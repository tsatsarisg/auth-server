/**
 * Authentication's view of an account. Deliberately narrow: no aggregate,
 * no password hash — nothing crosses this boundary that token issuance
 * does not need.
 */
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthUserPort {
  /** Returns the account when the credentials match, null otherwise. */
  verifyCredentials(email: string, password: string): Promise<AuthUser | null>;
}

export const AUTH_USER_PORT = 'AUTH_USER_PORT';
