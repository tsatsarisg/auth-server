import { Inject, Injectable } from '@nestjs/common';
import type UserRepository from '../domain/user.repository.interface';
import User from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
  ) {}

  create(email: string, passwordHash: string): Promise<void> {
    const id = randomUUID();
    const user = new User(id, email, passwordHash);
    return this.userRepository.create(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
