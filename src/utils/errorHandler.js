/**
 * Error Handler
 * Custom error classes and error handling utilities
 */

/**
 * Base custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Translation error
 */
class TranslationError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'TRANSLATION_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends AppError {
  constructor(message, resetTime = null) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.resetTime = resetTime;
  }
}

/**
 * Database error
 */
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * API error (external API failures)
 */
class APIError extends AppError {
  constructor(message, statusCode = 500, originalError = null) {
    super(message, statusCode, 'API_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Usage limit error
 */
class UsageLimitError extends AppError {
  constructor(message, limit = null, used = null) {
    super(message, 403, 'USAGE_LIMIT_ERROR');
    this.limit = limit;
    this.used = used;
  }
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(error, context = {}) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code || 'UNKNOWN_ERROR',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    context,
  };

  // Log to console (in production, use proper logging service)
  console.error('Error logged:', JSON.stringify(errorInfo, null, 2));

  // In production, you might want to send to error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Format error for API response
 * @param {Error} error - Error object
 * @param {boolean} includeStack - Whether to include stack trace (dev only)
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, includeStack = false) {
  const isDev = process.env.NODE_ENV === 'development';

  const response = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An error occurred',
      statusCode: error.statusCode || 500,
    },
  };

  // Include stack trace in development
  if (isDev && includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  // Include additional error properties
  if (error.field) {
    response.error.field = error.field;
  }

  if (error.resetTime) {
    response.error.resetTime = error.resetTime;
  }

  if (error.limit !== undefined) {
    response.error.limit = error.limit;
    response.error.used = error.used;
  }

  return response;
}

/**
 * Handle and log error
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} Formatted error response
 */
function handleError(error, context = {}) {
  // Log the error
  logError(error, context);

  // Format response
  return formatErrorResponse(error, true);
}

/**
 * Convert unknown error to AppError
 * @param {Error} error - Error object
 * @returns {AppError} Converted error
 */
function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  // Check error message for known patterns
  const message = error.message || 'An error occurred';

  if (message.includes('rate limit') || message.includes('429')) {
    return new RateLimitError(message, error.resetTime);
  }

  if (message.includes('quota') || message.includes('limit')) {
    return new UsageLimitError(message);
  }

  if (message.includes('translation')) {
    return new TranslationError(message, error);
  }

  if (message.includes('database') || message.includes('connection')) {
    return new DatabaseError(message, error);
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return new ValidationError(message);
  }

  // Default to API error
  return new APIError(message, 500, error);
}

module.exports = {
  AppError,
  TranslationError,
  ValidationError,
  RateLimitError,
  DatabaseError,
  APIError,
  UsageLimitError,
  logError,
  formatErrorResponse,
  handleError,
  normalizeError,
};
