/**
 * Performance Optimization Utilities
 * Provides performance monitoring and optimization helpers
 */

// Performance metrics
const metrics = {
  translationTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  errors: 0,
};

/**
 * Track translation performance
 * @param {number} duration - Translation duration in milliseconds
 * @param {boolean} fromCache - Whether translation came from cache
 */
function trackTranslation(duration, fromCache) {
  metrics.translationTimes.push(duration);
  metrics.apiCalls++;
  
  if (fromCache) {
    metrics.cacheHits++;
  } else {
    metrics.cacheMisses++;
  }

  // Keep only last 1000 measurements
  if (metrics.translationTimes.length > 1000) {
    metrics.translationTimes.shift();
  }
}

/**
 * Track error
 */
function trackError() {
  metrics.errors++;
}

/**
 * Get performance statistics
 * @returns {Object} Performance metrics
 */
function getPerformanceStats() {
  const times = metrics.translationTimes;
  const avgTime = times.length > 0
    ? times.reduce((sum, t) => sum + t, 0) / times.length
    : 0;
  
  const sortedTimes = [...times].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

  const totalRequests = metrics.cacheHits + metrics.cacheMisses;
  const cacheHitRate = totalRequests > 0
    ? metrics.cacheHits / totalRequests
    : 0;

  return {
    avgResponseTime: Math.round(avgTime),
    p50: Math.round(p50),
    p95: Math.round(p95),
    p99: Math.round(p99),
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    totalApiCalls: metrics.apiCalls,
    errors: metrics.errors,
    errorRate: metrics.apiCalls > 0
      ? Math.round((metrics.errors / metrics.apiCalls) * 100) / 100
      : 0,
  };
}

/**
 * Batch translation requests for better performance
 * @param {Array} requests - Array of translation requests
 * @param {Function} translateFn - Translation function
 * @param {number} batchSize - Batch size (default: 10)
 * @returns {Promise<Array>} Translation results
 */
async function batchTranslations(requests, translateFn, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(req => translateFn(req.text, req.sourceLang, req.targetLang))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function calls
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Maximum calls per period
 * @param {number} period - Period in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(fn, limit, period) {
  let inThrottle;
  let lastCall;
  
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      lastCall = Date.now();
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, period);
    } else {
      const timeSinceLastCall = Date.now() - lastCall;
      if (timeSinceLastCall >= period) {
        fn.apply(this, args);
        lastCall = Date.now();
      }
    }
  };
}

/**
 * Reset performance metrics
 */
function resetMetrics() {
  metrics.translationTimes = [];
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.apiCalls = 0;
  metrics.errors = 0;
}

module.exports = {
  trackTranslation,
  trackError,
  getPerformanceStats,
  batchTranslations,
  debounce,
  throttle,
  resetMetrics,
};
