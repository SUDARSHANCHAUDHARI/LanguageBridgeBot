/**
 * Anti-Spam Utilities
 * Detects and blocks spam messages
 */

/**
 * Detect spam in text
 * @param {string} text - Text to check
 * @returns {Object} {score: number, reasons: string[]}
 */
function detectSpam(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons = [];

  // Check for repeated characters (e.g., "aaaaaa", "111111")
  const repeatedCharPattern = /(.)\1{4,}/g;
  const repeatedMatches = text.match(repeatedCharPattern);
  if (repeatedMatches && repeatedMatches.length > 0) {
    score += 30;
    reasons.push('Repeated characters detected');
  }

  // Check for all caps (spam indicator)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    score += 20;
    reasons.push('Excessive capitalization');
  }

  // Check for excessive emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiMatches = text.match(emojiRegex);
  const emojiRatio = emojiMatches ? emojiMatches.length / text.length : 0;
  if (emojiRatio > 0.5 && text.length > 20) {
    score += 15;
    reasons.push('Excessive emojis');
  }

  // Check for URL spam (multiple URLs)
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urlMatches = text.match(urlPattern);
  if (urlMatches && urlMatches.length > 3) {
    score += 25;
    reasons.push('Multiple URLs detected');
  }

  // Check for very short repeated messages (would need message history)
  // This is a placeholder for future enhancement

  // Check for suspicious patterns (e.g., "click here", "free money", etc.)
  const spamKeywords = [
    /click here/gi,
    /free money/gi,
    /urgent/gi,
    /limited time/gi,
    /act now/gi,
  ];

  const keywordMatches = spamKeywords.filter(pattern => pattern.test(text));
  if (keywordMatches.length > 2) {
    score += 20;
    reasons.push('Suspicious keywords detected');
  }

  return { score, reasons };
}

/**
 * Check if message should be blocked
 * @param {string} text - Text to check
 * @param {number} threshold - Spam score threshold (default: 50)
 * @returns {boolean} True if message should be blocked
 */
function shouldBlockMessage(text, threshold = 50) {
  const spamCheck = detectSpam(text);
  return spamCheck.score >= threshold;
}

/**
 * Get spam detection details
 * @param {string} text - Text to check
 * @returns {Object} Spam detection result
 */
function getSpamDetails(text) {
  return detectSpam(text);
}

module.exports = {
  detectSpam,
  shouldBlockMessage,
  getSpamDetails,
};
