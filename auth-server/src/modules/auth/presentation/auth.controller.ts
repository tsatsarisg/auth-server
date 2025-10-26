import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Req,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import AuthService from '../application/auth.service';
import { UserService } from '../../user/application/user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string },
  ): Promise<{ message: string }> {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      await this.userService.create({ email, password });
      return { message: 'User registered successfully' };
    } catch (e: any) {
      throw new BadRequestException('Failed to register user');
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = body;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const result = await this.authService.login(email, password);

    if (result.isErr()) {
      const error = result.error;
      if (
        error.type === 'user_not_found' ||
        error.type === 'invalid_credentials'
      ) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw new UnauthorizedException('Login failed');
    }

    return result.value;
  }

  @Post('refresh')
  async refresh(
    @Body() body: { refreshToken: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = body;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const result = await this.authService.refresh(refreshToken);

    if (result.isErr()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return result.value;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any): Promise<{ message: string }> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found in token');
    }

    const result = await this.authService.logout(userId);

    if (result.isErr()) {
      throw new UnauthorizedException('Logout failed');
    }

    return { message: 'Logged out successfully' };
  }
}
