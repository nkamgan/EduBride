
/**
 * Safe localStorage wrapper to handle QuotaExceededError and pruning
 */
export const safeStorage = {
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        console.warn(`Quota exceeded for ${key}. Pruning cache and retrying...`);
        this.pruneCache();
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryErr) {
          console.error(`Persistent quota failure for ${key}`, retryErr);
          return false;
        }
      }
      console.error(`Error saving ${key}`, err);
      return false;
    }
  },

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Prunes non-essential data (like edu_cache_) from localStorage
   */
  pruneCache(): void {
    const keys = Object.keys(localStorage);
    // Find all cache entries
    const cacheKeys = keys
      .filter(k => k.startsWith('edu_cache_'))
      .map(k => {
        try {
          const entry = JSON.parse(localStorage.getItem(k) || '{}');
          return { key: k, time: entry.timestamp || 0 };
        } catch {
          return { key: k, time: 0 };
        }
      })
      .sort((a, b) => a.time - b.time);

    // Remove oldest entries or error logs if no cache entries
    if (cacheKeys.length > 0) {
      const toRemove = Math.max(1, Math.ceil(cacheKeys.length * 0.3));
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(cacheKeys[i].key);
      }
    } else {
      // If no cache, try removing history/logs as last resort
      localStorage.removeItem('edu_error_logs');
    }
  }
};
