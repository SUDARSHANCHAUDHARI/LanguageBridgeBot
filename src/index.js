/**
 * Main entry point for LanguageBridgeBot
 * Express server with LINE webhook integration
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/environment');
const { handleWebhook } = require('./bot/webhook');
const { connectDatabase, closeDatabase, getAllActiveGroups } = require('./services/databaseService');
const { requestLogger, logErrorWithContext } = require('./middleware/logger');
const { validateLineSignature, groupRateLimiter, rateLimiter } = require('./middleware/security');
const { checkHealth, getSystemMetrics } = require('./services/monitoringService');
const { getAnalytics } = require('./services/analyticsService');

// Initialize Express app
const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

// Security middleware - Helmet with custom configuration
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for LINE webhooks
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins (LINE webhooks come from LINE servers)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Line-Signature'],
}));

// Request logging middleware (before other middleware)
app.use(requestLogger);

// Stripe webhook endpoint (for premium subscriptions)
// Mounted before express.json(): constructEvent needs the raw, unparsed body
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { handleWebhookEvent, verifyWebhookSignature } = require('./services/paymentService');
    const signature = req.headers['stripe-signature'];
    const event = verifyWebhookSignature(req.body, signature);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Body parser for JSON (LINE webhook sends JSON)
app.use(express.json({
  verify: (req, res, buf) => {
    // Store raw body for LINE signature validation
    req.rawBody = buf.toString('utf8');
  },
}));

// Health check endpoint (no rate limiting or signature validation)
app.get('/health', async (req, res) => {
  try {
    const health = await checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Admin stats endpoint (token-protected, rate limited)
app.get('/admin/stats', rateLimiter, async (req, res) => {
  try {
    // Fail closed: require a configured admin token AND a matching header.
    // (Previously the check was skipped entirely when ADMIN_TOKEN was unset,
    // leaving this endpoint fully public and leaking group data + metrics.)
    const adminToken = req.headers['x-admin-token'];
    if (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analytics = await getAnalytics();
    const systemMetrics = getSystemMetrics();
    const activeGroups = await getAllActiveGroups();
    const health = await checkHealth();

    res.json({
      analytics,
      system: systemMetrics,
      groups: {
        active: activeGroups.length,
        list: activeGroups.map(g => ({
          groupId: g.groupId,
          groupName: g.groupName,
          languages: g.languages,
          isPremium: g.isPremium,
          messageCount: g.messageCount,
        })),
      },
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Swagger API documentation
const { setupSwagger } = require('./swagger');
setupSwagger(app);

// Dashboard routes
const dashboardRouter = require('./dashboard/index');
const analyticsRouter = require('./dashboard/analytics');
app.use('/dashboard', dashboardRouter);
app.use('/dashboard/analytics', analyticsRouter);

// LINE webhook endpoint with security middleware
app.post('/webhook',
  rateLimiter,              // IP-based rate limiting
  validateLineSignature,     // LINE signature validation
  groupRateLimiter,          // Group-based rate limiting
  async (req, res) => {
    try {
      await handleWebhook(req, res);
    } catch (error) {
      logErrorWithContext(error, req);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  logErrorWithContext(err, req);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined,
    requestId: req.requestId,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = config.server.port;

// Initialize database connection and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 LanguageBridgeBot server running on port ${PORT}`);
      console.log(`📡 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📨 Webhook endpoint: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  try {
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
