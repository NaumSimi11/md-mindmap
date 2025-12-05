#!/bin/bash

# MDReader Backend Startup Script
# Quick start script for development

set -e

echo "🚀 MDReader Backend Startup"
echo "============================"
echo ""

# Check if we're in the backend directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Must run from backend directory"
    echo "   cd /Users/naum/Desktop/mdreader/mdreader-main/backend"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Run: python3 -m venv venv"
    exit 1
fi

# Activate venv
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Run: cp .env.example .env"
fi

# Check Docker services
echo "✅ Checking Docker services..."
if ! docker ps | grep -q "mdreader-postgres"; then
    echo "⚠️  PostgreSQL not running. Starting..."
    docker-compose up -d postgres
    sleep 3
fi

if ! docker ps | grep -q "mdreader-redis"; then
    echo "⚠️  Redis not running. Starting..."
    docker-compose up -d redis
    sleep 2
fi

echo "✅ Docker services running"
echo ""

# Check database connection
echo "🔌 Testing database connection..."
if python scripts/test_db.py > /dev/null 2>&1; then
    echo "✅ Database connected"
else
    echo "❌ Database connection failed"
    exit 1
fi

echo ""
echo "🎯 Starting FastAPI server..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo "   Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
export PYTHONPATH=$(pwd)
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

