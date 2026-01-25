import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UnfurlService } from '../services/unfurl.service';
import { logger } from '../logger';

const unfurlRequestSchema = z.object({
  url: z.string().url().max(2000),
});

type UnfurlRequest = z.infer<typeof unfurlRequestSchema>;

export async function unfurlRoutes(fastify: FastifyInstance) {
  const unfurlService = new UnfurlService();

  fastify.post<{ Body: UnfurlRequest }>('/v1/unfurl', {
    schema: {
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri', maxLength: 2000 },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const validatedBody = unfurlRequestSchema.parse(request.body);

        logger.info({ url: validatedBody.url }, 'Unfurl request');

        const result = await unfurlService.unfurl(validatedBody.url);

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400);
          return {
            success: false,
            error: 'Validation failed',
            details: error.errors,
          };
        }

        logger.error({ error }, 'Unfurl request failed');
        reply.code(500);
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    },
  });
}
