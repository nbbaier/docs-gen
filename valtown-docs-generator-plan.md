# Implementation Plan

## Goal

-  After completion, visiting the published `docGenerator` HTTP val with a `?val=username/valname` query returns generated API docs < 3s for a representative public val.
-  Success criteria:
   -  `GET /api/docs?val=acme/sample` responds 200 with parsed exports (functions, types, constants) in JSON validated against `DocManifest` schema.
   -  UI route `/` renders documentation cards for the same sample val with syntax highlighting and navigation.
   -  Cache hits logged for repeat requests within 1 hour, cache misses stay under 2 API calls per request and serve cached manifests/HTML within ~20 ms.
-  Scope boundaries:
   -  No authentication for private vals, no editing/workspace features.
   -  Multi-val/project aggregation and version diffing remain out of scope for v1.
   -  UI polish limited to Tailwind-based theming without custom theming engine.

## Analysis

-  Key components and responsibilities (to be created under `/backend`, `/frontend`, `/shared` as per AGENTS guidelines):
   -  [backend/docGenerator.http.ts](/backend/docGenerator.http.ts#L1-L200) — Planned Hono HTTP entrypoint orchestrating fetch → parse → cache → render.
   -  [backend/services/valFetcher.ts](/backend/services/valFetcher.ts#L1-L200) — Planned Val Town API client resolving val metadata and source bundle.
   -  [backend/services/tsParser.ts](/backend/services/tsParser.ts#L1-L300) — Planned TypeScript compiler API walker emitting `ParsedDocumentation`.
   -  [backend/services/docCache.ts](/backend/services/docCache.ts#L1-L160) — Planned blob-backed cache with memory front.
   -  [shared/docTypes.ts](/shared/docTypes.ts#L1-L200) — Planned shared TypeScript interfaces for parser output and UI consumption.
   -  [frontend/index.html](/frontend/index.html#L1-L200) & [frontend/App.tsx](/frontend/App.tsx#L1-L200) — Planned React shell rendering docs, search, and navigation.
-  Data/types affected:
   -  `DocManifest`, `FunctionDoc`, `TypeDoc`, `ClassDoc`, `ConstantDoc`, `ImportInfo`; caching metadata `{ cacheKey: string; createdAt: number; version: string; }`.
   -  Request DTO `{ val: string; refresh?: boolean }`, error envelope `{ code: string; message: string; details?: unknown }`.
-  Current flow:
   1. Request enters Hono → query param validation.
   2. Cache lookup by `valIdentifier@version` (memory → blob fallback).
   3. On miss: fetch val metadata + files → parse AST → build manifest → persist cache.
   4. API route returns JSON; UI route hydrates React with initial manifest + fetch fallback.

## Approach

-  Establish shared documentation schemas and validation helpers first so backend and frontend contract is locked before logic work.
-  Implement val fetching and caching seams prior to TypeScript parsing to minimize external API pressure and enable testability via fixtures.
-  Build the TypeScript parser as a pure module with exhaustive unit tests, then integrate into the fetcher pipeline behind cache lookups.
-  Compose the Hono HTTP val with separate API (`/api/docs`) and UI (`/`) routes, injecting fetch/parse/cache services for easy stubbing.
-  Deliver the React/Twind frontend last, hydrating with server-injected manifest while supporting client-side refresh via the API.
-  Assumptions: `npm:typescript` bundling works in Val Town serverless context; Val Town REST endpoints for public vals require no auth; Tailwind via Twind CDN is acceptable for styling.

## Step-by-Step Implementation

> Sequence logically: refactor → scaffold → integrate (flagged) → validate → cleanup.

### Step 1 — Define shared documentation contract

**Intent:** Lock parser ↔ renderer contract and validation helpers before logic diverges.
**Files:** [shared/docTypes.ts](/shared/docTypes.ts#L1-L200), [shared/docTypes.test.ts](/shared/docTypes.test.ts#L1-L160)
**Change sketch:**

```diff
+ export interface DocManifest {
+   val: string;
+   version: string;
+   generatedAt: string;
+   exports: {
+     functions: FunctionDoc[];
+     classes: ClassDoc[];
+     interfaces: InterfaceDoc[];
+     types: TypeAliasDoc[];
+     constants: ConstantDoc[];
+   };
+   imports: ImportInfo[];
+   metadata: ValMetadata;
+ }
+
+ export function assertDocManifest(data: unknown): asserts data is DocManifest {
+   // runtime validation leveraging type predicates or zod-like helper (decide on zod dependency vs hand-rolled guards)
+ }
```

**Preconditions:** None.
**Postconditions:** Typed contract with runtime guard available for backend and frontend.
**Checks:** Unit tests covering validation happy path and failure scenarios.

### Step 2 — Scaffold Val Town fetcher and cache seams

**Intent:** Provide deterministic data sources and caching hooks prior to parser integration.
**Files:** [backend/services/valFetcher.ts](/backend/services/valFetcher.ts#L1-L200), [backend/services/docCache.ts](/backend/services/docCache.ts#L1-L200), [backend/services/**tests**/valFetcher.test.ts](/backend/services/__tests__/valFetcher.test.ts#L1-L200)
**Change sketch:**

```diff
+ export interface ValFetcher {
+   fetchLatest(val: string): Promise<ValBundle>;
+ }
+
+ export const docCache = createDocCache({
+   ttlMs: 60 * 60 * 1000,
+   blobPrefix: "doc-manifest",
+ });
```

**Preconditions:** Step 1 contract finalized.
**Postconditions:** Fetcher returns mocked data in tests; cache exposes get/set/isFresh with blob-backed implementation (no parser usage yet).
**Checks:** Unit tests hitting Val Town API via mocked fetch; cache tests verifying TTL & key derivation.

### Step 3 — Implement TypeScript parser module

**Intent:** Build pure parsing logic producing the shared manifest structures without I/O coupling.
**Files:** [backend/services/tsParser.ts](/backend/services/tsParser.ts#L1-L300), [backend/services/**tests**/tsParser.test.ts](/backend/services/__tests__/tsParser.test.ts#L1-L300), [test-fixtures/vals/simple.ts](/test-fixtures/vals/simple.ts#L1-L200)
**Change sketch:**

```diff
+ export function parseValBundle(bundle: ValBundle): DocManifest {
+   const program = ts.createProgram(
+     bundle.files.map((file) => file.path),
+     compilerOptions,
+     createInMemoryCompilerHost(bundle)
+   );
+   // walk AST, fill manifest.exports
+   return manifest;
+ }
```

**Preconditions:** Step 1 types available; Step 2 supplies ValBundle shape.
**Postconditions:** Parser returns manifest for fixture bundles with deterministic ordering; no cache integration yet.
**Checks:** Unit tests for functions, classes, interfaces, type aliases, constants, malformed inputs.

### Step 4 — Compose doc generation pipeline with caching

**Intent:** Integrate fetcher, parser, and cache into orchestrated service exposing `generateDocs`, caching manifests and prerendered HTML for <3s responses.
**Files:** [backend/services/docService.ts](/backend/services/docService.ts#L1-L200), [backend/services/**tests**/docService.test.ts](/backend/services/__tests__/docService.test.ts#L1-L200)
**Change sketch:**

```diff
+ export interface CachedDocPayload {
+   manifest: DocManifest;
+   ssrHtml?: string;
+   cachedAt: number;
+ }
+
+ export async function generateDocs(val: string, opts: { refresh?: boolean }) {
+   const cacheKey = deriveCacheKey(val);
+   if (!opts.refresh) {
+     const cached = await docCache.get<CachedDocPayload>(cacheKey);
+     if (cached && !docCache.isExpired(cacheKey)) return cached;
+   }
+   const bundle = await valFetcher.fetchLatest(val);
+   const manifest = parseValBundle(bundle);
+   const payload: CachedDocPayload = { manifest, cachedAt: Date.now() };
+   await docCache.set(cacheKey, payload, { version: bundle.version });
+   return payload;
+ }
```

**Preconditions:** Steps 1–3 merged.
**Postconditions:** Single orchestration entry point with cache hit logging hook, rate-limited fetch usage; cached payload reusable for API and UI routes.
**Checks:** Service tests mocking cache/fetcher to assert cache strategy, ttl handling, and refresh behavior.

### Step 5 — Build Hono HTTP val routes

**Intent:** Expose API and UI endpoints leveraging docService; ensure error handling & logging.
**Files:** [backend/docGenerator.http.ts](/backend/docGenerator.http.ts#L1-L200), [backend/routes/apiDocs.ts](/backend/routes/apiDocs.ts#L1-L200), [backend/routes/ui.ts](/backend/routes/ui.ts#L1-L200), [backend/routes/**tests**/apiDocs.test.ts](/backend/routes/__tests__/apiDocs.test.ts#L1-L200)
**Change sketch:**

```diff
+ app.get("/api/docs", async (c) => {
+   const val = c.req.query("val");
+   if (!val) return c.json({ code: "BAD_REQUEST" }, 400);
+   const { manifest } = await generateDocs(val, { refresh: c.req.query("refresh") === "true" });
+   return c.json(manifest);
+ });
+
+ app.get("/", async (c) => {
+   const initialVal = c.req.query("val");
+   const cached = initialVal ? await generateDocs(initialVal, { refresh: false }) : null;
+   if (!cached?.manifest) {
+     const emptyHtml = await renderIndexPage({ manifest: null, val: initialVal });
+     return c.html(emptyHtml);
+   }
+   if (!cached.ssrHtml) {
+     cached.ssrHtml = await renderIndexPage({ manifest: cached.manifest, val: initialVal });
+     await docCache.set(deriveCacheKey(initialVal), cached, { version: cached.manifest.version });
+   }
+   return c.html(cached.ssrHtml);
+ });
```

**Preconditions:** Step 4 ready.
**Postconditions:** HTTP val deployed with API contract, SSR injecting initial manifest, error states handled.
**Checks:** Integration tests via superdeno hitting API and root route; lint/typecheck.

### Step 6 — Implement React/Twind frontend shell

**Intent:** Deliver interactive documentation UI consuming manifest and supporting client fetch refresh.
**Files:** [frontend/index.html](/frontend/index.html#L1-L200), [frontend/App.tsx](/frontend/App.tsx#L1-L200), [frontend/components/FunctionDoc.tsx](/frontend/components/FunctionDoc.tsx#L1-L200), [frontend/components/Sidebar.tsx](/frontend/components/Sidebar.tsx#L1-L200), [frontend/**tests**/App.test.tsx](/frontend/__tests__/App.test.tsx#L1-L200)
**Change sketch:**

```diff
+ /** @jsxImportSource https://esm.sh/react@18.2.0 */
+ import { useEffect, useState } from "https://esm.sh/react@18.2.0";
+ export function App(props: { initialManifest?: DocManifest; initialVal?: string }) {
+   const [manifest, setManifest] = useState(props.initialManifest ?? null);
+   // render header, sidebar, main, search, dark mode toggle
+ }
```

**Preconditions:** Step 5 HTML render helper able to inject `initialManifest`.
**Postconditions:** Responsive UI with search/filter, syntax highlighting via Prism/Twind, copy-to-clipboard.
**Checks:** Frontend unit tests with pre-rendered manifest, visual smoke test in Val Town.

### Step 7 — Telemetry, rate limiting, and documentation

**Intent:** Add request logging, cache hit metrics, rate limiting guard, and README instructions.
**Files:** [backend/services/logger.ts](/backend/services/logger.ts#L1-L120), [backend/docGenerator.http.ts](/backend/docGenerator.http.ts#L1-L200), [README.md](/README.md#L1-L200)
**Change sketch:**

```diff
+ app.use("/api/docs", rateLimit({ windowMs: 60_000, max: 30 }));
+ logger.info({ event: "doc_cache_hit", val, cacheKey });
+ logger.info({ event: "doc_cache_miss", val, durationMs });
+
+## Usage
+- Deploy `docGenerator` via Val Town HTTP val.
```

**Preconditions:** Core functionality stable (Steps 1–6).
**Postconditions:** Observability and docs in place; rate limiting prevents abuse.
**Checks:** Manual smoke tests, documentation review.

## Open Questions

-  Confirm whether we must support fetching specific val versions (e.g., `?version=` query) in v1 or default to latest only.
-  Clarify if Tailwind via Twind CDN is acceptable for production or if inline Tailwind build step is preferred.
-  Determine acceptable rate limit thresholds and logging retention (where should logs emit?).

## Resources

-  Build/test: `deno task check`, `deno test`, `deno lint`, `biome check .`
-  Docs: [Val Town API](https://docs.val.town/api/overview), [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API), [TSDoc Spec](https://tsdoc.org/).
-  Reference vals: `https://www.val.town/v/std/utils@85-main/index.ts`, `https://www.val.town/v/std/blob`.
