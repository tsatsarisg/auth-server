import { ok, err } from 'neverthrow';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { unwrapOrThrow } from './unwrap-or-throw.js';
import { type AppError } from './app-error.js';

describe('unwrapOrThrow', () => {
  it('returns the value of an ok result', () => {
    expect(unwrapOrThrow(ok({ accessToken: 'abc' }))).toEqual({ accessToken: 'abc' });
  });

  it.each<[AppError, new (...args: never[]) => Error]>([
    [{ code: 'NOT_FOUND', resource: 'user' }, NotFoundException],
    [{ code: 'UNAUTHORIZED', reason: 'token_reuse' }, UnauthorizedException],
    [{ code: 'CONFLICT', resource: 'user' }, ConflictException],
    [{ code: 'BAD_REQUEST', message: 'bad input' }, BadRequestException],
    [{ code: 'INTERNAL_ERROR', message: 'boom' }, InternalServerErrorException],
  ])('maps %o to the matching HTTP exception', (error, exception) => {
    expect(() => unwrapOrThrow(err(error))).toThrow(exception);
  });
});
