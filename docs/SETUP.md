# Setup Guide

Complete step-by-step guide to set up @LanguageBridgeBot.

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- LINE Developer Account
- Google Cloud Account
- MongoDB Atlas account (free tier available)

## Step 1: Get LINE Credentials

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new provider (if you don't have one)
3. Create a new **Messaging API Channel**
4. Copy the following:
   - **Channel Access Token** (under "Messaging API" tab)
   - **Channel Secret** (under "Basic settings" tab)
5. Enable **Webhook** in the Messaging API settings

## Step 2: Get Google Cloud Translation API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Cloud Translation API**
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "API Key"
6. Copy the API key
7. (Optional) Restrict the API key to Translation API only

## Step 3: Setup MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier: M0)
4. Create a database user
5. Whitelist your IP (or use 0.0.0.0/0 for development)
6. Get connection string: Click "Connect" > "Connect your application"
7. Copy the connection string (replace `<password>` with your password)

### Option B: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/languagebridge`

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:
```env
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
GOOGLE_TRANSLATE_API_KEY=YOUR_GOOGLE_TRANSLATE_API_KEY
MONGODB_URI=YOUR_MONGODB_URI
PORT=3000
NODE_ENV=development
```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Test Locally

1. Start the server:
```bash
npm run dev
```

2. Test health check:
```bash
curl http://localhost:3000/health
```

3. Use ngrok to expose webhook:
```bash
ngrok http 3000
```

4. Update LINE webhook URL in LINE Developers Console:
   - Go to your channel settings
   - Set Webhook URL to: `https://YOUR_TUNNEL_DOMAIN/webhook`
   - Enable webhook

## Step 7: Test with LINE

1. Add bot as friend: Search `@LanguageBridgeBot` in LINE
2. Send a message: `/help`
3. Configure languages: `/set en th hi`
4. Send a test message: "Hello"

## Troubleshooting

### Bot doesn't respond
- Check webhook URL is correct
- Verify LINE signature validation
- Check server logs for errors

### Translation fails
- Verify Google API key is correct
- Check API quota in Google Cloud Console
- Verify language codes are valid

### Database connection fails
- Check MongoDB URI is correct
- Verify IP whitelist in MongoDB Atlas
- Check database user credentials

### Port already in use
- Change PORT in `.env` file
- Or kill process using port 3000

## Next Steps

- Read [Deployment Guide](./DEPLOYMENT.md) for production deployment
- Read [Commands Guide](./COMMANDS.md) for bot usage
- Read [API Documentation](./API.md) for technical details
