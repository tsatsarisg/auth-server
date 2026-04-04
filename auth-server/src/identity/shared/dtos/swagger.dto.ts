import { ApiProperty } from '@nestjs/swagger';

/**
 * Swagger documentation classes that mirror the Zod validation schemas.
 * These are used purely for OpenAPI spec generation; actual validation
 * is handled by ZodValidationPipe with RegisterSchema / LoginSchema.
 */

export class RegisterBodyDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    example: 'StrongP@ss1!',
    description: 'Password (10-128 characters)',
    minLength: 10,
    maxLength: 128,
  })
  password!: string;
}

export class LoginBodyDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    example: 'StrongP@ss1!',
    description: 'User password',
  })
  password!: string;
}

export class AccessTokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Result message' })
  message!: string;
}
