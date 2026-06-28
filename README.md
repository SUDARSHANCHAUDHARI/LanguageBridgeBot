# 🌍 LanguageBridgeBot

<div align="center">

**A LINE messaging bot/backend that automatically translates messages across 35 languages with optional AI context, OCR, voice, payments, and dashboard features**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Languages](https://img.shields.io/badge/Languages-35-blue.svg)](#-features)

[Status](#-status) • [Technical Decisions](#-key-technical-decisions) • [Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Verification](#-verification)

</div>

---

## 🚦 Status

| Item | State |
|---|---|
| Release type | Production backend candidate |
| Code readiness | Verified locally |
| Live production | Pending real credentials and webhook smoke |
| Deployment targets | Docker or Railway |
| Last verified | 2026-06-04 |

Verified checks:

```bash
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm exec jest tests/integration --runInBand --detectOpenHandles
```

> **Release note:** this repo is a code-level release candidate. A live production launch still requires LINE, MongoDB, Google Cloud, optional OpenAI/Stripe credentials, HTTPS domain setup, and real LINE webhook testing.

---

## 📖 Overview

**LanguageBridgeBot** is an intelligent LINE messaging bot that breaks down language barriers in group chats and private conversations. It automatically detects languages and translates messages in real-time, supporting **35 languages** with special focus on **Indian languages**.

Perfect for:
- 🌏 International teams and communities
- 🇮🇳 Multi-language Indian groups (Hindi, Marathi, Telugu, Bengali, Tamil, etc.)
- 📱 LINE group chats and 1-on-1 conversations
- 🎯 Real-time multilingual communication

---

## 🧠 Key Technical Decisions

**LINE webhook handling is kept inside an Express backend.** LINE requires signed webhook verification and fast reply behavior, so a dedicated Node.js backend keeps bot routing, validation, and API middleware together.

**MongoDB stores users, groups, usage, subscriptions, and analytics.** Translation bots need durable per-user and per-group configuration; MongoDB keeps that state separate from LINE events and supports dashboard/reporting flows.

**Google Cloud Translate is the primary translation engine.** It provides broad language support and predictable API behavior for the core bot experience. OpenAI is optional and used for context-aware premium behavior, not required for base translation.

**Cache, rate limiting, and anti-spam are first-class release features.** Translation and AI APIs can become expensive quickly, so the backend includes caching, request limits, and abuse controls before public launch.

**Tests import the app without starting the server.** The server starts only when `src/index.js` is run directly, which keeps Jest integration tests deterministic and avoids open-handle leaks.

---

## ✨ Features

### Core Features
- 🌐 **35 Language Support** - Asian, European, and Indian languages
- 🔍 **Auto Language Detection** - Automatically detects source language
- 🚀 **Multi-Language Translation** - Translate to multiple languages simultaneously
- 💬 **Group & Private Chat** - Works in both group chats and 1-on-1 conversations
- ⚡ **Smart Caching** - Reduces API costs and improves response time
- 🛡️ **Rate Limiting** - Prevents abuse and ensures fair usage
- 🚫 **Anti-Spam** - Intelligent spam detection and blocking

### Premium Features
- 🎤 **Voice Message Translation** - Transcribe and translate voice messages
- 📷 **OCR Image Translation** - Extract and translate text from images
- 🤖 **AI Context Understanding** - Context-aware translations with OpenAI
- 📊 **Advanced Analytics** - Detailed usage statistics and insights
- ♾️ **Unlimited Translations** - No daily limits
- 🔢 **Unlimited Languages** - Translate to as many languages as you want
- ⚡ **Priority Processing** - Faster translation responses

### Advanced Features
- 🎨 **Rich Menu** - LINE Rich Menu for quick command access
- 💳 **Premium Subscriptions** - Stripe integration for payments
- 🔬 **A/B Testing** - Test different translation strategies
- 🤖 **Multi-Bot Support** - Manage multiple LINE bot instances
- 📈 **Web Dashboard** - Admin panel for stats and group management
- 📊 **Analytics Dashboard** - Usage metrics and insights
- 📚 **Swagger API Docs** - Interactive API documentation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** v9 or higher
- **LINE Developer Account** - [Get one here](https://developers.line.biz/)
- **Google Cloud Translation API Key** - [Get one here](https://console.cloud.google.com/)
- **MongoDB Atlas** (recommended) or local MongoDB - [Get one here](https://www.mongodb.com/cloud/atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SUDARSHANCHAUDHARI/LanguageBridgeBot.git
   cd LanguageBridgeBot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
   LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
   GOOGLE_TRANSLATE_API_KEY=YOUR_GOOGLE_TRANSLATE_API_KEY
   MONGODB_URI=YOUR_MONGODB_URI
   ```

4. **Start the server**
   ```bash
   # Development mode (with hot reload)
   pnpm dev
   
   # Production mode
   pnpm start
   ```

5. **Configure LINE Webhook**
   - Go to [LINE Developers Console](https://developers.line.biz/console/)
   - Set webhook URL: `https://example.com/webhook`
   - Enable webhook

### Docker Deployment

```bash
# Build image
docker build -t language-bridge-bot .

# Run with docker-compose
docker-compose up -d
```

---

## 📱 Usage

### Basic Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/help` or `/start` | Show help message | `/help` |
| `/languages` | List all supported languages | `/languages` |
| `/set [lang1] [lang2] ...` | Configure translation languages | `/set en th hi` |
| `/status` | Show group configuration and usage | `/status` |
| `/about` | Show bot information | `/about` |
| `/reset` | Reset group configuration | `/reset` |

### Example Workflow

1. **Add bot to your LINE group**
2. **Set languages**: `/set en th hi mr`
3. **Start chatting** - Bot automatically translates!

```
You: Hello, how are you?
Bot: 🇹🇭 สวัสดี คุณเป็นอย่างไรบ้าง?
     🇮🇳 नमस्ते, आप कैसे हैं?
     🇮🇳 नमस्कार, तुम्ही कसे आहात?
```

---

## 🏗️ Project Structure

```
LanguageBridgeBot/
├── src/
│   ├── bot/              # Webhook handlers, commands, rich menu
│   ├── services/         # Translation, database, analytics, payment services
│   ├── utils/            # Helpers, validators, performance utilities
│   ├── config/           # Environment, constants
│   ├── middleware/       # Security, logging middleware
│   ├── dashboard/        # Web dashboard and analytics
│   └── index.js          # Main entry point
├── tests/                # Unit and integration tests
├── docs/                 # Documentation
├── scripts/              # Deployment and utility scripts
├── .env.example          # Environment variables template
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
└── package.json          # Dependencies and scripts
```

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server with nodemon

# Production
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage    # Run tests with coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
```

---

## 📚 Documentation

### Core Documentation
- ➕ [Features Added](./FEATURES_ADDED.md) - Additional features beyond core

### Setup & Deployment
- 🔧 [Setup Guide](./docs/SETUP.md) - Step-by-step setup instructions
- 🚀 [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions
- 🐳 [Docker Guide](./docs/DEPLOYMENT.md#docker) - Docker deployment

### User Guides
- 📖 [User Guide](./docs/USER_GUIDE.md) - End-user documentation
- 💬 [Commands Guide](./docs/COMMANDS.md) - Bot commands reference

### API & Technical
- 🔌 [API Documentation](./docs/API.md) - REST API documentation
- 📊 [Swagger UI](./api-docs) - Interactive API documentation (when running)
- 🏛️ [Architecture](./docs/API.md#architecture) - System architecture

### Analysis
- 📊 [Competitive Analysis](./COMPETITIVE_ANALYSIS.md) - Market analysis
- 🔍 [Feature Comparison](./FEATURE_COMPARISON.md) - Feature comparison with competitors

---

## 🔌 API

### Endpoints

- `GET /health` - Health check
- `GET /dashboard` - Dashboard overview (requires auth)
- `GET /dashboard/groups` - List all groups (requires auth)
- `GET /dashboard/analytics` - Analytics data (requires auth)
- `GET /api-docs` - Swagger UI documentation
- `POST /webhook` - LINE webhook endpoint
- `POST /webhook/stripe` - Stripe webhook endpoint

### Authentication

Dashboard endpoints require authentication via `Authorization` header:
```bash
curl -H "Authorization: YOUR_DASHBOARD_SECRET_KEY" \
  https://YOUR_DOMAIN/dashboard
```

See [API Documentation](./docs/API.md) for complete API reference.

---

## 🌐 Supported Languages

### Asian Languages (16)
🇹🇭 Thai • 🇯🇵 Japanese • 🇰🇷 Korean • 🇨🇳 Chinese (Simplified) • 🇹🇼 Chinese (Traditional) • 🇻🇳 Vietnamese • 🇮🇩 Indonesian • 🇲🇾 Malay • 🇵🇭 Filipino • 🇸🇬 Singaporean • 🇱🇰 Sinhala • 🇲🇲 Burmese • 🇰🇭 Khmer • 🇱🇦 Lao • 🇧🇩 Bengali • 🇵🇰 Urdu

### European Languages (15)
🇬🇧 English • 🇪🇸 Spanish • 🇫🇷 French • 🇩🇪 German • 🇮🇹 Italian • 🇵🇹 Portuguese • 🇷🇺 Russian • 🇳🇱 Dutch • 🇵🇱 Polish • 🇬🇷 Greek • 🇹🇷 Turkish • 🇨🇿 Czech • 🇷🇴 Romanian • 🇭🇺 Hungarian • 🇸🇪 Swedish

### Indian Languages (5) ⭐
🇮🇳 Hindi • 🇮🇳 Marathi • 🇮🇳 Telugu • 🇮🇳 Tamil • 🇮🇳 Gujarati

**Total: 35 languages**

---

## 🔧 Configuration

### Required Environment Variables

```env
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
GOOGLE_TRANSLATE_API_KEY=YOUR_GOOGLE_TRANSLATE_API_KEY
MONGODB_URI=YOUR_MONGODB_URI
```

### Optional Environment Variables

```env
# Premium Features
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
GOOGLE_VISION_API_KEY=YOUR_GOOGLE_VISION_API_KEY      # For OCR
GOOGLE_SPEECH_API_KEY=YOUR_GOOGLE_SPEECH_API_KEY       # For voice
OPENAI_API_KEY=YOUR_OPENAI_API_KEY                     # For AI context

# Dashboard
DASHBOARD_SECRET_KEY=YOUR_DASHBOARD_SECRET_KEY
DASHBOARD_PORT=3001

# Features
ENABLE_MULTI_BOT=false
ENABLE_AB_TESTING=false
```

See [`.env.example`](./.env.example) for complete configuration options.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

---

## 🐳 Docker

### Build and Run

```bash
# Build image
docker build -t language-bridge-bot .

# Run container
docker run -p 3000:3000 --env-file .env language-bridge-bot
```

### Docker Compose

```bash
# Start all services (bot + MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📊 Features Comparison

| Feature | Free Tier | Premium |
|---------|-----------|---------|
| Daily Translations | 20 | Unlimited |
| Languages per Group | 2 | Unlimited |
| Voice Translation | ❌ | ✅ |
| Image OCR Translation | ❌ | ✅ |
| AI Context Understanding | ❌ | ✅ |
| Priority Processing | ❌ | ✅ |
| Translation History | ❌ | ✅ |
| Advanced Analytics | ❌ | ✅ |

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

Built by **Sudarshan Chaudhari** — SudarshanTechLabs. [@SUDARSHANCHAUDHARI](https://github.com/SUDARSHANCHAUDHARI)

---

## 🙏 Acknowledgments

- [LINE Messaging API](https://developers.line.biz/)
- [Google Cloud Translation API](https://cloud.google.com/translate)
- [MongoDB](https://www.mongodb.com/)
- All contributors and users

---

## 📞 Support

- 📖 [User Guide](./docs/USER_GUIDE.md) - For end-users
- 🔧 [Setup Guide](./docs/SETUP.md) - For setup help
- 🐛 [Issues](https://github.com/SUDARSHANCHAUDHARI/LanguageBridgeBot/issues) - Report bugs or request features
- 💬 [Discussions](https://github.com/SUDARSHANCHAUDHARI/LanguageBridgeBot/discussions) - Ask questions

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">

**Made with ❤️ for breaking down language barriers**

[⬆ Back to Top](#-languagebridgebot)

</div>
