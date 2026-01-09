/**
 * Monitoring Service
 * Health checks and system monitoring
 */

const { getGroupConfig } = require('./databaseService');
const { getCacheStats } = require('./cacheService');
const config = require('../config/environment');

/**
 * Check system health
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check database connection
  try {
    await getGroupConfig('health_check_test');
    health.checks.database = { status: 'healthy', message: 'Connected' };
  } catch (error) {
    health.checks.database = { status: 'unhealthy', message: error.message };
    health.status = 'degraded';
  }

  // Check cache service
  try {
    const cacheStats = getCacheStats();
    health.checks.cache = {
      status: 'healthy',
      message: 'Operational',
      keys: cacheStats.keys,
    };
  } catch (error) {
    health.checks.cache = { status: 'unhealthy', message: error.message };
    health.status = 'degraded';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  health.checks.memory = {
    status: memoryMB.heapUsed < 500 ? 'healthy' : 'warning',
    ...memoryMB,
  };

  if (memoryMB.heapUsed > 500) {
    health.status = 'degraded';
  }

  // Check Google API (basic check - just verify config exists)
  health.checks.googleApi = {
    status: config.google.translateApiKey ? 'configured' : 'missing',
    message: config.google.translateApiKey ? 'API key configured' : 'API key missing',
  };

  // Check LINE config
  health.checks.line = {
    status: config.line.channelAccessToken && config.line.channelSecret
      ? 'configured'
      : 'missing',
    message: config.line.channelAccessToken && config.line.channelSecret
      ? 'LINE credentials configured'
      : 'LINE credentials missing',
  };

  return health;
}

/**
 * Get system metrics
 * @returns {Object} System metrics
 */
function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    },
    uptime: {
      seconds: Math.round(uptime),
      formatted: formatUptime(uptime),
    },
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
  };
}

/**
 * Format uptime in human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = {
  checkHealth,
  getSystemMetrics,
};
