import { type User } from '../../user.aggregate.js';
import { type UserRepository, EmailAlreadyInUseError } from '../../ports/user.repository.js';

/**
 * In-memory adapter for tests and local experiments. Enforces email
 * uniqueness the same way the databases do: at write time.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly byEmail = new Map<string, User>();

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.byEmail.get(email) ?? null);
  }

  create(user: User): Promise<void> {
    if (this.byEmail.has(user.email)) {
      return Promise.reject(new EmailAlreadyInUseError());
    }
    this.byEmail.set(user.email, user);
    return Promise.resolve();
  }
}
