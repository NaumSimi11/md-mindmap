#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║      CRITICAL E2E TESTS - PRE-COMMIT          ║"
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

# Run critical tests from root (uses root playwright.config.ts)
echo "🧪 Running critical tests (paste + import)..."
echo ""

npx playwright test \
  e2e/paste-and-diagrams.spec.ts \
  e2e/import-flow.spec.ts \
  --workers=1 \
  --reporter=list

# Check results
if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ✅ ALL CRITICAL TESTS PASSED ✅      ║"
    echo "║                                                ║"
    echo "║   Paste persistence and import working!       ║"
    echo "║   Safe to commit.                             ║"
    echo "╚════════════════════════════════════════════════╝"
    exit 0
else
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ❌ CRITICAL TESTS FAILED ❌           ║"
    echo "║                                                ║"
    echo "║   DO NOT COMMIT!                              ║"
    echo "║   Fix the broken core functionality first.    ║"
    echo "╚════════════════════════════════════════════════╝"
    exit 1
fi