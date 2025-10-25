# Auth Server

A production-ready NestJS authentication server with MongoDB integration, JWT token management, and password encryption. Built with clean architecture principles and a monorepo structure using pnpm workspaces.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Project Overview

This authentication server provides:

- **User Management**: Registration, authentication, and user profile management
- **JWT Authentication**: Secure token-based authentication with configurable expiration
- **Password Security**: Bcrypt hashing with configurable salt rounds
- **Data Encryption**: Field-level encryption for sensitive data
- **MongoDB Integration**: Document-based database with Mongoose ORM
- **Clean Architecture**: Separation of concerns with domain, application, and infrastructure layers
- **Type Safety**: Full TypeScript support with strict typing

## 🏗️ Architecture

The project follows clean architecture principles with clear separation of concerns:

```
auth-server/
├── src/
│   ├── config/          # Configuration and environment setup
│   ├── database/        # Database module and connections
│   └── modules/         # Feature modules (auth, user, encryptor)
│       ├── auth/        # Authentication module
│       │   ├── application/    # Use cases and services
│       │   ├── domain/         # Business logic and interfaces
│       │   └── infrastructure/ # Implementation details
│       ├── user/        # User management module
│       └── encryptor/   # Encryption utilities
├── test/                # E2E tests
└── dist/                # Compiled output
```

### Layer Responsibilities

- **Domain Layer**: Core business logic, interfaces, and value objects (pure TypeScript, no dependencies)
- **Application Layer**: Use cases and services that orchestrate domain logic
- **Infrastructure Layer**: Database repositories, external service integrations, and implementations

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20 or higher
- **pnpm**: v9 or higher (package manager)
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **Git**: For version control

### Installation Instructions

#### Node.js

