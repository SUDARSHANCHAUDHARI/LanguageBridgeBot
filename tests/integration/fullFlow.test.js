/**
 * Full flow integration tests
 */

const { handleMessage } = require('../../src/bot/messageHandler');
const { client } = require('../../src/bot/webhook');

// Mock LINE client
jest.mock('../../src/bot/webhook', () => ({
  client: {
    replyMessage: jest.fn().mockResolvedValue({}),
  },
}));

// Mock translation service
jest.mock('../../src/services/translationService', () => ({
  detectLanguage: jest.fn().mockResolvedValue('en'),
  translateToMultiple: jest.fn().mockResolvedValue([
    { lang: 'th', text: 'สวัสดี', flag: '🇹🇭', name: 'Thai' },
  ]),
}));

// Mock database service
jest.mock('../../src/services/databaseService', () => ({
  getGroupConfig: jest.fn().mockResolvedValue({
    groupId: 'test123',
    languages: ['en', 'th'],
    isActive: true,
  }),
  saveGroupConfig: jest.fn().mockResolvedValue({}),
  incrementUsage: jest.fn().mockResolvedValue({}),
}));

// Mock usage service
jest.mock('../../src/services/usageService', () => ({
  checkUsageLimit: jest.fn().mockResolvedValue({
    withinLimit: true,
    limit: 20,
    used: 0,
    remaining: 20,
  }),
  trackUsage: jest.fn().mockResolvedValue({}),
}));

describe('Full Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process message and send translation', async () => {
    const event = {
      type: 'message',
      message: { type: 'text', text: 'Hello' },
      source: { userId: 'U1234567890', type: 'user' },
      replyToken: 'test_reply_token',
    };

    await handleMessage(event, client);

    expect(client.replyMessage).toHaveBeenCalled();
    const callArgs = client.replyMessage.mock.calls[0];
    expect(callArgs[0]).toBe('test_reply_token');
    expect(callArgs[1].type).toBe('text');
  });

  it('should handle commands', async () => {
    const event = {
      type: 'message',
      message: { type: 'text', text: '/help' },
      source: { userId: 'U1234567890', type: 'user' },
      replyToken: 'test_reply_token',
    };

    await handleMessage(event, client);

    // Command should be handled (translation should not be called)
    expect(client.replyMessage).toHaveBeenCalled();
  });
});
