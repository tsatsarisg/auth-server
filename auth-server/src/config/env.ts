import * as z from 'zod';

const envSchema = z
  .object({
    PORT: z.string().regex(/^\d+$/).transform(Number),
    DB_PROVIDER: z.enum(['postgres', 'mongo']).default('postgres'),
    MONGO_URI: z.string().min(1).optional(),
    POSTGRES_URI: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ENCRYPTION_KEY_BASE64: z.string().min(1),
    ALLOWED_ORIGINS: z.string().optional(),
    TRUST_PROXY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.DB_PROVIDER === 'postgres' && !data.POSTGRES_URI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'POSTGRES_URI is required when DB_PROVIDER is postgres',
        path: ['POSTGRES_URI'],
      });
    }
    if (data.DB_PROVIDER === 'mongo' && !data.MONGO_URI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MONGO_URI is required when DB_PROVIDER is mongo',
        path: ['MONGO_URI'],
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

const ENVS = parsedEnv.data;

export default ENVS;
