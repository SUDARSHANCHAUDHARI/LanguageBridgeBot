#!/bin/bash

# Test Docker locally
# Usage: ./scripts/test-local.sh

set -e

echo "🐳 Testing Docker build locally..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t language-bridge-bot:test .

# Run container
echo "🚀 Starting container..."
docker run -d \
  --name language-bridge-bot-test \
  -p 3000:3000 \
  --env-file .env \
  language-bridge-bot:test

echo "⏳ Waiting for container to start..."
sleep 5

# Test health check
echo "🏥 Testing health check..."
curl -f http://localhost:3000/health || {
    echo "❌ Health check failed"
    docker logs language-bridge-bot-test
    docker stop language-bridge-bot-test
    docker rm language-bridge-bot-test
    exit 1
}

echo "✅ Docker test passed!"
echo "🛑 Stopping container..."
docker stop language-bridge-bot-test
docker rm language-bridge-bot-test

echo "✅ All tests passed!"
