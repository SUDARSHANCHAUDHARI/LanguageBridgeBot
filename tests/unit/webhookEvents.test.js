/**
 * Unit tests for webhook event handling (follow/join welcome, terminal no-ops)
 */

// Mock the LINE SDK so the module-level client never makes real API calls.
const mockReplyMessage = jest.fn().mockResolvedValue({});

jest.mock('@line/bot-sdk', () => ({
  Client: jest.fn().mockImplementation(() => ({
    replyMessage: mockReplyMessage,
  })),
}));

const { handleEvent } = require('../../src/bot/webhook');
const { formatWelcomeMessage } = require('../../src/utils/messageFormatter');

describe('webhook handleEvent', () => {
  beforeEach(() => {
    mockReplyMessage.mockClear();
  });

  it('replies with the welcome message on follow', async () => {
    await handleEvent({ type: 'follow', replyToken: 'rt-follow', source: { userId: 'U1' } });
    expect(mockReplyMessage).toHaveBeenCalledWith('rt-follow', {
      type: 'text',
      text: formatWelcomeMessage(),
    });
  });

  it('replies with the welcome message when the bot joins a group', async () => {
    await handleEvent({ type: 'join', replyToken: 'rt-join', source: { groupId: 'G1' } });
    expect(mockReplyMessage).toHaveBeenCalledWith('rt-join', {
      type: 'text',
      text: formatWelcomeMessage(),
    });
  });

  it('does not reply on unfollow (no reply token is issued)', async () => {
    await handleEvent({ type: 'unfollow', source: { userId: 'U1' } });
    expect(mockReplyMessage).not.toHaveBeenCalled();
  });

  it('handles leave without replying or throwing', async () => {
    await expect(
      handleEvent({ type: 'leave', source: { groupId: 'G1' } })
    ).resolves.toBeUndefined();
    expect(mockReplyMessage).not.toHaveBeenCalled();
  });

  it('swallows errors from one event so others still process', async () => {
    mockReplyMessage.mockRejectedValueOnce(new Error('LINE API down'));
    await expect(
      handleEvent({ type: 'follow', replyToken: 'rt-x', source: { userId: 'U2' } })
    ).resolves.toBeUndefined();
  });
});
