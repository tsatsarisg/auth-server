import * as z from 'zod';

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number),
  MONGO_URI: z.string().min(1),
  POSTGRES_URI: z.string().min(1),
  JWT_SECRET: z.string().min(8),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

const ENVS = parsedEnv.data;

export default ENVS;
