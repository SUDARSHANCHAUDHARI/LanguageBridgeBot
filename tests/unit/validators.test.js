/**
 * Unit tests for validators
 */

const {
  validateLanguageCode,
  validateLanguageCodes,
  validateMessageText,
  validateGroupConfig,
  isCommand,
  parseCommand,
  sanitizeInput,
  normalizeLanguageCode,
  normalizeText,
} = require('../../src/utils/validators');

describe('Validators', () => {
  describe('validateLanguageCode', () => {
    it('should validate supported language codes', () => {
      expect(validateLanguageCode('en')).toBe(true);
      expect(validateLanguageCode('th')).toBe(true);
      expect(validateLanguageCode('hi')).toBe(true);
    });

    it('should reject invalid language codes', () => {
      expect(validateLanguageCode('invalid')).toBe(false);
      expect(validateLanguageCode('xx')).toBe(false);
      expect(validateLanguageCode(null)).toBe(false);
      expect(validateLanguageCode('')).toBe(false);
    });
  });

  describe('validateLanguageCodes', () => {
    it('should validate array of language codes', () => {
      const result = validateLanguageCodes(['en', 'th', 'hi']);
      expect(result.valid).toEqual(['en', 'th', 'hi']);
      expect(result.invalid).toEqual([]);
    });

    it('should separate valid and invalid codes', () => {
      const result = validateLanguageCodes(['en', 'invalid', 'th', 'xx']);
      expect(result.valid).toEqual(['en', 'th']);
      expect(result.invalid).toEqual(['invalid', 'xx']);
    });
  });

  describe('validateMessageText', () => {
    it('should validate normal text', () => {
      const result = validateMessageText('Hello world');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject empty text', () => {
      const result = validateMessageText('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(6000);
      const result = validateMessageText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject text with only whitespace', () => {
      const result = validateMessageText('   \n\t  ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('whitespace');
    });
  });

  describe('validateGroupConfig', () => {
    it('should validate correct group config', () => {
      const config = {
        groupId: 'test123',
        languages: ['en', 'th'],
      };
      const result = validateGroupConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject config with less than 2 languages', () => {
      const config = {
        languages: ['en'],
      };
      const result = validateGroupConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least 2 languages');
    });

    it('should reject config with invalid languages', () => {
      const config = {
        languages: ['en', 'invalid'],
      };
      const result = validateGroupConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isCommand', () => {
    it('should detect commands', () => {
      expect(isCommand('/help')).toBe(true);
      expect(isCommand('/set en th')).toBe(true);
    });

    it('should not detect non-commands', () => {
      expect(isCommand('Hello world')).toBe(false);
      expect(isCommand('help')).toBe(false);
    });
  });

  describe('parseCommand', () => {
    it('should parse command and arguments', () => {
      const result = parseCommand('/set en th hi');
      expect(result.command).toBe('set');
      expect(result.args).toEqual(['en', 'th', 'hi']);
    });

    it('should handle commands without arguments', () => {
      const result = parseCommand('/help');
      expect(result.command).toBe('help');
      expect(result.args).toEqual([]);
    });

    it('should handle @ mentions', () => {
      const result = parseCommand('@bot /set en th');
      expect(result.command).toBe('set');
      expect(result.args).toEqual(['en', 'th']);
    });

    it('should return null for non-commands', () => {
      expect(parseCommand('Hello world')).toBeNull();
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = 'Hello<script>alert("xss")</script>World';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('normalizeLanguageCode', () => {
    it('should normalize language codes', () => {
      expect(normalizeLanguageCode('  EN  ')).toBe('en');
      expect(normalizeLanguageCode('TH')).toBe('th');
    });
  });

  describe('normalizeText', () => {
    it('should normalize text', () => {
      expect(normalizeText('  Hello   World  ')).toBe('Hello World');
      expect(normalizeText('Line1\n\n\nLine2')).toBe('Line1\n\nLine2');
    });
  });
});
