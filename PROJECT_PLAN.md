# Cursor AI Prompt Sequence for @LanguageBridgeBot

## 📋 Complete Development Guide Using Cursor AI

This document provides the **exact sequence of prompts** to give Cursor AI to build your LINE translation bot from scratch.

---

## ✅ Pre-Development Checklist

Before starting with Cursor AI, make sure you have:

- [ ] **LINE Developer Account** created at https://developers.line.biz/console/
- [ ] **LINE Messaging API Channel** created
- [ ] **Channel Access Token** (copy this)
- [ ] **Channel Secret** (copy this)
- [ ] **Google Cloud Account** created
- [ ] **Google Cloud Translation API** enabled
- [ ] **Google API Key** generated
- [ ] **Node.js** installed (v18 or higher)
- [ ] **Git** installed
- [ ] **MongoDB** account (MongoDB Atlas free tier)
- [ ] **Railway.app** account (for deployment)

---

## 🚀 Cursor AI Prompt Sequence

### Phase 1: Project Setup (Prompts 1-3)

#### **PROMPT 1: Initialize Project**

```
Create a new Node.js project for a LINE messaging bot called "@LanguageBridgeBot" with the following structure:

Project name: language-bridge-bot
Description: A LINE bot that automatically translates messages in 35 languages

Setup requirements:
1. Initialize npm project
2. Create folder structure:
   - /src
     - /bot (webhook handlers, commands)
     - /services (translation, database)
     - /utils (helpers, validators)
     - /config (environment, constants)
   - /tests
   - /.env.example
3. Install these dependencies:
   - express
   - @line/bot-sdk
   - @google-cloud/translate
   - dotenv
   - mongodb
   - node-cache
   - helmet (security)
   - cors
4. Install dev dependencies:
   - nodemon
   - jest (for testing)
   - eslint

Create package.json with proper scripts:
- start: node src/index.js
- dev: nodemon src/index.js
- test: jest

Create .env.example file with all required environment variables.
Create a basic .gitignore file.
```

---

#### **PROMPT 2: Setup Environment Configuration**

```
Create the configuration files for the LINE translation bot:

1. Create /src/config/constants.js with:
   - List of all 35 supported languages with codes and names
   - Language code mapping (e.g., 'en' -> 'English')
   - Flag emoji mapping for all 35 languages
   - Default settings (rate limits, cache TTL, etc.)
   - Support these 35 languages:
     * Asian (15): zh-CN, zh-TW, ja, ko, th, vi, id, ms, tl, hi, mr, te, bn, ur, ta, my
     * European (15): en, es, fr, de, it, pt, ru, pl, nl, sv, no, da, fi, el, tr
     * Other (5): ar, he, fa, af, ht

2. Create /src/config/environment.js that:
   - Loads environment variables using dotenv
   - Validates required variables exist
   - Exports configuration object
   - Handles different environments (dev, prod)

3. Update .env.example with all variables needed:
   - LINE_CHANNEL_ACCESS_TOKEN
   - LINE_CHANNEL_SECRET
   - GOOGLE_TRANSLATE_API_KEY
   - MONGODB_URI
   - PORT
   - NODE_ENV
   - CACHE_TTL
   - RATE_LIMIT_WINDOW
   - RATE_LIMIT_MAX_REQUESTS
```

---

#### **PROMPT 3: Create Basic Express Server with LINE Webhook**

```
Create the main Express server with LINE webhook integration:

1. Create /src/index.js:
   - Setup Express app
   - Add security middleware (helmet, cors)
   - Add body parser for JSON
   - Setup LINE webhook endpoint at POST /webhook
   - Add health check endpoint at GET /health
   - Add error handling middleware
   - Start server on PORT from environment

2. Create /src/bot/webhook.js:
   - Import LINE SDK
   - Create LINE client with config
   - Setup webhook signature validation
   - Create handleWebhook function that:
     * Validates LINE signature
     * Processes events array
     * Handles different event types (message, follow, join, leave)
     * Returns 200 OK response
   - Add error logging

3. Create basic message handler that just echoes back messages for now.

Make sure to:
- Use async/await properly
- Add try-catch blocks
- Log all errors to console
- Return proper HTTP status codes
```

---

### Phase 2: Translation Service (Prompts 4-6)

#### **PROMPT 4: Create Translation Service**

