/**
 * Subscription Service
 * Handles premium subscriptions and feature access
 */

const { getGroupConfig, saveGroupConfig } = require('./databaseService');
const { DEFAULT_SETTINGS } = require('../config/constants');

/**
 * Check if group/user has premium subscription
 * @param {string} groupId - Group ID or user ID
 * @returns {Promise<boolean>} True if premium
 */
async function isPremium(groupId) {
  try {
    const group = await getGroupConfig(groupId);
    return group?.isPremium || false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Check if user can access premium feature
 * @param {string} groupId - Group ID or user ID
 * @param {string} feature - Feature name
 * @returns {Promise<boolean>} True if can access
 */
async function canAccessPremiumFeature(groupId, _feature) {
  const premium = await isPremium(groupId);
  if (!premium) {
    return false;
  }

  // Feature-specific checks can be added here
  return true;
}

/**
 * Upgrade group to premium
 * @param {string} groupId - Group ID or user ID
 * @param {Object} subscriptionData - Subscription information
 * @returns {Promise<Object>} Updated group config
 */
async function upgradeToPremium(groupId, subscriptionData = {}) {
  try {
    const group = await getGroupConfig(groupId);
    const languages = group?.languages || DEFAULT_SETTINGS.DEFAULT_LANGUAGES;

    await saveGroupConfig(groupId, languages, {
      isPremium: true,
      ...subscriptionData,
    });

    return await getGroupConfig(groupId);
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    throw new Error('Failed to upgrade to premium');
  }
}

/**
 * Downgrade group from premium
 * @param {string} groupId - Group ID or user ID
 * @returns {Promise<Object>} Updated group config
 */
async function downgradeFromPremium(groupId) {
  try {
    const group = await getGroupConfig(groupId);
    const languages = group?.languages || DEFAULT_SETTINGS.DEFAULT_LANGUAGES;

    await saveGroupConfig(groupId, languages, {
      isPremium: false,
    });

    return await getGroupConfig(groupId);
  } catch (error) {
    console.error('Error downgrading from premium:', error);
    throw new Error('Failed to downgrade from premium');
  }
}

/**
 * Get subscription information
 * @param {string} groupId - Group ID or user ID
 * @returns {Promise<Object>} Subscription info
 */
async function getSubscriptionInfo(groupId) {
  try {
    const group = await getGroupConfig(groupId);
    
    return {
      isPremium: group?.isPremium || false,
      features: {
        unlimitedTranslations: group?.isPremium || false,
        priorityTranslation: group?.isPremium || false,
        unlimitedLanguages: group?.isPremium || false,
        translationHistory: group?.isPremium || false,
        advancedAnalytics: group?.isPremium || false,
      },
      limits: {
        dailyMessages: group?.isPremium 
          ? Infinity 
          : DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
        maxLanguages: group?.isPremium 
          ? Infinity 
          : DEFAULT_SETTINGS.MAX_LANGUAGES_FREE,
      },
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return {
      isPremium: false,
      features: {},
      limits: {},
    };
  }
}

module.exports = {
  isPremium,
  canAccessPremiumFeature,
  upgradeToPremium,
  downgradeFromPremium,
  getSubscriptionInfo,
};
