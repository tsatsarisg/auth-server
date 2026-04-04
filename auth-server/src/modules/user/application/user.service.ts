import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository.interface';
import { User } from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository.interface';
import { randomUUID } from 'crypto';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/password.hasher.interface';
import { Password } from '../domain/password.vo';
import { RegisterDto } from './dtos/register.dto';
import type { AuthUserPort } from '../../auth/domain/auth-user.port';

@Injectable()
export class UserService implements AuthUserPort {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
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
