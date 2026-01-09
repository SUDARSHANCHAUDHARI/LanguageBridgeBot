#!/bin/bash

# Backup database script
# Usage: ./scripts/backup-db.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"

echo "💾 Backing up database..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI not set"
    exit 1
fi

# Export data (requires mongodump)
if command -v mongodump &> /dev/null; then
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/dump_$TIMESTAMP"
    echo "✅ Database backup created: $BACKUP_DIR/dump_$TIMESTAMP"
else
    echo "⚠️  mongodump not found. Install MongoDB tools to use this script."
    echo "💡 Alternative: Use MongoDB Atlas backup feature"
fi

echo "✅ Backup complete!"
