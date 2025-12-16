#!/bin/bash

# Production Stop Script
# Stops all services gracefully

set -e

echo "
═══════════════════════════════════════════════════════════
🛑 STOPPING MDREADER SERVICES
═══════════════════════════════════════════════════════════
"

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop Frontend
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo "🛑 Stopping Frontend (PID: $FRONTEND_PID)..."
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    rm logs/frontend.pid
    echo "✅ Frontend stopped"
else
    echo "⚠️  Frontend PID not found"
fi

# Stop Backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo "🛑 Stopping Backend (PID: $BACKEND_PID)..."
    kill -TERM $BACKEND_PID 2>/dev/null || true
    rm logs/backend.pid
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend PID not found"
fi

# Stop Hocuspocus
if [ -f logs/hocuspocus.pid ]; then
    HOCUSPOCUS_PID=$(cat logs/hocuspocus.pid)
    echo "🛑 Stopping Hocuspocus (PID: $HOCUSPOCUS_PID)..."
    kill -TERM $HOCUSPOCUS_PID 2>/dev/null || true
    rm logs/hocuspocus.pid
    echo "✅ Hocuspocus stopped"
else
    echo "⚠️  Hocuspocus PID not found"
fi

# Stop Docker services
echo "🛑 Stopping Docker services..."
cd backendv2
docker-compose down
cd ..
echo "✅ Docker services stopped"

echo "
═══════════════════════════════════════════════════════════
✅ ALL SERVICES STOPPED
═══════════════════════════════════════════════════════════
"

