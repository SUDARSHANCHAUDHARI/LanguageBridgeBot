/**
 * LINE webhook handler
 * Handles incoming webhook events from LINE platform
 */

const line = require('@line/bot-sdk');
const crypto = require('crypto');
const config = require('../config/environment');
const { handleMessage } = require('./messageHandler');
const { handleRichMenuPostback } = require('./richMenu');
const { formatWelcomeMessage } = require('../utils/messageFormatter');

// Create LINE client
const client = new line.Client({
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
});

/**
 * Validate LINE webhook signature
 * @param {string} signature - X-Line-Signature header value
 * @param {string} body - Raw request body
 * @returns {boolean} True if signature is valid
 */
function validateSignature(signature, body) {
  if (!signature || !body) {
    return false;
  }

  const hash = crypto
    .createHmac('sha256', config.line.channelSecret)
    .update(body)
    .digest('base64');

  // Constant-time compare; timingSafeEqual throws on length mismatch, so check that first
  const hashBuf = Buffer.from(hash);
  const sigBuf = Buffer.from(signature);
  return hashBuf.length === sigBuf.length && crypto.timingSafeEqual(hashBuf, sigBuf);
}

/**
 * Handle different event types
 * @param {Object} event - LINE webhook event
 */
async function handleEvent(event) {
  try {
    switch (event.type) {
      case 'message':
        await handleMessage(event, client);
        break;

      case 'follow':
        console.log('User followed bot:', event.source.userId);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: formatWelcomeMessage(),
        });
        break;

      case 'unfollow':
        // No reply token is issued for unfollow events; nothing to send back.
        // User-scoped data expires via the cache/usage TTLs, so no cleanup is needed here.
        console.log('User unfollowed bot:', event.source.userId);
        break;

      case 'join':
        console.log('Bot joined group/room:', event.source.groupId || event.source.roomId);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: formatWelcomeMessage(),
        });
        break;

      case 'leave':
        // Terminal event with no reply token; the group config simply goes idle.
        console.log('Bot left group/room:', event.source.groupId || event.source.roomId);
        break;

      case 'postback':
        console.log('Postback event received:', event.postback.data);
        // Handle rich menu postbacks
        if (event.postback.data.startsWith('action=')) {
          await handleRichMenuPostback(event);
        }
        break;

      case 'beacon':
        // Beacon proximity events are not part of the translation product; logged only.
        console.log('Beacon event received');
        break;

      default:
        console.log('Unknown event type:', event.type);
    }
  } catch (error) {
    console.error('Error handling event:', error);
    // Don't throw - we want to process other events even if one fails
  }
}

/**
 * Main webhook handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleWebhook(req, res) {
  try {
    // Get signature from headers
    const signature = req.headers['x-line-signature'];
    const body = req.rawBody || JSON.stringify(req.body);

    // Validate signature
    if (!validateSignature(signature, body)) {
      console.error('Invalid LINE signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse events
    const events = req.body.events || [];

    if (events.length === 0) {
      console.log('No events in webhook');
      return res.status(200).json({ status: 'ok' });
    }

    // Process events in parallel
    await Promise.all(events.map(event => handleEvent(event)));

    // Always return 200 OK to LINE
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Still return 200 to LINE to prevent retries
    res.status(200).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  handleWebhook,
  handleEvent,
  validateSignature,
  client,
};
