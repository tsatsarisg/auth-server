import { type User } from '../../../identity/shared/user.aggregate.js';

export interface AuthUserPort {
  findByEmail(email: string): Promise<User | null>;
  create(email: string, password: string): Promise<User>;
  validateUser(email: string, password: string): Promise<boolean>;
}

export const AUTH_USER_PORT = 'AUTH_USER_PORT';