Visit [nodejs.org](https://nodejs.org) and download the LTS version.

#### pnpm

```bash
npm install -g pnpm
```

#### Docker & Docker Compose

Visit [docker.com](https://www.docker.com/products/docker-desktop) and install Docker Desktop.

## 🚀 Getting Started

### Quick Start with Docker Compose (Recommended)

This is the fastest way to get the entire development environment running:

```bash
# Clone the repository
git clone <repository-url>
cd auth-server

# Run the development startup script
./scripts/dev.sh
```

The script will:

1. ✅ Validate Docker and pnpm installation
2. 📦 Install project dependencies
3. 🏗️ Build Docker images
4. 🐳 Start MongoDB and the backend service
5. 🔄 Enable hot-reload for development

The application will be available at: **http://localhost:3000**

### Manual Setup (Without Docker)

If you prefer to run locally without Docker:

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp infra/envs/.env.dev .env

# Start MongoDB locally (requires MongoDB server running)
# Update .env MONGO_URI to match your local MongoDB instance

# Start the development server
pnpm --filter auth-server start:dev
```

### Docker Compose Commands

```bash
# Start services
docker-compose -f infra/docker/docker-compose.dev.yml up

# Start services in background
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Stop services
docker-compose -f infra/docker/docker-compose.dev.yml down

# View logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f auth-server

# Rebuild images
docker-compose -f infra/docker/docker-compose.dev.yml build --no-cache
```

## 📁 Project Structure

```
auth-server/
├── auth-server/                        # Main monorepo package
│   ├── src/
│   │   ├── app.module.ts              # Root NestJS module
│   │   ├── main.ts                    # Application entry point
│   │   ├── config/
│   │   │   └── env.ts                 # Environment validation with Zod
│   │   ├── database/
│   │   │   └── database.module.ts     # MongoDB connection module
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── auth.module.ts
│   │       │   ├── application/
│   │       │   │   ├── auth.service.ts
│   │       │   │   └── dtos/
│   │       │   │       └── register.dto.ts
│   │       │   ├── domain/
│   │       │   │   ├── password.hasher.interface.ts
│   │       │   │   └── password.vo.ts
│   │       │   └── infrastructure/
│   │       │       └── password.hasher.ts
│   │       ├── user/
│   │       │   ├── user.module.ts
│   │       │   ├── application/
│   │       │   │   └── user.service.ts
│   │       │   ├── domain/
│   │       │   │   ├── user.entity.ts
│   │       │   │   └── user.repository.interface.ts
│   │       │   └── infra/
│   │       │       └── mongo/
│   │       │           ├── user.mapper.ts
│   │       │           ├── user.repository.mongo.ts
│   │       │           └── schemas/
│   │       │               └── user.schema.ts
│   │       └── encryptor/
│   │           ├── encryptor.module.ts
│   │           └── encryptor.ts
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   └── package.json
├── infra/
│   ├── docker/
│   │   ├── Dockerfile                 # Production Docker image
│   │   ├── docker-compose.yml         # Production compose config
│   │   └── docker-compose.dev.yml     # Development compose config
│   └── envs/
│       └── .env.dev                   # Development environment template
├── scripts/
│   └── dev.sh                         # Development startup script
├── pnpm-workspace.yaml                # Monorepo workspace config
├── pnpm-lock.yaml                     # Locked dependency versions
├── tsconfig.json                      # Root TypeScript config
├── tsconfig.build.json                # Build TypeScript config
└── README.md                          # This file
```

## 📝 Available Scripts

### Development

```bash
# Start development server with hot-reload
pnpm --filter auth-server start:dev

# Start in debug mode
pnpm --filter auth-server start:debug

# Build for production
pnpm --filter auth-server build
```

### Testing

```bash
# Run unit tests
pnpm --filter auth-server test

# Run tests in watch mode
pnpm --filter auth-server test:watch

# Run tests with coverage
pnpm --filter auth-server test:cov

# Run E2E tests
pnpm --filter auth-server test:e2e
```

### Code Quality

```bash
# Lint code
pnpm --filter auth-server lint

# Format code
pnpm --filter auth-server format
```

### Production

```bash
# Build and start production server
pnpm --filter auth-server build
pnpm --filter auth-server start:prod
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory or use the development template:

```bash
cp infra/envs/.env.dev .env
```

#### Required Variables

| Variable                | Description                      | Example                                     |
| ----------------------- | -------------------------------- | ------------------------------------------- |
| `PORT`                  | Server port                      | `3000`                                      |
| `NODE_ENV`              | Environment mode                 | `development`, `production`                 |
| `MONGO_URI`             | MongoDB connection string        | `mongodb://admin:pass@localhost:27017/auth` |
| `JWT_SECRET`            | Secret key for JWT signing       | Min 8 characters                            |
| `ENCRYPTION_KEY_BASE64` | Base64 encoded encryption key    | Base64 string                               |
| `POSTGRES_URI`          | PostgreSQL connection (optional) | `postgresql://...`                          |

### Docker Compose Environment

The `docker-compose.dev.yml` file contains:

- **MongoDB**: Port 27017, authentication enabled, health checks configured
- **Auth Server**: Port 3000, hot-reload volumes, automatic restart
- **Network**: Isolated bridge network for inter-service communication

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## 🛠️ Development

### IDE Setup

#### VS Code Recommended Extensions

- ESLint
- Prettier - Code formatter
- Thunder Client or REST Client (for API testing)
- MongoDB for VS Code

#### Configuration

The project includes ESLint and Prettier configurations:

```bash
# Format code
pnpm --filter auth-server format

# Fix linting issues
pnpm --filter auth-server lint
```

### Adding New Features

1. **Create domain layer** (business logic):

   ```
   src/modules/feature/domain/
   ├── feature.entity.ts
   ├── feature.repository.interface.ts
   └── feature.value-object.ts
   ```

2. **Create application layer** (use cases):

   ```
   src/modules/feature/application/
   ├── feature.service.ts
   └── dtos/
   ```

3. **Create infrastructure layer** (implementations):

   ```
   src/modules/feature/infrastructure/
   └── feature.repository.ts
   ```

4. **Create module**:
   ```typescript
   src / modules / feature / feature.module.ts;
   ```

## 🧪 Testing

### Unit Tests

```bash
pnpm --filter auth-server test
```

### E2E Tests

```bash
pnpm --filter auth-server test:e2e
```

### Test Coverage

```bash
pnpm --filter auth-server test:cov
```

## 🚢 Deployment

### Production Build

```bash
# Build the Docker image
docker build -f infra/docker/Dockerfile -t auth-server:latest .

# Run with docker-compose (production)
docker-compose -f infra/docker/docker-compose.yml up -d
```

### Environment Variables for Production

Update environment variables in your production environment:

```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/auth_prod
JWT_SECRET=<strong-random-secret>
ENCRYPTION_KEY_BASE64=<base64-encoded-key>
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB container is running
docker ps | grep mongodb

# View MongoDB logs
docker-compose -f infra/docker/docker-compose.dev.yml logs mongodb

# Connect to MongoDB directly
mongosh "mongodb://admin:admin123@localhost:27017/auth_dev?authSource=admin"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Docker Compose Issues

```bash
# Clean up all containers and volumes
docker-compose -f infra/docker/docker-compose.dev.yml down -v

# Rebuild everything from scratch
docker-compose -f infra/docker/docker-compose.dev.yml up --build --force-recreate
```
