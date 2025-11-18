/**
 * Documentation generation service
 * Orchestrates fetching, parsing, and caching of val documentation
 */

import type { DocManifest } from "../../shared/docTypes.ts";
import { deriveCacheKey, docCache } from "./docCache.ts";
import { parseValBundle } from "./tsParser.ts";
import { valFetcher } from "./valFetcher.ts";

/**
 * Cached documentation payload containing manifest and optional SSR HTML.
 */
export interface CachedDocPayload {
  /** The documentation manifest */
  manifest: DocManifest;
  /** Server-side rendered HTML (optional, cached for performance) */
  ssrHtml?: string;
  /** Timestamp when the payload was cached (milliseconds since epoch) */
  cachedAt: number;
}

/**
 * Options for documentation generation.
 */
export interface GenerateDocsOptions {
  /** If true, bypasses cache and regenerates documentation */
  refresh?: boolean;
}

/**
 * Generate documentation for a val
 * This is the main entry point for the documentation generation pipeline
 */
export async function generateDocs(
  val: string,
  opts: GenerateDocsOptions = {},
): Promise<CachedDocPayload> {
  const cacheKey = deriveCacheKey(val);

  // Check cache unless refresh is requested
  if (!opts.refresh) {
    const cached = await docCache.get<CachedDocPayload>(cacheKey);
    if (cached) {
      console.log(`[doc-service] Cache hit for ${val}`);
      return cached;
    }
  }

  console.log(`[doc-service] Cache miss for ${val}, generating docs...`);

  // Fetch val bundle from Val Town API
  const bundle = await valFetcher.fetchLatest(val);

  // Parse TypeScript to extract documentation
  const manifest = parseValBundle(bundle);

  // Create payload
  const payload: CachedDocPayload = {
    manifest,
    cachedAt: Date.now(),
  };

  // Cache for future requests
  await docCache.set(cacheKey, payload, { version: bundle.version });

  console.log(
    `[doc-service] Generated and cached docs for ${val}@${bundle.version}`,
  );

  return payload;
}

/**
 * Forces a refresh of documentation for a val, bypassing cache.
 *
 * @param val - Val identifier in format "username/valname"
 * @returns Freshly generated documentation payload
 */
export async function refreshDocs(val: string): Promise<CachedDocPayload> {
  return generateDocs(val, { refresh: true });
}

/**
 * Retrieves cached documentation without generating new documentation.
 *
 * @param val - Val identifier in format "username/valname"
 * @returns Cached documentation payload if available, null otherwise
 */
export async function getCachedDocs(
  val: string,
): Promise<CachedDocPayload | null> {
  const cacheKey = deriveCacheKey(val);
  return await docCache.get<CachedDocPayload>(cacheKey);
}

/**
 * Updates the SSR HTML in the cached documentation payload.
 *
 * @param val - Val identifier in format "username/valname"
 * @param html - The HTML string to cache
 */
export async function updateCachedHtml(
  val: string,
  html: string,
): Promise<void> {
  const cacheKey = deriveCacheKey(val);
  const cached = await docCache.get<CachedDocPayload>(cacheKey);

  if (cached) {
    cached.ssrHtml = html;
    await docCache.set(cacheKey, cached, {
      version: cached.manifest.version,
    });
  }
}

/**
 * Clears the documentation cache for a specific val.
 *
 * @param val - Val identifier in format "username/valname"
 */
export async function clearValCache(val: string): Promise<void> {
  const cacheKey = deriveCacheKey(val);
  await docCache.delete(cacheKey);
  console.log(`[doc-service] Cleared cache for ${val}`);
}

/**
 * Clears all documentation caches.
 *
 * Removes all cached documentation from both memory and blob storage.
 */
export async function clearAllCaches(): Promise<void> {
  await docCache.clear();
  console.log("[doc-service] Cleared all documentation caches");
}
