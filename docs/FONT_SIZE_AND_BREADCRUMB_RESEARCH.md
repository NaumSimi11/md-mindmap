# 🔍 **FONT SIZE & BREADCRUMB RESEARCH**

## 📋 **TWO QUESTIONS TO ANSWER**

1. **Font Size Control:** Where and how to add font size control in the WYSIWYG editor?
2. **Top Bar Breadcrumb:** What should appear in the breadcrumb when in editor mode?

---

## 1️⃣ **FONT SIZE CONTROL RESEARCH**

### **🔍 CURRENT STATE**

#### **What We Have:**
- ✅ **Font Family Dropdown** - 12 fonts (Sans Serif, Serif, Monospace, etc.)
- ✅ **Format Dropdown** - Bold, Italic, Headings, Lists, etc.
- ✅ **Context Menu** - Right-click on selected text
- ✅ **Floating Toolbar** - Appears on text selection
- ✅ **TipTap Extensions:**
  - `TextStyle` - For inline text styling
  - `FontFamily` - For font family changes
  - ❌ **NO `FontSize` extension!**

#### **What We DON'T Have:**
- ❌ Font size control
- ❌ TipTap doesn't include a built-in `FontSize` extension

---

### **🎯 SOLUTION: CREATE CUSTOM FONT SIZE EXTENSION**

TipTap requires a custom extension for font size. Here's the research:

#### **Option 1: Custom FontSize Extension** ⭐ **RECOMMENDED**
```typescript
import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',
  
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});
```

#### **Font Size Options:**
```typescript
const fontSizes = [
  { name: 'Small', value: '12px' },
  { name: 'Normal', value: '16px' },
  { name: 'Medium', value: '18px' },
  { name: 'Large', value: '24px' },
  { name: 'Extra Large', value: '32px' },
  { name: 'Huge', value: '48px' },
];
```

---

### **📍 WHERE TO PLACE FONT SIZE CONTROL?**

#### **Option A: Main Toolbar** ⭐ **BEST**
```
┌────────────────────────────────────────────────────┐
│ [Format] [Font Family] [Font Size] [Diagram] ...  │
└────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Always visible
- ✅ Consistent with Font Family dropdown
- ✅ Easy to discover
- ✅ Works for any text (selected or at cursor)

**Cons:**
- ❌ Takes toolbar space

---

#### **Option B: Format Dropdown**
```
Format Dropdown:
├── Text Style
│   ├── Bold
│   ├── Italic
│   ├── Font Size ← NEW
│   └── ...
```

**Pros:**
- ✅ Organized with other text formatting
- ✅ Doesn't clutter toolbar

**Cons:**
- ❌ Hidden in dropdown (less discoverable)
- ❌ Extra click required

---

#### **Option C: Context Menu** (Right-click)
```
Right-click on selected text:
├── Bold
├── Italic
├── Font Size ← NEW
└── ...
```

**Pros:**
- ✅ Contextual
- ✅ Quick access

**Cons:**
- ❌ Only works on selected text
- ❌ Not discoverable for new users

---

#### **Option D: Floating Toolbar** (Selection)
```
When text is selected:
[B] [I] [U] [Font Size] [Color]
```

**Pros:**
- ✅ Appears on selection
- ✅ Quick access

**Cons:**
- ❌ Only works on selected text
- ❌ Toolbar is already crowded

---

### **🏆 RECOMMENDATION: OPTION A (Main Toolbar)**

**Why?**
1. ✅ **Consistent** - Matches Font Family dropdown
2. ✅ **Always visible** - Easy to find
3. ✅ **Works everywhere** - Selected text or cursor position
4. ✅ **Professional** - Standard in word processors (Word, Google Docs)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [Format] [Font Family ▼] [Font Size ▼] [Diagram] [AI]    │
└────────────────────────────────────────────────────────────┘
```

---

### **🎨 PROPOSED UI**

#### **FontSizeDropdown Component:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button size="sm" variant="outline" className="gap-1 min-w-[80px]">
      <Type className="h-4 w-4" />
      <span className="text-xs">{currentSize || '16px'}</span>
      <ChevronDown className="h-3 w-3 ml-auto" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-40" align="start">
    <DropdownMenuLabel className="text-xs">Font Size</DropdownMenuLabel>
    <DropdownMenuSeparator />
    {fontSizes.map((size) => (
      <DropdownMenuItem
        key={size.value}
        onClick={() => setFontSize(size.value)}
        className={currentSize === size.value ? 'bg-accent' : ''}
      >
        <span style={{ fontSize: size.value }}>{size.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{size.value}</span>
      </DropdownMenuItem>
    ))}
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => unsetFontSize()}>
      <span className="text-xs text-muted-foreground">Reset to default</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### **📋 IMPLEMENTATION CHECKLIST**

- [ ] Create `FontSize` TipTap extension
- [ ] Create `FontSizeDropdown` component
- [ ] Add `FontSize` to editor extensions
- [ ] Add `FontSizeDropdown` to toolbar (after Font Family)
- [ ] Add keyboard shortcut (optional): `Ctrl+Shift+>` (increase), `Ctrl+Shift+<` (decrease)
- [ ] Update keyboard shortcuts panel
- [ ] Test with markdown round-trip
- [ ] Add to context menu (optional)

---

## 2️⃣ **TOP BAR BREADCRUMB RESEARCH**

### **🔍 CURRENT STATE**

