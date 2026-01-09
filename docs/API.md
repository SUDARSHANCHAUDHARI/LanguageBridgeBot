# API Documentation

Technical documentation for @LanguageBridgeBot.

## API Endpoints

### Health Check

**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

### Webhook Endpoint

**POST** `/webhook`

LINE webhook endpoint for receiving messages.

**Headers:**
- `X-Line-Signature`: LINE webhook signature (required)
- `Content-Type`: `application/json`

**Request Body:**
```json
{
  "events": [
    {
      "type": "message",
      "message": {
        "type": "text",
        "text": "Hello"
      },
      "source": {
        "userId": "U1234567890",
        "type": "user"
      },
      "replyToken": "reply_token_here",
      "timestamp": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## Database Schema

### Groups Collection

```javascript
{
  groupId: String,           // LINE group ID or user ID (unique)
  groupName: String,          // Display name
  languages: [String],        // Language codes, e.g., ['en', 'th', 'hi']
  mode: String,              // 'bilingual' or 'multilingual'
  isActive: Boolean,         // Active status
  isPremium: Boolean,        // Premium status
  messageCount: Number,      // Total messages translated
  characterCount: Number,    // Total characters translated
  createdAt: Date,          // Creation timestamp
  lastUsedAt: Date         // Last usage timestamp
}
```

**Indexes:**
- `groupId` (unique)
- `isActive`
- `lastUsedAt`

---

## Code Architecture

### Directory Structure

```
src/
├── bot/
│   ├── webhook.js          # LINE webhook handler
│   ├── messageHandler.js   # Message processing logic
│   └── commands.js         # Command handlers
├── services/
│   ├── translationService.js  # Google Translation API
│   ├── cacheService.js        # Caching layer
│   ├── databaseService.js     # MongoDB operations
│   └── usageService.js        # Usage tracking
├── utils/
│   ├── validators.js          # Input validation
│   ├── messageFormatter.js    # Message formatting
│   ├── rateLimiter.js        # Rate limiting
│   ├── antiSpam.js           # Spam detection
│   └── errorHandler.js       # Error handling
├── middleware/
│   ├── security.js            # Security middleware
│   └── logger.js              # Request logging
├── config/
│   ├── constants.js           # Constants and language data
│   └── environment.js         # Environment configuration
└── index.js                   # Main entry point
```

### Data Flow

1. **Webhook Request** → Security middleware → Webhook handler
2. **Event Processing** → Message handler → Command check
3. **Translation Flow** → Language detection → Multi-language translation
4. **Response** → Format message → Send reply → Update stats

### Service Dependencies

```
index.js
  └── webhook.js
      └── messageHandler.js
          ├── commands.js
          ├── translationService.js
          │   └── cacheService.js
          ├── databaseService.js
          ├── usageService.js
          └── messageFormatter.js
```

---

## Environment Variables

See `.env.example` for complete list.

**Required:**
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `GOOGLE_TRANSLATE_API_KEY`
- `MONGODB_URI`

**Optional:**
- `PORT` (default: 3000)
- `NODE_ENV` (default: development)
- `CACHE_TTL` (default: 3600)
- `RATE_LIMIT_WINDOW` (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS` (default: 30)

---

## Error Codes

- `TRANSLATION_ERROR` - Translation API failure
- `VALIDATION_ERROR` - Input validation failure
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `DATABASE_ERROR` - Database operation failure
- `API_ERROR` - External API failure
- `USAGE_LIMIT_ERROR` - Usage limit exceeded

---

## Rate Limits

- **IP-based:** 100 requests/minute
- **Group-based:** 30 requests/minute
- **Free tier:** 20 messages/day
- **Premium:** Unlimited

---

## Security

- LINE signature validation (HMAC SHA256)
- Rate limiting per IP and group
- Input sanitization
- Spam detection
- Security headers (Helmet)
- CORS configuration

---

## Monitoring

- Health check endpoint: `/health`
- Request logging with request IDs
- Error logging with context
- Cache statistics
- Usage statistics
