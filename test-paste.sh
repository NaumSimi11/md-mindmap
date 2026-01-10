#!/bin/bash

# PASTE AND DIAGRAMS TEST SUITE
# Run this before EVERY commit

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║   PASTE & DIAGRAMS - THE BIBLE TEST SUITE     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Note: Playwright will auto-start a dev server on port 5174 via webServer config
# No need to check manually - Playwright handles this

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

