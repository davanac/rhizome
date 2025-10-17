import Fastify from 'fastify';
import cors from '@fastify/cors';

// Import routes
import authRoutes from '../../src/routes/auth.routes.js';
import profilesRoutes from '../../src/routes/profiles.routes.js';
import projectsRoutes from '../../src/routes/projects.routes.js';
import adminRoutes from '../../src/routes/admin.routes.js';
import blockchainRoutes from '../../src/routes/blockchain.routes.js';

/**
 * Create a Fastify app instance for testing
 * @param {object} options - Fastify options
 * @returns {Promise<Fastify>} Configured Fastify instance
 */
export async function createTestApp(options = {}) {
  const app = Fastify({
    logger: false, // Disable logging in tests
    ...options
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  // Register routes with /api prefix
  await app.register(async (fastify) => {
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(profilesRoutes, { prefix: '/profiles' });
    await fastify.register(projectsRoutes, { prefix: '/projects' });
    await fastify.register(adminRoutes, { prefix: '/admin' });
    await fastify.register(blockchainRoutes, { prefix: '/blockchain' });
  }, { prefix: '/api' });

  // Add health check endpoint
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    console.error('Test app error:', error);
    reply.status(500).send({
      success: false,
      message: error.message,
      errorCode: 'test-error'
    });
  });

  return app;
}

/**
 * Create authenticated request headers for testing
 * @param {string} token - JWT token
 * @returns {object} Headers object
 */
export function createAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Create a test app with all plugins loaded and ready for testing
 * @returns {Promise<Fastify>} Ready Fastify instance
 */
export async function createReadyTestApp() {
  const app = await createTestApp();
  await app.ready();
  return app;
}