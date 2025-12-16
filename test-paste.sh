#!/bin/bash

# PASTE AND DIAGRAMS TEST SUITE
# Run this before EVERY commit

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║   PASTE & DIAGRAMS - THE BIBLE TEST SUITE     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "🔍 Checking if dev server is running..."
if ! curl -s http://localhost:5174 > /dev/null; then
    echo "❌ Dev server not running on http://localhost:5174"
    echo "   Run: npm run dev"
    exit 1
fi
echo "✅ Dev server is running"
echo ""

# Run tests
echo "🧪 Running paste and diagram tests..."
echo ""

npx playwright test e2e/paste-and-diagrams.spec.ts --reporter=list

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ✅ ALL TESTS PASSED ✅                ║"
    echo "║                                                ║"
    echo "║   Paste and diagrams are working correctly!   ║"
    echo "║   Safe to commit.                             ║"
    echo "╚════════════════════════════════════════════════╝"
    exit 0
else
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ❌ TESTS FAILED ❌                    ║"
    echo "║                                                ║"
    echo "║   DO NOT COMMIT!                              ║"
    echo "║   Fix the broken functionality first.         ║"
    echo "╚════════════════════════════════════════════════╝"
    exit 1
fi

