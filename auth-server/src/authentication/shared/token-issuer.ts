import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TokenService, REFRESH_TOKEN_TTL_MS } from './token.service.js';
import { REFRESH_TOKEN_REPOSITORY, type RefreshTokenRepository } from './ports/refresh-token.repository.js';
import { hashToken } from './token-hasher.js';

export type TokenPair = { accessToken: string; refreshToken: string };

@Injectable()
export class TokenIssuer {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  /** Signs an access/refresh pair and stores the refresh token's hash for rotation. */
  async issueTokenPair(userId: string, email: string): Promise<TokenPair> {
    const jti = randomUUID();
    const accessToken = this.tokenService.signAccessToken({ sub: userId, email });
    const refreshToken = this.tokenService.signRefreshToken({ sub: userId, jti, email });
    await this.refreshTokenRepo.store(userId, {
      jti,
      hash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    return { accessToken, refreshToken };
  }
}
