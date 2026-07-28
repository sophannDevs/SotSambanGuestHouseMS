#!/usr/bin/env bash
# =============================================================================
#  Guest House Manager — Production Deploy Script
#  Builds and starts containers via Docker Compose on AWS EC2
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "============================================================"
echo "🚀 Deploying Guest House Manager..."
echo "============================================================"

# Ensure .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.production.example..."
    cp .env.production.example .env
    echo "🔑 Please verify database passwords and secret keys in .env!"
fi

# Determine docker compose command (v2 plugin vs v1 binary)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif sudo docker compose version &> /dev/null; then
    DOCKER_COMPOSE="sudo docker compose"
elif sudo command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="sudo docker-compose"
else
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi

echo "📦 Pulling latest images & building containers..."
$DOCKER_COMPOSE down --remove-orphans || true
$DOCKER_COMPOSE up -d --build

echo "⏳ Waiting for services to initialize..."
sleep 10

echo "🔍 Container status:"
$DOCKER_COMPOSE ps

echo "============================================================"
echo "✅ Deployment completed successfully!"
echo "🌐 Your application is running on port 80."
echo "📋 View logs anytime with: docker compose logs -f"
echo "============================================================"
