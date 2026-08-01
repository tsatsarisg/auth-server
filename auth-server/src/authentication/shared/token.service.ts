import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import { ENVS } from '../../config/env.js';

const ISS = 'auth-server';
const ALGORITHM = 'HS256' as const;

/** Single source of truth for token lifetimes: JWT exp, stored expiresAt, and cookie maxAge all derive from these. */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessTokenClaims {
  sub: string;
  email: string;
}

export interface RefreshTokenClaims {
  sub: string;
  jti: string;
  email: string;
}

const AccessTokenClaimsSchema = z.looseObject({
  sub: z.string(),
  email: z.string(),
  type: z.literal('access'),
});

const RefreshTokenClaimsSchema = z.looseObject({
  sub: z.string(),
  jti: z.string(),
  email: z.string(),
  type: z.literal('refresh'),
});

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(claims: AccessTokenClaims): string {
    return this.jwtService.sign(
      { ...claims, type: 'access', iss: ISS },
      { secret: ENVS.JWT_SECRET, expiresIn: ACCESS_TOKEN_TTL_MS / 1000, algorithm: ALGORITHM },
    );
  }

  signRefreshToken(claims: RefreshTokenClaims): string {
    return this.jwtService.sign(
      { ...claims, type: 'refresh', iss: ISS },
      { secret: ENVS.JWT_REFRESH_SECRET, expiresIn: REFRESH_TOKEN_TTL_MS / 1000, algorithm: ALGORITHM },
    );
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    const payload = this.jwtService.verify(token, {
      secret: ENVS.JWT_SECRET,
      algorithms: [ALGORITHM],
    });
    return AccessTokenClaimsSchema.parse(payload);
  }

  verifyRefreshToken(token: string): RefreshTokenClaims {
    const payload = this.jwtService.verify(token, {
      secret: ENVS.JWT_REFRESH_SECRET,
      algorithms: [ALGORITHM],
    });
    return RefreshTokenClaimsSchema.parse(payload);
  }
}
