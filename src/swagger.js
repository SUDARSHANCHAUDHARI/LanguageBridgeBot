/**
 * Swagger/OpenAPI Documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LanguageBridgeBot API',
      version: '1.0.0',
      description: 'RESTful API for LanguageBridgeBot - LINE translation bot with 35 languages support',
      contact: {
        name: 'LanguageBridgeBot Support',
        email: 'support@languagebridgebot.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Dashboard',
        description: 'Dashboard and statistics endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and insights endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
    ],
  },
  apis: ['./src/index.js', './src/dashboard/*.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

/**
 * Swagger UI setup
 * @param {Express} app - Express app instance
 */
function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LanguageBridgeBot API Documentation',
  }));

  // JSON endpoint for OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

module.exports = {
  setupSwagger,
  specs,
};
