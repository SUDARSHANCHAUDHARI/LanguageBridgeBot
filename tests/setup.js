/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token';
process.env.LINE_CHANNEL_SECRET = 'test_secret';
process.env.GOOGLE_TRANSLATE_API_KEY = 'test_api_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.PORT = '3001';

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
