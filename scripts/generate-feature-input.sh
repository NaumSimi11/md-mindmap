#!/bin/bash

# ╔══════════════════════════════════════════════════════════════╗
# ║     Backend Feature Input Generator                         ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./scripts/generate-feature-input.sh
#   Follow the interactive prompts

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FEATURES_DIR="$PROJECT_ROOT/features"

# Create features directory if it doesn't exist
mkdir -p "$FEATURES_DIR"

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       Backend Feature Input Generator                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Prompt for feature name
echo -e "${BOLD}📝 Feature Name:${NC}"
echo -e "${BLUE}   (e.g., 'Document Tags', 'Starred Documents', 'Search')${NC}"
read -p "   → " feature_name

if [ -z "$feature_name" ]; then
    echo -e "${RED}❌ Feature name is required${NC}"
    exit 1
fi

# Create safe filename
feature_slug=$(echo "$feature_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
timestamp=$(date +%Y%m%d-%H%M)
filename="${FEATURES_DIR}/${feature_slug}-input-${timestamp}.md"

# Prompt for priority
echo ""
echo -e "${BOLD}🎯 Priority:${NC}"
echo "   1) High"
echo "   2) Medium"
echo "   3) Low"
read -p "   → " priority_choice

case $priority_choice in
    1) priority="High" ;;
    2) priority="Medium" ;;
    3) priority="Low" ;;
    *) priority="Medium" ;;
esac

# Prompt for epic
echo ""
echo -e "${BOLD}📊 Related Epic:${NC}"
echo -e "${BLUE}   (e.g., 'Phase 3 - Document Organization')${NC}"
read -p "   → " epic

# Prompt for real-time requirement
echo ""
echo -e "${BOLD}⚡ Real-time Updates Required?${NC}"
echo "   1) Yes (WebSocket)"
echo "   2) No (REST API only)"
read -p "   → " realtime_choice

case $realtime_choice in
    1) 
        realtime="Yes"
        websocket="Required"
        ;;
    *) 
        realtime="No"
        websocket="Optional"
        ;;
esac

# Prompt for offline support
echo ""
echo -e "${BOLD}📴 Offline Support?${NC}"
echo "   1) Full CRUD (local storage + sync)"
echo "   2) Read-only (cached data)"
echo "   3) Online-only"
read -p "   → " offline_choice

case $offline_choice in
    1) 
        offline="Full CRUD"
        offline_desc="Full create, read, update, delete capabilities offline. Sync on reconnect."
        ;;
    2) 
        offline="Read-only"
        offline_desc="Cached data available for reading. Changes require internet connection."
        ;;
    *) 
        offline="Online-only"
        offline_desc="Feature requires active internet connection."
        ;;
esac

# Prompt for database storage
echo ""
echo -e "${BOLD}💾 Primary Storage:${NC}"
echo "   1) PostgreSQL (transactional data)"
echo "   2) Redis (cache/sessions)"
echo "   3) Both"
echo "   4) Filesystem"
read -p "   → " storage_choice

case $storage_choice in
    1) storage_pg="[x]"; storage_redis="[ ]"; storage_fs="[ ]" ;;
    2) storage_pg="[ ]"; storage_redis="[x]"; storage_fs="[ ]" ;;
    3) storage_pg="[x]"; storage_redis="[x]"; storage_fs="[ ]" ;;
    4) storage_pg="[ ]"; storage_redis="[ ]"; storage_fs="[x]" ;;
    *) storage_pg="[x]"; storage_redis="[ ]"; storage_fs="[ ]" ;;
esac

# Generate the input file
cat > "$filename" << EOF
# Backend Feature Input: ${feature_name}

**Generated:** $(date +"%Y-%m-%d %H:%M:%S")

---

## **1. FEATURE NAME**

