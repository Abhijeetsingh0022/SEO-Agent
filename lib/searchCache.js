/**
 * Simple TTL-based cache for search results.
 * This helps reduce API costs and latency for repetitive research steps.
 */
export class SearchCache {
  static #cache = new Map();
  static #DEFAULT_TTL = 3600 * 1000; // 1 hour

  /**
   * Get a cached result for a given query/provider
   */
  static get(provider, context, query) {
    const key = `${provider}:${context}:${query}`;
    const entry = this.#cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.#cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set a result in the cache
   */
  static set(provider, context, query, data, ttl = this.#DEFAULT_TTL) {
    const key = `${provider}:${context}:${query}`;
    this.#cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Clear old entries periodically
   */
  static cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.#cache.entries()) {
      if (now > entry.expiry) {
        this.#cache.delete(key);
      }
    }
  }
}
