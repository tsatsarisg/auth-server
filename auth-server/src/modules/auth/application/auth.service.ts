import { UserService } from 'src/modules/user/application/user.service';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/password.hasher.interface';
import { Inject } from '@nestjs/common';
import Password from '../domain/password.vo';
import { RegisterDto } from './dtos/register.dto';

export default class AuthService {
  constructor(
    private readonly userService: UserService,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.userService.findByEmail(email);
    if (!user) return false;
    return this.hasher.compare(password, user.passwordHash);
  }

  async register(dto: RegisterDto) {
    const passwordVo = Password.create(dto.password);

    const passwordHash = await this.hasher.hash(passwordVo.value);

    await this.userService.create(dto.email, passwordHash);
  }
}
