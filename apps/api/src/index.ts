import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './logger';
import { healthRoutes } from './routes/health.route';
import { compsRoutes } from './routes/comps.route';
import { reverseImageRoutes } from './routes/reverse-image.route';
import { unfurlRoutes } from './routes/unfurl.route';

async function main() {
  const fastify = Fastify({
    logger: logger as any,
    bodyLimit: 15 * 1024 * 1024, // 15MB for images
  });

  // Register CORS
  await fastify.register(cors, {
    origin: config.cors.origin === '*' ? true : config.cors.origin,
    credentials: true,
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    errorResponseBuilder: (_request, context) => {
      return {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: context.after,
      };
    },
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(compsRoutes);
  await fastify.register(reverseImageRoutes);
  await fastify.register(unfurlRoutes);

  // 404 handler
  fastify.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
    });
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error({ error, request: request.url }, 'Request error');

    reply.code(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Internal server error',
    });
  });

  // Start server
  try {
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`🚀 ScamSight API running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`eBay API: ${config.ebay.appId ? 'Configured' : 'Not configured (comps disabled)'}`);
    logger.info(
      `Reverse Image: ${config.reverseImage.apiKey ? 'Configured' : 'Not configured (disabled)'}`
    );
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

main();
