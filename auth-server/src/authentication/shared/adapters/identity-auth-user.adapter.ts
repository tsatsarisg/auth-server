import { Injectable } from '@nestjs/common';
import { type AuthUser, type AuthUserPort } from '../ports/auth-user.port.js';
import { UserService } from '../../../identity/index.js';

/**
 * Translates Identity's User aggregate into Authentication's AuthUser at the
 * context boundary, so no domain model crosses between contexts.
 */
@Injectable()
export class IdentityAuthUserAdapter implements AuthUserPort {
  constructor(private readonly users: UserService) {}

  async verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.users.verifyCredentials(email, password);
    return user ? { id: user.id, email: user.email } : null;
  }
}
