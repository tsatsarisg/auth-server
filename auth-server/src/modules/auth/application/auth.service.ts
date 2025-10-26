import { UserService } from 'src/modules/user/application/user.service';
import { JwtService } from '@nestjs/jwt';
import { err, ok, Result } from 'neverthrow';
import { randomUUID } from 'crypto';

type TokenPair = { accessToken: string; refreshToken: string };
type AuthError =
  | { type: 'user_not_found' }
  | { type: 'missing_password' }
  | { type: 'invalid_credentials' }
  | { type: 'internal'; message?: string };

export default class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<Result<TokenPair, AuthError>> {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) return err({ type: 'user_not_found' });

      const valid = await this.userService.validateUser(email, password);
      if (!valid) return err({ type: 'invalid_credentials' });

      const payload = { sub: user.id, email: user.email };

      let accessToken: string;
      let refreshToken: string;
      try {
        accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const jti = randomUUID();
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        refreshToken = this.jwtService.sign(
          { sub: user.id, jti },
          { expiresIn: '7d' },
        );
        await this.userService.storeRefreshToken(
          user.id,
          refreshToken,
          jti,
          refreshExpiresAt,
        );
      } catch (e: any) {
        return err({ type: 'internal', message: e?.message });
      }

      return ok({ accessToken, refreshToken });
    } catch (e: any) {
      return err({ type: 'internal', message: e?.message });
    }
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<Result<TokenPair, AuthError>> {
    try {
      let payload: any;
      try {
        payload = this.jwtService.verify(rawRefreshToken);
      } catch (e: any) {
        return err({ type: 'invalid_credentials' });
      }

      const { jti, sub: userId } = payload;
      if (!jti || !userId) return err({ type: 'invalid_credentials' });

      const { valid, userId: storedUserId } =
        await this.userService.validateRefreshToken(jti, rawRefreshToken);

      if (!valid) {
        if (storedUserId) {
          await this.userService.revokeAllRefreshTokensForUser(storedUserId);
        }
        return err({ type: 'invalid_credentials' });
      }

      await this.userService.revokeRefreshToken(jti);

      const newJti = randomUUID();
      const newAccessToken = this.jwtService.sign(
        { sub: userId, email: payload.email },
        { expiresIn: '15m' },
      );
      const newRefreshExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );
      const newRefreshToken = this.jwtService.sign(
        { sub: userId, jti: newJti },
        { expiresIn: '7d' },
      );
      await this.userService.storeRefreshToken(
        userId,
        newRefreshToken,
        newJti,
        newRefreshExpiresAt,
      );

      return ok({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (e: any) {
      return err({ type: 'internal', message: e?.message });
    }
  }

  async logout(userId: string): Promise<Result<void, AuthError>> {
    try {
      await this.userService.revokeAllRefreshTokensForUser(userId);
      return ok(undefined);
    } catch (e: any) {
      return err({ type: 'internal', message: e?.message });
    }
  }
}
