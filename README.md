# Auth Server

**Production-reference authentication server built with NestJS, TypeScript, and clean architecture.**

> **License: Source Available -- View Only.**
> This project is proprietary. You may view the source code for reference purposes only.
> See [LICENSE](./LICENSE) for full terms.

---

## Overview

Auth Server is a production-grade authentication service demonstrating clean architecture, CQRS, and domain-driven design principles in a NestJS application. It implements JWT-based authentication with refresh token rotation, multi-database support, and defense-in-depth security practices.

The architecture follows a vertical slice approach inspired by Greg Young's CQRS and domain modeling patterns. Each use case (register, login, refresh, logout) is an isolated vertical slice with its own command, handler, and domain events. Cross-cutting concerns like encryption, persistence, and logging are separated through ports and adapters, keeping the domain logic free of infrastructure dependencies.

The codebase is organized into two bounded contexts -- **Identity** (user management, password hashing, persistence) and **Authentication** (token issuance, rotation, revocation, session lifecycle). Communication between contexts flows through well-defined ports, making each context independently testable and replaceable.

---

## Architecture

### Vertical Slice Organization

Each feature is a self-contained slice with its own command/query, handler, and domain events. Shared infrastructure (controllers, services, adapters) lives in a `shared/` directory within each bounded context.

### Bounded Contexts

- **Identity** -- Owns the user aggregate, email/password value objects, password hashing strategy, and user persistence.
- **Authentication** -- Owns token issuance, refresh token rotation, reuse detection, logout, and scheduled cleanup.

### Patterns

- **CQRS** -- Commands mutate state (register, login, refresh, logout); queries read state (find user by email). Dispatched via NestJS `CommandBus` and `QueryBus`.
- **Ports and Adapters** -- Domain logic depends on port interfaces (`UserRepository`, `PasswordHasher`, `RefreshTokenRepository`). Concrete adapters (Postgres, MongoDB) are injected at the module level.
- **Domain Events** -- Each use case emits domain events (`UserRegistered`, `LoginSucceeded`, `RefreshTokenReused`, `UserLoggedOut`) consumed by audit handlers for structured logging.
- **Result Type** -- Business operations return `Result<T, E>` (via neverthrow) instead of throwing exceptions, keeping error handling explicit in the domain layer.

### Directory Structure

```
auth-server/
  src/
    authentication/
      login/               # LoginCommand, handler, domain events
      logout/              # LogoutCommand, handler, domain events
      refresh/             # RefreshTokenCommand, handler, reuse detection
      register/            # RegisterUserCommand, handler, domain events
      shared/
        adapters/          # Postgres + MongoDB refresh token repositories
        guards/            # JWT auth guard
        ports/             # RefreshTokenRepository, AuthUserPort interfaces
        auth.controller.ts # HTTP layer (all auth endpoints)
        auth.service.ts    # Token signing, verification, rotation logic
        token-cleanup.service.ts  # Scheduled purge of expired tokens
        token-hasher.ts    # SHA-256 token hashing for storage
      authentication.module.ts
    identity/
      find-user-by-email/  # Query + handler
      shared/
        adapters/          # Postgres + MongoDB user repositories, mappers
        dtos/              # Zod schemas + Swagger DTOs
        ports/             # UserRepository, PasswordHasher interfaces
        email.vo.ts        # Email value object
        password.vo.ts     # Password value object
        user.aggregate.ts  # User aggregate root
        identity.service.ts
      identity.module.ts
    common/
      pipes/               # ZodValidationPipe
    config/
      env.ts               # Zod-validated environment variables
    database/
      database.module.ts   # MongoDB (Mongoose) provider
      drizzle.module.ts    # PostgreSQL (Drizzle) provider
      drizzle.provider.ts
    encryption/
      encryptor.ts         # AES-256-GCM encrypt/decrypt
      encryption.module.ts
    health/
      health.controller.ts # /health with DB connectivity check
      health.module.ts
    app.module.ts
    main.ts
```

---

## Features

- JWT authentication with access tokens (15 min) and refresh token rotation (7 day)
- Refresh token reuse detection -- revokes all sessions on replay attack
- Multi-database support: PostgreSQL (Drizzle ORM) and MongoDB (Mongoose), switchable via environment variable
- AES-256-GCM encryption at rest for stored password hashes
- Scrypt password hashing with versioned cost parameters and timing-safe comparison
- Per-endpoint rate limiting (e.g., 3 req/min for registration, 5 for login)
- HttpOnly, Secure, SameSite=Strict cookie-based refresh tokens
- Audit logging via domain events (register, login, refresh reuse, logout)
- Health check endpoint with database connectivity verification
- OpenAPI / Swagger documentation at `/docs`
- Scheduled token cleanup (daily purge of expired and revoked tokens)
- Correlation IDs via `X-Request-Id` header propagation (Pino)
- Helmet security headers
- Configurable CORS with origin allowlist
- Zod schema validation at the HTTP boundary
- Docker support with dev and production multi-stage builds
- Request body size limit (16 KB) to mitigate hash-DoS attacks
- Trust proxy configuration for deployment behind reverse proxies

---

## Tech Stack

| Category        | Technology                             |
| --------------- | -------------------------------------- |
| Runtime         | Node.js 22 LTS                         |
| Framework       | NestJS 11                              |
| Language        | TypeScript 5.7+ (strict mode)          |
| Databases       | PostgreSQL 17, MongoDB 8               |
| ORM             | Drizzle ORM (Postgres), Mongoose (MongoDB) |
| Auth            | JWT with HS256, separate signing keys  |
| Validation      | Zod                                    |
| Logging         | Pino (structured JSON, pino-pretty dev)|
| API Docs        | Swagger / OpenAPI 3.0                  |
| Containers      | Docker, Docker Compose                 |
| Package Manager | pnpm 10                                |
| Linting         | ESLint 10 (flat config), Prettier      |
| Testing         | Jest, Supertest                        |

