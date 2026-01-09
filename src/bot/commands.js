/**
 * Command Handler
 * Handles all bot commands (/help, /languages, /set, /status, /about, /reset)
 */

const { client } = require('./webhook');
const {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  INDIAN_LANGUAGES,
  LANGUAGES_BY_REGION,
  DEFAULT_SETTINGS,
  isValidLanguageCode,
  getLanguageInfo,
} = require('../config/constants');
const { saveGroupConfig, getGroupConfig, deactivateGroup } = require('../services/databaseService');
const { getUsageInfo } = require('../services/usageService');
const {
  formatWelcomeMessage,
  formatHelpMessage,
  formatLanguageList,
  formatStatusMessage,
} = require('../utils/messageFormatter');

/**
 * Parse command from message text
 * @param {string} text - Message text
 * @returns {Object} { command: string, args: string[] } or null if not a command
 */
function parseCommand(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Remove @ mention if present
  let cleanText = text.trim();
  cleanText = cleanText.replace(/@\w+/g, '').trim();

  // Check if it's a command (starts with /)
  if (!cleanText.startsWith('/')) {
    return null;
  }

  // Extract command and arguments
  const parts = cleanText.split(/\s+/);
  const command = parts[0].toLowerCase().substring(1); // Remove leading /
  const args = parts.slice(1).filter(arg => arg.length > 0);

  return { command, args };
}

/**
 * Check if message is a command
 * @param {string} text - Message text
 * @returns {boolean} True if message is a command
 */
function isCommand(text) {
  const parsed = parseCommand(text);
  return parsed !== null;
}

/**
 * Handle /start or /help command
 * @param {Object} event - LINE event object
 * @returns {Promise<void>}
 */
async function handleHelp(event) {
  const replyToken = event.replyToken;
  const message = formatHelpMessage();

  await client.replyMessage(replyToken, {
    type: 'text',
    text: message,
  });
}

/**
 * Handle /languages command
 * @param {Object} event - LINE event object
 * @returns {Promise<void>}
 */
async function handleLanguages(event) {
  const replyToken = event.replyToken;
  const message = formatLanguageList();

  await client.replyMessage(replyToken, {
    type: 'text',
    text: message,
  });
}

/**
 * Handle /set command
 * @param {Object} event - LINE event object
 * @param {string[]} args - Language codes
 * @returns {Promise<void>}
 */
async function handleSet(event, args) {
  const replyToken = event.replyToken;
  const groupId = event.source.groupId || event.source.userId;

  try {
    // Validate arguments
    if (!args || args.length === 0) {
      await client.replyMessage(replyToken, {
        type: 'text',
        text: '❌ Error: Please provide at least 2 language codes.\n\nExample: /set en th hi',
      });
      return;
    }

    if (args.length < 2) {
      await client.replyMessage(replyToken, {
        type: 'text',
        text: '❌ Error: At least 2 languages are required.\n\nExample: /set en th',
      });
      return;
    }

    // Validate all language codes
    const invalidCodes = [];
    const validCodes = [];

    args.forEach(code => {
      const normalizedCode = code.toLowerCase().trim();
      if (isValidLanguageCode(normalizedCode)) {
        validCodes.push(normalizedCode);
      } else {
        invalidCodes.push(code);
      }
    });

    if (invalidCodes.length > 0) {
      await client.replyMessage(replyToken, {
        type: 'text',
        text: `❌ Error: Invalid language codes: ${invalidCodes.join(', ')}\n\nUse /languages to see all supported languages.`,
      });
      return;
    }

    if (validCodes.length < 2) {
      await client.replyMessage(replyToken, {
        type: 'text',
        text: '❌ Error: At least 2 valid languages are required.',
      });
      return;
    }

    // Remove duplicates
    const uniqueCodes = [...new Set(validCodes)];

    // Save configuration
    const groupName = event.source.type === 'group' 
      ? `Group ${groupId.substring(0, 8)}`
      : 'Private Chat';

    await saveGroupConfig(groupId, uniqueCodes, {
      groupName,
    });

    // Build confirmation message
    let message = '✅ Configuration saved!\n\n';
    message += '🌍 Configured languages:\n';
    
    uniqueCodes.forEach(code => {
      const info = getLanguageInfo(code);
      const isIndian = INDIAN_LANGUAGES.includes(code);
      const highlight = isIndian ? ' ⭐' : '';
      message += `${info.flag} ${info.name} (${code})${highlight}\n`;
    });

    message += '\n💡 Now send messages and I will translate them!';

    await client.replyMessage(replyToken, {
      type: 'text',
      text: message,
    });
  } catch (error) {
    console.error('Error handling /set command:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: '❌ Error: Failed to save configuration. Please try again.',
    });
  }
}

