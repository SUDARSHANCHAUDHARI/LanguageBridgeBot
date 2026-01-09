/**
 * A/B Testing Service
 * Tests different translation strategies to optimize quality
 */

const { translateText } = require('./translationService');
const { translateWithContext } = require('./contextService');

// A/B test variants
const VARIANTS = {
  STANDARD: 'standard',
  CONTEXT_AWARE: 'context_aware',
  FORMAL: 'formal',
  CASUAL: 'casual',
};

// Track test results
const testResults = new Map();

/**
 * Get variant for a group (consistent assignment)
 * @param {string} groupId - Group ID
 * @returns {string} Variant name
 */
function getVariant(groupId) {
  // Use hash of groupId to consistently assign variant
  const hash = groupId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const variants = Object.values(VARIANTS);
  return variants[Math.abs(hash) % variants.length];
}

/**
 * Translate with A/B testing
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} Translation result with variant info
 */
async function translateWithABTesting(text, sourceLang, targetLang, groupId) {
  const variant = getVariant(groupId);
  let translatedText;
  let startTime = Date.now();

  try {
    switch (variant) {
      case VARIANTS.CONTEXT_AWARE:
        translatedText = await translateWithContext(text, sourceLang, targetLang, groupId);
        break;

      case VARIANTS.FORMAL:
        // Use formal translation style
        translatedText = await translateText(text, sourceLang, targetLang);
        // Could enhance with formal tone detection
        break;

      case VARIANTS.CASUAL:
        // Use casual translation style
        translatedText = await translateText(text, sourceLang, targetLang);
        // Could enhance with casual tone detection
        break;

      default:
        translatedText = await translateText(text, sourceLang, targetLang);
    }

    const responseTime = Date.now() - startTime;

    // Track result
    trackResult(groupId, variant, {
      success: true,
      responseTime,
      textLength: text.length,
    });

    return {
      text: translatedText,
      variant,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Track failure
    trackResult(groupId, variant, {
      success: false,
      responseTime,
      error: error.message,
    });

    throw error;
  }
}

/**
 * Track A/B test result
 * @param {string} groupId - Group ID
 * @param {string} variant - Variant name
 * @param {Object} result - Test result
 */
function trackResult(groupId, variant, result) {
  const key = `${groupId}:${variant}`;
  if (!testResults.has(key)) {
    testResults.set(key, {
      variant,
      total: 0,
      successes: 0,
      failures: 0,
      totalResponseTime: 0,
      totalTextLength: 0,
    });
  }

  const stats = testResults.get(key);
  stats.total++;
  stats.totalResponseTime += result.responseTime || 0;
  stats.totalTextLength += result.textLength || 0;

  if (result.success) {
    stats.successes++;
  } else {
    stats.failures++;
  }
}

/**
 * Get A/B test statistics
 * @param {string} variant - Optional variant filter
 * @returns {Object} Test statistics
 */
function getTestStats(variant = null) {
  const stats = {
    variants: {},
    overall: {
      total: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
    },
  };

  for (const [key, data] of testResults.entries()) {
    if (variant && data.variant !== variant) {
      continue;
    }

    if (!stats.variants[data.variant]) {
      stats.variants[data.variant] = {
        total: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
        successRate: 0,
      };
    }

    const variantStats = stats.variants[data.variant];
    variantStats.total += data.total;
    variantStats.successes += data.successes;
    variantStats.failures += data.failures;
    variantStats.avgResponseTime = data.total > 0
      ? data.totalResponseTime / data.total
      : 0;
    variantStats.successRate = data.total > 0
      ? (data.successes / data.total) * 100
      : 0;

    stats.overall.total += data.total;
    stats.overall.successes += data.successes;
    stats.overall.failures += data.failures;
  }

  if (stats.overall.total > 0) {
    stats.overall.avgResponseTime = testResults.size > 0
      ? Array.from(testResults.values())
          .reduce((sum, data) => sum + data.totalResponseTime, 0) /
        Array.from(testResults.values())
          .reduce((sum, data) => sum + data.total, 0)
      : 0;
  }

  return stats;
}

/**
 * Clear test results
 */
function clearTestResults() {
  testResults.clear();
}

module.exports = {
  translateWithABTesting,
  getTestStats,
  clearTestResults,
  VARIANTS,
};
