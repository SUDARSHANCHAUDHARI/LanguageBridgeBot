/**
 * Database Service
 * Handles MongoDB operations for group configurations and usage statistics
 */

const { MongoClient } = require('mongodb');
const config = require('../config/environment');
const { DEFAULT_SETTINGS } = require('../config/constants');

let client = null;
let db = null;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retries attempted
 * @returns {Promise<void>}
 */
async function connectDatabase(retries = 0) {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      console.log('MongoDB already connected');
      return;
    }

    console.log(`Connecting to MongoDB... (attempt ${retries + 1}/${MAX_RETRIES + 1})`);

    client = new MongoClient(config.mongodb.uri, {
      maxPoolSize: 10, // Connection pooling
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(); // Use default database from URI

    // Create indexes for better performance
    await createIndexes();

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error(`MongoDB connection error (attempt ${retries + 1}):`, error.message);

    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDatabase(retries + 1);
    }

    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES + 1} attempts: ${error.message}`);
  }
}

/**
 * Create database indexes for better query performance
 * @returns {Promise<void>}
 */
async function createIndexes() {
  try {
    const groupsCollection = db.collection('groups');

    // Create index on groupId for fast lookups
    await groupsCollection.createIndex({ groupId: 1 }, { unique: true });

    // Create index on isActive for filtering active groups
    await groupsCollection.createIndex({ isActive: 1 });

    // Create index on lastUsedAt for cleanup queries
    await groupsCollection.createIndex({ lastUsedAt: 1 });

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('Error creating indexes:', error);
    // Don't throw - indexes might already exist
  }
}

/**
 * Get group configuration
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<Object|null>} Group configuration or null if not found
 */
async function getGroupConfig(groupId) {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }

    const groupsCollection = db.collection('groups');
    const group = await groupsCollection.findOne({ groupId });

    return group;
  } catch (error) {
    console.error('Error getting group config:', error);
    throw new Error(`Failed to get group config: ${error.message}`);
  }
}

/**
 * Save or update group configuration
 * @param {string} groupId - LINE group ID or user ID
 * @param {string[]} languages - Array of language codes
 * @param {Object} options - Additional options (groupName, mode, etc.)
 * @returns {Promise<Object>} Updated group configuration
 */
async function saveGroupConfig(groupId, languages, options = {}) {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }

    if (!Array.isArray(languages) || languages.length < 2) {
      throw new Error('At least 2 languages are required');
    }

    const groupsCollection = db.collection('groups');
    const now = new Date();

    // Determine mode based on language count
    const mode = languages.length === 2 ? 'bilingual' : 'multilingual';

    const groupConfig = {
      groupId,
      groupName: options.groupName || `Group ${groupId}`,
      languages,
      mode,
      isActive: true,
      isPremium: options.isPremium || false,
      messageCount: options.messageCount || 0,
      characterCount: options.characterCount || 0,
      createdAt: options.createdAt || now,
      lastUsedAt: now,
    };

    // Upsert (insert or update)
    await groupsCollection.updateOne(
      { groupId },
      { $set: groupConfig },
      { upsert: true }
    );

    console.log(`Group config saved: ${groupId} with languages: ${languages.join(', ')}`);
    return groupConfig;
  } catch (error) {
    console.error('Error saving group config:', error);
    throw new Error(`Failed to save group config: ${error.message}`);
  }
}

/**
 * Increment usage statistics for a group
 * @param {string} groupId - LINE group ID or user ID
 * @param {number} messageLength - Length of the message in characters
 * @returns {Promise<void>}
 */
async function incrementUsage(groupId, messageLength) {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }

    const groupsCollection = db.collection('groups');
    const now = new Date();

    await groupsCollection.updateOne(
      { groupId },
      {
        $inc: {
          messageCount: 1,
          characterCount: messageLength || 0,
        },
        $set: {
          lastUsedAt: now,
        },
      }
    );
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw new Error(`Failed to increment usage: ${error.message}`);
  }
}

/**
 * Get group statistics
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<Object>} Group statistics
 */
async function getGroupStats(groupId) {
  try {
    const group = await getGroupConfig(groupId);

    if (!group) {
      return null;
    }

    return {
      groupId: group.groupId,
      groupName: group.groupName,
      languages: group.languages,
      mode: group.mode,
      isPremium: group.isPremium,
      messageCount: group.messageCount || 0,
      characterCount: group.characterCount || 0,
      createdAt: group.createdAt,
      lastUsedAt: group.lastUsedAt,
    };
  } catch (error) {
    console.error('Error getting group stats:', error);
    throw new Error(`Failed to get group stats: ${error.message}`);
  }
}

/**
 * Check if group is within daily usage limits
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<Object>} { withinLimit: boolean, limit: number, used: number }
 */
async function checkUsageLimit(groupId) {
  try {
    const group = await getGroupConfig(groupId);

    if (!group) {
      // New group - within limit
      return {
        withinLimit: true,
        limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
        used: 0,
        isPremium: false,
      };
    }

    // Premium users have unlimited usage
    if (group.isPremium) {
      return {
        withinLimit: true,
        limit: Infinity,
        used: 0,
        isPremium: true,
      };
    }

    // For free tier, we'll check daily usage in usageService
    // This is a placeholder - actual daily tracking is in usageService
    return {
      withinLimit: true, // Will be checked in usageService
      limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      used: 0, // Will be calculated in usageService
      isPremium: false,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // Default to allowing usage on error
    return {
      withinLimit: true,
      limit: DEFAULT_SETTINGS.FREE_TIER_DAILY_LIMIT,
      used: 0,
      isPremium: false,
    };
  }
}

/**
 * Get all active groups
 * @returns {Promise<Array>} Array of active group configurations
 */
async function getAllActiveGroups() {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }

    const groupsCollection = db.collection('groups');
    const groups = await groupsCollection
      .find({ isActive: true })
      .toArray();

    return groups;
  } catch (error) {
    console.error('Error getting active groups:', error);
    throw new Error(`Failed to get active groups: ${error.message}`);
  }
}

/**
 * Deactivate a group
 * @param {string} groupId - LINE group ID or user ID
 * @returns {Promise<void>}
 */
async function deactivateGroup(groupId) {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }

    const groupsCollection = db.collection('groups');
    await groupsCollection.updateOne(
      { groupId },
      { $set: { isActive: false } }
    );

    console.log(`Group deactivated: ${groupId}`);
  } catch (error) {
    console.error('Error deactivating group:', error);
    throw new Error(`Failed to deactivate group: ${error.message}`);
  }
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

module.exports = {
  connectDatabase,
  getGroupConfig,
  saveGroupConfig,
  incrementUsage,
  getGroupStats,
  checkUsageLimit,
  getAllActiveGroups,
  deactivateGroup,
  closeDatabase,
};