/**
 * Handle /status command
 * @param {Object} event - LINE event object
 * @returns {Promise<void>}
 */
async function handleStatus(event) {
  const replyToken = event.replyToken;
  const groupId = event.source.groupId || event.source.userId;

  try {
    const usageInfo = await getUsageInfo(groupId);
    const group = await getGroupConfig(groupId);

    if (!group || !group.languages || group.languages.length === 0) {
      await client.replyMessage(replyToken, {
        type: 'text',
        text: 'ℹ️ No configuration found.\n\nUse /set [lang1] [lang2] ... to configure languages.\n\nExample: /set en th',
      });
      return;
    }

    const message = formatStatusMessage(group, usageInfo);

    await client.replyMessage(replyToken, {
      type: 'text',
      text: message,
    });
  } catch (error) {
    console.error('Error handling /status command:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: '❌ Error: Failed to get status. Please try again.',
    });
  }
}

/**
 * Handle /about command
 * @param {Object} event - LINE event object
 * @returns {Promise<void>}
 */
async function handleAbout(event) {
  const replyToken = event.replyToken;

  const message = `🌉 @LanguageBridgeBot

Version: ${DEFAULT_SETTINGS.BOT_VERSION}

🌍 Features:
• 35 supported languages
• Auto language detection
• Multi-language translation
• Special focus on Indian languages ⭐
  (Hindi, Marathi, Telugu, Bengali, Tamil, Urdu)

📊 Free Tier: 20 messages/day
⭐ Premium: Unlimited translations

💡 Commands:
/help - Show help
/languages - List all languages
/set - Configure languages
/status - View status

🔗 Website: Coming soon
📧 Support: Coming soon

Made with ❤️ for multilingual communication`;

  await client.replyMessage(replyToken, {
    type: 'text',
    text: message,
  });
}

/**
 * Handle /reset command
 * @param {Object} event - LINE event object
 * @returns {Promise<void>}
 */
async function handleReset(event) {
  const replyToken = event.replyToken;
  const groupId = event.source.groupId || event.source.userId;

  try {
    // Deactivate group (soft delete)
    await deactivateGroup(groupId);

    await client.replyMessage(replyToken, {
      type: 'text',
      text: '✅ Group configuration reset!\n\nUse /set [lang1] [lang2] ... to configure again.\n\nExample: /set en th',
    });
  } catch (error) {
    console.error('Error handling /reset command:', error);
    await client.replyMessage(replyToken, {
      type: 'text',
      text: '❌ Error: Failed to reset configuration. Please try again.',
    });
  }
}

/**
 * Handle unknown/invalid command
 * @param {Object} event - LINE event object
 * @param {string} command - Command name
 * @returns {Promise<void>}
 */
async function handleUnknownCommand(event, command) {
  const replyToken = event.replyToken;

  await client.replyMessage(replyToken, {
    type: 'text',
    text: `❌ Unknown command: /${command}\n\nUse /help to see all available commands.`,
  });
}

/**
 * Main command handler - routes commands to appropriate handlers
 * @param {Object} event - LINE event object
 * @param {string} text - Message text
 * @returns {Promise<boolean>} True if command was handled
 */
async function handleCommand(event, text) {
  const parsed = parseCommand(text);

  if (!parsed) {
    return false; // Not a command
  }

  const { command, args } = parsed;

  try {
    switch (command) {
      case 'start':
      case 'help':
        await handleHelp(event);
        break;

      case 'languages':
      case 'lang':
        await handleLanguages(event);
        break;

      case 'set':
        await handleSet(event, args);
        break;

      case 'status':
      case 'stats':
        await handleStatus(event);
        break;

      case 'about':
        await handleAbout(event);
        break;

      case 'reset':
        await handleReset(event);
        break;

      default:
        await handleUnknownCommand(event, command);
    }

    return true; // Command was handled
  } catch (error) {
    console.error('Error handling command:', error);
    return false;
  }
}

module.exports = {
  parseCommand,
  isCommand,
  handleCommand,
  handleHelp,
  handleLanguages,
  handleSet,
  handleStatus,
  handleAbout,
  handleReset,
};