```
Create a complete translation service using Google Cloud Translation API:

1. Create /src/services/translationService.js with:

   - detectLanguage(text): Detects the language of input text
     * Use Google Cloud Translation API
     * Return language code (e.g., 'en', 'th')
     * Handle errors gracefully
     * Return 'en' as default if detection fails

   - translateText(text, sourceLang, targetLang): Translates text
     * Use Google Cloud Translation API
     * Handle API errors
     * Return translated text
     * Add timeout handling (max 5 seconds)

   - translateToMultiple(text, sourceLang, targetLangs[]): Translate to multiple languages
     * Call translateText for each target language
     * Run translations in parallel using Promise.all
     * Return array of {lang, text, flag} objects
     * Handle partial failures (if one translation fails, continue others)

   - validateLanguageCode(code): Check if language code is supported
     * Check against our 35 supported languages
     * Return boolean

2. Add proper error handling:
   - Catch API quota errors
   - Catch network errors
   - Catch invalid language errors
   - Return meaningful error messages

3. Add JSDoc comments for all functions.
```

---

#### **PROMPT 5: Implement Caching System**

```
Create a caching system to reduce Translation API costs and improve speed:

1. Create /src/services/cacheService.js:
   - Use node-cache library
   - Setup cache with 1 hour TTL
   - Create these functions:
     * getCacheKey(text, sourceLang, targetLang): Generate unique cache key
     * getCachedTranslation(text, sourceLang, targetLang): Get from cache
     * setCachedTranslation(text, sourceLang, targetLang, translation): Save to cache
     * clearCache(): Clear all cached translations
     * getCacheStats(): Return hit rate, size, etc.

2. Update /src/services/translationService.js:
   - Integrate cache into translateText function
   - Check cache before calling API
   - Save to cache after successful API call
   - Don't cache errors
   - Add cache statistics logging

3. Make cache key generation smart:
   - Normalize text (trim, lowercase for comparison)
   - Include source and target language
   - Use SHA256 hash for long texts
   - Keep cache keys under 250 characters
```

---

#### **PROMPT 6: Create Database Service**

```
Create MongoDB database service for storing group configurations and usage stats:

1. Create /src/services/databaseService.js with these functions:

   Database Schema for 'groups' collection:
   {
     groupId: String (LINE group ID or user ID),
     groupName: String,
     languages: [String], // e.g., ['en', 'th', 'mr']
     mode: String, // 'bilingual' or 'multilingual'
     isActive: Boolean,
     isPremium: Boolean,
     messageCount: Number,
     characterCount: Number,
     createdAt: Date,
     lastUsedAt: Date
   }

   Functions to create:
   - connectDatabase(): Connect to MongoDB
   - getGroupConfig(groupId): Get group settings
   - saveGroupConfig(groupId, languages): Save/update group settings
   - incrementUsage(groupId, messageLength): Update usage stats
   - getGroupStats(groupId): Get group statistics
   - checkUsageLimit(groupId): Check if within daily limits
   - getAllActiveGroups(): Get list of active groups
   - deactivateGroup(groupId): Mark group as inactive

2. Add connection retry logic (max 3 retries).
3. Add connection pooling.
4. Add proper error handling for all database operations.
5. Create indexes on groupId for faster queries.

3. Create /src/services/usageService.js:
   - Track daily usage per group
   - Implement free tier limits (20 messages/day)
   - Implement premium tier (unlimited)
   - Return usage information
```

---

### Phase 3: Bot Commands & Logic (Prompts 7-9)

#### **PROMPT 7: Create Command Handler**

```
Create a comprehensive command handler for the bot:

1. Create /src/bot/commands.js:

   Implement these commands:

   /start or /help:
   - Welcome message
   - Brief description of bot
   - List all available commands
   - Show example usage

   /languages:
   - Display all 35 supported languages
   - Group by region (Asian, European, Other)
   - Show language codes
   - Highlight Indian languages (hi, mr, te, bn, ta, ur)
   - Include flag emojis

   /set [lang1] [lang2] ...:
   - Parse language codes from arguments
   - Validate each language code
   - Require minimum 2 languages
   - Save configuration to database
   - Send confirmation message
   - Show currently configured languages

   /status:
   - Display current group configuration
   - Show configured languages with flags
   - Show usage statistics (messages today, total)
   - Show premium status
   - Show last used time

   /about:
   - Bot version
   - Supported languages count (35)
   - Highlight special focus on Indian languages
   - Website link
   - Support contact

   /reset:
   - Reset group configuration to defaults
   - Clear usage statistics
   - Send confirmation

2. Create command parser:
   - Extract command and arguments from message
   - Handle commands with or without @ mention
   - Case-insensitive command matching
   - Trim whitespace

3. Add proper error messages for invalid commands.
4. Add permission checks (only group admins can use /set).
```

