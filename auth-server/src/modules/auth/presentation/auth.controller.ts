import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Req,
  UseGuards,
} from '@nestjs/common';
import AuthService from '../application/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
