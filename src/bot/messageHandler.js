/**
 * Message handler
 * Handles incoming text messages from LINE
 * Checks for commands first, then processes translations
 */

const { handleCommand } = require('./commands');
const { detectLanguage, translateToMultiple } = require('../services/translationService');
const { getGroupConfig, saveGroupConfig, incrementUsage } = require('../services/databaseService');
const { checkUsageLimit, trackUsage } = require('../services/usageService');
const {
  formatTranslations,
  truncateMessage,
  isOnlyEmojis,
  isBotMessage,
  formatWelcomeMessage,
  formatErrorMessage,
} = require('../utils/messageFormatter');
const { checkRateLimit, getResetTime } = require('../utils/rateLimiter');
const { shouldBlockMessage } = require('../utils/antiSpam');
const { DEFAULT_SETTINGS, getLanguageInfo } = require('../config/constants');
const { trackTranslation, trackError } = require('../services/analyticsService');
const { isPremium } = require('../services/subscriptionService');

/**
 * Handle incoming message event
 * @param {Object} event - LINE message event
 * @param {Object} lineClient - LINE client instance
 */
async function handleMessage(event, lineClient) {
  try {
    const messageType = event.message.type;

    // Handle different message types
    if (messageType === 'text') {
      await handleTextMessage(event, lineClient);
    } else if (messageType === 'image') {
      await handleImageMessage(event, lineClient);
    } else if (messageType === 'audio') {
      await handleVoiceMessage(event, lineClient);
    } else {
      console.log('Unsupported message type:', messageType);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try {
      const errorMsg = formatErrorMessage(error);
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: errorMsg,
      });
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
}

/**
 * Handle text message
 * @param {Object} event - LINE message event
 * @param {Object} lineClient - LINE client instance
 */
async function handleTextMessage(event, lineClient) {
  const groupId = event.source.groupId || event.source.userId;
  const replyToken = event.replyToken;
  const messageText = event.message.text;

  // Log the message
  console.log('Received text message:', messageText);
  console.log('From user:', event.source.userId);
  console.log('In group:', groupId);

    // Check if message is from a bot (ignore bot messages)
    if (isBotMessage(event)) {
      console.log('Ignoring bot message');
      return;
    }

    // Check if message contains only emojis (skip translation)
    if (isOnlyEmojis(messageText)) {
      console.log('Skipping emoji-only message');
      return;
    }

    // Check for spam
    if (shouldBlockMessage(messageText)) {
      console.log('Blocking spam message');
      // Silently ignore spam messages (don't reply)
      return;
    }

    // Check rate limit
    if (!checkRateLimit(groupId)) {
      const resetTime = getResetTime(groupId);
      const errorMsg = formatErrorMessage(new Error(`Rate limit reached. Please wait ${resetTime} seconds`));
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: errorMsg,
      });
      return;
    }

    // Check if it's a command first
    const isCommandHandled = await handleCommand(event, messageText);
    
    if (isCommandHandled) {
      console.log('Command handled successfully');
      return; // Command was handled, don't process as regular message
    }

    // Get group configuration
    let groupConfig = await getGroupConfig(groupId);

    // If no config exists, use default and send welcome message
    if (!groupConfig || !groupConfig.languages || groupConfig.languages.length === 0) {
      // Save default configuration
      const defaultLangs = DEFAULT_SETTINGS.DEFAULT_LANGUAGES;
      groupConfig = await saveGroupConfig(groupId, defaultLangs, {
        groupName: event.source.type === 'group' ? `Group ${groupId.substring(0, 8)}` : 'Private Chat',
      });

      // Send welcome message
      const welcomeText = formatWelcomeMessage();
      const defaultLangsText = defaultLangs.map(l => {
        const info = getLanguageInfo(l);
        return `${info.flag} ${info.name}`;
      }).join(', ');
      
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `${welcomeText}\n\n✅ Default languages set: ${defaultLangsText}`,
      });

      // Process the message with default config
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(groupId);
    if (!usageCheck.withinLimit) {
      const premiumStatus = await isPremium(groupId);
      let errorMsg = formatErrorMessage(new Error('Daily usage limit reached'));
      
      if (!premiumStatus) {
        errorMsg += '\n\n⭐ Upgrade to Premium for unlimited translations!\n';
        errorMsg += '💡 Benefits:\n';
        errorMsg += '• Unlimited daily translations\n';
        errorMsg += '• Unlimited languages per group\n';
        errorMsg += '• Priority translation\n';
        errorMsg += '• Translation history\n';
        errorMsg += '• Advanced analytics\n\n';
        errorMsg += 'Contact us to upgrade!';
      }
      
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: errorMsg,
      });
      return;
    }

    // Detect source language
    let sourceLang;
    try {
      sourceLang = await detectLanguage(messageText);
      console.log(`Detected source language: ${sourceLang}`);
    } catch (error) {
      console.error('Error detecting language:', error);
      sourceLang = 'en'; // Default to English
    }

    // Get target languages (exclude source language)
    let targetLangs = groupConfig.languages.filter(lang => lang !== sourceLang);

    // Check premium status for language limits
    const premiumStatus = await isPremium(groupId);
    if (!premiumStatus && targetLangs.length > DEFAULT_SETTINGS.MAX_LANGUAGES_FREE) {
      // Free tier: limit to 2 languages
      targetLangs = targetLangs.slice(0, DEFAULT_SETTINGS.MAX_LANGUAGES_FREE);
    }

    if (targetLangs.length === 0) {
      // No target languages (all messages are in the same language)
      console.log('No target languages, skipping translation');
      return;
    }

    // Translate to all target languages
    const startTime = Date.now();
    let translations;
    let fromCache = false;
    
    try {
      translations = await translateToMultiple(messageText, sourceLang, targetLangs);
      const responseTime = Date.now() - startTime;
      console.log(`Translated to ${translations.length} languages in ${responseTime}ms`);
      
      // Track analytics
      trackTranslation(sourceLang, targetLangs, messageText.length, responseTime, fromCache);
    } catch (error) {
      console.error('Error translating:', error);
      trackError();
      const errorMsg = formatErrorMessage(error);
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: errorMsg,
      });
      return;
    }

    if (translations.length === 0) {
      console.log('No translations available');
      return;
    }

    // Format response message
    let formattedMessage = formatTranslations(translations, sourceLang);
    
    // Truncate if too long
    formattedMessage = truncateMessage(formattedMessage);

    // Send reply message
    try {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: formattedMessage,
      });

      // Update usage statistics
      await trackUsage(groupId, messageText.length);
      await incrementUsage(groupId, messageText.length);

      console.log('Translation completed successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      // Don't throw - we've already translated, just log the error
    }

}

