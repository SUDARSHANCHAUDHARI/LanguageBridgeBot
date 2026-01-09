/**
 * Logger Middleware
 * Request logging with structured format
 */

/**
 * Request logger middleware
 * Logs all incoming requests without logging sensitive data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Attach request ID to request object
  req.requestId = requestId;

  // Log request (without sensitive data)
  const logData = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  // Don't log message content for privacy
  if (req.path === '/webhook' && req.body?.events) {
    logData.eventCount = req.body.events.length;
    logData.eventTypes = req.body.events.map(e => e.type);
    // Don't log message content
  }

  console.log('Incoming request:', JSON.stringify(logData, null, 2));

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // Log level based on status code
    if (res.statusCode >= 500) {
      console.error('Request error:', JSON.stringify(responseLog, null, 2));
    } else if (res.statusCode >= 400) {
      console.warn('Request warning:', JSON.stringify(responseLog, null, 2));
    } else {
      console.log('Request completed:', JSON.stringify(responseLog, null, 2));
    }
  });

  next();
}

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} context - Additional context
 */
function logErrorWithContext(error, req, context = {}) {
  const errorLog = {
    requestId: req.requestId || 'unknown',
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
    },
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };

  console.error('Error with context:', JSON.stringify(errorLog, null, 2));
}

module.exports = {
  requestLogger,
  logErrorWithContext,
  generateRequestId,
};
