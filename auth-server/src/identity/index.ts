/**
 * Public surface of the Identity context. Other contexts may import only
 * from this file (enforced by the boundary rules in eslint.config.mjs).
 */
export { IdentityModule } from './identity.module.js';
export { UserService } from './shared/user.service.js';
export { RegisterUserCommand } from './register/register-user.command.js';
export { RegisterSchema, type RegisterDto } from './register/register.schema.js';
