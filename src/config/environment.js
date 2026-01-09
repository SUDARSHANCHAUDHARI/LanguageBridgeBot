/**
 * Environment configuration loader and validator
 * Loads environment variables and validates required ones exist
 */

require('dotenv').config();

/**
 * Required environment variables
 */
const REQUIRED_VARS = [
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LINE_CHANNEL_SECRET',
  'GOOGLE_TRANSLATE_API_KEY',
  'MONGODB_URI',
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_VARS = {
  PORT: 3000,
  NODE_ENV: 'development',
  CACHE_TTL: 3600,
  RATE_LIMIT_WINDOW: 60000,
  RATE_LIMIT_MAX_REQUESTS: 30,
};

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required variable is missing
 */
function validateEnvironment() {
  const missing = [];
  
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or set these variables.'
    );
  }
}

/**
 * Get environment configuration object
 * @returns {Object} Configuration object with all environment variables
 */
function getConfig() {
  // Validate required variables
  validateEnvironment();
  
  // Build config object
  const config = {
    // LINE Bot Configuration
    line: {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    },
    
    // Google Cloud Translation API
    google: {
      translateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
    },
    
    // MongoDB Configuration
    mongodb: {
      uri: process.env.MONGODB_URI,
    },
    
    // Server Configuration
    server: {
      port: parseInt(process.env.PORT || OPTIONAL_VARS.PORT, 10),
      nodeEnv: process.env.NODE_ENV || OPTIONAL_VARS.NODE_ENV,
    },
    
    // Cache Configuration
    cache: {
      ttl: parseInt(process.env.CACHE_TTL || OPTIONAL_VARS.CACHE_TTL, 10),
    },
    
    // Rate Limiting Configuration
    rateLimit: {
      window: parseInt(process.env.RATE_LIMIT_WINDOW || OPTIONAL_VARS.RATE_LIMIT_WINDOW, 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || OPTIONAL_VARS.RATE_LIMIT_MAX_REQUESTS, 10),
    },
  };
  
  // Add environment-specific settings
  if (config.server.nodeEnv === 'production') {
    // Production-specific settings
    config.server.logLevel = 'info';
  } else {
    // Development-specific settings
    config.server.logLevel = 'debug';
  }
  
  return config;
}

// Export configuration
const config = getConfig();

module.exports = config;
