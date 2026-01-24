import { FastifyInstance } from 'fastify';
import { SCORING_ENGINE_VERSION } from '@scamsight/shared';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      scoringEngineVersion: SCORING_ENGINE_VERSION,
    };
  });

  fastify.get('/health/ready', async (request, reply) => {
    // Check dependencies (database, external APIs, etc.)
    // For now, simple check
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  });
}
