# 🎯 **PRESENTATION CONTEXT STRATEGY**

## 🤔 **THE QUESTION**

When generating presentations, we have 3 possible contexts:

1. **Editor Content** - Markdown/HTML from WYSIWYG editor
2. **Mindmap Data** - Nodes and edges from Studio2
3. **Both** - Editor + Mindmap together

**Question:** Should we offer all 3 options, or pick one strategy?

---

## 💡 **RECOMMENDED STRATEGY: UNIFIED CONTEXT**

### **Approach: Generate from BOTH when available**

**Why?**
- Editor provides **rich text content** (paragraphs, lists, formatting)
- Mindmap provides **structure** (hierarchy, relationships, organization)
- Together = **Best presentations** (content + structure)

### **Flow:**

```
User clicks "Prepare Presentation" from:
├─ Editor (WYSIWYG)
│  └─ Uses: Editor content ONLY
│  └─ Good for: Text-heavy documents
│
├─ Mindmap (Studio2)
│  └─ Uses: Mindmap data + Original editor content (if available)
│  └─ Good for: Visual/structured presentations
│
└─ Workspace (when both exist)
   └─ Uses: BOTH editor + mindmap
   └─ Best for: Complete presentations
```

---

## 🔄 **CONTEXT ALIGNMENT**

### **Current State:**
- ✅ Editor and Mindmap share the same document
- ✅ `EditorStudioSession` syncs content between them
- ✅ Mindmap can be generated from editor content
- ✅ Mindmap changes can be merged back to editor

### **For Presentations:**
- ✅ Studio2 has access to original editor content via `originalContent` state
- ✅ Editor has access to its own content
- ✅ Both can pass their context to `PresentationGenerator`

---

## 🎯 **IMPLEMENTATION STRATEGY**

### **Option 1: Current Approach (Separate Flows)** ✅ RECOMMENDED

**Editor Flow:**
```typescript
// User clicks "Prepare Presentation" in editor
1. Open wizard
2. User configures (slides, theme, etc.)
3. Generate from: editorContent + null (no mindmap)
4. Navigate to /workspace/doc/{id}/slides
```

**Studio2 Flow:**
```typescript
// User clicks "Presentation" in Studio2
1. Open wizard
2. User configures (slides, theme, etc.)
3. Generate from: editorContent (original) + mindmapData
4. Navigate to /workspace/doc/{id}/slides
```

**Benefits:**
- ✅ Simple, clear separation
- ✅ User controls which context to use
- ✅ No confusion about what's being generated
- ✅ Both flows work independently

**Drawbacks:**
- ⚠️ User might not realize they can use both
- ⚠️ No explicit "use both" option

---

### **Option 2: Smart Detection (Auto-merge)** ❌ NOT RECOMMENDED

```typescript
// Automatically detect and merge contexts
if (hasMindmap && hasEditor) {
  // Use both
} else if (hasMindmap) {
  // Use mindmap only
} else {
  // Use editor only
}
```

**Benefits:**
- ✅ Automatic, no user decision needed

**Drawbacks:**
- ❌ User loses control
- ❌ Unclear what's being used
- ❌ Might generate unexpected results

---

### **Option 3: Explicit Choice Modal** ⚠️ MAYBE LATER

```
┌────────────────────────────────────────┐
│ Generate Presentation From:            │
├────────────────────────────────────────┤
│ ( ) Editor content only                │
│ ( ) Mindmap structure only             │
│ (•) Both editor + mindmap (recommended)│
│                                        │
│                    [Next →]            │
└────────────────────────────────────────┘
```

**Benefits:**
- ✅ Full user control
- ✅ Clear what's being used
- ✅ Educational (teaches users about options)

**Drawbacks:**
- ❌ Extra step (friction)
- ❌ Might confuse users
- ❌ Most users will just pick default anyway

---

## ✅ **FINAL DECISION: OPTION 1 (CURRENT APPROACH)**

**Reasoning:**
1. **Simple:** Each button does what you expect
2. **Flexible:** User can choose by clicking the right button
3. **No friction:** No extra modals or choices
4. **Clear:** Editor button = text-based, Mindmap button = structure-based
5. **Best of both:** Mindmap flow already includes editor content!

**Implementation:**
- ✅ Editor "Prepare Presentation" → Uses editor content only
- ✅ Studio2 "Presentation" → Uses mindmap + original editor content
- ✅ Both use the same wizard
- ✅ Both navigate to the same presentation editor

---

## 🔧 **FIXES NEEDED**

### **1. Add Wizard to Editor** ✅
Replace the old localStorage flow with the new wizard.

### **2. Fix "Back to Editor" Navigation** ✅
Update PresentationEditor to navigate to correct editor:
- If from workspace: `/workspace/doc/{id}/edit`
- If standalone: `/dashboard/editor`

### **3. Ensure Context Alignment** ✅
Make sure Studio2 passes both mindmap + editor content.

---

## 📊 **COMPARISON TABLE**

| Source | Editor Content | Mindmap Data | Best For |
|--------|---------------|--------------|----------|
| **Editor Button** | ✅ Yes | ❌ No | Text-heavy documents, articles, reports |
| **Studio2 Button** | ✅ Yes (original) | ✅ Yes | Visual presentations, structured content |
| **Workspace** | ✅ Yes | ✅ Yes (if exists) | Complete presentations with both |

---

## 🎯 **USER GUIDANCE**

**In the UI, we should hint:**

**Editor:**
> "Generate presentation from your document content"

**Studio2:**
> "Generate presentation from your mindmap structure"

**Tooltip:**
> "💡 Tip: Use the mindmap to create structured, visual presentations!"

---

## ✅ **CONCLUSION**

**Strategy:** Keep separate flows, but ensure both work seamlessly.

**Key Points:**
1. Editor generates from text content
2. Studio2 generates from mindmap + original text
3. Both use the same wizard
4. Both navigate to the same presentation editor
5. User chooses by clicking the appropriate button

**This is the simplest, clearest approach that gives users flexibility without complexity.**

