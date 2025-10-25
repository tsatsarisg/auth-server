import { Inject, Injectable } from '@nestjs/common';
import type UserRepository from '../domain/user.repository.interface';
import User from '../domain/user.entity';
import { USER_REPOSITORY } from '../domain/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
  ) {}

  createUser(email: string, passwordHash: string): Promise<void> {
    const id = ''; // ID generation logic can be added here
    const user = new User(id, email, passwordHash);
    return this.userRepository.create(user);
  }
}
