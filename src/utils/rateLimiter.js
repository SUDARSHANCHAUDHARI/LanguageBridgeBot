/**
 * Rate Limiter
 * Simple in-memory rate limiting per group
 */

const { DEFAULT_SETTINGS } = require('../config/constants');

// Store rate limit data: { groupId: { count: number, resetAt: timestamp } }
const rateLimitStore = new Map();

/**
 * Check if group is within rate limit
 * @param {string} groupId - Group ID or user ID
 * @returns {boolean} True if within rate limit
 */
function checkRateLimit(groupId) {
  const now = Date.now();
  const window = DEFAULT_SETTINGS.RATE_LIMIT_WINDOW;
  const maxRequests = DEFAULT_SETTINGS.RATE_LIMIT_MAX_REQUESTS;

  const limit = rateLimitStore.get(groupId);

  if (!limit) {
    // First request
    rateLimitStore.set(groupId, {
      count: 1,
      resetAt: now + window,
    });
    return true;
  }

  // Check if window has expired
  if (now > limit.resetAt) {
    // Reset window
    rateLimitStore.set(groupId, {
      count: 1,
      resetAt: now + window,
    });
    return true;
  }

  // Check if within limit
  if (limit.count >= maxRequests) {
    return false;
  }

  // Increment count
  limit.count++;
  rateLimitStore.set(groupId, limit);
  return true;
}

/**
 * Get time until rate limit resets (in seconds)
 * @param {string} groupId - Group ID or user ID
 * @returns {number} Seconds until reset
 */
function getResetTime(groupId) {
  const limit = rateLimitStore.get(groupId);
  if (!limit) {
    return 0;
  }

  const now = Date.now();
  const remaining = Math.max(0, limit.resetAt - now);
  return Math.ceil(remaining / 1000);
}

/**
 * Clear rate limit for a group (for testing)
 * @param {string} groupId - Group ID or user ID
 */
function clearRateLimit(groupId) {
  rateLimitStore.delete(groupId);
}

/**
 * Clear all rate limits (for testing)
 */
function clearAllRateLimits() {
  rateLimitStore.clear();
}

module.exports = {
  checkRateLimit,
  getResetTime,
  clearRateLimit,
  clearAllRateLimits,
};
