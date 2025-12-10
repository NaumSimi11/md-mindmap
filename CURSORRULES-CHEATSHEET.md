# 🚀 `.cursorrules-be` Cheat Sheet

## **TL;DR**

`.cursorrules-be` = Backend code generator  
You give it structured input → It gives you complete backend plan

---

## ⚡ **Quick Workflow**

```bash
# 1. Generate input
./scripts/generate-feature-input.sh

# 2. Fill TODOs in generated file

# 3. In Cursor, run:
@.cursorrules-be Here's my feature input:
[Paste file contents]

# 4. Implement what it generates
```

---

## 📋 **What Input Needs (5 Sections)**

1. **Feature Name** - What you're building
2. **Frontend Context** - Components, UI flow, API calls
3. **Backend Stack** - FastAPI, PostgreSQL, Redis (MDReader standard)
4. **Data Persistence** - Where data lives, CRUD rules
5. **Offline/Online** - Sync strategy, conflict resolution

---

## 💡 **Handling Dynamic Requirements**

| Problem | Solution |
|---------|----------|
| Requirements change | Version inputs: `v1.md`, `v2.md`, `v3.md` |
| Unclear specs | Use TODOs and placeholders |
| Complex features | Break into modules |
| Incremental dev | Start simple, add features in phases |

---

## ✅ **Quality Checklist**

Before feeding to `.cursorrules-be`:

- [ ] Feature name is specific
- [ ] UI flow is step-by-step
- [ ] API calls show TypeScript examples
- [ ] Auth rules are explicit
- [ ] Error states are listed
- [ ] Offline behavior is defined
- [ ] Sync conflicts are handled

---

## 📚 **Files Created**

| File | Purpose |
|------|---------|
| `BACKEND_WIRING_INPUT_TEMPLATE.md` | Full template with examples |
| `.cursorrules-usage-guide.md` | Detailed strategies |
| `scripts/generate-feature-input.sh` | Interactive generator |
| `CURSORRULES-CHEATSHEET.md` | This file |

---

## 🎯 **Example: Simple Feature Input**

```markdown
Feature: Starred Documents

Frontend:
- User clicks star icon
- POST /api/v1/documents/{id}/star
- Response: { starred: true }
- Icon turns yellow

Backend:
- Add column: documents.is_starred (boolean)
- Add column: documents.starred_at (timestamp)
- Auth: User must own workspace

Offline:
- Star locally in IndexedDB
- Sync on reconnect
- Conflict: Keep starred (merge)
```

Feed this to `@.cursorrules-be` → Get complete backend plan!

---

## 🚀 **Start Here**

```bash
./scripts/generate-feature-input.sh
```

Follow the prompts → Get pre-filled template → Fill TODOs → Use it! 🎉