---

#### **PROMPT 8: Create Main Message Handler**

```
Create the main message processing logic that handles translations:

1. Update /src/bot/messageHandler.js:

   Main flow:
   - Check if message is a command (starts with /)
     * If yes, pass to command handler
     * If no, proceed with translation

   - Get group configuration from database
     * If no config exists, use default (en, th)
     * If user is new, send welcome message with /help

   - Check usage limits
     * If free tier and limit reached, send upgrade message
     * If within limits, proceed

   - Detect source language of the message
     * Use translation service
     * Cache detection result

   - Get list of target languages
     * From group configuration
     * Exclude source language (don't translate to same language)
     * If no target languages remain, skip translation

   - Translate to all target languages
     * Use translation service with caching
     * Run translations in parallel
     * Handle partial failures

   - Format response message
     * Include flag emoji for each language
     * Format: 🇹🇭 TH: [translation]
     * Add newline between translations
     * Keep under LINE's 5000 character limit

   - Send reply message
     * Use LINE reply API
     * Handle API errors
     * Log successful translation

   - Update usage statistics
     * Increment message count
     * Track character count
     * Update last used timestamp

2. Add special handling:
   - Ignore messages from bots (including self)
   - Handle very long messages (split if needed)
   - Handle messages with only emojis
   - Handle messages with URLs (translate around them)
   - Handle mixed-language messages

3. Add rate limiting per group:
   - Max 30 messages per minute
   - Return friendly rate limit message
```

---

#### **PROMPT 9: Create Message Formatter**

```
Create a message formatter with good UX:

1. Create /src/utils/messageFormatter.js:

   Functions:
   - formatTranslations(translations, sourceLang):
     * Takes array of {lang, text, flag} objects
     * Formats into pretty multi-line message
     * Adds flag emojis
     * Adds language codes
     * Returns formatted string

   - formatWelcomeMessage():
     * Welcome new users/groups
     * Brief introduction
     * Show /help command

   - formatHelpMessage():
     * List all commands with descriptions
     * Show examples
     * Mention 35 language support

   - formatErrorMessage(error):
     * User-friendly error messages
     * Different messages for different errors:
       - Rate limit reached
       - Translation failed
       - Invalid command
       - Database error
       - API quota exceeded

   - formatLanguageList():
     * All 35 languages nicely formatted
     * Grouped by region
     * With flag emojis and codes

   - formatStatusMessage(groupConfig, usageStats):
     * Current settings
     * Usage statistics
     * Premium status

   - truncateMessage(text, maxLength):
     * Truncate long messages
     * Add "..." at end
     * Respect word boundaries

2. Add formatting constants:
   - Max message length: 5000 characters
   - Max languages to show: 5 (if more, use "and X more")
   - Line break style
   - Emoji style

3. Make all messages friendly and conversational.
```

---

### Phase 4: Error Handling & Validation (Prompts 10-11)

#### **PROMPT 10: Create Validation Utilities**

```
Create validation utilities for better error handling:

1. Create /src/utils/validators.js:

   Functions:
   - validateLanguageCode(code):
     * Check if code is in our 35 supported languages
     * Return boolean

   - validateLanguageCodes(codes[]):
     * Validate array of language codes
     * Return {valid: [], invalid: []}

   - validateMessageText(text):
     * Check if text is not empty
     * Check if text is not too long (>5000 chars)
     * Check if text contains actual characters (not just emojis)
     * Return {valid: boolean, error: string}

   - validateGroupConfig(config):
     * Check if config has required fields
     * Check if languages array is valid
     * Check if minimum 2 languages
     * Return {valid: boolean, errors: []}

   - isCommand(text):
     * Check if message starts with /
     * Return boolean

   - parseCommand(text):
     * Extract command name
     * Extract arguments
     * Return {command: string, args: []}

   - isGroupAdmin(userId, groupId):
     * Check if user is group admin
     * Use LINE API to verify
     * Return boolean

2. Add sanitization:
   - sanitizeInput(text): Remove dangerous characters
   - normalizeLanguageCode(code): Convert to lowercase, trim
   - normalizeText(text): Trim, normalize whitespace

3. Create /src/utils/errorHandler.js:
   - Custom error classes:
     * TranslationError
     * ValidationError
     * RateLimitError
     * DatabaseError
     * APIError
   - Error logger function
   - Error response formatter
```

