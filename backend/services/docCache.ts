/**
 * Documentation cache using Val Town blob storage with in-memory front cache
 */

import { blob } from "https://esm.town/v/std/blob";

/**
 * Cache entry metadata
 */
export interface CacheEntry<T> {
  data: T;
  version: string;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache TTL in milliseconds (default: 1 hour) */
  ttlMs?: number;
  /** Blob key prefix (default: "doc-cache") */
  blobPrefix?: string;
}

/**
 * Documentation cache interface
 */
export interface DocCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, metadata: { version: string }): Promise<void>;
  has(key: string): Promise<boolean>;
  isExpired(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory cache with LRU eviction
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  set<T>(key: string, entry: CacheEntry<T>): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Create a documentation cache instance
 */
export function createDocCache(config: CacheConfig = {}): DocCache {
  const ttlMs = config.ttlMs ?? 60 * 60 * 1000; // 1 hour default
  const blobPrefix = config.blobPrefix ?? "doc-cache";
  const memoryCache = new MemoryCache(100);

  function deriveBlobKey(key: string): string {
    return `${blobPrefix}:${key}`;
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      const now = Date.now();

      // Check memory cache first
      const memEntry = memoryCache.get<T>(key);
      if (memEntry && memEntry.expiresAt > now) {
        return memEntry.data;
      }

      // Fall back to blob storage
      const blobKey = deriveBlobKey(key);
      const blobEntry = await blob.getJSON(blobKey) as CacheEntry<T> | null;

      if (!blobEntry) {
        return null;
      }

      // Check if expired
      if (blobEntry.expiresAt <= now) {
        // Clean up expired entry
        await blob.delete(blobKey);
        memoryCache.delete(key);
        return null;
      }

      // Populate memory cache
      memoryCache.set(key, blobEntry);

      return blobEntry.data;
    },

    async set<T>(
      key: string,
      data: T,
      metadata: { version: string },
    ): Promise<void> {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        version: metadata.version,
        cachedAt: now,
        expiresAt: now + ttlMs,
      };

      // Store in both memory and blob
      memoryCache.set(key, entry);
      await blob.setJSON(deriveBlobKey(key), entry);
    },

    async has(key: string): Promise<boolean> {
      // Check memory first
      if (memoryCache.has(key)) {
        const entry = memoryCache.get(key);
        if (entry && entry.expiresAt > Date.now()) {
          return true;
        }
      }

      // Check blob
      const blobKey = deriveBlobKey(key);
      const blobEntry = await blob.getJSON(blobKey) as CacheEntry<unknown> |
        null;

      if (!blobEntry) {
        return false;
      }

      return blobEntry.expiresAt > Date.now();
    },

    async isExpired(key: string): Promise<boolean> {
      const hasKey = await this.has(key);
      return !hasKey;
    },

    async delete(key: string): Promise<void> {
      memoryCache.delete(key);
      await blob.delete(deriveBlobKey(key));
    },

    async clear(): Promise<void> {
      memoryCache.clear();
      // List and delete all blob entries with our prefix
      const keys = await blob.list(blobPrefix);
      await Promise.all(keys.map((key) => blob.delete(key)));
    },
  };
}

/**
 * Derive cache key from val identifier and version
 */
export function deriveCacheKey(val: string, version?: string): string {
  const normalized = val.toLowerCase().replace(/[^a-z0-9_/-]/g, "_");
  return version ? `${normalized}@${version}` : normalized;
}

/**
 * Default doc cache instance with 1 hour TTL
 */
export const docCache = createDocCache({
  ttlMs: 60 * 60 * 1000,
  blobPrefix: "doc-manifest",
});
