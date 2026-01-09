# @LanguageBridgeBot

A LINE messaging bot that automatically translates messages in 35 languages, with a special focus on Indian languages.

## 🌟 Features

- **35 Language Support**: Including Hindi, Marathi, Telugu, Bengali, Tamil, Urdu, and 29 more
- **Auto Language Detection**: Automatically detects the source language
- **Multi-Language Translation**: Translate to multiple languages simultaneously
- **Group & 1-on-1 Chat Support**: Works in both group chats and private conversations
- **Smart Caching**: Reduces API costs and improves response time
- **Free Tier**: 20 messages per day
- **Premium Features**: Unlimited translations, advanced features

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- LINE Developer Account
- Google Cloud Translation API Key
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LanguageBridgeBot
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your credentials:
   - LINE Channel Access Token
   - LINE Channel Secret
   - Google Translate API Key
   - MongoDB URI

5. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
LanguageBridgeBot/
├── src/
│   ├── bot/          # Webhook handlers, commands
│   ├── services/     # Translation, database services
│   ├── utils/        # Helpers, validators
│   ├── config/       # Environment, constants
│   └── index.js      # Main entry point
├── tests/            # Test files
├── .env.example      # Environment variables template
└── package.json      # Dependencies and scripts
```

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 📚 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Complete development guide
- [Competitive Analysis](./COMPETITIVE_ANALYSIS.md) - Market analysis
- [Feature Comparison](./FEATURE_COMPARISON.md) - Feature comparison with competitors
- [Setup Guide](./docs/SETUP.md) - Step-by-step setup instructions
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions
- [Commands Guide](./docs/COMMANDS.md) - Bot commands documentation
- [API Documentation](./docs/API.md) - API and architecture docs

## 🔧 Configuration

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## 🐳 Docker

```bash
# Build image
docker build -t language-bridge-bot .

# Run with docker-compose
docker-compose up -d
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## ✅ Implementation Status

All core phases (1-7) have been completed! See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for details.

**Status:** 🚀 **PRODUCTION READY**
