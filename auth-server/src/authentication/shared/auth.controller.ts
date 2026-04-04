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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  RegisterSchema,
  type RegisterDto,
  LoginSchema,
  type LoginDto,
} from '../../identity/shared/dtos/register.dto.js';
import { RegisterUserCommand } from '../register/register-user.command.js';
import { LoginCommand } from '../login/login.command.js';
import { RefreshTokenCommand } from '../refresh/refresh-token.command.js';
import { LogoutCommand } from '../logout/logout.command.js';
import { dispatch } from '../../common/cqrs/dispatch.js';
import { unwrapOrThrow } from '../../common/errors/unwrap-or-throw.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterDto): Promise<{ message: string }> {
    return unwrapOrThrow(await dispatch(this.commandBus, new RegisterUserCommand(body.email, body.password)));
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user and receive tokens' })
  @ApiResponse({
    status: 201,
    description: 'Login successful. Access token in body, refresh token in HttpOnly cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = unwrapOrThrow(
      await dispatch(this.commandBus, new LoginCommand(body.email, body.password)),
    );
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate the refresh token and receive a new access token' })
  @ApiResponse({ status: 201, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Refresh token cookie missing' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) throw new BadRequestException('Refresh token is required');

    const { accessToken, refreshToken: newRefreshToken } = unwrapOrThrow(
      await dispatch(this.commandBus, new RefreshTokenCommand(refreshToken)),
    );
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  @ApiResponse({ status: 201, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response): Promise<{ message: string }> {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User not found in token');

    const result = unwrapOrThrow(await dispatch(this.commandBus, new LogoutCommand(userId)));

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/v1/auth',
    });

    return result;
  }
}
