import { Inject, Injectable } from '@nestjs/common';
import type UserRepository from '../domain/user.repository.interface';
import User from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository.interface';
import { randomUUID } from 'crypto';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/password.hasher.interface';
import Password from '../domain/password.vo';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async create(dto: RegisterDto): Promise<void> {
    const id = randomUUID();
    const passwordVo = Password.create(dto.password);
    const passwordHash = await this.hasher.hash(passwordVo.value);

    const user = new User(id, dto.email, passwordHash);
    return this.userRepository.create(user);
  }

  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return false;
    return this.hasher.compare(password, user.passwordHash);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    jti: string,
    expiresAt: Date,
  ): Promise<void> {
    const hash = await this.hasher.hash(refreshToken);
    return this.userRepository.storeRefreshToken(userId, {
      jti,
      hash,
      expiresAt,
    });
  }

  async validateRefreshToken(
    jti: string,
    refreshToken: string,
  ): Promise<{ valid: boolean; userId?: string }> {
    const stored = await this.userRepository.findRefreshTokenByJti(jti);
    if (!stored) return { valid: false };
    if (stored.revoked) return { valid: false };
    if (new Date(stored.expiresAt) < new Date()) return { valid: false };

    const matches = await this.hasher.compare(refreshToken, stored.hash);
    if (!matches) return { valid: false, userId: stored.userId };
    return { valid: true, userId: stored.userId };
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    return this.userRepository.revokeRefreshToken(jti);
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    return this.userRepository.revokeAllRefreshTokensForUser(userId);
  }
}
