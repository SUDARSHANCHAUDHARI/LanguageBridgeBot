/**
 * Validation Utilities
 * Provides validation functions for inputs and configurations
 */

const { isValidLanguageCode } = require('../config/constants');
const { DEFAULT_SETTINGS } = require('../config/constants');

/**
 * Validate if a language code is supported
 * @param {string} code - Language code to validate
 * @returns {boolean} True if language code is valid
 */
function validateLanguageCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return isValidLanguageCode(code.toLowerCase().trim());
}

/**
 * Validate array of language codes
 * @param {string[]} codes - Array of language codes
 * @returns {Object} {valid: string[], invalid: string[]}
 */
function validateLanguageCodes(codes) {
  if (!Array.isArray(codes)) {
    return { valid: [], invalid: codes || [] };
  }

  const valid = [];
  const invalid = [];

  codes.forEach(code => {
    const normalized = normalizeLanguageCode(code);
    if (validateLanguageCode(normalized)) {
      valid.push(normalized);
    } else {
      invalid.push(code);
    }
  });

  return { valid, invalid };
}

/**
 * Validate message text
 * @param {string} text - Text to validate
 * @returns {Object} {valid: boolean, error: string}
 */
function validateMessageText(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Message text cannot be empty' };
  }

  if (/^\s+$/.test(text)) {
    return { valid: false, error: 'Message contains only whitespace' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message text cannot be empty' };
  }

  if (trimmed.length > DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message is too long (${trimmed.length} characters). Maximum is ${DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  // Check if text contains actual characters (not just whitespace/emojis)
  const textWithoutWhitespace = trimmed.replace(/\s/g, '');
  if (textWithoutWhitespace.length === 0) {
    return { valid: false, error: 'Message contains only whitespace' };
  }

  // Check for minimum meaningful content (at least 1 alphanumeric character)
  const hasAlphanumeric = /[a-zA-Z0-9]/.test(textWithoutWhitespace);
  if (!hasAlphanumeric && textWithoutWhitespace.length < 3) {
    return { valid: false, error: 'Message must contain meaningful text' };
  }

  return { valid: true, error: null };
}

/**
 * Validate group configuration
 * @param {Object} config - Group configuration object
 * @returns {Object} {valid: boolean, errors: string[]}
 */
function validateGroupConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Configuration is required'] };
  }

  if (!config.languages || !Array.isArray(config.languages)) {
    errors.push('Languages array is required');
  } else {
    if (config.languages.length < 2) {
      errors.push('At least 2 languages');
    }

    const langValidation = validateLanguageCodes(config.languages);
    if (langValidation.invalid.length > 0) {
      errors.push(`Invalid language codes: ${langValidation.invalid.join(', ')}`);
    }
  }

  if (config.groupId && typeof config.groupId !== 'string') {
    errors.push('Group ID must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if message is a command
 * @param {string} text - Message text
 * @returns {boolean} True if message is a command
 */
function isCommand(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();
  return trimmed.startsWith('/');
}

/**
 * Parse command from message text
 * @param {string} text - Message text
 * @returns {Object|null} {command: string, args: string[]} or null if not a command
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
 * Check if user is a group admin
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @param {Object} lineClient - LINE client instance (optional)
 * @returns {Promise<boolean>} True if user is admin
 */
async function isGroupAdmin(userId, groupId, lineClient = null) {
  try {
    if (!groupId || !userId) {
      return false;
    }

    // LINE API doesn't have a direct way to check if user is admin
    // We can use getGroupMemberProfile to get member info
    // For now, we'll allow all users (can be enhanced later)
    // In production, you might want to store admin list or use LINE's member list API

    if (lineClient) {
      try {
        // Try to get member profile (this might fail if user is not admin)
        // In LINE, only admins can get member profiles in some cases
        // This is a simplified check - can be enhanced
        await lineClient.getGroupMemberProfile(groupId, userId);
        return true; // If we can get profile, user might be admin
      } catch {
        // If we can't get profile, user might not be admin
        return false;
      }
    }

    // Placeholder: Return true for now (allow all users)
    // TODO: Implement proper admin check using LINE API
    return true;
  } catch (error) {
    console.error('Error checking group admin:', error);
    return false;
  }
}

/**
 * Sanitize input text - remove dangerous characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Remove potential script injection patterns (basic)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized;
}

/**
 * Normalize language code
 * @param {string} code - Language code
 * @returns {string} Normalized language code
 */
function normalizeLanguageCode(code) {
  if (!code || typeof code !== 'string') {
    return '';
  }
  return code.toLowerCase().trim();
}

/**
 * Normalize text - trim and normalize whitespace
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/[ \t\r\f\v]+/g, ' ') // Replace horizontal whitespace with single space
    .replace(/ *\n */g, '\n') // Trim spaces around line breaks
    .replace(/\n{3,}/g, '\n\n'); // Replace 3+ newlines with 2
}

module.exports = {
  validateLanguageCode,
  validateLanguageCodes,
  validateMessageText,
  validateGroupConfig,
  isCommand,
  parseCommand,
  isGroupAdmin,
  sanitizeInput,
  normalizeLanguageCode,
  normalizeText,
};
