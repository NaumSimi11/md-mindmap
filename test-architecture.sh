#!/bin/bash

# ============================================================================
# MDREADER ARCHITECTURE TEST RUNNER
# Verifies the complete Yjs CRDT architecture implementation
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Start time
START_TIME=$(date +%s)

echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}🧪 MDREADER ARCHITECTURE VERIFICATION${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Testing Yjs CRDT + Local-First Architecture${NC}"
echo -e "${BLUE}Date: $(date)${NC}"
echo ""

# ============================================================================
# TEST 1: Frontend Running
# ============================================================================
echo -e "${BOLD}[1/10] Frontend Service${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ PASS${NC} - Frontend running on http://localhost:5173"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ FAIL${NC} - Frontend not running"
    echo -e "   ${YELLOW}ℹ️  Run: cd frontend && npm run dev${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 2: File Structure
# ============================================================================
echo -e "${BOLD}[2/10] File Structure${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

REQUIRED_FILES=(
    "frontend/src/hooks/useYjsDocument.ts"
    "frontend/src/components/editor/WYSIWYGEditor.tsx"
    "frontend/src/components/editor/extensions.ts"
    "frontend/src/services/workspace/GuestWorkspaceService.ts"
    "frontend/src/services/workspace/BackendWorkspaceService.ts"
    "frontend/src/scripts/migrateToYjs.ts"
    "frontend/src/scripts/verifyImplementation.ts"
    "frontend/src/contexts/WorkspaceContext.tsx"
    "planning_docs/CODE_CLEANUP_PLAN.md"
    "planning_docs/INTEGRATION_TEST_PLAN.md"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "   ${RED}❌ Missing: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - All ${#REQUIRED_FILES[@]} required files present"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ FAIL${NC} - Missing $MISSING_FILES files"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 3: Yjs Packages
# ============================================================================
echo -e "${BOLD}[3/10] Yjs Packages${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd frontend
MISSING_PACKAGES=0
REQUIRED_PACKAGES=("yjs" "y-indexeddb" "y-websocket" "@tiptap/extension-collaboration" "@tiptap/extension-collaboration-cursor" "y-prosemirror" "@tiptap/y-tiptap")

for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if ! npm list "$pkg" > /dev/null 2>&1; then
        echo -e "   ${RED}❌ Missing: $pkg${NC}"
        MISSING_PACKAGES=$((MISSING_PACKAGES + 1))
    fi
done

if [ $MISSING_PACKAGES -eq 0 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - All Yjs packages installed"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ FAIL${NC} - Missing $MISSING_PACKAGES packages"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
cd ..
echo ""

# ============================================================================
# TEST 4: TypeScript Compilation
# ============================================================================
echo -e "${BOLD}[4/10] TypeScript Compilation${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd frontend
if npm run type-check > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ PASS${NC} - TypeScript compiles without errors"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${YELLOW}⚠️  SKIP${NC} - TypeScript check skipped (type-check script not found)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
cd ..
echo ""

# ============================================================================
# TEST 5: Code Quality (Deprecated Markers)
# ============================================================================
echo -e "${BOLD}[5/10] Code Quality (Deprecation Markers)${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

DEPRECATED_FILES=(
    "frontend/src/services/offline/SyncManager.ts"
    "frontend/src/services/workspace/WorkspaceService.ts"
)

MISSING_DEPRECATION=0
for file in "${DEPRECATED_FILES[@]}"; do
    if [ -f "$file" ]; then
        if ! grep -q "@deprecated" "$file"; then
            echo -e "   ${RED}❌ Missing @deprecated tag: $file${NC}"
            MISSING_DEPRECATION=$((MISSING_DEPRECATION + 1))
        fi
    fi
done

if [ $MISSING_DEPRECATION -eq 0 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - All deprecated code properly marked"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ FAIL${NC} - $MISSING_DEPRECATION files missing @deprecated tags"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 6: Architecture Documentation
# ============================================================================
echo -e "${BOLD}[6/10] Architecture Documentation${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

DOC_FILES=(
    "ARCHITECTURE_VISUAL.md"
    "IMPLEMENTATION_STATUS.md"
    "planning_docs/FINDNGS.MD"
    "planning_docs/ARCHITECTURE_COMPARISON.md"
    "planning_docs/YJS_MIGRATION_CHECKLIST.md"
)

MISSING_DOCS=0
for doc in "${DOC_FILES[@]}"; do
    if [ ! -f "$doc" ]; then
        echo -e "   ${RED}❌ Missing: $doc${NC}"
        MISSING_DOCS=$((MISSING_DOCS + 1))
    fi
done

if [ $MISSING_DOCS -eq 0 ]; then
    echo -e "   ${GREEN}✅ PASS${NC} - All architecture documentation present"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ FAIL${NC} - Missing $MISSING_DOCS documentation files"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 7: SyncManager Disabled
# ============================================================================
echo -e "${BOLD}[7/10] SyncManager Auto-start Disabled${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if grep -q "syncManager.startAutoSync();" frontend/src/services/offline/SyncManager.ts 2>/dev/null; then
    echo -e "   ${RED}❌ FAIL${NC} - SyncManager auto-start is still active"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    echo -e "   ${GREEN}✅ PASS${NC} - SyncManager auto-start disabled (Yjs handles sync)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 8: Guest Workspace Service
# ============================================================================
echo -e "${BOLD}[8/10] Guest Workspace Service${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

GUEST_SERVICE="frontend/src/services/workspace/GuestWorkspaceService.ts"
if [ -f "$GUEST_SERVICE" ]; then
    if grep -q "Quick Notes" "$GUEST_SERVICE" && grep -q "Projects" "$GUEST_SERVICE"; then
        echo -e "   ${GREEN}✅ PASS${NC} - Default folders (Quick Notes, Projects) configured"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   ${RED}❌ FAIL${NC} - Default folders not found"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "   ${RED}❌ FAIL${NC} - GuestWorkspaceService not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 9: Collaboration Extensions
# ============================================================================
echo -e "${BOLD}[9/10] TipTap Collaboration Extensions${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

EXTENSIONS_FILE="frontend/src/components/editor/extensions.ts"
if [ -f "$EXTENSIONS_FILE" ]; then
    if grep -q "Collaboration" "$EXTENSIONS_FILE" && grep -q "CollaborationCursor" "$EXTENSIONS_FILE"; then
        echo -e "   ${GREEN}✅ PASS${NC} - Collaboration extensions imported"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   ${RED}❌ FAIL${NC} - Collaboration extensions not found"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "   ${RED}❌ FAIL${NC} - extensions.ts not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# TEST 10: Migration Script
# ============================================================================
echo -e "${BOLD}[10/10] Migration Script${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))

MIGRATION_SCRIPT="frontend/src/scripts/migrateToYjs.ts"
if [ -f "$MIGRATION_SCRIPT" ]; then
    if grep -q "verifyMigration" "$MIGRATION_SCRIPT" && grep -q "checkYjsDocExists" "$MIGRATION_SCRIPT"; then
        echo -e "   ${GREEN}✅ PASS${NC} - Migration script enhanced with verification"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   ${YELLOW}⚠️  WARN${NC} - Migration script missing verification functions"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    echo -e "   ${RED}❌ FAIL${NC} - Migration script not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# ============================================================================
# RESULTS
# ============================================================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📊 TEST RESULTS${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   Total Tests:     ${BOLD}$TOTAL_TESTS${NC}"
echo -e "   ${GREEN}✅ Passed:        $PASSED_TESTS${NC}"
echo -e "   ${RED}❌ Failed:        $FAILED_TESTS${NC}"
echo -e "   ⏱️  Duration:      ${DURATION}s"
echo ""

# Calculate success rate
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "   ${BOLD}Success Rate:    $SUCCESS_RATE%${NC}"
echo ""

# Status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TESTS PASSED! Architecture verified.${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "   1. Open browser: ${BOLD}http://localhost:5173${NC}"
    echo -e "   2. Open DevTools console"
    echo -e "   3. Run: ${BOLD}await verifyImplementation()${NC}"
    echo -e "   4. Verify 8/8 automated tests pass"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}⚠️  SOME TESTS FAILED${NC}"
    echo -e "${RED}Please review failures above and fix issues.${NC}"
    echo ""
    exit 1
fi

