/**
 * Integration tests for database service
 * Note: These tests require a test MongoDB instance
 */

const {
  connectDatabase,
  getGroupConfig,
  saveGroupConfig,
  incrementUsage,
  getGroupStats,
  closeDatabase,
} = require('../../src/services/databaseService');

describe('Database Integration', () => {
  const testGroupId = `test_${Date.now()}`;

  beforeAll(async () => {
    // Skip if no test database configured
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('test')) {
      await connectDatabase();
    }
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should save and retrieve group config', async () => {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.includes('test')) {
      console.log('Skipping database test - no test database configured');
      return;
    }

    const languages = ['en', 'th'];
    await saveGroupConfig(testGroupId, languages, {
      groupName: 'Test Group',
    });

    const config = await getGroupConfig(testGroupId);
    expect(config).toBeTruthy();
    expect(config.languages).toEqual(languages);
  });

  it('should increment usage statistics', async () => {
    if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.includes('test')) {
      return;
    }

    await incrementUsage(testGroupId, 100);
    const stats = await getGroupStats(testGroupId);
    expect(stats.messageCount).toBeGreaterThan(0);
  });
});
