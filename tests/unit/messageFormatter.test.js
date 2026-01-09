/**
 * Unit tests for messageFormatter
 */

const {
  formatTranslations,
  truncateMessage,
  isOnlyEmojis,
  isBotMessage,
  formatWelcomeMessage,
  formatHelpMessage,
  formatErrorMessage,
  formatLanguageList,
  formatStatusMessage,
} = require('../../src/utils/messageFormatter');

describe('MessageFormatter', () => {
  describe('formatTranslations', () => {
    it('should format translations with flags', () => {
      const translations = [
        { lang: 'th', text: 'สวัสดี', flag: '🇹🇭' },
        { lang: 'hi', text: 'नमस्ते', flag: '🇮🇳' },
      ];

      const result = formatTranslations(translations, 'en');
      expect(result).toContain('🇹🇭 TH:');
      expect(result).toContain('🇮🇳 HI:');
      expect(result).toContain('สวัสดี');
    });

    it('should handle empty translations', () => {
      const result = formatTranslations([], 'en');
      expect(result).toContain('No translations available');
    });

    it('should show "and X more" for many translations', () => {
      const translations = Array.from({ length: 10 }, (_, i) => ({
        lang: `lang${i}`,
        text: `Translation ${i}`,
        flag: '🌐',
      }));

      const result = formatTranslations(translations, 'en');
      expect(result).toContain('and 5 more');
    });
  });

  describe('truncateMessage', () => {
    it('should truncate long messages', () => {
      const longText = 'a'.repeat(6000);
      const result = truncateMessage(longText, 5000);
      expect(result.length).toBeLessThanOrEqual(5003); // 5000 + '...'
      expect(result).toContain('...');
    });

    it('should not truncate short messages', () => {
      const shortText = 'Hello world';
      const result = truncateMessage(shortText);
      expect(result).toBe(shortText);
    });

    it('should truncate at word boundary when possible', () => {
      const text = 'word '.repeat(2000); // ~10000 chars
      const result = truncateMessage(text, 5000);
      expect(result).not.toContain('word word'); // Should break at word boundary
    });
  });

  describe('isOnlyEmojis', () => {
    it('should detect emoji-only messages', () => {
      expect(isOnlyEmojis('😀😃😄')).toBe(true);
      expect(isOnlyEmojis('👍👍👍')).toBe(true);
    });

    it('should not detect text with emojis', () => {
      expect(isOnlyEmojis('Hello 😀')).toBe(false);
      expect(isOnlyEmojis('Test message')).toBe(false);
    });
  });

  describe('isBotMessage', () => {
    it('should detect bot messages', () => {
      const event = { source: { type: 'bot' } };
      expect(isBotMessage(event)).toBe(true);
    });

    it('should not detect user messages', () => {
      const event = { source: { type: 'user', userId: 'U1234567890' } };
      expect(isBotMessage(event)).toBe(false);
    });
  });

  describe('formatWelcomeMessage', () => {
    it('should return welcome message', () => {
      const result = formatWelcomeMessage();
      expect(result).toContain('Welcome');
      expect(result).toContain('@LanguageBridgeBot');
      expect(result).toContain('/help');
    });
  });

  describe('formatHelpMessage', () => {
    it('should return help message with commands', () => {
      const result = formatHelpMessage();
      expect(result).toContain('/help');
      expect(result).toContain('/set');
      expect(result).toContain('/languages');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format rate limit errors', () => {
      const error = new Error('Rate limit reached');
      const result = formatErrorMessage(error);
      expect(result).toContain('Rate limit');
    });

    it('should format translation errors', () => {
      const error = new Error('Translation failed');
      const result = formatErrorMessage(error);
      expect(result).toContain('Translation failed');
    });

    it('should format quota errors', () => {
      const error = new Error('API quota exceeded');
      const result = formatErrorMessage(error);
      expect(result).toContain('quota');
    });
  });

  describe('formatLanguageList', () => {
    it('should format language list by region', () => {
      const result = formatLanguageList();
      expect(result).toContain('Asian Languages');
      expect(result).toContain('European Languages');
      expect(result).toContain('Other Languages');
    });
  });

  describe('formatStatusMessage', () => {
    it('should format status with group config', () => {
      const groupConfig = {
        languages: ['en', 'th'],
        mode: 'bilingual',
        isPremium: false,
        lastUsedAt: new Date(),
      };

      const usageStats = {
        isPremium: false,
        limit: { used: 5, limit: 20, remaining: 15 },
        total: { messageCount: 100, characterCount: 5000 },
      };

      const result = formatStatusMessage(groupConfig, usageStats);
      expect(result).toContain('Configured Languages');
      expect(result).toContain('Today: 5/20');
    });
  });
});
