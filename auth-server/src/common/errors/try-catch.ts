import { err, type Result } from 'neverthrow';
import { type AppError } from './app-error.js';

export function toAppError(e: unknown): AppError {
  const message = e instanceof Error ? e.message : undefined;
  return { code: 'INTERNAL_ERROR', message };
}

/**
 * Runs a use-case body, converting unexpected throws into the Result channel
 * so no infrastructure error can escape a handler as an unhandled exception.
 * `mapKnown` translates expected infrastructure errors (e.g. unique-constraint
 * violations) into a specific AppError before the INTERNAL_ERROR fallback.
 */
export async function tryCatch<T>(
  fn: () => Promise<Result<T, AppError>>,
  mapKnown: (e: unknown) => AppError | null = () => null,
): Promise<Result<T, AppError>> {
  try {
    return await fn();
  } catch (e) {
    return err(mapKnown(e) ?? toAppError(e));
  }
}
