import { type User } from '../user.aggregate.js';

/**
 * Thrown by create() when the email unique constraint is violated.
 * The database constraint — not a pre-insert existence check — is the
 * authoritative uniqueness guarantee under concurrent registrations.
 */
export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Email already in use');
    this.name = 'EmailAlreadyInUseError';
  }
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