#### **What We See:**
```
When in Editor (viewMode === 'edit'):
┌────────────────────────────────────────────────────┐
│ MD Creator / Untitled Document / ???               │
│                                   [Prepare Pres]   │
└────────────────────────────────────────────────────┘
```

#### **What We See in Other Modes:**
```
When in Mindmap (viewMode === 'mindmap'):
┌────────────────────────────────────────────────────┐
│ MD Creator / Document Title / 🧠 Mindmap           │
└────────────────────────────────────────────────────┘

When in Presentation (viewMode === 'presentation'):
┌────────────────────────────────────────────────────┐
│ MD Creator / Document Title / 📊 Presentation      │
└────────────────────────────────────────────────────┘
```

---

### **🎯 THE PROBLEM**

**Current Code:**
```tsx
{/* View Mode Indicator */}
{viewMode && viewMode !== 'editor' && (
  <>
    <span className="text-muted-foreground">/</span>
    <span className="text-sm font-medium text-primary px-2 py-1 rounded-md bg-primary/10">
      {viewMode === 'mindmap' && '🧠 Mindmap'}
      {viewMode === 'presentation' && '📊 Presentation'}
    </span>
  </>
)}
```

**Issue:** The condition `viewMode !== 'editor'` means nothing shows when `viewMode === 'edit'`!

---

### **🏆 SOLUTION OPTIONS**

#### **Option 1: Show "Editor" Badge** ⭐ **RECOMMENDED**
```
MD Creator / Untitled Document / ✍️ Editor
```

**Why?**
- ✅ Consistent with other modes
- ✅ Clear indication of current view
- ✅ Helps user understand where they are

**Code:**
```tsx
{viewMode && viewMode !== 'home' && (
  <>
    <span className="text-muted-foreground">/</span>
    <span className="text-sm font-medium text-primary px-2 py-1 rounded-md bg-primary/10">
      {viewMode === 'edit' && '✍️ Editor'}
      {viewMode === 'mindmap' && '🧠 Mindmap'}
      {viewMode === 'presentation' && '📊 Presentation'}
    </span>
  </>
)}
```

---

#### **Option 2: Show Editor Type**
```
MD Creator / Untitled Document / 📝 WYSIWYG
```

**Why?**
- ✅ More specific
- ✅ Indicates editor mode

**Cons:**
- ❌ Too technical for users
- ❌ Longer text

---

#### **Option 3: Show Document Type**
```
MD Creator / Untitled Document / 📄 Markdown
```

**Why?**
- ✅ Indicates file type
- ✅ Useful for multi-format support

**Cons:**
- ❌ Not as clear as "Editor"
- ❌ Might confuse users

---

#### **Option 4: Show Nothing** (Current)
```
MD Creator / Untitled Document
```

**Why?**
- ✅ Clean, minimal

**Cons:**
- ❌ Inconsistent with other modes
- ❌ User doesn't know current view

---

### **🏆 FINAL RECOMMENDATION: OPTION 1**

**Show "✍️ Editor" badge when in edit mode**

```tsx
{viewMode && viewMode !== 'home' && (
  <>
    <span className="text-muted-foreground">/</span>
    <span className="text-sm font-medium text-primary px-2 py-1 rounded-md bg-primary/10">
      {viewMode === 'edit' && '✍️ Editor'}
      {viewMode === 'mindmap' && '🧠 Mindmap'}
      {viewMode === 'presentation' && '📊 Presentation'}
    </span>
  </>
)}
```

**Result:**
```
┌────────────────────────────────────────────────────┐
│ MD Creator / Untitled Document / ✍️ Editor         │
│                                   [Prepare Pres]   │
└────────────────────────────────────────────────────┘
```

---

## 🎨 **VISUAL MOCKUPS**

### **Before:**
```
┌─────────────────────────────────────────────────────────────┐
│ MD Creator / Untitled Document                              │
│                                      [Prepare Presentation] │
│                                      | Guest | Login | 🌙   │
└─────────────────────────────────────────────────────────────┘
```

### **After (with both fixes):**
```
┌─────────────────────────────────────────────────────────────┐
│ MD Creator / Untitled Document / ✍️ Editor                  │
│                                      [Prepare Presentation] │
│                                      | Guest | Login | 🌙   │
└─────────────────────────────────────────────────────────────┘

Editor Toolbar:
┌─────────────────────────────────────────────────────────────┐
│ [Format▼] [Font Family▼] [Font Size▼] [Diagram] [AI]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **IMPLEMENTATION SUMMARY**

### **Font Size Control:**
1. ✅ Create `FontSize` TipTap extension
2. ✅ Create `FontSizeDropdown` component
3. ✅ Add to toolbar (after Font Family)
4. ✅ 6 size options (12px - 48px)
5. ✅ Preview in dropdown
6. ✅ Reset to default option

### **Breadcrumb Fix:**
1. ✅ Change condition from `viewMode !== 'editor'` to `viewMode !== 'home'`
2. ✅ Add `{viewMode === 'edit' && '✍️ Editor'}` case
3. ✅ Consistent badge styling

---

## 🚀 **READY TO IMPLEMENT!**

**Which would you like me to do first?**
1. **Font Size Control** (Create extension + dropdown)
2. **Breadcrumb Fix** (Quick 2-minute fix)
3. **Both!** (I'll do both in sequence)

Let me know and I'll proceed! 🎉