---

#### **PROMPT 11: Add Security & Rate Limiting**

```
Add security features and rate limiting:

1. Create /src/middleware/security.js:
   - validateLineSignature(req, res, next):
     * Verify LINE webhook signature
     * Use channel secret
     * Reject invalid signatures with 401
     * Log suspicious requests

   - rateLimiter(req, res, next):
     * Limit requests per IP (100/minute)
     * Limit requests per group (30/minute)
     * Return 429 when exceeded
     * Include Retry-After header

2. Create /src/middleware/logger.js:
   - requestLogger(req, res, next):
     * Log all incoming requests
     * Log response status and time
     * Don't log message content (privacy)
     * Use structured logging format

3. Update /src/index.js:
   - Add all security middleware
   - Add rate limiting
   - Add request logging
   - Set security headers (helmet)
   - Disable X-Powered-By header
   - Add CORS configuration

4. Create /src/utils/antiSpam.js:
   - detectSpam(text):
     * Check for repeated characters
     * Check for all caps
     * Check for excessive emojis
     * Return spam score
   - shouldBlockMessage(text):
     * Block obvious spam
     * Return boolean
```

---

### Phase 5: Testing (Prompts 12-13)

#### **PROMPT 12: Create Unit Tests**

```
Create comprehensive unit tests using Jest:

1. Create /tests/unit/translationService.test.js:
   - Test detectLanguage with various texts
   - Test translateText with valid inputs
   - Test translateToMultiple with multiple languages
   - Test error handling (invalid language, API error)
   - Mock Google Translation API

2. Create /tests/unit/cacheService.test.js:
   - Test cache set and get
   - Test cache expiration
   - Test cache key generation
   - Test cache statistics

3. Create /tests/unit/validators.test.js:
   - Test validateLanguageCode with valid/invalid codes
   - Test validateMessageText with various inputs
   - Test parseCommand with different formats
   - Test sanitizeInput

4. Create /tests/unit/messageFormatter.test.js:
   - Test formatTranslations output
   - Test message truncation
   - Test all format functions

5. Create /tests/unit/commands.test.js:
   - Test all command handlers
   - Test command parsing
   - Test error messages

Setup:
- Configure Jest in package.json
- Add test script: "test": "jest --coverage"
- Mock all external APIs
- Aim for >80% code coverage
```

---

#### **PROMPT 13: Create Integration Tests**

```
Create integration tests for end-to-end flows:

1. Create /tests/integration/webhook.test.js:
   - Test webhook endpoint receives messages
   - Test signature validation
   - Test message processing flow
   - Test translation response
   - Use supertest for HTTP testing

2. Create /tests/integration/database.test.js:
   - Test database connection
   - Test saving and retrieving group config
   - Test usage tracking
   - Use test database

3. Create /tests/integration/fullFlow.test.js:
   - Test complete message flow:
     * Receive message
     * Detect language
     * Translate
     * Send reply
   - Test command flow
   - Test error scenarios

Setup:
- Use test environment variables
- Use test database (separate from production)
- Clean up after each test
- Add setup and teardown functions
```

---

### Phase 6: Deployment Setup (Prompts 14-16)

#### **PROMPT 14: Create Deployment Configuration**

```
Create deployment configuration files:

1. Create Dockerfile:
   - Use Node.js 18 Alpine image
   - Set working directory
   - Copy package files
   - Install production dependencies only
   - Copy source code
   - Expose port 3000
   - Run with node (not nodemon)
   - Add health check

2. Create docker-compose.yml (for local testing):
   - Service for bot
   - Service for MongoDB
   - Service for Redis (optional cache)
   - Network configuration
   - Volume mounts
   - Environment variables

3. Create railway.json (for Railway.app):
   - Build configuration
   - Start command
   - Environment variables template
   - Health check endpoint

4. Create .dockerignore:
   - node_modules
   - .env
   - .git
   - tests
   - *.md
   - .vscode

5. Create deployment scripts in /scripts:
   - deploy.sh: Deploy to Railway
   - test-local.sh: Test Docker locally
   - backup-db.sh: Backup database
```

---

#### **PROMPT 15: Create Documentation**

