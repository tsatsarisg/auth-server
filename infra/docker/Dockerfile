FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace metadata and package manifests (no heavy build artifacts)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy package json for the auth-server so pnpm knows workspace deps
COPY auth-server/package.json ./auth-server/
COPY auth-server/tsconfig.json ./auth-server/
COPY auth-server/tsconfig.build.json ./auth-server/
COPY auth-server/nest-cli.json ./auth-server/

# Copy initial source (source will also be mounted from host for hot reload)
COPY auth-server/src ./auth-server/src

# Install dependencies inside the container
RUN pnpm install --frozen-lockfile

EXPOSE 3000

# Default to running the dev watcher for the auth-server workspace package
CMD ["pnpm", "--filter=auth-server", "run", "start:dev"]