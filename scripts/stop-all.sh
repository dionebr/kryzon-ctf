#!/bin/bash

# Kryzon CTF Platform - Stop All Services
# This script stops all running CTF services and cleans up containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Kryzon CTF Platform...${NC}"

# Set working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR/infra"

# Stop all services
echo -e "${YELLOW}Stopping infrastructure services...${NC}"
docker-compose down --remove-orphans

# Stop all challenge instances
echo -e "${YELLOW}Stopping challenge instances...${NC}"
docker ps -q --filter "label=kryzon.type=challenge-instance" | xargs -r docker stop
docker ps -aq --filter "label=kryzon.type=challenge-instance" | xargs -r docker rm

# Optional cleanup
read -p "Do you want to remove all Kryzon-related containers and images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cleaning up containers and images...${NC}"
    
    # Remove Kryzon containers
    docker ps -aq --filter "label=kryzon" | xargs -r docker rm -f
    
    # Remove Kryzon images
    docker images --filter "reference=kryzon/*" -q | xargs -r docker rmi -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi

echo -e "${GREEN}✅ Kryzon CTF Platform stopped successfully${NC}"