\`\`\`
Feature: ${feature_name}
Priority: ${priority}
Epic: ${epic}
\`\`\`

---

## **2. FRONTEND CONTEXT**

### **Components Involved:**

\`\`\`typescript
// TODO: List all React components that will use this feature
- ComponentName (path: src/components/...)
  - Props: { }
  - State: { }
  - Actions: [ ]
\`\`\`

### **Frontend Logic Summary:**

\`\`\`
1. User Action: [What triggers this feature?]
   TODO: Describe the initial user interaction

2. UI Flow: [Step-by-step user interaction]
   TODO: Detail the exact sequence of UI changes
   - Step 1: 
   - Step 2: 
   - Step 3: 

3. State Management: [Context/Zustand - what gets updated?]
   TODO: Which state management hook? What values change?

4. Expected Response: [What should the UI show?]
   TODO: Success state, loading state, empty state

5. Error States: [What errors can occur?]
   TODO: List all possible error scenarios
   - Network error: 
   - Validation error: 
   - Permission denied: 
\`\`\`

### **Frontend API Calls:**

\`\`\`typescript
// TODO: What the frontend expects to call

// Example:
await apiService.someMethod({
  param1: "value",
  param2: 123
})

// Expected response:
// { success: boolean, data: { ... } }
\`\`\`

---

## **3. BACKEND TECHNOLOGY STACK**

\`\`\`yaml
Framework: FastAPI
Language: Python 3.11+
Database: PostgreSQL (via SQLAlchemy)
Cache: Redis
Authentication: JWT tokens (Argon2 hashing)
File Storage: Local filesystem (uploads/)
WebSockets: ${websocket}
ORM: SQLAlchemy 2.0
Migrations: Alembic
\`\`\`

---

## **4. DATA PERSISTENCE RULES**

### **Storage Strategy:**

\`\`\`
Primary Data:
  - ${storage_pg} PostgreSQL (transactional, relational)
  - ${storage_redis} Redis (cache, sessions, real-time data)
  - ${storage_fs} Local Filesystem (file uploads, media)
  - [ ] S3/Cloud Storage (future consideration)

Data Flow:
  1. TODO: Where does data originate?
  2. TODO: How is it validated?
  3. TODO: Where is it stored?
  4. TODO: What gets cached?
  5. TODO: When does it sync?
\`\`\`

### **Data Lifecycle:**

\`\`\`
Create:
  - Who: TODO (which user roles can create?)
  - Validation: TODO (what rules must be met?)
  - Example: 

Read:
  - Who: TODO (which user roles can read?)
  - Filters: TODO (how is data filtered?)
  - Example: 

Update:
  - Who: TODO (which user roles can update?)
  - Fields: TODO (which fields are editable?)
  - Example: 

Delete:
  - Type: TODO (Soft delete / Hard delete)
  - Who: TODO (which user roles can delete?)
  - Cascade: TODO (what happens to related data?)
  - Example: 

Archive:
  - Rules: TODO (when/how is data archived?)
\`\`\`

---

## **5. OFFLINE/ONLINE EXPECTATIONS**

### **Online Mode:**

\`\`\`
- Real-time updates: ${realtime}
- WebSocket connection: ${websocket}
- API latency tolerance: TODO (e.g., 300ms)
- Concurrent user handling: TODO (e.g., 10 users/workspace)
\`\`\`

### **Offline Mode (Desktop App):**

\`\`\`
- Local storage: ${offline_desc}
- Sync strategy: TODO (On reconnect / Manual / Auto)
- Conflict resolution: TODO (Last-write-wins / Manual / Timestamps)
- Offline capabilities: ${offline}
\`\`\`

### **Sync Requirements:**

\`\`\`
- Initial sync: TODO (Full download / Incremental)
- Delta sync: TODO (Timestamp-based / Version-based)
- Conflict handling: TODO (Strategy for conflicts)
- Sync triggers: TODO (App start / Timer / Manual button)
\`\`\`

---

## **6. IMPLEMENTATION NOTES**

### **Similar Features:**
\`\`\`
TODO: Reference similar existing features in MDReader
- "Use same pattern as Document CRUD"
- "Follow Workspace isolation like workspace.py"
\`\`\`

### **Dependencies:**
\`\`\`
TODO: List features this depends on
- Requires: 
- Conflicts with: 
- Extends: 
\`\`\`

### **Edge Cases:**
\`\`\`
TODO: List important edge cases to handle
1. 
2. 
3. 
\`\`\`

---

## **7. NEXT STEPS**

### **To Complete This Input:**
- [ ] Fill in all TODO sections above
- [ ] Add TypeScript API call examples
- [ ] Specify exact database tables/columns needed
- [ ] Detail error handling scenarios
- [ ] Describe UI flow with specifics
- [ ] Add frontend component details

### **When Ready:**
\`\`\`bash
# Feed this to the backend generator:
# "@.cursorrules-be Here's my feature input: [paste this file]"
\`\`\`

---

## **TEMPLATE REFERENCE**

For detailed examples and guidance, see:
- \`BACKEND_WIRING_INPUT_TEMPLATE.md\` - Complete examples
- \`.cursorrules-usage-guide.md\` - Usage strategies
EOF

echo ""
echo -e "${GREEN}${BOLD}✅ Feature input created!${NC}"
echo ""
echo -e "${BOLD}📁 Location:${NC}"
echo -e "   ${CYAN}${filename}${NC}"
echo ""
echo -e "${BOLD}📝 Next Steps:${NC}"
echo -e "   1. Open the file: ${CYAN}vim ${filename}${NC}"
echo -e "   2. Fill in all ${YELLOW}TODO${NC} sections"
echo -e "   3. Add specific examples and code snippets"
echo -e "   4. Feed to ${CYAN}@.cursorrules-be${NC} when complete"
echo ""
echo -e "${BOLD}💡 Tips:${NC}"
echo -e "   - Be specific (not vague)"
echo -e "   - Include code examples"
echo -e "   - Reference existing MDReader patterns"
echo -e "   - List edge cases"
echo ""

# Open in editor if available
if command -v code &> /dev/null; then
    echo -e "${BLUE}🚀 Opening in VS Code...${NC}"
    code "$filename"
elif command -v cursor &> /dev/null; then
    echo -e "${BLUE}🚀 Opening in Cursor...${NC}"
    cursor "$filename"
fi

