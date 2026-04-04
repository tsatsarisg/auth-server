export type AppError =
  | { code: 'NOT_FOUND'; resource?: string }
  | { code: 'UNAUTHORIZED'; reason?: string }
  | { code: 'CONFLICT'; resource?: string }
  | { code: 'BAD_REQUEST'; message?: string }
  | { code: 'INTERNAL_ERROR'; message?: string };
