#!/bin/bash

# Deploy script for Railway.app
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Deploying LanguageBridgeBot to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it with: npm install -g @railway/cli"
    exit 1
fi

# Login to Railway (if not already logged in)
railway login

# Link to project (if not already linked)
if [ ! -f .railway/project.json ]; then
    echo "📦 Linking to Railway project..."
    railway link
fi

# Deploy
echo "📤 Deploying..."
railway up

echo "✅ Deployment complete!"
echo "🔗 Check your Railway dashboard for deployment status"
