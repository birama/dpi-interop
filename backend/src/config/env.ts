import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters (64+ hex recommended)')
    .refine(
      (s) => s !== 'ChangeMe_Random_64_Chars_Here_For_Production' && !s.includes('CHANGEZ_MOI'),
      { message: 'JWT_SECRET must not be a placeholder value. Generate a strong secret with: openssl rand -hex 64' },
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIMEWINDOW: z.coerce.number().default(60000),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