```
Create comprehensive documentation:

1. Update README.md with:
   - Project description
   - Features list (35 languages, auto-detection, etc.)
   - Screenshots/demo
   - Installation instructions
   - Configuration guide
   - Deployment guide
   - Usage examples
   - API documentation
   - Contributing guidelines
   - License (MIT)

2. Create /docs/SETUP.md:
   - Step-by-step setup guide
   - How to get LINE credentials
   - How to get Google API key
   - How to setup MongoDB
   - Environment variables explanation
   - Troubleshooting section

3. Create /docs/DEPLOYMENT.md:
   - Railway deployment guide
   - AWS deployment guide
   - Docker deployment guide
   - Environment configuration
   - Monitoring setup
   - Backup strategy

4. Create /docs/COMMANDS.md:
   - All bot commands documented
   - Screenshots of each command
   - Usage examples
   - Tips and tricks

5. Create /docs/API.md:
   - API endpoints if any
   - Webhook format
   - Database schema
   - Code architecture

6. Create CONTRIBUTING.md:
   - How to contribute
   - Code style guide
   - Pull request process
   - Issue reporting
```

---

#### **PROMPT 16: Add Monitoring & Analytics**

```
Add monitoring and analytics capabilities:

1. Create /src/services/analyticsService.js:
   - Track these metrics:
     * Total messages translated
     * Messages per language pair
     * Active groups count
     * Average response time
     * Error rate
     * Cache hit rate
     * API quota usage
   - Save metrics to database
   - Create daily/weekly aggregations

2. Create /src/services/monitoringService.js:
   - Health check function:
     * Check database connection
     * Check Google API availability
     * Check cache service
     * Check memory usage
     * Return health status
   - Alert function for critical errors
   - Log rotation

3. Create dashboard endpoint:
   - GET /admin/stats (protected)
   - Return analytics data
   - Return health status
   - Return active groups
   - Return usage statistics

4. Add structured logging:
   - Use winston or pino
   - Log levels: error, warn, info, debug
   - Log to file and console
   - Log rotation (daily)
   - Include request IDs

5. Optional: Integrate with external services:
   - Sentry for error tracking
   - Google Analytics
   - Datadog/New Relic for monitoring
```

---

### Phase 7: Optimization & Polish (Prompts 17-18)

#### **PROMPT 17: Performance Optimization**

```
Optimize the bot for better performance:

1. Update /src/services/translationService.js:
   - Implement batch translation for multiple languages
   - Add request deduplication (if same text requested twice simultaneously)
   - Add timeout handling (max 5 seconds per translation)
   - Implement exponential backoff for API retries
   - Add circuit breaker pattern for API calls

2. Update /src/services/cacheService.js:
   - Increase cache size if memory allows
   - Add cache warming (pre-translate common phrases)
   - Add cache compression for large translations
   - Implement LRU eviction policy
   - Add cache persistence (save to disk)

3. Optimize database queries:
   - Add indexes on frequently queried fields
   - Use connection pooling
   - Implement query result caching
   - Use lean() for read-only queries
   - Add pagination for large result sets

4. Update /src/bot/messageHandler.js:
   - Process webhook events in parallel when possible
   - Add message queue for high traffic
   - Implement request batching
   - Add response compression

5. Add performance monitoring:
   - Track response times
   - Track memory usage
   - Track CPU usage
   - Add performance alerts
```

---

#### **PROMPT 18: Add Premium Features & Monetization**

```
Add premium tier features and monetization:

1. Create /src/services/subscriptionService.js:
   - Check subscription status
   - Validate premium features access
   - Track trial periods
   - Handle subscription upgrades/downgrades

2. Implement premium features:
   - Unlimited translations (free tier: 20/day)
   - Priority translation (faster queue)
   - More than 2 languages simultaneously (free tier: 2)
   - Custom language pairs
   - Translation history
   - Advanced analytics

3. Create upgrade prompt:
   - When free tier limit reached, show upgrade message
   - Include pricing information
   - Add upgrade link
   - Show premium benefits

4. Create /src/routes/payment.js (optional):
   - Webhook for Stripe/PayPal
   - Handle subscription events
   - Update database on successful payment
   - Send confirmation to user

5. Add usage analytics:
   - Track which features are most used
   - Calculate ROI per user
   - Generate revenue reports

6. Create admin panel endpoints (optional):
   - View all users
   - View subscriptions
   - Manually upgrade users
   - View revenue statistics
```

---

## 🎯 Prompt Execution Order

### Week 1: Foundation
- Day 1: Prompts 1-3 (Project setup, server, webhook)
- Day 2: Prompts 4-5 (Translation service, caching)
- Day 3: Prompt 6 (Database service)
- Day 4: Prompts 7-8 (Commands, message handler)
- Day 5: Prompt 9 (Message formatting)

