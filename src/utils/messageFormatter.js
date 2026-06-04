/**
 * Message Formatter
 * Formats translation results into user-friendly messages
 */

const {
  getLanguageInfo,
  LANGUAGES_BY_REGION,
  INDIAN_LANGUAGES,
  DEFAULT_SETTINGS,
} = require('../config/constants');

// Formatting constants
const FORMATTING = {
  MAX_MESSAGE_LENGTH: DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH,
  MAX_LANGUAGES_TO_SHOW: 5,
  LINE_BREAK: '\n',
  DOUBLE_LINE_BREAK: '\n\n',
};

/**
 * Format translations into a readable message
 * @param {Array} translations - Array of {lang, text, flag, name} objects
 * @returns {string} Formatted message
 */
function formatTranslations(translations) {
  if (!translations || translations.length === 0) {
    return 'No translations available.';
  }

  let message = '';

  // Show up to MAX_LANGUAGES_TO_SHOW, then show "and X more"
  const languagesToShow = translations.slice(0, FORMATTING.MAX_LANGUAGES_TO_SHOW);
  const remainingCount = translations.length - FORMATTING.MAX_LANGUAGES_TO_SHOW;

  languagesToShow.forEach((trans, index) => {
    const flag = trans.flag || '🌐';
    const langCode = trans.lang.toUpperCase();
    const text = trans.text || 'Translation failed';

    message += `${flag} ${langCode}: ${text}`;

    if (index < languagesToShow.length - 1) {
      message += FORMATTING.DOUBLE_LINE_BREAK;
    }
  });

  // Add "and X more" if there are more translations
  if (remainingCount > 0) {
    message += FORMATTING.DOUBLE_LINE_BREAK;
    message += `... and ${remainingCount} more translation${remainingCount > 1 ? 's' : ''}`;
  }

  return message;
}

/**
 * Truncate message if it exceeds LINE's character limit
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 5000)
 * @returns {string} Truncated text
 */
function truncateMessage(text, maxLength = DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH) {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Try to truncate at word boundary
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.9) {
    // If we can find a space near the end, use it
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Check if message contains only emojis
 * @param {string} text - Text to check
 * @returns {boolean} True if message is only emojis
 */
function isOnlyEmojis(text) {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // Remove whitespace and check if remaining characters are emojis
  const cleaned = text.replace(/\s/g, '');
  // Simple emoji detection - check if most characters are non-ASCII
  const emojiRegex = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

  return cleaned.replace(emojiRegex, '').length === 0;
}

/**
 * Check if message is from a bot
 * @param {Object} event - LINE event object
 * @returns {boolean} True if message is from a bot
 */
function isBotMessage(event) {
  // LINE bot messages have a specific source type
  // We'll check if the source type indicates a bot
  // For now, we'll check if userId starts with 'U' (user) vs other types
  return event.source.type === 'bot' || 
         (event.source.userId && !event.source.userId.startsWith('U'));
}

/**
 * Format welcome message for new users/groups
 * @returns {string} Welcome message
 */
function formatWelcomeMessage() {
  return `👋 Welcome to @LanguageBridgeBot!

I automatically translate messages in 35 languages, with special focus on Indian languages ⭐

💡 Quick Start:
1. Use /set [lang1] [lang2] ... to configure languages
2. Send messages and I'll translate them automatically!

📋 Commands:
/help - Show all commands
/languages - List all supported languages
/status - Check your settings

🎯 Free Tier: 20 messages/day
⭐ Premium: Unlimited translations

Need help? Use /help anytime!`;
}

/**
 * Format help message with all commands
 * @returns {string} Help message
 */
function formatHelpMessage() {
  return `🌉 @LanguageBridgeBot Help

📋 Available Commands:

/help or /start
   Show this help message

/languages
   List all 35 supported languages
   (Grouped by region with flag emojis)

/set [lang1] [lang2] ...
   Configure translation languages
   Minimum: 2 languages
   Maximum: Unlimited (premium)
   Example: /set en th hi mr

/status
   Show current settings and usage statistics

/about
   About this bot and features

/reset
   Reset group configuration

💡 Examples:
/set en th        → English ↔ Thai
/set en hi mr te  → English ↔ Hindi, Marathi, Telugu

🌍 Features:
• 35 supported languages
• Auto language detection
• Multi-language translation
• Special focus on Indian languages ⭐

📊 Usage:
Free Tier: 20 messages/day
Premium: Unlimited translations

Need more help? Contact support!`;
}

/**
 * Format error message based on error type
 * @param {Error|string} error - Error object or error message
 * @returns {string} User-friendly error message
 */
function formatErrorMessage(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Rate limit errors
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('rate limit reached')) {
    return `⏱️ Rate limit reached!\n\nPlease wait a moment before sending more messages.\n\nWe limit messages to prevent spam and ensure quality service.`;
  }

  // Translation errors
  if (lowerMessage.includes('translation failed') || lowerMessage.includes('translation error')) {
    return `❌ Translation failed!\n\nPlease try again in a moment. If the problem persists, check your language configuration with /status.`;
  }

  // API quota errors
  if (lowerMessage.includes('quota') || lowerMessage.includes('429') || lowerMessage.includes('api quota')) {
    return `📊 API quota exceeded!\n\nWe've reached our translation limit for now. Please try again later.\n\n⭐ Premium users get priority access!`;
  }

  // Database errors
  if (lowerMessage.includes('database') || lowerMessage.includes('connection')) {
    return `🔌 Database connection error!\n\nPlease try again in a moment. Your settings are safe!`;
  }

  // Invalid command errors
  if (lowerMessage.includes('invalid command') || lowerMessage.includes('unknown command')) {
    return `❓ Unknown command!\n\nUse /help to see all available commands.`;
  }

  // Usage limit errors
  if (lowerMessage.includes('usage limit') || lowerMessage.includes('daily limit')) {
    return `📊 Daily limit reached!\n\nYou've used all your free messages for today.\n\n⭐ Upgrade to premium for unlimited translations!\n\nUse /status to check your usage.`;
  }

  // Generic error
  return `❌ Oops! Something went wrong.\n\nError: ${errorMessage}\n\nPlease try again or use /help for assistance.`;
}

