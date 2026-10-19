/**
 * Analytics Dashboard
 * Provides detailed usage metrics and insights
 */

const express = require('express');
const { getAnalytics } = require('../services/analyticsService');
const { getAllActiveGroups, getGroupStats } = require('../services/databaseService');
const { getTestStats } = require('../services/abTestingService');
const config = require('../config/environment');
const { safeEqual } = require('../middleware/security');

const router = express.Router();

// Simple authentication middleware
function authenticate(req, res, next) {
  // Header only: a query-string secret leaks into access logs and browser history
  const token = req.headers.authorization;
  
  if (!config.dashboard.secretKey) {
    return res.status(500).json({ error: 'Dashboard not configured' });
  }

  if (!safeEqual(token, config.dashboard.secretKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

/**
 * Get comprehensive analytics
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const analytics = await getAnalytics();
    const groups = await getAllActiveGroups();
    
    // Get top groups by usage
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const stats = await getGroupStats(group.groupId);
        return {
          groupId: group.groupId,
          groupName: group.groupName,
          ...stats,
        };
      })
    );

    // Sort by usage
    groupsWithStats.sort((a, b) => (b.totalUsage || 0) - (a.totalUsage || 0));

    // A/B testing stats (if enabled)
    let abStats = null;
    if (config.features.abTesting) {
      abStats = getTestStats();
    }

    res.json({
      status: 'ok',
      analytics: {
        ...analytics,
        topGroups: groupsWithStats.slice(0, 10),
        totalGroups: groups.length,
        abTesting: abStats,
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get usage trends (daily/weekly/monthly)
 */
router.get('/trends', authenticate, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    // This would typically query time-series data from database
    // For now, return mock structure
    res.json({
      status: 'ok',
      trends: {
        period,
        data: [], // Would contain time-series data
        message: 'Trend data collection coming soon',
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get language usage statistics
 */
router.get('/languages', authenticate, async (req, res) => {
  try {
    const analytics = await getAnalytics();
    
    res.json({
      status: 'ok',
      languages: {
        mostTranslatedFrom: analytics.mostTranslatedFrom || [],
        mostTranslatedTo: analytics.mostTranslatedTo || [],
        languagePairs: analytics.languagePairs || [],
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get performance metrics
 */
router.get('/performance', authenticate, async (req, res) => {
  try {
    const analytics = await getAnalytics();
    const health = await require('../services/monitoringService').getHealthStatus();
    
    res.json({
      status: 'ok',
      performance: {
        avgResponseTime: analytics.avgResponseTime || 0,
        cacheHitRate: analytics.cacheHitRate || 0,
        errorRate: analytics.errorRate || 0,
        systemHealth: health,
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
