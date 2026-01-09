/**
 * Unit tests for translationService
 */

const {
  detectLanguage,
  translateText,
  translateToMultiple,
  validateLanguageCode,
} = require('../../src/services/translationService');

// Mock Google Cloud Translation API
jest.mock('@google-cloud/translate', () => ({
  Translate: jest.fn().mockImplementation(() => ({
    detect: jest.fn(),
    translate: jest.fn(),
  })),
}));

const { Translate } = require('@google-cloud/translate');

describe('TranslationService', () => {
  let mockTranslate;

  beforeEach(() => {
    mockTranslate = {
      detect: jest.fn(),
      translate: jest.fn(),
    };
    Translate.mockImplementation(() => mockTranslate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectLanguage', () => {
    it('should detect English language', async () => {
      mockTranslate.detect.mockResolvedValue([{ language: 'en' }]);

      const result = await detectLanguage('Hello world');
      expect(result).toBe('en');
    });

    it('should detect Thai language', async () => {
      mockTranslate.detect.mockResolvedValue([{ language: 'th' }]);

      const result = await detectLanguage('สวัสดี');
      expect(result).toBe('th');
    });

    it('should default to English on error', async () => {
      mockTranslate.detect.mockRejectedValue(new Error('API error'));

      const result = await detectLanguage('Test');
      expect(result).toBe('en');
    });

    it('should handle empty text', async () => {
      const result = await detectLanguage('');
      expect(result).toBe('en');
    });

    it('should map zh to zh-CN', async () => {
      mockTranslate.detect.mockResolvedValue([{ language: 'zh' }]);

      const result = await detectLanguage('你好');
      expect(result).toBe('zh-CN');
    });
  });

  describe('translateText', () => {
    it('should translate text successfully', async () => {
      mockTranslate.translate.mockResolvedValue(['สวัสดี']);

      const result = await translateText('Hello', 'en', 'th');
      expect(result).toBe('สวัสดี');
    });

    it('should return same text if source and target are same', async () => {
      const result = await translateText('Hello', 'en', 'en');
      expect(result).toBe('Hello');
      expect(mockTranslate.translate).not.toHaveBeenCalled();
    });

    it('should throw error for invalid source language', async () => {
      await expect(translateText('Hello', 'invalid', 'th')).rejects.toThrow();
    });

    it('should throw error for invalid target language', async () => {
      await expect(translateText('Hello', 'en', 'invalid')).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      mockTranslate.translate.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 6000))
      );

      await expect(translateText('Hello', 'en', 'th')).rejects.toThrow('timeout');
    });
  });

  describe('translateToMultiple', () => {
    it('should translate to multiple languages', async () => {
      mockTranslate.translate
        .mockResolvedValueOnce(['สวัสดี'])
        .mockResolvedValueOnce(['नमस्ते']);

      const result = await translateToMultiple('Hello', 'en', ['th', 'hi']);
      
      expect(result).toHaveLength(2);
      expect(result[0].lang).toBe('th');
      expect(result[1].lang).toBe('hi');
    });

    it('should exclude source language from targets', async () => {
      mockTranslate.translate.mockResolvedValue(['สวัสดี']);

      const result = await translateToMultiple('Hello', 'en', ['en', 'th']);
      
      expect(result).toHaveLength(1);
      expect(result[0].lang).toBe('th');
    });

    it('should handle partial failures', async () => {
      mockTranslate.translate
        .mockResolvedValueOnce(['สวัสดี'])
        .mockRejectedValueOnce(new Error('Translation failed'));

      const result = await translateToMultiple('Hello', 'en', ['th', 'hi']);
      
      expect(result).toHaveLength(1);
      expect(result[0].lang).toBe('th');
    });

    it('should return empty array for invalid languages', async () => {
      const result = await translateToMultiple('Hello', 'en', ['invalid']);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateLanguageCode', () => {
    it('should validate supported language codes', () => {
      expect(validateLanguageCode('en')).toBe(true);
      expect(validateLanguageCode('th')).toBe(true);
      expect(validateLanguageCode('hi')).toBe(true);
    });

    it('should reject invalid language codes', () => {
      expect(validateLanguageCode('invalid')).toBe(false);
      expect(validateLanguageCode('xx')).toBe(false);
    });
  });
});
