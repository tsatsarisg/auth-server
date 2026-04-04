import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindUserByEmailQuery } from './find-user-by-email.query.js';
import { UserService } from '../shared/identity.service.js';
import type { User } from '../shared/user.aggregate.js';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailQuery> {
  constructor(private readonly userService: UserService) {}

  async execute(query: FindUserByEmailQuery): Promise<User | null> {
    return this.userService.findByEmail(query.email);
  }
}
