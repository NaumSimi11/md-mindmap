#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║      CRITICAL E2E TESTS - PRE-COMMIT          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Note: Playwright will auto-start a dev server on port 5174 via webServer config
# No need to check manually - Playwright handles this

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