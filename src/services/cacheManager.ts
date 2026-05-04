import { get, set, keys, del, clear } from 'idb-keyval';
import CryptoJS from 'crypto-js';
import { safeStorage } from '../lib/storage';

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
  version: string;
}

const CACHE_VERSION = '1.1';

export const cacheManager = {
  /**
   * Generates a stable hash for any input
   */
  hash(input: string): string {
    return CryptoJS.MD5(input).toString();
  },

  /**
   * Stores data in IndexedDB (primary) and localStorage (fallback for small text)
   */
  async save<T>(key: string, data: T) {
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      data,
      version: CACHE_VERSION
    };

    try {
      await set(key, entry);
    } catch (err) {
      console.warn('IDB save failed, falling back to localStorage', err);
      // Fallback for smaller entries
      if (typeof data === 'object' && JSON.stringify(data).length < 2000) {
        safeStorage.setItem(key, JSON.stringify(entry));
      }
    }
  },

  /**
   * Retrieves data from Cache
   */
  async get<T>(key: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<T | null> {
    try {
      // Check IDB first
      const entry = await get(key) as CacheEntry<T> | undefined;
      
      // Fallback to localStorage if not in IDB
      let finalEntry = entry;
      if (!finalEntry) {
        const local = safeStorage.getItem(key);
        if (local) {
          try {
            finalEntry = JSON.parse(local);
          } catch {
            safeStorage.removeItem(key);
          }
        }
      }

      if (finalEntry && finalEntry.version === CACHE_VERSION) {
        if (Date.now() - finalEntry.timestamp < maxAgeMs) {
          return finalEntry.data;
        } else {
          // Expired, delete it
          this.remove(key);
        }
      }
    } catch (err) {
      console.error('Cache retrieval error', err);
    }
    return null;
  },

  async remove(key: string) {
    await del(key);
    safeStorage.removeItem(key);
  },

  async clearAll() {
    await clear();
    // Only clear edu_cache keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('edu_cache_')) safeStorage.removeItem(key);
    });
  },

  async getStats() {
    const allKeys = await keys();
    const idbCount = allKeys.length;
    let localCount = 0;
    Object.keys(localStorage).forEach(k => { if (k.startsWith('edu_cache_')) localCount++; });
    
    return {
      indexedDBEntries: idbCount,
      localStorageEntries: localCount,
      totalEntries: idbCount + localCount
    };
  }
};

