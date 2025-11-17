/**
 * Documentation generation service
 * Orchestrates fetching, parsing, and caching of val documentation
 */

import type { DocManifest } from "../../shared/docTypes.ts";
import { valFetcher } from "./valFetcher.ts";
import { deriveCacheKey, docCache } from "./docCache.ts";
import { parseValBundle } from "./tsParser.ts";

/**
 * Cached documentation payload
 */
export interface CachedDocPayload {
  manifest: DocManifest;
  ssrHtml?: string;
  cachedAt: number;
}

/**
 * Generation options
 */
export interface GenerateDocsOptions {
  /** Force refresh, bypassing cache */
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
 * Refresh documentation in the cache
 */
export async function refreshDocs(val: string): Promise<CachedDocPayload> {
  return generateDocs(val, { refresh: true });
}

/**
 * Get cached documentation without generating
 */
export async function getCachedDocs(
  val: string,
): Promise<CachedDocPayload | null> {
  const cacheKey = deriveCacheKey(val);
  return await docCache.get<CachedDocPayload>(cacheKey);
}

/**
 * Update SSR HTML in cache
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
 * Clear documentation cache for a specific val
 */
export async function clearValCache(val: string): Promise<void> {
  const cacheKey = deriveCacheKey(val);
  await docCache.delete(cacheKey);
  console.log(`[doc-service] Cleared cache for ${val}`);
}

/**
 * Clear all documentation caches
 */
export async function clearAllCaches(): Promise<void> {
  await docCache.clear();
  console.log("[doc-service] Cleared all documentation caches");
}