---

## Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- pnpm 10+
- Docker and Docker Compose

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd auth-server
   ```

2. **Configure environment variables**

   ```bash
   cp infra/envs/.env.dev.example infra/envs/.env.dev
   ```

   Edit `infra/envs/.env.dev` and fill in your secrets. At minimum, generate the required keys:

   ```bash
   # Generate JWT secrets (32+ characters each)
   openssl rand -hex 32

   # Generate AES-256 encryption key (exactly 32 bytes, base64-encoded)
   openssl rand -base64 32
   ```

3. **Start infrastructure**

   ```bash
   docker compose -f infra/docker/docker-compose.dev.yml up -d mongo postgres
   ```

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Run database migrations** (PostgreSQL only)

   ```bash
   pnpm --filter auth-server run db:migrate
   ```

6. **Start the development server**

   ```bash
   pnpm --filter auth-server run start:dev
   ```

7. **Verify**

   - Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)
   - Health check: [http://localhost:3000/health](http://localhost:3000/health)

### Full-Stack Dev (Docker)

To run everything in Docker (databases + application with hot reload):

```bash
docker compose -f infra/docker/docker-compose.dev.yml up
```

---

## Docker

### Development

```bash
docker compose -f infra/docker/docker-compose.dev.yml up
```

Includes hot reload via volume mounts. Application runs on port 3000.

### Production

With PostgreSQL:

```bash
docker compose -f infra/docker/docker-compose.prod.yml --profile postgres up -d
```

With MongoDB:

```bash
docker compose -f infra/docker/docker-compose.prod.yml --profile mongo up -d
```

Production builds use multi-stage Dockerfiles for minimal image size.

---

## API Endpoints

| Method | Endpoint               | Description                          | Auth Required |
| ------ | ---------------------- | ------------------------------------ | ------------- |
| POST   | `/api/v1/auth/register`| Register a new user                  | No            |
| POST   | `/api/v1/auth/login`   | Authenticate and receive tokens      | No            |
| POST   | `/api/v1/auth/refresh` | Rotate refresh token, get new access | Cookie        |
| POST   | `/api/v1/auth/logout`  | Revoke all refresh tokens            | Bearer token  |
| GET    | `/health`              | Health check with DB status          | No            |
| GET    | `/docs`                | Swagger UI                           | No            |

---

## Project Scripts

All scripts are scoped to the `auth-server` workspace. Run with `pnpm --filter auth-server run <script>`.

| Script           | Description                              |
| ---------------- | ---------------------------------------- |
| `start:dev`      | Start with hot reload (watch mode)       |
| `start:debug`    | Start with debugger attached             |
| `start:prod`     | Run compiled production build            |
| `build`          | Compile TypeScript to `dist/`            |
| `lint`           | Run ESLint                               |
| `lint:fix`       | Run ESLint with auto-fix                 |
| `format`         | Format code with Prettier                |
| `format:check`   | Check formatting without writing         |
| `typecheck`      | Run TypeScript type checking             |
| `test`           | Run unit tests                           |
| `test:watch`     | Run tests in watch mode                  |
| `test:cov`       | Run tests with coverage report           |
| `test:e2e`       | Run end-to-end tests                     |
| `db:generate`    | Generate Drizzle migration files         |
| `db:migrate`     | Run Drizzle migrations                   |
| `db:push`        | Push schema changes directly (dev only)  |
| `db:studio`      | Open Drizzle Studio GUI                  |
| `audit`          | Run security audit on dependencies       |
| `deps:check`     | Check for outdated dependencies          |

Root-level convenience scripts:

| Script      | Description                                  |
| ----------- | -------------------------------------------- |
| `dev`       | Start full dev stack via Docker Compose       |
| `dev:down`  | Tear down dev Docker Compose stack            |

---

## Environment Variables

| Variable               | Description                                          | Required                    |
| ---------------------- | ---------------------------------------------------- | --------------------------- |
| `PORT`                 | Server port                                          | Yes                         |
| `NODE_ENV`             | Environment (`development`, `production`)             | Yes                         |
| `DB_PROVIDER`          | Database backend (`postgres` or `mongo`)              | Yes (default: `postgres`)   |
| `POSTGRES_URI`         | PostgreSQL connection string                          | When `DB_PROVIDER=postgres` |
| `MONGO_URI`            | MongoDB connection string                             | When `DB_PROVIDER=mongo`    |
| `JWT_SECRET`           | Access token signing key (min 32 characters)          | Yes                         |
| `JWT_REFRESH_SECRET`   | Refresh token signing key (min 32 characters)         | Yes                         |
| `ENCRYPTION_KEY_BASE64`| AES-256 key for encryption at rest (base64, 32 bytes) | Yes                         |
| `ALLOWED_ORIGINS`      | Comma-separated CORS origins                          | No                          |
| `TRUST_PROXY`          | Proxy hop count or trusted IPs for `X-Forwarded-*`    | No                          |

---

## License

This project is **proprietary and source-available for viewing purposes only**. You may not use, copy, modify, or distribute the code. See the [LICENSE](./LICENSE) file for full terms.

Copyright (c) 2025-present George. All rights reserved.