/**
 * Format language list grouped by region
 * @returns {string} Formatted language list
 */
function formatLanguageList() {
  let message = '🌍 Supported Languages (35 total)\n\n';

  // Asian Languages
  message += '📌 Asian Languages (16):\n';
  LANGUAGES_BY_REGION.Asian.forEach(code => {
    const info = getLanguageInfo(code);
    const isIndian = INDIAN_LANGUAGES.includes(code);
    const highlight = isIndian ? ' ⭐' : '';
    message += `${info.flag} ${info.name} (${code})${highlight}${FORMATTING.LINE_BREAK}`;
  });

  message += FORMATTING.DOUBLE_LINE_BREAK;
  message += '📌 European Languages (15):\n';
  LANGUAGES_BY_REGION.European.forEach(code => {
    const info = getLanguageInfo(code);
    message += `${info.flag} ${info.name} (${code})${FORMATTING.LINE_BREAK}`;
  });

  message += FORMATTING.DOUBLE_LINE_BREAK;
  message += '📌 Other Languages (5):\n';
  LANGUAGES_BY_REGION.Other.forEach(code => {
    const info = getLanguageInfo(code);
    message += `${info.flag} ${info.name} (${code})${FORMATTING.LINE_BREAK}`;
  });

  message += FORMATTING.DOUBLE_LINE_BREAK;
  message += '⭐ = Indian languages (special focus)\n';
  message += FORMATTING.LINE_BREAK;
  message += '💡 Use /set [lang1] [lang2] ... to configure';

  return message;
}

/**
 * Format status message with group config and usage stats
 * @param {Object} groupConfig - Group configuration object
 * @param {Object} usageStats - Usage statistics object
 * @returns {string} Formatted status message
 */
function formatStatusMessage(groupConfig, usageStats) {
  if (!groupConfig || !groupConfig.languages || groupConfig.languages.length === 0) {
    return 'ℹ️ No configuration found.\n\nUse /set [lang1] [lang2] ... to configure languages.\n\nExample: /set en th';
  }

  let message = '📊 Current Status\n\n';

  // Languages
  message += '🌍 Configured Languages:\n';
  groupConfig.languages.forEach(code => {
    const info = getLanguageInfo(code);
    const isIndian = INDIAN_LANGUAGES.includes(code);
    const highlight = isIndian ? ' ⭐' : '';
    message += `${info.flag} ${info.name} (${code})${highlight}${FORMATTING.LINE_BREAK}`;
  });

  message += FORMATTING.DOUBLE_LINE_BREAK;
  message += `📈 Mode: ${groupConfig.mode || 'multilingual'}`;

  // Usage
  message += FORMATTING.DOUBLE_LINE_BREAK;
  message += '📊 Usage Statistics:';
  
  if (usageStats && usageStats.isPremium) {
    message += FORMATTING.LINE_BREAK;
    message += '⭐ Premium: Unlimited';
  } else {
    const dailyUsed = usageStats?.limit?.used || 0;
    const dailyLimit = usageStats?.limit?.limit || DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT;
    const remaining = usageStats?.limit?.remaining || (dailyLimit - dailyUsed);
    
    message += FORMATTING.LINE_BREAK;
    message += `📅 Today: ${dailyUsed}/${dailyLimit} messages`;
    message += FORMATTING.LINE_BREAK;
    message += `📊 Remaining: ${remaining} messages`;
  }

  if (usageStats?.total) {
    message += FORMATTING.LINE_BREAK;
    message += `📝 Total Messages: ${usageStats.total.messageCount || 0}`;
    message += FORMATTING.LINE_BREAK;
    message += `📝 Total Characters: ${(usageStats.total.characterCount || 0).toLocaleString()}`;
  }

  // Last used
  if (groupConfig.lastUsedAt) {
    const lastUsed = new Date(groupConfig.lastUsedAt);
    message += FORMATTING.LINE_BREAK;
    message += `🕐 Last Used: ${lastUsed.toLocaleString()}`;
  }

  return message;
}

module.exports = {
  formatTranslations,
  truncateMessage,
  isOnlyEmojis,
  isBotMessage,
  formatWelcomeMessage,
  formatHelpMessage,
  formatErrorMessage,
  formatLanguageList,
  formatStatusMessage,
  FORMATTING,
};
