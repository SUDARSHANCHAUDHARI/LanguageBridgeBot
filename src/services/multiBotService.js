/**
 * Multi-Bot Service
 * Manages multiple LINE bot instances with different configurations
 */

const { MongoClient } = require('mongodb');
const config = require('../config/environment');
const { getGroupConfig } = require('./databaseService');

// Bot configurations cache
const botConfigs = new Map();

/**
 * Bot configuration schema
 */
class BotConfig {
  constructor(botId, name, channelAccessToken, channelSecret, settings = {}) {
    this.botId = botId;
    this.name = name;
    this.channelAccessToken = channelAccessToken;
    this.channelSecret = channelSecret;
    this.settings = {
      defaultLanguages: settings.defaultLanguages || ['en', 'th', 'ja'],
      maxLanguages: settings.maxLanguages || 5,
      rateLimit: settings.rateLimit || 30,
      ...settings,
    };
    this.createdAt = new Date();
    this.isActive = true;
  }
}

/**
 * Register a new bot
 * @param {string} botId - Unique bot ID
 * @param {string} name - Bot name
 * @param {string} channelAccessToken - LINE channel access token
 * @param {string} channelSecret - LINE channel secret
 * @param {Object} settings - Bot settings
 * @returns {BotConfig} Bot configuration
 */
function registerBot(botId, name, channelAccessToken, channelSecret, settings = {}) {
  const botConfig = new BotConfig(botId, name, channelAccessToken, channelSecret, settings);
  botConfigs.set(botId, botConfig);
  return botConfig;
}

/**
 * Get bot configuration
 * @param {string} botId - Bot ID
 * @returns {BotConfig|null} Bot configuration or null
 */
function getBotConfig(botId) {
  return botConfigs.get(botId) || null;
}

/**
 * Get all active bots
 * @returns {Array<BotConfig>} List of active bot configurations
 */
function getAllBots() {
  return Array.from(botConfigs.values()).filter(bot => bot.isActive);
}

/**
 * Deactivate a bot
 * @param {string} botId - Bot ID
 */
function deactivateBot(botId) {
  const bot = botConfigs.get(botId);
  if (bot) {
    bot.isActive = false;
  }
}

/**
 * Activate a bot
 * @param {string} botId - Bot ID
 */
function activateBot(botId) {
  const bot = botConfigs.get(botId);
  if (bot) {
    bot.isActive = true;
  }
}

/**
 * Update bot settings
 * @param {string} botId - Bot ID
 * @param {Object} settings - New settings
 */
function updateBotSettings(botId, settings) {
  const bot = botConfigs.get(botId);
  if (bot) {
    bot.settings = { ...bot.settings, ...settings };
  }
}

/**
 * Get bot for a group (determines which bot handles which group)
 * @param {string} groupId - Group ID
 * @returns {string|null} Bot ID or null
 */
async function getBotForGroup(groupId) {
  // Default: use first active bot
  const activeBots = getAllBots();
  if (activeBots.length === 0) {
    return null;
  }

  // Could implement routing logic here:
  // - Round-robin
  // - Based on group metadata
  // - Based on load balancing
  // For now, return first bot
  return activeBots[0].botId;
}

/**
 * Route message to appropriate bot
 * @param {string} groupId - Group ID
 * @param {Object} event - LINE event
 * @returns {Promise<Object>} Bot configuration and client
 */
async function routeToBot(groupId, event) {
  if (!config.features.multiBot) {
    // Multi-bot disabled, use default
    return {
      botId: 'default',
      config: null,
      client: require('../bot/webhook').client,
    };
  }

  const botId = await getBotForGroup(groupId);
  if (!botId) {
    throw new Error('No active bot available');
  }

  const botConfig = getBotConfig(botId);
  if (!botConfig || !botConfig.isActive) {
    throw new Error(`Bot ${botId} is not active`);
  }

  // Create LINE client for this bot
  const line = require('@line/bot-sdk');
  const client = new line.Client({
    channelAccessToken: botConfig.channelAccessToken,
    channelSecret: botConfig.channelSecret,
  });

  return {
    botId,
    config: botConfig,
    client,
  };
}

module.exports = {
  registerBot,
  getBotConfig,
  getAllBots,
  deactivateBot,
  activateBot,
  updateBotSettings,
  getBotForGroup,
  routeToBot,
  BotConfig,
};
