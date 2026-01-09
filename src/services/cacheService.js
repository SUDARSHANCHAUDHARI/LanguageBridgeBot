/**
 * Cache Service
 * Provides caching functionality to reduce Translation API costs and improve speed
 */

const NodeCache = require('node-cache');
const crypto = require('crypto');
const config = require('../config/environment');

// Initialize cache with 1 hour TTL
const cache = new NodeCache({
  stdTTL: config.cache.ttl, // Time to live in seconds (default: 1 hour)
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Don't clone values (better performance)
});

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  clears: 0,
};

/**
 * Normalize text for cache key generation
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Generate a unique cache key for a translation request
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {string} Cache key
 */
function getCacheKey(text, sourceLang, targetLang) {
  // Normalize inputs
  const normalizedText = normalizeText(text);
  const normalizedSourceLang = (sourceLang || '').toLowerCase().trim();
  const normalizedTargetLang = (targetLang || '').toLowerCase().trim();

  // Create base key
  const baseKey = `${normalizedSourceLang}:${normalizedTargetLang}:${normalizedText}`;

  // If key is too long, use SHA256 hash
  if (baseKey.length > 200) {
    // Use hash for long texts, but keep some readable parts
    const hash = crypto.createHash('sha256').update(baseKey).digest('hex').substring(0, 16);
    const shortText = normalizedText.substring(0, 50);
    return `trans:${normalizedSourceLang}:${normalizedTargetLang}:${hash}:${shortText}`;
  }

  // For shorter texts, use readable key
  return `trans:${normalizedSourceLang}:${normalizedTargetLang}:${normalizedText}`;
}

/**
 * Get cached translation if it exists
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {string|null} Cached translation or null if not found
 */
function getCachedTranslation(text, sourceLang, targetLang) {
  try {
    const key = getCacheKey(text, sourceLang, targetLang);
    const cached = cache.get(key);

    if (cached !== undefined) {
      cacheStats.hits++;
      return cached;
    }

    cacheStats.misses++;
    return null;
  } catch (error) {
    console.error('Error getting cached translation:', error);
    cacheStats.misses++;
    return null;
  }
}

/**
 * Save translation to cache
 * @param {string} text - Original text
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} translation - Translated text
 * @returns {boolean} True if successfully cached
 */
function setCachedTranslation(text, sourceLang, targetLang, translation) {
  try {
    if (!translation || typeof translation !== 'string') {
      return false;
    }

    const key = getCacheKey(text, sourceLang, targetLang);
    const success = cache.set(key, translation);

    if (success) {
      cacheStats.sets++;
    }

    return success;
  } catch (error) {
    console.error('Error setting cached translation:', error);
    return false;
  }
}

/**
 * Clear all cached translations
 * @returns {number} Number of keys cleared
 */
function clearCache() {
  try {
    const keys = cache.keys();
    cache.del(keys);
    cacheStats.clears++;
    return keys.length;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics object
 */
function getCacheStats() {
  const totalRequests = cacheStats.hits + cacheStats.misses;
  const hitRate = totalRequests > 0 
    ? ((cacheStats.hits / totalRequests) * 100).toFixed(2) 
    : 0;

  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    sets: cacheStats.sets,
    clears: cacheStats.clears,
    hitRate: `${hitRate}%`,
    totalRequests,
    keys: cache.keys().length,
    ttl: config.cache.ttl,
  };
}

/**
 * Reset cache statistics
 */
function resetCacheStats() {
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    clears: 0,
  };
}

/**
 * Get cache size (number of keys)
 * @returns {number} Number of cached items
 */
function getCacheSize() {
  return cache.keys().length;
}

module.exports = {
  getCacheKey,
  getCachedTranslation,
  setCachedTranslation,
  clearCache,
  getCacheStats,
  resetCacheStats,
  getCacheSize,
};
