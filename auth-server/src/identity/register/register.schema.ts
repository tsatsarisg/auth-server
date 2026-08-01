import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email({ message: 'Invalid email' }),
  password: z
    .string()
    .min(10, { message: 'Password must be at least 10 characters' })
    .max(128, { message: 'Password must be at most 128 characters' }),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
