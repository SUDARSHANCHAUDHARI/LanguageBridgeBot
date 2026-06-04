/**
 * Integration tests for webhook endpoint
 */

const request = require('supertest');
const crypto = require('crypto');
const app = require('../../src/index');
const config = require('../../src/config/environment');

// Mock LINE client to avoid actual API calls
jest.mock('../../src/bot/webhook', () => ({
  client: {
    replyMessage: jest.fn().mockResolvedValue({}),
  },
  handleWebhook: jest.fn().mockImplementation(async (req, res) => {
    res.status(200).json({ status: 'ok' });
  }),
}));

describe('Webhook Integration', () => {
  function generateSignature(body) {
    return crypto
      .createHmac('sha256', config.line.channelSecret)
      .update(body)
      .digest('base64');
  }

  it('should accept valid LINE webhook', async () => {
    const body = {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: 'Hello' },
          source: { userId: 'U1234567890', type: 'user' },
        },
      ],
    };

    const bodyString = JSON.stringify(body);
    const signature = generateSignature(bodyString);

    const response = await request(app)
      .post('/webhook')
      .set('X-Line-Signature', signature)
      .send(body);

    expect(response.status).toBe(200);
  });

  it('should reject invalid signature', async () => {
    const body = { events: [] };
    const invalidSignature = 'invalid_signature';

    const response = await request(app)
      .post('/webhook')
      .set('X-Line-Signature', invalidSignature)
      .send(body);

    expect(response.status).toBe(401);
  });

  it('should report degraded health when database is not connected', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
    expect(response.body.checks.database.status).toBe('unhealthy');
  });

  it('should return dashboard health with a valid dashboard token', async () => {
    const response = await request(app)
      .get('/dashboard/health')
      .set('Authorization', 'test_dashboard_secret');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.health.status).toBe('degraded');
  });
});