### Week 2: Quality & Security
- Day 1: Prompts 10-11 (Validation, security)
- Day 2: Prompts 12-13 (Testing)
- Day 3: Testing and bug fixes
- Day 4: Prompts 14-15 (Deployment, docs)
- Day 5: Prompt 16 (Monitoring)

### Week 3: Launch
- Day 1: Prompts 17-18 (Optimization, premium)
- Day 2: Final testing
- Day 3: Deploy to production
- Day 4: Monitor and fix issues
- Day 5: Marketing and user acquisition

---

## 📚 Additional Prompts (As Needed)

### **BONUS PROMPT A: Add Rich Menu**

```
Create a LINE Rich Menu for better UX:

1. Design rich menu with buttons:
   - Help
   - Languages
   - Settings
   - About
   - Upgrade (for premium)

2. Create /src/services/richMenuService.js:
   - Create rich menu using LINE API
   - Set rich menu for users/groups
   - Handle rich menu taps
   - Update menu based on premium status

3. Create menu images:
   - Design 2500x1686px or 2500x843px image
   - Include button labels
   - Use brand colors
   - Add icons

4. Implement menu logic:
   - Show different menus for free vs premium users
   - Handle button clicks
   - Update menu when settings change
```

---

### **BONUS PROMPT B: Add Voice Translation**

```
Add voice message translation feature:

1. Install additional dependencies:
   - @google-cloud/speech (Speech-to-Text)
   - @google-cloud/text-to-speech (optional)

2. Create /src/services/voiceService.js:
   - downloadVoiceMessage(messageId): Download voice file from LINE
   - transcribeAudio(audioBuffer): Convert speech to text
   - translateVoice(audioBuffer, targetLang): Full pipeline

3. Update message handler:
   - Detect voice messages
   - Process voice translation
   - Reply with text translation
   - Optional: Reply with voice in target language

4. Add usage limits:
   - Voice translation costs more
   - Premium feature or limited free usage
```

---

### **BONUS PROMPT C: Add Image OCR Translation**

```
Add image text translation using OCR:

1. Install dependencies:
   - @google-cloud/vision (Cloud Vision API)

2. Create /src/services/ocrService.js:
   - downloadImage(messageId): Get image from LINE
   - extractText(imageBuffer): OCR extraction
   - detectTextLanguage(text): Detect language
   - translateImage(imageBuffer, targetLang): Full pipeline

3. Update message handler:
   - Detect image messages
   - Process OCR translation
   - Reply with extracted and translated text
   - Handle images with no text

4. Add features:
   - Support multiple languages in one image
   - Handle rotated text
   - Handle handwritten text (if possible)
```

---

### **BONUS PROMPT D: Create Web Dashboard**

```
Create a web dashboard for users to manage their bot:

1. Create /src/routes/web.js:
   - GET / : Landing page
   - GET /dashboard : User dashboard (after LINE login)
   - GET /settings : Group settings page
   - GET /analytics : Usage statistics
   - GET /pricing : Pricing page
   - POST /api/settings : Update settings API

2. Create frontend using:
   - Express + EJS templates (simple)
   - Or React (more advanced)
   - Or Next.js (modern)

3. Implement LINE Login:
   - OAuth authentication
   - Get user profile
   - Get user's groups
   - Store session

4. Dashboard features:
   - View all groups bot is in
   - Configure languages per group
   - View usage statistics
   - Upgrade to premium
   - View translation history
   - Download reports

5. Make it responsive (mobile-friendly).
```

---

### **BONUS PROMPT E: Add Conversation Context**

```
Add AI-powered context understanding for better translations:

1. Install dependencies:
   - openai or @anthropic-ai/sdk

2. Create /src/services/contextService.js:
   - Store recent messages (last 10 per group)
   - analyzeContext(messages): Get conversation context
   - improveTranslation(text, context, targetLang): Context-aware translation

3. Update translation flow:
   - Check if context would improve translation
   - Use context for idioms and references
   - Use context for ambiguous words
   - Cache context-aware translations separately

4. Privacy consideration:
   - Only store message metadata
   - Clear context after inactivity
   - Allow users to opt-out
   - Encrypt stored context

5. Premium feature:
   - Free tier: Basic translation
   - Premium tier: Context-aware translation
```

---

## 🔍 Testing Prompts

### **TEST PROMPT 1: Local Testing**

