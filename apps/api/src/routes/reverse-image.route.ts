import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReverseImageService } from '../services/reverse-image.service';
import { logger } from '../logger';

const reverseImageRequestSchema = z.object({
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
  userConsent: z.boolean(),
});

type ReverseImageRequest = z.infer<typeof reverseImageRequestSchema>;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function reverseImageRoutes(fastify: FastifyInstance) {
  const reverseImageService = new ReverseImageService();

  fastify.post<{ Body: ReverseImageRequest }>('/v1/reverse-image', {
    schema: {
      body: {
        type: 'object',
        required: ['userConsent'],
        properties: {
          imageUrl: { type: 'string' },
          imageBase64: { type: 'string' },
          userConsent: { type: 'boolean' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Validate with Zod
        const validatedBody = reverseImageRequestSchema.parse(request.body);

        // Check user consent (REQUIRED for privacy)
        if (!validatedBody.userConsent) {
          reply.code(403);
          return {
            success: false,
            error: 'User consent required for external reverse image search',
          };
        }

        // Validate input
        if (!validatedBody.imageUrl && !validatedBody.imageBase64) {
          reply.code(400);
          return {
            success: false,
            error: 'Either imageUrl or imageBase64 must be provided',
          };
        }

        if (validatedBody.imageUrl && validatedBody.imageBase64) {
          reply.code(400);
          return {
            success: false,
            error: 'Provide either imageUrl or imageBase64, not both',
          };
        }

        // Check base64 size
        if (validatedBody.imageBase64) {
          const sizeBytes = Buffer.from(validatedBody.imageBase64, 'base64').length;
          if (sizeBytes > MAX_IMAGE_SIZE) {
            reply.code(413);
            return {
              success: false,
              error: 'Image size exceeds 10MB limit',
            };
          }
        }

        logger.info('Reverse image search request (with user consent)');

        let result;
        if (validatedBody.imageUrl) {
          result = await reverseImageService.searchImage(validatedBody.imageUrl);
        } else if (validatedBody.imageBase64) {
          result = await reverseImageService.searchImageBase64(validatedBody.imageBase64);
        }

        return {
          success: true,
          data: result,
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

        logger.error({ error }, 'Failed to perform reverse image search');
        reply.code(500);
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    },
  });
}
