import { type Result } from 'neverthrow';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { type AppError } from './app-error.js';

export function unwrapOrThrow<T>(result: Result<T, AppError>): T {
  if (result.isOk()) return result.value;

  const error = result.error;
  switch (error.code) {
    case 'NOT_FOUND':
      throw new NotFoundException(error.resource);
    case 'UNAUTHORIZED':
      throw new UnauthorizedException(error.reason);
    case 'CONFLICT':
      throw new ConflictException(error.resource);
    case 'BAD_REQUEST':
      throw new BadRequestException(error.message);
    case 'INTERNAL_ERROR':
      throw new InternalServerErrorException(error.message);
  }
}
