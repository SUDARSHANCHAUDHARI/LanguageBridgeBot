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
  const shouldRunDatabaseTests = process.env.RUN_DATABASE_TESTS === 'true';
  const testGroupId = `test_${Date.now()}`;

  beforeAll(async () => {
    if (shouldRunDatabaseTests) {
      await connectDatabase();
    }
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should save and retrieve group config', async () => {
    if (!shouldRunDatabaseTests) {
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
    if (!shouldRunDatabaseTests) {
      return;
    }

    await incrementUsage(testGroupId, 100);
    const stats = await getGroupStats(testGroupId);
    expect(stats.messageCount).toBeGreaterThan(0);
  });
});
