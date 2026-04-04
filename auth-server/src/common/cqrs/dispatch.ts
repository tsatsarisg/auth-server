import { type CommandBus } from '@nestjs/cqrs';
import { type Result } from 'neverthrow';
import { type AppError } from '../errors/app-error.js';

// Phantom type — carries the handler's return type at compile time, zero runtime cost.
// Abstract class (not interface) so TypeScript embeds _result in the structural type
// and can infer TResult when dispatch() is called.
export abstract class TypedCommand<TResult> {
  declare readonly _result: TResult;
}

export function dispatch<TResult>(bus: CommandBus, command: TypedCommand<TResult>): Promise<Result<TResult, AppError>> {
  return bus.execute(command);
}
