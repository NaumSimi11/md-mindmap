# 📍 CONTENT PLACEMENT SYSTEM - How AI Decides WHERE to Insert

**Question:** How does the AI know WHERE in the document to place generated content?

**Answer:** It uses **cursor position** and **section detection**!

---

## 🎯 The "Section:" Indicator

### What You See in Chat UI:

```
┌──────────────────────────────────────┐
│ 📄 Document Name                     │
│ 👆 Section: Password Reset Flow      │ ← THIS!
└──────────────────────────────────────┘
```

**What this means:**
- This shows **where your cursor is** in the document
- The AI uses this as **context** for understanding what you're working on
- It helps the AI decide where to place new content

---

## 🔍 How Position Detection Works

### Step 1: Detect Current Section

When you open the AI chat, the system:

```typescript
// In src/utils/documentContext.ts
function findCurrentSection(editor, cursorPosition) {
    // Finds all headings (##) in document
    const sections = extractSections(editor);
    
    // Finds the last heading BEFORE your cursor
    for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].position <= cursorPosition) {
            return sections[i].name;  // e.g., "Password Reset Flow"
        }
    }
    
    return null;  // Cursor is before any headings
}
```

**Example:**

```markdown
## User Registration     ← Section 1
Some content here...

## Login Flow            ← Section 2
More content...

## Password Reset Flow   ← Section 3
Your cursor is here! 👈  ← YOU ARE HERE!
```

**Result:** The UI shows `Section: Password Reset Flow` because your cursor is after that heading.

---

## 🎨 How Content Placement is Decided

### Current System (3 Strategies):

#### Strategy 1: **User Specifies Position**
```
User: "add a Security section AFTER login flow"
         ↓
AI detects: "after login flow"
         ↓
Function call: {
    position: { after: "Login Flow" }
}
```

#### Strategy 2: **Based on Cursor Position**
```
Document:
## Login Flow
Content...

## Password Reset    ← Your cursor here!
                        
         ↓
User: "add prerequisites"
         ↓
AI places: AFTER "Password Reset" (where cursor is)
```

#### Strategy 3: **Default Placement**
```
User: "add a conclusion"
         ↓
AI: Doesn't specify → defaults to END of document
         ↓
Function call: {
    position: "end"
}
```

---

## 📊 Position Options

### In Function Calls:

```typescript
// Option 1: Start of document
position: "start"

// Option 2: End of document
position: "end"

// Option 3: After specific section
position: { after: "Installation" }

// Option 4: Before specific section
position: { before: "Conclusion" }
```

### Smart Section Matching:

The AI uses fuzzy matching:

```
User says: "after the install section"
AI matches: "Installation Steps" ✅ (partial match)

User says: "in security"
AI matches: "Security Best Practices" ✅

User says: "after auth"
AI matches: "Authentication" ✅
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────┐
│ Step 1: User Opens AI Chat                 │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 2: Detect Cursor Position              │
│ → Find cursor at position 1500              │
│ → Find nearest heading before cursor        │
│ → Result: "Password Reset Flow"             │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 3: Show Context in UI                  │
│ → Display: "Section: Password Reset Flow"   │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 4: User Asks for Content               │
│ → "add prerequisites"                       │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 5: AI Decides Position                 │
│                                             │
│ Option A: User specified position?          │
│ → "after login" → Use that! ✅              │
│                                             │
│ Option B: Use cursor context                │
│ → After "Password Reset Flow" ✅            │
│                                             │
│ Option C: Default                           │
│ → End of document                           │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 6: Generate & Stage Content            │
│ → Content created                           │
│ → Position determined                       │
│ → Show preview                              │
└─────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 7: User Accepts                        │
│ → Content inserted at determined position   │
└─────────────────────────────────────────────┘
```

---

## 💡 Examples

### Example 1: Using Cursor Position

```
Document:
## Introduction
Some text...

## Installation      ← Your cursor here!
Empty section...

## Configuration
Some text...
```

```
You: "add installation steps"
AI: [Generates content]
AI: [Places AFTER "Installation" - where cursor is]

Result:
## Installation
1. Clone the repository
2. Install dependencies
3. Run the application
```

### Example 2: Explicit Position

```
You: "add a Security section AFTER Configuration"
AI: [Understands: position = after "Configuration"]
AI: [Generates security content]
AI: [Places after Configuration section]

Result:
## Configuration
...

## Security          ← NEW!
- Use HTTPS
- Enable authentication
```

### Example 3: Default Position

```
You: "add a conclusion"
AI: [No position specified, no cursor context]
AI: [Defaults to END of document]

Result:
[... existing content ...]

## Conclusion        ← NEW! (at end)
This guide covered...
```

---

## 🎯 Best Practices

### For Users:

**✅ Good: Be Specific**
```
"add prerequisites BEFORE installation"
"add security section AFTER authentication"
"insert troubleshooting at the end"
```

**✅ Good: Use Cursor Position**
```
1. Place cursor where you want content
2. Say: "add a section here"
3. AI uses cursor position ✅
```

**❌ Avoid: Vague Requests**
```
"add something"  ← Where? What?
"make it better" ← Which section?
```

---

## 🚀 Future Improvements

### Idea 1: Visual Position Picker
```
[Select where to insert:]
○ Start of document
● After "Installation"  ← Selected
○ Before "Conclusion"
○ End of document
```

### Idea 2: Preview with Position
```
📝 PREVIEW
Position: After "Installation" ↓

## Prerequisites    ← Will be inserted here!
- Node.js 18+
- PostgreSQL

[Change Position] [Accept] [Cancel]
```

### Idea 3: Smart Suggestions
```
AI: "I'll add this section. Where should it go?"
Suggestions:
• After "Installation" (recommended)
• Before "Configuration"
• At the end
```

---

## 🔧 How to Control Position

### Method 1: Move Your Cursor
```
1. Click where you want content
2. Open AI chat
3. Request content
4. AI uses cursor position ✅
```

### Method 2: Specify in Request
```
"add X AFTER Y"
"insert X BEFORE Y"
"add X at the START"
"add X at the END"
```

### Method 3: Use Preview Buttons (Future)
```
[Preview shown]
Position: After "Installation"
[Change Position ↕]
```

---

## 📊 Decision Priority

When deciding where to place content:

```
1. **Explicit Position** (highest priority)
   User says: "after installation"
   → Use that position ✅

2. **Cursor Context** (medium priority)
   Cursor in "Security" section
   → Place after "Security" ✅

3. **Semantic Understanding** (medium priority)
   User adds "prerequisites"
   AI knows: belongs at START
   → Place at start ✅

4. **Default** (lowest priority)
   No clues
   → Place at END
```

---

## 🎊 Summary

### The "Section:" Indicator:
- Shows **where your cursor is**
- Provides **context** to the AI
- Helps **decide placement**

### Position Detection:
- Uses **cursor position**
- Respects **explicit instructions**
- Falls back to **smart defaults**

### How to Control:
- **Move cursor** where you want content
- **Specify position** in request ("after X")
- **Accept/modify** in preview

---

**Now you understand the placement system!** 🎯

The AI is context-aware and tries to be smart about WHERE content goes, but you can always override with explicit instructions! 💪

