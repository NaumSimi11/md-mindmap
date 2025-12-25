#!/bin/bash

# Complete clean slate for MDReader
# Clears: PostgreSQL, IndexedDB, LocalStorage, Redis

set -e

echo "🧹 ============================================"
echo "🧹 COMPLETE CLEAN SLATE - MDReader"
echo "🧹 ============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Stop all services
echo -e "${YELLOW}🛑 Stopping all services...${NC}"
./stop-services.sh 2>/dev/null || true
sleep 2

# 🔥 BUG FIX #10: Ensure Docker containers are running before exec commands
echo ""
echo -e "${BLUE}🔄 Starting Docker containers (needed for cleanup)...${NC}"
docker-compose up -d > /dev/null 2>&1 || true
sleep 5  # Wait for containers to be ready

# 2. Clear PostgreSQL
echo ""
echo -e "${BLUE}🗑️  Clearing PostgreSQL database...${NC}"
docker exec mdreader-v2-postgres psql -U mdreader -d postgres -c "DROP DATABASE IF EXISTS mdreader;" 2>/dev/null || true
docker exec mdreader-v2-postgres psql -U mdreader -d postgres -c "CREATE DATABASE mdreader;" 2>/dev/null || true
echo -e "${GREEN}✅ PostgreSQL cleared${NC}"

# 3. Clear Redis
echo ""
echo -e "${BLUE}🗑️  Clearing Redis cache...${NC}"
docker exec mdreader-v2-redis redis-cli FLUSHALL 2>/dev/null || true
echo -e "${GREEN}✅ Redis cleared${NC}"

# 4. Instructions for browser
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clear browser storage manually!${NC}"
echo ""
echo -e "${BLUE}Open browser console and run:${NC}"
echo ""
echo -e "${GREEN}// Clear IndexedDB${NC}"
echo "indexedDB.databases().then(dbs => {"
echo "  dbs.forEach(db => {"
echo "    console.log('Deleting:', db.name);"
echo "    indexedDB.deleteDatabase(db.name);"
echo "  });"
echo "});"
echo ""
echo -e "${GREEN}// Clear localStorage${NC}"
echo "localStorage.clear();"
echo ""
echo -e "${GREEN}// Reload${NC}"
echo "location.reload();"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}After clearing browser storage, restart services:${NC}"
echo -e "${GREEN}./start-services.sh${NC}"
echo ""
echo -e "${YELLOW}🎉 Ready for fresh start!${NC}"

