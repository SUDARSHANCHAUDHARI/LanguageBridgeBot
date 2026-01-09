/**
 * Translation Service
 * Handles all translation operations using Google Cloud Translation API
 */

const { Translate } = require('@google-cloud/translate').v2;
const config = require('../config/environment');
const { isValidLanguageCode, getLanguageInfo } = require('../config/constants');
const { DEFAULT_SETTINGS } = require('../config/constants');
const {
  getCachedTranslation,
  setCachedTranslation,
  getCacheStats,
} = require('./cacheService');
const CircuitBreaker = require('../utils/circuitBreaker');

// Initialize Google Translate client
const translate = new Translate({
  key: config.google.translateApiKey,
});

// Circuit breaker for translation API
const translationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
});

// Request deduplication (prevent duplicate simultaneous requests)
const pendingRequests = new Map();

/**
 * Exponential backoff retry
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Detects the language of input text
 * @param {string} text - Text to detect language for
 * @returns {Promise<string>} Language code (e.g., 'en', 'th')
 */
async function detectLanguage(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('Empty or invalid text provided for language detection');
      return 'en'; // Default to English
    }

    const [detection] = await translate.detect(text);
    
    if (!detection || !detection.language) {
      console.warn('Language detection returned no result');
      return 'en';
    }

    const detectedLang = detection.language;
    
    // Validate that detected language is in our supported list
    if (isValidLanguageCode(detectedLang)) {
      return detectedLang;
    }

    // If detected language is not supported, try to map it
    // Some Google codes might differ (e.g., 'zh' vs 'zh-CN')
    const langMap = {
      'zh': 'zh-CN',
      'zh-Hans': 'zh-CN',
      'zh-Hant': 'zh-TW',
    };

    const mappedLang = langMap[detectedLang] || 'en';
    
    if (isValidLanguageCode(mappedLang)) {
      return mappedLang;
    }

    console.warn(`Detected language ${detectedLang} not supported, defaulting to English`);
    return 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en'; // Default to English on error
  }
}

/**
 * Translates text from source language to target language
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} Translated text
 * @throws {Error} If translation fails
 */
async function translateText(text, sourceLang, targetLang) {
  try {
    // Validate inputs
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }

    if (!isValidLanguageCode(sourceLang)) {
      throw new Error(`Invalid source language code: ${sourceLang}`);
    }

    if (!isValidLanguageCode(targetLang)) {
      throw new Error(`Invalid target language code: ${targetLang}`);
    }

    // Don't translate if source and target are the same
    if (sourceLang === targetLang) {
      return text;
    }

    // Check cache first
    const cachedTranslation = getCachedTranslation(text, sourceLang, targetLang);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // Check for duplicate request (deduplication)
    const requestKey = `${text}:${sourceLang}:${targetLang}`;
    if (pendingRequests.has(requestKey)) {
      // Wait for existing request
      return await pendingRequests.get(requestKey);
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Translation timeout: exceeded 5 seconds'));
          }, DEFAULT_SETTINGS.TRANSLATION_TIMEOUT);
        });

        // Translation promise with circuit breaker and retry
        const translationPromise = translationCircuitBreaker.execute(() =>
          retryWithBackoff(() =>
            translate.translate(text, {
              from: sourceLang,
              to: targetLang,
            })
          )
        );

        // Race between translation and timeout
        const [translations] = await Promise.race([translationPromise, timeoutPromise]);
        return translations;
      } finally {
        // Remove from pending requests
        pendingRequests.delete(requestKey);
      }
    })();

    // Store pending request
    pendingRequests.set(requestKey, requestPromise);

    const [translations] = await requestPromise;

    if (!translations || translations.length === 0) {
      throw new Error('Translation returned empty result');
    }

    // Handle both single string and array responses
    const translatedText = Array.isArray(translations) ? translations[0] : translations;

    // Save to cache after successful translation
    setCachedTranslation(text, sourceLang, targetLang, translatedText);

    return translatedText;
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('timeout')) {
      throw new Error('Translation timeout: API took too long to respond');
    }

    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('Translation API quota exceeded. Please try again later.');
    }

    if (error.message.includes('403') || error.message.includes('permission')) {
      throw new Error('Translation API access denied. Please check your API key.');
    }

    if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Could not connect to translation service.');
    }

    // Generic error
    // Don't cache errors - only cache successful translations
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Get cache statistics (for logging/monitoring)
 * @returns {Object} Cache statistics
 */
function getTranslationCacheStats() {
  return getCacheStats();
}

/**
 * Translates text to multiple target languages in parallel
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string[]} targetLangs - Array of target language codes
 * @returns {Promise<Array>} Array of {lang, text, flag} objects
 */
async function translateToMultiple(text, sourceLang, targetLangs) {
  try {
    if (!Array.isArray(targetLangs) || targetLangs.length === 0) {
      return [];
    }

    // Validate all target languages
    const validTargetLangs = targetLangs.filter(lang => {
      if (!isValidLanguageCode(lang)) {
        console.warn(`Invalid target language code: ${lang}, skipping`);
        return false;
      }
      return true;
    });

    if (validTargetLangs.length === 0) {
      return [];
    }

    // Remove source language from targets (no need to translate to itself)
    const filteredLangs = validTargetLangs.filter(lang => lang !== sourceLang);

    if (filteredLangs.length === 0) {
      return [];
    }

    // Create translation promises for all target languages
    const translationPromises = filteredLangs.map(async (targetLang) => {
      try {
        const translatedText = await translateText(text, sourceLang, targetLang);
        const languageInfo = getLanguageInfo(targetLang);

        return {
          lang: targetLang,
          text: translatedText,
          flag: languageInfo ? languageInfo.flag : '🌐',
          name: languageInfo ? languageInfo.name : targetLang,
        };
      } catch (error) {
        // Handle partial failures - log but don't throw
        console.error(`Failed to translate to ${targetLang}:`, error.message);
        return {
          lang: targetLang,
          text: null,
          flag: getLanguageInfo(targetLang)?.flag || '🌐',
          name: getLanguageInfo(targetLang)?.name || targetLang,
          error: error.message,
        };
      }
    });

    // Execute all translations in parallel
    const results = await Promise.all(translationPromises);

    // Filter out failed translations (optional - you might want to include them with error messages)
    return results.filter(result => result.text !== null);
  } catch (error) {
    console.error('Error in translateToMultiple:', error);
    throw new Error(`Multi-language translation failed: ${error.message}`);
  }
}

/**
 * Validates if a language code is supported
 * @param {string} code - Language code to validate
 * @returns {boolean} True if language code is supported
 */
function validateLanguageCode(code) {
  return isValidLanguageCode(code);
}

module.exports = {
  detectLanguage,
  translateText,
  translateToMultiple,
  validateLanguageCode,
  getTranslationCacheStats,
};
