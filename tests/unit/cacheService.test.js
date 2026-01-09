/**
 * Unit tests for cacheService
 */

const {
  getCacheKey,
  getCachedTranslation,
  setCachedTranslation,
  clearCache,
  getCacheStats,
  resetCacheStats,
} = require('../../src/services/cacheService');

describe('CacheService', () => {
  beforeEach(() => {
    clearCache();
    resetCacheStats();
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const key1 = getCacheKey('Hello', 'en', 'th');
      const key2 = getCacheKey('Hello', 'en', 'th');
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different texts', () => {
      const key1 = getCacheKey('Hello', 'en', 'th');
      const key2 = getCacheKey('World', 'en', 'th');
      expect(key1).not.toBe(key2);
    });

    it('should normalize text in cache key', () => {
      const key1 = getCacheKey('  Hello  ', 'en', 'th');
      const key2 = getCacheKey('hello', 'en', 'th');
      expect(key1).toBe(key2);
    });

    it('should use hash for long texts', () => {
      const longText = 'a'.repeat(300);
      const key = getCacheKey(longText, 'en', 'th');
      expect(key.length).toBeLessThan(250);
      expect(key).toContain('trans:');
    });
  });

  describe('getCachedTranslation and setCachedTranslation', () => {
    it('should cache and retrieve translations', () => {
      const text = 'Hello';
      const sourceLang = 'en';
      const targetLang = 'th';
      const translation = 'สวัสดี';

      // Cache miss
      expect(getCachedTranslation(text, sourceLang, targetLang)).toBeNull();

      // Set cache
      setCachedTranslation(text, sourceLang, targetLang, translation);

      // Cache hit
      expect(getCachedTranslation(text, sourceLang, targetLang)).toBe(translation);
    });

    it('should not cache null or empty translations', () => {
      const result = setCachedTranslation('Hello', 'en', 'th', '');
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached translations', () => {
      setCachedTranslation('Hello', 'en', 'th', 'สวัสดี');
      setCachedTranslation('World', 'en', 'hi', 'दुनिया');

      expect(getCachedTranslation('Hello', 'en', 'th')).not.toBeNull();

      const cleared = clearCache();
      expect(cleared).toBe(2);

      expect(getCachedTranslation('Hello', 'en', 'th')).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should track cache statistics', () => {
      // Set some cache entries
      setCachedTranslation('Hello', 'en', 'th', 'สวัสดี');
      setCachedTranslation('World', 'en', 'hi', 'दुनिया');

      // Get cache hits
      getCachedTranslation('Hello', 'en', 'th');
      getCachedTranslation('Hello', 'en', 'th');

      // Get cache miss
      getCachedTranslation('Missing', 'en', 'th');

      const stats = getCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(2);
      expect(stats.keys).toBe(2);
    });
  });
});
