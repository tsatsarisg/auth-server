import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENVS } from '../../config/env.js';

const ISS = 'auth-server';
const ALGORITHM = 'HS256' as const;

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(
      { ...payload, type: 'access', iss: ISS },
      { secret: ENVS.JWT_SECRET, expiresIn: '15m', algorithm: ALGORITHM },
    );
  }

  signRefreshToken(payload: Record<string, unknown>): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh', iss: ISS },
      { secret: ENVS.JWT_REFRESH_SECRET, expiresIn: '7d', algorithm: ALGORITHM },
    );
  }

  verifyAccessToken(token: string): Record<string, unknown> {
    return this.jwtService.verify(token, {
      secret: ENVS.JWT_SECRET,
      algorithms: [ALGORITHM],
    });
  }

  verifyRefreshToken(token: string): Record<string, unknown> {
    return this.jwtService.verify(token, {
      secret: ENVS.JWT_REFRESH_SECRET,
      algorithms: [ALGORITHM],
    });
  }
}