/**
 * Handle image message with OCR
 * @param {Object} event - LINE message event
 * @param {Object} lineClient - LINE client instance
 */
async function handleImageMessage(event, lineClient) {
  try {
    const groupId = event.source.groupId || event.source.userId;
    const replyToken = event.replyToken;

    console.log('Received image message');
    console.log('From user:', event.source.userId);
    console.log('In group:', groupId);

    // Get group configuration
    let groupConfig = await getGroupConfig(groupId);
    if (!groupConfig || !groupConfig.languages || groupConfig.languages.length === 0) {
      const defaultLangs = DEFAULT_SETTINGS.DEFAULT_LANGUAGES;
      groupConfig = await saveGroupConfig(groupId, defaultLangs, {
        groupName: event.source.type === 'group' ? `Group ${groupId.substring(0, 8)}` : 'Private Chat',
      });
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(groupId);
    if (!usageCheck.withinLimit) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: formatErrorMessage(new Error('Daily usage limit reached')),
      });
      return;
    }

    // Process image with OCR
    const { handleImageMessage: processImage } = require('../services/ocrService');
    const result = await processImage(event, groupConfig.languages);

    if (!result || !result.translations || result.translations.length === 0) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: 'No text found in image or translation failed.',
      });
      return;
    }

    // Format and send translations
    let formattedMessage = `📷 Image Text (${result.sourceLanguage}):\n${result.originalText}\n\n`;
    formattedMessage += formatTranslations(result.translations, result.sourceLanguage);
    formattedMessage = truncateMessage(formattedMessage);

    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: formattedMessage,
    });

    // Update usage
    await trackUsage(groupId, result.originalText.length);
    await incrementUsage(groupId, result.originalText.length);
  } catch (error) {
    console.error('Error handling image message:', error);
    throw error;
  }
}

/**
 * Handle voice message
 * @param {Object} event - LINE message event
 * @param {Object} lineClient - LINE client instance
 */
async function handleVoiceMessage(event, lineClient) {
  try {
    const groupId = event.source.groupId || event.source.userId;
    const replyToken = event.replyToken;

    console.log('Received voice message');
    console.log('From user:', event.source.userId);
    console.log('In group:', groupId);

    // Get group configuration
    let groupConfig = await getGroupConfig(groupId);
    if (!groupConfig || !groupConfig.languages || groupConfig.languages.length === 0) {
      const defaultLangs = DEFAULT_SETTINGS.DEFAULT_LANGUAGES;
      groupConfig = await saveGroupConfig(groupId, defaultLangs, {
        groupName: event.source.type === 'group' ? `Group ${groupId.substring(0, 8)}` : 'Private Chat',
      });
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(groupId);
    if (!usageCheck.withinLimit) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: formatErrorMessage(new Error('Daily usage limit reached')),
      });
      return;
    }

    // Process voice message
    const { handleVoiceMessage: processVoice } = require('../services/voiceService');
    const result = await processVoice(event, groupConfig.languages);

    if (!result || !result.translations || result.translations.length === 0) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: 'Could not transcribe or translate voice message.',
      });
      return;
    }

    // Format and send translations
    let formattedMessage = `🎤 Voice Message (${result.sourceLanguage}):\n${result.originalText}\n\n`;
    formattedMessage += formatTranslations(result.translations, result.sourceLanguage);
    formattedMessage = truncateMessage(formattedMessage);

    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: formattedMessage,
    });

    // Update usage
    await trackUsage(groupId, result.originalText.length);
    await incrementUsage(groupId, result.originalText.length);
  } catch (error) {
    console.error('Error handling voice message:', error);
    throw error;
  }
}

module.exports = {
  handleMessage,
};
