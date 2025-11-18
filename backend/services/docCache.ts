/**
 * Documentation cache using Val Town blob storage with in-memory front cache
 */

import { blob } from "https://esm.town/v/std/blob";

/**
 * Cache entry with metadata for expiration and versioning.
 *
 * @template T - Type of cached data
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Version identifier for cache invalidation */
  version: string;
  /** Timestamp when entry was cached (milliseconds since epoch) */
  cachedAt: number;
  /** Timestamp when entry expires (milliseconds since epoch) */
  expiresAt: number;
}

/**
 * Configuration options for documentation cache.
 */
export interface CacheConfig {
  /** Cache time-to-live in milliseconds (default: 1 hour) */
  ttlMs?: number;
  /** Prefix for blob storage keys (default: "doc-cache") */
  blobPrefix?: string;
}

/**
 * Interface for documentation cache operations.
 *
 * Provides a two-tier caching system: in-memory LRU cache with blob storage fallback.
 */
export interface DocCache {
  /**
   * Retrieves cached data by key.
   *
   * @template T - Type of cached data
   * @param key - Cache key
   * @returns Cached data if found and not expired, null otherwise
   */
  get<T>(key: string): Promise<T | null>;
  /**
   * Stores data in cache with version metadata.
   *
   * @template T - Type of data to cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param metadata - Cache metadata including version
   */
  set<T>(key: string, data: T, metadata: { version: string }): Promise<void>;
  /**
   * Checks if a key exists in cache and is not expired.
   *
   * @param key - Cache key
   * @returns True if key exists and is valid, false otherwise
   */
  has(key: string): Promise<boolean>;
  /**
   * Checks if a cache entry is expired.
   *
   * @param key - Cache key
   * @returns True if expired or doesn't exist, false if valid
   */
  isExpired(key: string): Promise<boolean>;
  /**
   * Deletes a cache entry by key.
   *
   * @param key - Cache key
   */
  delete(key: string): Promise<void>;
  /**
   * Clears all cache entries.
   */
  clear(): Promise<void>;
}

/**
 * In-memory cache with LRU (Least Recently Used) eviction policy.
 *
 * Maintains a fixed-size cache, automatically evicting the oldest entry when at capacity.
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
 * Creates a documentation cache instance with two-tier storage.
 *
 * Uses in-memory LRU cache for fast access and blob storage for persistence.
 *
 * @param config - Cache configuration options
 * @returns Configured DocCache instance
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
      const blobEntry = (await blob.getJSON(blobKey)) as CacheEntry<T> | null;

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
      const blobEntry = (await blob.getJSON(
        blobKey,
      )) as CacheEntry<unknown> | null;

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
 * Derives a normalized cache key from a val identifier and optional version.
 *
 * Normalizes the val identifier by lowercasing and replacing invalid characters.
 *
 * @param val - Val identifier in format "username/valname"
 * @param version - Optional version string to append
 * @returns Normalized cache key
 */
export function deriveCacheKey(val: string, version?: string): string {
  const normalized = val.toLowerCase().replace(/[^a-z0-9_/-]/g, "_");
  return version ? `${normalized}@${version}` : normalized;
}

/**
 * Default documentation cache instance with 1 hour TTL.
 *
 * Uses "doc-manifest" as the blob storage prefix.
 */
export const docCache = createDocCache({
  ttlMs: 60 * 60 * 1000,
  blobPrefix: "doc-manifest",
});
