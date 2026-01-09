/**
 * Web Dashboard
 * Admin panel for stats and group management
 */

const express = require('express');
const path = require('path');
const config = require('../config/environment');
const { getAllActiveGroups, getGroupStats } = require('../services/databaseService');
const { getAnalytics } = require('../services/analyticsService');
const { getHealthStatus } = require('../services/monitoringService');

const router = express.Router();

// Simple authentication middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization || req.query.token;
  
  if (!config.dashboard.secretKey) {
    return res.status(500).json({ error: 'Dashboard not configured' });
  }

  if (token !== config.dashboard.secretKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

/**
 * Dashboard home page
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const stats = await getAnalytics();
    const health = await getHealthStatus();
    const groups = await getAllActiveGroups();

    res.json({
      status: 'ok',
      dashboard: {
        stats: {
          totalGroups: groups.length,
          totalMessages: stats.totalMessages || 0,
          totalTranslations: stats.totalTranslations || 0,
          activeUsers: stats.activeUsers || 0,
          cacheHitRate: stats.cacheHitRate || 0,
          avgResponseTime: stats.avgResponseTime || 0,
        },
        health,
        groups: groups.slice(0, 10), // Latest 10 groups
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all groups with stats
 */
router.get('/groups', authenticate, async (req, res) => {
  try {
    const groups = await getAllActiveGroups();
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const stats = await getGroupStats(group.groupId);
        return {
          ...group,
          stats,
        };
      })
    );

    res.json({
      status: 'ok',
      groups: groupsWithStats,
      total: groupsWithStats.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get group details
 */
router.get('/groups/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const stats = await getGroupStats(groupId);
    const { getGroupConfig } = require('../services/databaseService');
    const config = await getGroupConfig(groupId);

    res.json({
      status: 'ok',
      group: {
        groupId,
        config,
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get analytics data
 */
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json({
      status: 'ok',
      analytics,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system health
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const health = await getHealthStatus();
    res.json({
      status: 'ok',
      health,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