```
Help me test the bot locally before deployment:

1. Create test scenarios:
   - Test basic translation (EN -> TH)
   - Test multi-language translation (EN -> TH, HI, MR)
   - Test all commands (/help, /languages, /set, /status)
   - Test rate limiting
   - Test usage limits
   - Test error handling

2. Create test webhook sender:
   - Script to send fake LINE webhook events
   - Simulate different message types
   - Test with various languages

3. Setup ngrok for local testing:
   - Install ngrok
   - Start local server
   - Expose webhook via ngrok
   - Update LINE console with ngrok URL
   - Test with real LINE app

4. Create test checklist:
   - [ ] Bot responds to messages
   - [ ] Translation works
   - [ ] Commands work
   - [ ] Database saves correctly
   - [ ] Cache works
   - [ ] Rate limiting works
   - [ ] Error handling works
```

---

### **TEST PROMPT 2: Load Testing**

```
Help me load test the bot to ensure it can handle traffic:

1. Install load testing tool:
   - artillery or k6
   - Setup test scenarios

2. Create load test script:
   - Simulate 100 concurrent groups
   - Each group sends 1 message per second
   - Run for 5 minutes
   - Measure response times
   - Measure error rates

3. Test scenarios:
   - Normal load (10 groups, 10 msg/min)
   - High load (100 groups, 100 msg/min)
   - Burst load (50 groups, 500 msg/min for 1 min)
   - Sustained load (50 groups, 50 msg/min for 1 hour)

4. Monitor during tests:
   - CPU usage
   - Memory usage
   - Database connections
   - API quota usage
   - Response times
   - Error rates

5. Identify bottlenecks and optimize.
```

---

## ✅ Final Integration Prompt

### **FINAL PROMPT: Bring Everything Together**

```
Now that all components are created, integrate everything:

1. Review /src/index.js and ensure:
   - All routes are imported and mounted
   - All middleware is applied in correct order
   - Database connection happens on startup
   - Graceful shutdown is implemented
   - Error handlers are in place

2. Create startup script:
   - Check all environment variables
   - Test database connection
   - Test Google API connection
   - Initialize cache
   - Start Express server
   - Log startup success

3. Create graceful shutdown:
   - Handle SIGTERM and SIGINT
   - Close database connections
   - Clear cache
   - Finish pending requests
   - Log shutdown

4. Final code review:
   - Remove console.logs (use proper logger)
   - Remove commented code
   - Check for hardcoded values
   - Ensure all secrets are in .env
   - Check for TODO comments

5. Run full test suite:
   - npm test (all unit tests)
   - npm run test:integration
   - npm run lint
   - Fix any issues

6. Test complete workflow manually:
   - Start server locally
   - Use ngrok to expose webhook
   - Add bot to LINE group
   - Send test messages in multiple languages
   - Test all commands
   - Verify database updates
   - Check logs for errors

7. Prepare for deployment:
   - Build Docker image
   - Test Docker image locally
   - Push to GitHub
   - Deploy to Railway
   - Configure environment variables in Railway
   - Update LINE webhook URL to production
   - Monitor logs for errors
```

---

## 📋 Coverage Checklist

### ✅ Areas Covered in Project Plan:

**Core Functionality:**
- [x] LINE webhook integration
- [x] Google Translation API integration  
- [x] 35 language support (including Hindi & Marathi)
- [x] Auto language detection
- [x] Multi-language translation
- [x] Group chat support
- [x] 1-on-1 chat support

**Features:**
- [x] Command system (/help, /languages, /set, /status, /about)
- [x] Smart caching system
- [x] Rate limiting
- [x] Usage tracking
- [x] Free tier limits (20 messages/day)
- [x] Premium tier support
- [x] Message formatting with flags
- [x] Error handling

**Database:**
- [x] MongoDB integration
- [x] Group configuration storage
- [x] Usage statistics
- [x] Subscription management

**Security:**
- [x] LINE signature validation
- [x] Input validation
- [x] Rate limiting
- [x] Anti-spam measures
- [x] Environment variable protection
- [x] Security headers (Helmet)

**Testing:**
- [x] Unit tests
- [x] Integration tests
- [x] Load testing guides
- [x] Local testing with ngrok

**Deployment:**
- [x] Docker configuration
- [x] Railway.app deployment
- [x] Environment setup
- [x] Monitoring & analytics
- [x] Health checks
- [x] Graceful shutdown

**Documentation:**
- [x] README
- [x] Setup guide
- [x] Deployment guide
- [x] API documentation
- [x] Contributing guide

