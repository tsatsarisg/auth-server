import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email({ message: 'Invalid email' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .max(128, { message: 'Password must be at most 128 characters' }),
});

export type LoginDto = z.infer<typeof LoginSchema>;
