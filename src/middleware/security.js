/**
 * Security Middleware
 * LINE signature validation and rate limiting
 */

const crypto = require('crypto');
const config = require('../config/environment');

// Rate limit stores: { identifier: { count: number, resetAt: timestamp } }
const ipRateLimitStore = new Map();
const groupRateLimitStore = new Map();

const IP_RATE_LIMIT = 100; // requests per minute per IP
const GROUP_RATE_LIMIT = 30; // requests per minute per group
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

/**
 * Validate LINE webhook signature
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function validateLineSignature(req, res, next) {
  try {
    const signature = req.headers['x-line-signature'];
    const body = req.rawBody || JSON.stringify(req.body);

    if (!signature) {
      console.warn('Missing LINE signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Generate hash
    const hash = crypto
      .createHmac('sha256', config.line.channelSecret)
      .update(body)
      .digest('base64');

    // Compare signatures (constant time; length check first because timingSafeEqual throws on mismatch)
    const hashBuf = Buffer.from(hash);
    const sigBuf = Buffer.from(signature);
    if (hashBuf.length !== sigBuf.length || !crypto.timingSafeEqual(hashBuf, sigBuf)) {
      console.warn('Invalid LINE signature', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Signature is valid
    next();
  } catch (error) {
    console.error('Error validating LINE signature:', error);
    return res.status(401).json({ error: 'Signature validation failed' });
  }
}

/**
 * Rate limiter middleware - limits requests per IP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function rateLimiter(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Check IP rate limit
    const ipLimit = ipRateLimitStore.get(ip);

    if (!ipLimit) {
      // First request from this IP
      ipRateLimitStore.set(ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      });
      return next();
    }

    // Check if window has expired
    if (now > ipLimit.resetAt) {
      // Reset window
      ipRateLimitStore.set(ip, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      });
      return next();
    }

    // Check if within limit
    if (ipLimit.count >= IP_RATE_LIMIT) {
      const resetTime = Math.ceil((ipLimit.resetAt - now) / 1000);
      res.set('Retry-After', resetTime.toString());
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${resetTime} seconds.`,
        retryAfter: resetTime,
      });
    }

    // Increment count
    ipLimit.count++;
    ipRateLimitStore.set(ip, ipLimit);

    next();
  } catch (error) {
    console.error('Error in rate limiter:', error);
    // On error, allow request (fail open)
    next();
  }
}

/**
 * Group rate limiter - limits requests per group (for webhook endpoint)
 * This is a separate middleware that can be applied to webhook routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function groupRateLimiter(req, res, next) {
  try {
    // Extract group ID from request body (LINE webhook)
    const events = req.body?.events || [];
    if (events.length === 0) {
      return next();
    }

    // Get group ID from first event
    const groupId = events[0]?.source?.groupId || 
                    events[0]?.source?.userId || 
                    'unknown';

    const now = Date.now();
    const groupLimit = groupRateLimitStore.get(groupId);

    if (!groupLimit) {
      // First request from this group
      groupRateLimitStore.set(groupId, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      });
      return next();
    }

    // Check if window has expired
    if (now > groupLimit.resetAt) {
      // Reset window
      groupRateLimitStore.set(groupId, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      });
      return next();
    }

    // Check if within limit
    if (groupLimit.count >= GROUP_RATE_LIMIT) {
      const resetTime = Math.ceil((groupLimit.resetAt - now) / 1000);
      res.set('Retry-After', resetTime.toString());
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests from this group. Please try again in ${resetTime} seconds.`,
        retryAfter: resetTime,
      });
    }

    // Increment count
    groupLimit.count++;
    groupRateLimitStore.set(groupId, groupLimit);

    next();
  } catch (error) {
    console.error('Error in group rate limiter:', error);
    // On error, allow request (fail open)
    next();
  }
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
function cleanupRateLimits() {
  const now = Date.now();

  // Clean IP rate limits
  for (const [ip, limit] of ipRateLimitStore.entries()) {
    if (now > limit.resetAt) {
      ipRateLimitStore.delete(ip);
    }
  }

  // Clean group rate limits
  for (const [groupId, limit] of groupRateLimitStore.entries()) {
    if (now > limit.resetAt) {
      groupRateLimitStore.delete(groupId);
    }
  }
}

// Clean up expired entries every 5 minutes
const cleanupInterval = setInterval(cleanupRateLimits, 5 * 60 * 1000);
cleanupInterval.unref?.();

module.exports = {
  validateLineSignature,
  rateLimiter,
  groupRateLimiter,
  cleanupRateLimits,
};
