# Architecture Documentation Index

**Last Updated:** December 15, 2025

---

## 🎯 **PRIMARY SPECIFICATIONS**

### **1. EDITOR_MASTERPIECE_V2_CONSOLIDATED.md**
**Status:** 🔴 **DEFINITIVE BLUEPRINT** (v2.1)  
**Purpose:** Complete, consolidated, executable architecture for Cursor-grade editor

**What's Inside:**
- System invariants & product goals
- Complete database schema (13 tables)
- Provenance & blame model (3 levels)
- CRDT persistence & compaction strategy
- Patch protocol v2 (stable anchors)
- Workspace semantic search
- CRDT testing strategy (chaos, fuzz, property)
- Security model (encryption, isolation, GDPR)
- Mermaid diagram integration
- Implementation matrix (claim → module → file)
- Migration plan (6 phases)

**Use This For:** Implementation, code reviews, architecture decisions

---

### **2. V2_1_FIXES_SUMMARY.md**
**Status:** ✅ **GAP ANALYSIS RESPONSE**  
**Purpose:** Summary of what was fixed from v2.0 → v2.1

**What's Inside:**
- 5 hard blockers fixed
- 4 missing subsystems added
- Comparison table (v2.0 vs v2.1)
- What's new in v2.1

**Use This For:** Understanding what changed and why

---

## 📚 **SUPPORTING DOCUMENTATION**

### **3. MDREADER_COMPLETE_ARCHITECTURE.md**
**Status:** 🟡 **CURRENT SYSTEM** (v1.0)  
**Purpose:** Architecture of the existing MDReader system (as-is)

**What's Inside:**
- Current PostgreSQL schema
- Current sync architecture
- Current backend/frontend structure
- Phase 1-7 implementation plan (original)

**Use This For:** Understanding current system, migration planning

---

### **4. TECHNOLOGY_STACK_DIAGRAM.md**
**Status:** 🟢 **REFERENCE**  
**Purpose:** Complete technology stack with diagrams

**What's Inside:**
- 4-layer tech stack (client, backend, data, devops)
- Data flow diagrams
- Authentication flow
- Collaboration stack
- Package.json & requirements.txt (exact versions)
- Technology decision matrix

**Use This For:** Technology choices, dependency management, onboarding

---

## 🗂️ **OTHER PLANNING DOCS**

### **PATTERNS_ADOPTION.md**
Coding patterns and standards (backend/frontend)

### **DOCUMENTATION_STANDARD.md**
How to write documentation for this project

### **DEVELOPMENT_EXECUTION_MANUAL.md**
Developer onboarding and workflow guide

### **DEFINITIVE_EXECUTION_PLAN.md**
High-level execution roadmap

### **COMPREHENSIVE_USE_CASES.md**
User stories and use cases

---

## 🚀 **QUICK START FOR ENGINEERS**

### **New to the Project?**
1. Read: `MDREADER_COMPLETE_ARCHITECTURE.md` (current system)
2. Read: `TECHNOLOGY_STACK_DIAGRAM.md` (tech choices)
3. Skim: `DEVELOPMENT_EXECUTION_MANUAL.md` (workflow)

### **Implementing New Features?**
1. **PRIMARY REFERENCE:** `EDITOR_MASTERPIECE_V2_CONSOLIDATED.md`
2. Find your feature in Section 10 (Implementation Matrix)
3. Check claim → module → file mapping
4. Implement in the specified touchpoint
5. Test using Section 7 (Reliability & Testing)

### **Reviewing PRs?**
1. Verify implementation matches v2.1 spec
2. Check Section 10: Is the right file touched?
3. Check Section 7: Are tests included?
4. Check Section 8: Security considerations?

---

## 📖 **READING ORDER (RECOMMENDED)**

### **For Product/Designers:**
1. MDREADER_COMPLETE_ARCHITECTURE.md (Sections 1-9: UX flows)
2. EDITOR_MASTERPIECE_V2_CONSOLIDATED.md (Section 0: Product goals)

### **For Backend Engineers:**
1. MDREADER_COMPLETE_ARCHITECTURE.md (Section 2: Database)
2. EDITOR_MASTERPIECE_V2_CONSOLIDATED.md (Sections 1, 3, 4, 8)
3. Implementation Matrix (Section 10) for touchpoints

### **For Frontend Engineers:**
1. TECHNOLOGY_STACK_DIAGRAM.md (Frontend stack)
2. EDITOR_MASTERPIECE_V2_CONSOLIDATED.md (Sections 2, 5, 9)
3. Implementation Matrix (Section 10) for touchpoints

### **For Architects:**
1. EDITOR_MASTERPIECE_V2_CONSOLIDATED.md (ALL SECTIONS)
2. V2_1_FIXES_SUMMARY.md (What changed)
3. MDREADER_COMPLETE_ARCHITECTURE.md (Current state)

### **For QA/Test Engineers:**
1. EDITOR_MASTERPIECE_V2_CONSOLIDATED.md (Section 7: Testing)
2. Implementation Matrix (Section 10) for test touchpoints

---

## ⚡ **KEY PRINCIPLES (FROM V2.1)**

```
✓ INVARIANT 1: Local-First is Mandatory
✓ INVARIANT 2: CRDT is Canonical
✓ INVARIANT 3: AI Never Silently Mutates
✓ INVARIANT 4: Provenance is Guaranteed
✓ INVARIANT 5: Zero-Trust Security
✓ INVARIANT 6: Deterministic Collaboration
✓ INVARIANT 7: Bounded Storage Growth
```

**Violating these invariants = architectural failure.**

---

## 🔄 **DOCUMENT LIFECYCLE**

### **Version History:**
- v1.0 (Dec 2025): MDREADER_COMPLETE_ARCHITECTURE.md (current system)
- v2.0 (Dec 2025): EDITOR_FUTURE_MASTERPIECE (Part 1 + Part 2)
- v2.1 (Dec 2025): EDITOR_MASTERPIECE_V2_CONSOLIDATED.md ← **CURRENT**

### **Deprecation Policy:**
- v2.0 (Part 1 + Part 2): ~~Deleted~~ (superseded by v2.1)
- v1.0: Kept for migration reference

### **Updates:**
- v2.1 is living document
- Updates committed to v2.1 file directly
- Major revisions → v2.2, v2.3, etc.

---

## 📞 **QUESTIONS?**

**For clarifications on v2.1 spec:**
→ Check Section 10 (Implementation Matrix) first
→ If still unclear: Raise issue with specific claim

**For current system questions:**
→ Check MDREADER_COMPLETE_ARCHITECTURE.md

**For tech stack questions:**
→ Check TECHNOLOGY_STACK_DIAGRAM.md

---

**Last Review:** December 15, 2025  
**Next Review:** After Phase 0 completion (Week 2)

---

*This index will be updated as new documentation is added.*

