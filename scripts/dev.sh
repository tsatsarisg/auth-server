#!/bin/bash

# Development Docker Compose Startup Script
# This script sets up and runs the development environment with pnpm workspaces

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}🚀 Starting Auth Server Development Environment${NC}"
echo "Project root: $PROJECT_ROOT"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies with pnpm...${NC}"
cd "$PROJECT_ROOT"
pnpm install --frozen-lockfile

echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
docker-compose -f "$PROJECT_ROOT/infra/docker/docker-compose.dev.yml" build

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}🐳 Starting services with Docker Compose...${NC}"

# Start services
docker-compose -f "$PROJECT_ROOT/infra/docker/docker-compose.dev.yml" up

# Cleanup on exit
trap 'echo -e "${YELLOW}Shutting down services...${NC}"; docker-compose -f "$PROJECT_ROOT/infra/docker/docker-compose.dev.yml" down' EXIT
