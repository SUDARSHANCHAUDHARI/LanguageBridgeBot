/**
 * Context Understanding Service
 * Uses AI to improve translation quality with context awareness
 */

const OpenAI = require('openai');
const config = require('../config/environment');
const { translateText } = require('./translationService');

// Initialize OpenAI client (optional)
let openaiClient = null;
if (config.openai?.apiKey) {
  openaiClient = new OpenAI({
    apiKey: config.openai.apiKey,
  });
}

// Context cache for conversation history
const contextCache = new Map();
const MAX_CONTEXT_HISTORY = 10;

/**
 * Get conversation context for a group
 * @param {string} groupId - Group ID
 * @returns {Array} Recent messages in the conversation
 */
function getConversationContext(groupId) {
  const context = contextCache.get(groupId) || [];
  return context.slice(-MAX_CONTEXT_HISTORY); // Return last N messages
}

/**
 * Add message to conversation context
 * @param {string} groupId - Group ID
 * @param {string} originalText - Original message text
 * @param {string} sourceLang - Source language
 * @param {string} translatedText - Translated text
 */
function addToContext(groupId, originalText, sourceLang, translatedText) {
  if (!contextCache.has(groupId)) {
    contextCache.set(groupId, []);
  }

  const context = contextCache.get(groupId);
  context.push({
    original: originalText,
    sourceLang,
    translated: translatedText,
    timestamp: Date.now(),
  });

  // Keep only recent messages
  if (context.length > MAX_CONTEXT_HISTORY) {
    context.shift();
  }
}

/**
 * Clear context for a group
 * @param {string} groupId - Group ID
 */
function clearContext(groupId) {
  contextCache.delete(groupId);
}

/**
 * Enhance translation with context using AI
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @param {string} groupId - Group ID for context
 * @returns {Promise<string>} Context-aware translated text
 */
async function translateWithContext(text, sourceLang, targetLang, groupId) {
  try {
    // If OpenAI is not configured, fall back to regular translation
    if (!openaiClient) {
      return await translateText(text, sourceLang, targetLang);
    }

    // Get conversation context
    const context = getConversationContext(groupId);

    // Build context prompt
    const contextMessages = context
      .map(msg => `Previous: ${msg.original} → ${msg.translated}`)
      .join('\n');

    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}, considering the conversation context to provide accurate and natural translations.

${contextMessages ? `Conversation context:\n${contextMessages}\n\n` : ''}
Translate this text: "${text}"

Provide only the translation, no explanations.`;

    // Use OpenAI for context-aware translation
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const translatedText = completion.choices[0].message.content.trim();

    // Add to context
    addToContext(groupId, text, sourceLang, translatedText);

    return translatedText;
  } catch (error) {
    console.error('Context-aware translation failed, falling back to regular translation:', error);
    // Fall back to regular translation
    return await translateText(text, sourceLang, targetLang);
  }
}

/**
 * Detect intent and improve translation based on message type
 * @param {string} text - Text to analyze
 * @param {string} sourceLang - Source language
 * @returns {Promise<Object>} Intent and context information
 */
async function detectIntent(text, sourceLang) {
  try {
    if (!openaiClient) {
      return {
        intent: 'general',
        isQuestion: text.includes('?'),
        isFormal: false,
      };
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analyze the following text in ${sourceLang} and determine:
1. Intent (question, statement, command, greeting, etc.)
2. Formality level (formal, casual, neutral)
3. Domain (general, technical, business, casual, etc.)

Respond in JSON format: {"intent": "...", "formality": "...", "domain": "..."}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.2,
      max_tokens: 100,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    return {
      intent: analysis.intent || 'general',
      formality: analysis.formality || 'neutral',
      domain: analysis.domain || 'general',
      isQuestion: text.includes('?') || analysis.intent === 'question',
    };
  } catch (error) {
    console.error('Intent detection failed:', error);
    return {
      intent: 'general',
      isQuestion: text.includes('?'),
      formality: 'neutral',
      domain: 'general',
    };
  }
}

module.exports = {
  translateWithContext,
  detectIntent,
  getConversationContext,
  addToContext,
  clearContext,
};