**Optimization:**
- [x] Caching strategy
- [x] Parallel translations
- [x] Database indexing
- [x] Query optimization
- [x] Memory management

**Monetization:**
- [x] Free tier setup
- [x] Premium features
- [x] Subscription logic
- [x] Payment webhook (optional)

**Bonus Features:**
- [x] Rich Menu (optional)
- [x] Voice translation (optional)
- [x] OCR image translation (optional)
- [x] Web dashboard (optional)
- [x] AI context understanding (optional)

---

## 🎯 Quick Start Summary

### Minimum Viable Product (Prompts 1-9):
**Week 1 - Core Bot**
1. Project setup
2. Config & environment
3. Express server + webhook
4. Translation service
5. Caching
6. Database
7. Commands
8. Message handler
9. Formatting

**Result:** Working bot that translates in 35 languages ✅

### Production Ready (Prompts 10-16):
**Week 2 - Polish & Deploy**
10. Validation
11. Security
12. Unit tests
13. Integration tests
14. Deployment config
15. Documentation
16. Monitoring

**Result:** Production-ready bot ready to launch ✅

### Advanced Features (Prompts 17-18 + Bonus):
**Week 3+ - Optimization & Growth**
17. Performance optimization
18. Premium features
- Bonus A: Rich menu
- Bonus B: Voice translation
- Bonus C: OCR translation
- Bonus D: Web dashboard
- Bonus E: AI context

**Result:** Full-featured commercial bot ✅

---

## 💡 Tips for Using Cursor AI

### Best Practices:

1. **One Prompt at a Time:**
   - Don't rush through prompts
   - Review each output before moving to next
   - Test code before continuing

2. **Provide Context:**
   - Reference previous prompts if needed
   - Mention files already created
   - Explain what's not working

3. **Be Specific:**
   - Include exact file paths
   - Specify function names
   - Mention variable names

4. **Review & Refine:**
   - Check generated code
   - Ask for explanations if unclear
   - Request modifications if needed

5. **Test Frequently:**
   - Test after each major component
   - Don't wait until everything is done
   - Fix issues immediately

### If Something Goes Wrong:

```
The [X] is not working correctly. Here's the error: [paste error]

Current code in [file path]: [paste relevant code]

Expected behavior: [describe what should happen]

Please help me fix this.
```

### If You Need Clarification:

```
I don't understand [specific part]. Can you explain:
1. What does [this code] do?
2. Why do we need [this component]?
3. How does [this] connect to [that]?
```

### If You Want to Modify:

```
The current implementation [does X]. 
I want to change it to [do Y] instead.

Current code: [paste code]
Desired behavior: [describe]

Please help me modify this.
```

---

## 🚀 Ready to Start?

Your complete roadmap:

**Phase 1:** Copy Prompt 1 to Cursor AI → Start building!

**Phase 2:** Work through Prompts 2-9 in sequence

**Phase 3:** Test everything locally with ngrok

**Phase 4:** Deploy to Railway using Prompts 14-16

**Phase 5:** Add premium features using Prompts 17-18

**Bonus:** Add advanced features when needed

---

## 📞 What's Not Covered (You'll Need to Do Manually)

1. **LINE Developer Account Setup:**
   - Go to https://developers.line.biz/console/
   - Create Messaging API channel
   - Get credentials (can't be automated)

2. **Google Cloud Setup:**
   - Create Google Cloud account
   - Enable Translation API
   - Generate API key
   - Setup billing

3. **MongoDB Atlas Setup:**
   - Create free cluster
   - Get connection string
   - Configure IP whitelist

4. **Railway Deployment:**
   - Create Railway account
   - Connect GitHub repo
   - Configure environment variables

5. **Domain & SSL (Optional):**
   - Buy domain name
   - Configure DNS
   - Setup SSL certificate

6. **Marketing & User Acquisition:**
   - Create landing page content
   - Social media strategy
   - Community outreach
   - User support

All of these have setup guides in the documentation prompts!

---

## 🎓 Learning Resources

While Cursor AI builds the code, you should understand:

- **LINE Bot Basics:** https://developers.line.biz/en/docs/messaging-api/
- **Google Translation API:** https://cloud.google.com/translate/docs
- **Node.js Async/Await:** https://javascript.info/async-await
- **MongoDB Basics:** https://www.mongodb.com/docs/
- **Express.js:** https://expressjs.com/en/guide/routing.html

---

**You're all set! Start with Prompt 1 and build your @LanguageBridgeBot! 🚀**
