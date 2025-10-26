# Auth Server

A NestJS authentication server with JWT, refresh tokens, MongoDB, and clean architecture.

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd auth-server
pnpm install

# Set environment variables
cp infra/envs/.env.dev .env

# Start with Docker Compose
docker-compose -f infra/docker/docker-compose.dev.yml up

# Or manually (requires local MongoDB)
pnpm --filter auth-server start:dev
```

Server runs on **http://localhost:3000**

## Prerequisites

- Node.js v20+
- pnpm v9+
- Docker & Docker Compose (optional)
- MongoDB running locally or via Docker

## API Endpoints

### Authentication

| Method | Endpoint         | Body                | Description                 |
| ------ | ---------------- | ------------------- | --------------------------- |
| POST   | `/auth/register` | `{email, password}` | Create new user             |
| POST   | `/auth/login`    | `{email, password}` | Get access & refresh tokens |
| POST   | `/auth/refresh`  | `{refreshToken}`    | Get new token pair          |
| POST   | `/auth/logout`   | Bearer token        | Revoke all refresh tokens   |

**Example Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Response:

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## Architecture

```
src/modules/
├── auth/
│   ├── application/          # Use cases (AuthService)
│   ├── presentation/         # HTTP handlers (AuthController)
│   └── guards/               # JWT auth guard
├── user/
│   ├── application/          # User operations (UserService)
│   ├── domain/               # Business logic & interfaces
│   └── infra/mongo/          # Database layer
└── encryptor/                # Encryption utilities
```

**Layers:**

- **Domain**: Core business logic, no dependencies
- **Application**: Services orchestrating domain logic
- **Presentation**: Controllers & HTTP handlers
- **Infrastructure**: Database & external services

## Environment Variables

```env
PORT=3000
MONGO_URI=mongodb://admin:admin123@localhost:27017/auth_dev?authSource=admin
JWT_SECRET=your-secret-key-min-8-chars
ENCRYPTION_KEY_BASE64=base64-encoded-encryption-key
```

## Available Scripts

```bash
# Development
pnpm --filter auth-server start:dev    # Hot reload
pnpm --filter auth-server lint         # ESLint
pnpm --filter auth-server format       # Prettier

# Testing
pnpm --filter auth-server test         # Unit tests
pnpm --filter auth-server test:e2e     # E2E tests
pnpm --filter auth-server test:cov     # Coverage

# Production
pnpm --filter auth-server build        # Compile
pnpm --filter auth-server start:prod   # Run
```

## Key Features

✅ **JWT Access & Refresh Tokens** - 15m access, 7d refresh with rotation  
✅ **Secure Password Hashing** - scrypt with salt  
✅ **Token Rotation** - Refresh endpoint issues new token pair  
✅ **Theft Detection** - Revokes all sessions on invalid refresh  
✅ **Clean Architecture** - Domain, application, & infrastructure layers  
✅ **Type Safe** - Full TypeScript with strict typing  
✅ **MongoDB** - Document-based persistence

## Token Flow

1. **Login** → User provides email/password → Server issues access + refresh tokens
2. **Access API** → Client sends `Authorization: Bearer <accessToken>`
3. **Token Expires** → Client calls refresh endpoint with `refreshToken`
4. **Refresh** → Server validates, rotates tokens, issues new pair
5. **Logout** → Server revokes all refresh tokens for user

## Troubleshooting

```bash
# MongoDB connection issues
docker-compose -f infra/docker/docker-compose.dev.yml logs mongodb

# Port 3000 in use
lsof -i :3000 && kill -9 <PID>

# Clean rebuild
docker-compose -f infra/docker/docker-compose.dev.yml down -v
docker-compose -f infra/docker/docker-compose.dev.yml up --build
```

## Project Structure

```
auth-server/
├── src/
│   ├── config/env.ts              # Environment validation
│   ├── database/database.module.ts # MongoDB setup
│   └── modules/
│       ├── auth/                  # Authentication
│       ├── user/                  # User management
│       └── encryptor/             # Encryption
├── test/app.e2e-spec.ts           # E2E tests
├── infra/docker/                  # Docker configs
└── package.json
```

## License

UNLICENSED
