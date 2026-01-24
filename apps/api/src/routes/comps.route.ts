import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EbayService } from '../services/ebay.service';
import { logger } from '../logger';

const compsRequestSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.string().optional(),
  listingPrice: z.number().optional(),
});

type CompsRequest = z.infer<typeof compsRequestSchema>;

export async function compsRoutes(fastify: FastifyInstance) {
  const ebayService = new EbayService();

  fastify.post<{ Body: CompsRequest }>('/v1/comps', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 200 },
          category: { type: 'string' },
          listingPrice: { type: 'number' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Validate with Zod
        const validatedBody = compsRequestSchema.parse(request.body);

        logger.info({ query: validatedBody.query }, 'Market comps request');

        const result = await ebayService.getMarketComps(
          validatedBody.query,
          validatedBody.category
        );

        // Calculate price deviation if listing price provided
        let priceDeviation: number | undefined;
        if (validatedBody.listingPrice && result.averagePrice) {
          priceDeviation =
            ((validatedBody.listingPrice - result.averagePrice) / result.averagePrice) * 100;
        }

        return {
          success: true,
          data: {
            ...result,
            priceDeviation,
            provider: 'ebay',
          },
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

        logger.error({ error }, 'Failed to fetch market comps');
        reply.code(500);
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    },
  });
}
