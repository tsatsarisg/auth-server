import { type PipeTransform, type ArgumentMetadata, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodIssue } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const messages = result.error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }
    return result.data;
  }
}
