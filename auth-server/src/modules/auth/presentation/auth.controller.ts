import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ConflictException,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthService } from '../application/auth.service';
import { AUTH_USER_PORT, type AuthUserPort } from '../domain/auth-user.port';
import { UserService } from '../../user/application/user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  RegisterSchema,
  type RegisterDto,
  LoginSchema,
  type LoginDto,
} from '../../user/application/dtos/register.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @Inject(AUTH_USER_PORT) private readonly userPort: AuthUserPort,
    @InjectPinoLogger(AuthController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterDto): Promise<{ message: string }> {
    const { email, password } = body;

    const existingUser = await this.userPort.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      await this.userService.create({ email, password });
      this.logger.info({ event: 'registration', email });
      return { message: 'User registered successfully' };
    } catch {
      throw new BadRequestException('Failed to register user');
    }
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const { email, password } = body;

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

    const { accessToken, refreshToken } = result.value;
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

    return { accessToken };
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const result = await this.authService.refresh(refreshToken);

    if (result.isErr()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = result.value;
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User not found in token');
    }

    const result = await this.authService.logout(userId);

    if (result.isErr()) {
      throw new UnauthorizedException('Logout failed');
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth',
    });

    return { message: 'Logged out successfully' };
  }
}
