/**
 * Usage Service
 * Tracks daily usage per group and enforces free tier limits
 */

const { getGroupConfig, incrementUsage: dbIncrementUsage } = require('./databaseService');
const { DEFAULT_SETTINGS } = require('../config/constants');

/**
 * Get today's date string (YYYY-MM-DD) for daily tracking
 * @returns {string} Today's date string
 */
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Get daily usage for a group
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<Object>} Daily usage information
 */
async function getDailyUsage(groupId) {
  try {
    const group = await getGroupConfig(groupId);

    if (!group) {
      return {
        date: getTodayDateString(),
        messageCount: 0,
        characterCount: 0,
        limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
        isPremium: false,
      };
    }

    // Premium users have unlimited usage
    if (group.isPremium) {
      return {
        date: getTodayDateString(),
        messageCount: 0, // Unlimited
        characterCount: 0, // Unlimited
        limit: Infinity,
        isPremium: true,
      };
    }

    // For free tier, we track daily usage
    // Note: This is a simplified version. In production, you might want to
    // store daily usage in a separate collection with date-based tracking
    // For now, we'll use a simple approach with lastUsedAt date

    const today = getTodayDateString();
    const lastUsedDate = group.lastUsedAt 
      ? new Date(group.lastUsedAt).toISOString().split('T')[0]
      : null;

    // If last used today, we need to track messages
    // For simplicity, we'll check if it's the same day
    // In production, implement proper daily tracking with a separate collection

    return {
      date: today,
      messageCount: lastUsedDate === today ? (group.dailyMessageCount || 0) : 0,
      characterCount: lastUsedDate === today ? (group.dailyCharacterCount || 0) : 0,
      limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      isPremium: false,
    };
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return {
      date: getTodayDateString(),
      messageCount: 0,
      characterCount: 0,
      limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      isPremium: false,
    };
  }
}

/**
 * Check if group is within daily usage limits
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<Object>} { withinLimit: boolean, limit: number, used: number, remaining: number }
 */
async function checkUsageLimit(groupId) {
  try {
    const usage = await getDailyUsage(groupId);

    // Premium users always within limit
    if (usage.isPremium) {
      return {
        withinLimit: true,
        limit: Infinity,
        used: 0,
        remaining: Infinity,
        isPremium: true,
      };
    }

    const withinLimit = usage.messageCount < usage.limit;
    const remaining = Math.max(0, usage.limit - usage.messageCount);

    return {
      withinLimit,
      limit: usage.limit,
      used: usage.messageCount,
      remaining,
      isPremium: false,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // Default to allowing usage on error
    return {
      withinLimit: true,
      limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      used: 0,
      remaining: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      isPremium: false,
    };
  }
}

/**
 * Track usage for a group (increment daily counters)
 * @param {string} groupId - LINE group ID or user ID
 * @param {number} messageLength - Length of message in characters
 * @returns {Promise<void>}
 */
async function trackUsage(groupId, messageLength = 0) {
  try {
    const group = await getGroupConfig(groupId);
    const today = getTodayDateString();

    if (!group) {
      // Create new group entry
      // This will be handled by databaseService.saveGroupConfig
      return;
    }

    // Premium users - no limits, just track total usage
    if (group.isPremium) {
      await dbIncrementUsage(groupId, messageLength);
      return;
    }

    // Free tier - check daily limit
    const usage = await getDailyUsage(groupId);
    
    if (usage.messageCount >= usage.limit) {
      throw new Error('Daily usage limit reached. Please upgrade to premium for unlimited translations.');
    }

    // Increment usage in database
    await dbIncrementUsage(groupId, messageLength);

    // Note: For proper daily tracking, you would update a daily usage collection
    // This is a simplified version that uses the group's lastUsedAt date
    // In production, implement a separate 'dailyUsage' collection with:
    // { groupId, date, messageCount, characterCount }
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

/**
 * Get usage information for a group
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<Object>} Complete usage information
 */
async function getUsageInfo(groupId) {
  try {
    const group = await getGroupConfig(groupId);
    const dailyUsage = await getDailyUsage(groupId);
    const limitCheck = await checkUsageLimit(groupId);

    return {
      groupId,
      isPremium: group?.isPremium || false,
      daily: dailyUsage,
      limit: limitCheck,
      total: {
        messageCount: group?.messageCount || 0,
        characterCount: group?.characterCount || 0,
      },
      createdAt: group?.createdAt,
      lastUsedAt: group?.lastUsedAt,
    };
  } catch (error) {
    console.error('Error getting usage info:', error);
    return {
      groupId,
      isPremium: false,
      daily: {
        date: getTodayDateString(),
        messageCount: 0,
        characterCount: 0,
        limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      },
      limit: {
        withinLimit: true,
        limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
        used: 0,
        remaining: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      },
      total: {
        messageCount: 0,
        characterCount: 0,
      },
    };
  }
}

/**
 * Reset daily usage (for testing or manual reset)
 * Note: In production, daily usage resets automatically based on date
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<void>}
 */
async function resetDailyUsage(groupId) {
  // This would reset daily counters in a dailyUsage collection
  // For now, it's a placeholder as we're using a simplified approach
  console.log(`Daily usage reset requested for group: ${groupId}`);
}

module.exports = {
  getDailyUsage,
  checkUsageLimit,
  trackUsage,
  getUsageInfo,
  resetDailyUsage,
};
