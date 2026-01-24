import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  ebay: z.object({
    appId: z.string().optional(),
    certId: z.string().optional(),
    devId: z.string().optional(),
  }),

  reverseImage: z.object({
    apiKey: z.string().optional(),
    provider: z.string().optional(),
  }),

  rateLimit: z.object({
    max: z.coerce.number().default(100),
    timeWindow: z.coerce.number().default(60000),
  }),

  cors: z.object({
    origin: z.string().default('*'),
  }),

  sentry: z.object({
    dsn: z.string().optional(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse({
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL,

  ebay: {
    appId: process.env.EBAY_APP_ID,
    certId: process.env.EBAY_CERT_ID,
    devId: process.env.EBAY_DEV_ID,
  },

  reverseImage: {
    apiKey: process.env.REVERSE_IMAGE_API_KEY,
    provider: process.env.REVERSE_IMAGE_PROVIDER,
  },

  rateLimit: {
    max: process.env.RATE_LIMIT_MAX,
    timeWindow: process.env.RATE_LIMIT_TIMEWINDOW,
  },

  cors: {
    origin: process.env.CORS_ORIGIN,
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
});
