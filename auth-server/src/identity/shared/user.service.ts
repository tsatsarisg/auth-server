import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { USER_REPOSITORY, type UserRepository } from './ports/user.repository.js';
import { User } from './user.aggregate.js';
import { PASSWORD_HASHER, type PasswordHasher } from './ports/password-hasher.js';
import { Password } from './password.vo.js';
import { Email } from './email.vo.js';

@Injectable()
export class UserService {
  private dummyHash?: Promise<string>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async create(email: string, password: string): Promise<User> {
    const passwordVo = Password.create(password);
    const passwordHash = await this.hasher.hash(passwordVo.value);
    const user = User.register(randomUUID(), email, passwordHash);
    await this.userRepository.create(user);
    return user;
  }

  /**
   * Returns the user when the credentials match, null otherwise. Unknown
   * emails still pay a full hash comparison so response timing does not
   * reveal whether an address is registered.
   */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(Email.normalize(email));
    if (!user) {
      await this.hasher.compare(password, await this.getDummyHash());
      return null;
    }
    const valid = await this.hasher.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash('timing-equalization-dummy');
    return this.dummyHash;
  }
}
