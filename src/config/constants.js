/**
 * Constants and configuration for LanguageBridgeBot
 * Contains language mappings, flag emojis, and default settings
 */

// Supported Languages - 35 total
const SUPPORTED_LANGUAGES = {
  // Asian Languages (15)
  'zh-CN': { name: 'Chinese (Simplified)', flag: '🇨🇳', region: 'Asian' },
  'zh-TW': { name: 'Chinese (Traditional)', flag: '🇹🇼', region: 'Asian' },
  'ja': { name: 'Japanese', flag: '🇯🇵', region: 'Asian' },
  'ko': { name: 'Korean', flag: '🇰🇷', region: 'Asian' },
  'th': { name: 'Thai', flag: '🇹🇭', region: 'Asian' },
  'vi': { name: 'Vietnamese', flag: '🇻🇳', region: 'Asian' },
  'id': { name: 'Indonesian', flag: '🇮🇩', region: 'Asian' },
  'ms': { name: 'Malay', flag: '🇲🇾', region: 'Asian' },
  'tl': { name: 'Filipino', flag: '🇵🇭', region: 'Asian' },
  'hi': { name: 'Hindi', flag: '🇮🇳', region: 'Asian' },
  'mr': { name: 'Marathi', flag: '🇮🇳', region: 'Asian' },
  'te': { name: 'Telugu', flag: '🇮🇳', region: 'Asian' },
  'bn': { name: 'Bengali', flag: '🇧🇩', region: 'Asian' },
  'ur': { name: 'Urdu', flag: '🇵🇰', region: 'Asian' },
  'ta': { name: 'Tamil', flag: '🇮🇳', region: 'Asian' },
  'my': { name: 'Burmese', flag: '🇲🇲', region: 'Asian' },

  // European Languages (15)
  'en': { name: 'English', flag: '🇬🇧', region: 'European' },
  'es': { name: 'Spanish', flag: '🇪🇸', region: 'European' },
  'fr': { name: 'French', flag: '🇫🇷', region: 'European' },
  'de': { name: 'German', flag: '🇩🇪', region: 'European' },
  'it': { name: 'Italian', flag: '🇮🇹', region: 'European' },
  'pt': { name: 'Portuguese', flag: '🇵🇹', region: 'European' },
  'ru': { name: 'Russian', flag: '🇷🇺', region: 'European' },
  'pl': { name: 'Polish', flag: '🇵🇱', region: 'European' },
  'nl': { name: 'Dutch', flag: '🇳🇱', region: 'European' },
  'sv': { name: 'Swedish', flag: '🇸🇪', region: 'European' },
  'no': { name: 'Norwegian', flag: '🇳🇴', region: 'European' },
  'da': { name: 'Danish', flag: '🇩🇰', region: 'European' },
  'fi': { name: 'Finnish', flag: '🇫🇮', region: 'European' },
  'el': { name: 'Greek', flag: '🇬🇷', region: 'European' },
  'tr': { name: 'Turkish', flag: '🇹🇷', region: 'European' },

  // Other Languages (5)
  'ar': { name: 'Arabic', flag: '🇸🇦', region: 'Other' },
  'he': { name: 'Hebrew', flag: '🇮🇱', region: 'Other' },
  'fa': { name: 'Persian', flag: '🇮🇷', region: 'Other' },
  'af': { name: 'Afrikaans', flag: '🇿🇦', region: 'Other' },
  'ht': { name: 'Haitian Creole', flag: '🇭🇹', region: 'Other' },
};

// Language code to name mapping
const LANGUAGE_NAMES = Object.entries(SUPPORTED_LANGUAGES).reduce((acc, [code, data]) => {
  acc[code] = data.name;
  return acc;
}, {});

// Language code to flag emoji mapping
const LANGUAGE_FLAGS = Object.entries(SUPPORTED_LANGUAGES).reduce((acc, [code, data]) => {
  acc[code] = data.flag;
  return acc;
}, {});

// Indian languages (highlighted for marketing)
const INDIAN_LANGUAGES = ['hi', 'mr', 'te', 'bn', 'ta', 'ur'];

// Languages grouped by region
const LANGUAGES_BY_REGION = {
  Asian: Object.entries(SUPPORTED_LANGUAGES)
    .filter(([_, data]) => data.region === 'Asian')
    .map(([code]) => code),
  European: Object.entries(SUPPORTED_LANGUAGES)
    .filter(([_, data]) => data.region === 'European')
    .map(([code]) => code),
  Other: Object.entries(SUPPORTED_LANGUAGES)
    .filter(([_, data]) => data.region === 'Other')
    .map(([code]) => code),
};

// Default settings
const DEFAULT_SETTINGS = {
  // Default languages for new groups
  DEFAULT_LANGUAGES: ['en', 'th'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute in milliseconds
  RATE_LIMIT_MAX_REQUESTS: 30, // Max requests per window
  
  // Cache settings
  CACHE_TTL: 3600, // 1 hour in seconds
  
  // Translation settings
  MAX_MESSAGE_LENGTH: 5000, // LINE's character limit
  MAX_LANGUAGES_FREE: 2, // Free tier: max 2 languages
  MAX_LANGUAGES_PREMIUM: Infinity, // Premium: unlimited
  
  // Usage limits
  FREE_TIER_DAILY_LIMIT: 20, // Messages per day for free tier
  PREMIUM_TIER_DAILY_LIMIT: Infinity, // Premium: unlimited
  
  // Bot settings
  BOT_NAME: '@LanguageBridgeBot',
  BOT_VERSION: '1.0.0',
  
  // Translation timeout
  TRANSLATION_TIMEOUT: 5000, // 5 seconds
};

// Helper functions
const isValidLanguageCode = (code) => {
  return code in SUPPORTED_LANGUAGES;
};

const getLanguageInfo = (code) => {
  return SUPPORTED_LANGUAGES[code] || null;
};

const getAllLanguageCodes = () => {
  return Object.keys(SUPPORTED_LANGUAGES);
};

const getLanguagesByRegion = (region) => {
  return LANGUAGES_BY_REGION[region] || [];
};

const isIndianLanguage = (code) => {
  return INDIAN_LANGUAGES.includes(code);
};

module.exports = {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  INDIAN_LANGUAGES,
  LANGUAGES_BY_REGION,
  DEFAULT_SETTINGS,
  isValidLanguageCode,
  getLanguageInfo,
  getAllLanguageCodes,
  getLanguagesByRegion,
  isIndianLanguage,
};
