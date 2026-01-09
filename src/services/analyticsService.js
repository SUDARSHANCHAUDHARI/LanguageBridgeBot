/**
 * Analytics Service
 * Tracks metrics and usage statistics
 */

const { getGroupStats, getAllActiveGroups } = require('./databaseService');
const { getCacheStats } = require('./cacheService');
const { getTranslationCacheStats } = require('./translationService');

// In-memory metrics (in production, store in database)
let metrics = {
  totalMessages: 0,
  totalCharacters: 0,
  languagePairs: {}, // { 'en-th': count, 'en-hi': count }
  activeGroups: 0,
  responseTimes: [],
  errors: 0,
  cacheHits: 0,
  cacheMisses: 0,
  apiQuotaUsed: 0,
  lastUpdated: new Date(),
};

/**
 * Track a translation event
 * @param {string} sourceLang - Source language
 * @param {string[]} targetLangs - Target languages
 * @param {number} messageLength - Message length in characters
 * @param {number} responseTime - Response time in milliseconds
 * @param {boolean} fromCache - Whether translation was from cache
 */
function trackTranslation(sourceLang, targetLangs, messageLength, responseTime, fromCache) {
  metrics.totalMessages++;
  metrics.totalCharacters += messageLength;
  metrics.responseTimes.push(responseTime);

  // Track language pairs
  targetLangs.forEach(targetLang => {
    const pair = `${sourceLang}-${targetLang}`;
    metrics.languagePairs[pair] = (metrics.languagePairs[pair] || 0) + 1;
  });

  // Track cache
  if (fromCache) {
    metrics.cacheHits++;
  } else {
    metrics.cacheMisses++;
    metrics.apiQuotaUsed += targetLangs.length;
  }

  metrics.lastUpdated = new Date();
}

/**
 * Track an error
 */
function trackError() {
  metrics.errors++;
  metrics.lastUpdated = new Date();
}

/**
 * Get analytics data
 * @returns {Promise<Object>} Analytics data
 */
async function getAnalytics() {
  try {
    const activeGroups = await getAllActiveGroups();
    const cacheStats = getTranslationCacheStats();

    // Calculate averages
    const avgResponseTime = metrics.responseTimes.length > 0
      ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
      : 0;

    const errorRate = metrics.totalMessages > 0
      ? (metrics.errors / metrics.totalMessages) * 100
      : 0;

    const cacheHitRate = (metrics.cacheHits + metrics.cacheMisses) > 0
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
      : 0;

    return {
      messages: {
        total: metrics.totalMessages,
        totalCharacters: metrics.totalCharacters,
        averageLength: metrics.totalMessages > 0
          ? metrics.totalCharacters / metrics.totalMessages
          : 0,
      },
      languagePairs: metrics.languagePairs,
      groups: {
        active: activeGroups.length,
        total: metrics.activeGroups || activeGroups.length,
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: errorRate.toFixed(2),
      },
      cache: {
        hits: metrics.cacheHits,
        misses: metrics.cacheMisses,
        hitRate: cacheHitRate.toFixed(2),
        ...cacheStats,
      },
      api: {
        quotaUsed: metrics.apiQuotaUsed,
      },
      lastUpdated: metrics.lastUpdated,
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return {
      error: 'Failed to get analytics',
    };
  }
}

/**
 * Reset analytics (for testing)
 */
function resetAnalytics() {
  metrics = {
    totalMessages: 0,
    totalCharacters: 0,
    languagePairs: {},
    activeGroups: 0,
    responseTimes: [],
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiQuotaUsed: 0,
    lastUpdated: new Date(),
  };
}

module.exports = {
  trackTranslation,
  trackError,
  getAnalytics,
  resetAnalytics,
};
