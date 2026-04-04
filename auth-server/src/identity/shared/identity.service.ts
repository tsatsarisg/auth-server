import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from './ports/user.repository.js';
import { User } from './user.aggregate.js';
import { USER_REPOSITORY } from './ports/user.repository.js';
import { randomUUID } from 'crypto';
import { PASSWORD_HASHER, type PasswordHasher } from './ports/password-hasher.js';
import { Password } from './password.vo.js';
import { RegisterDto } from './dtos/register.dto.js';
import type { AuthUserPort } from '../../authentication/shared/ports/auth-user.port.js';

@Injectable()
export class UserService implements AuthUserPort {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async create(dto: RegisterDto): Promise<User> {
    const id = randomUUID();
    const passwordVo = Password.create(dto.password);
    const passwordHash = await this.hasher.hash(passwordVo.value);

    const user = User.register(id, dto.email, passwordHash);
    await this.userRepository.create(user);
    return user;
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    const id = randomUUID();
    const user = User.register(id, email, passwordHash);
    await this.userRepository.create(user);
    return user;
  }

  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return false;
    return this.hasher.compare(password, user.passwordHash);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
