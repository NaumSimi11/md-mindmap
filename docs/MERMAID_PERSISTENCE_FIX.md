# 🐛 Mermaid Diagram Persistence Fix

## Problem
- ❌ Insert diagram → Renders correctly
- ❌ Refresh page → Shows plain text instead of diagram

## Root Cause
When content is saved, diagrams are stored as markdown (` ```mermaid ` blocks). 

On page refresh:
1. Content loads as markdown from storage
2. `markdownToHtml()` converts it using `markdown-it`
3. **BUT** `markdown-it` converts ` ```mermaid ` to `<pre><code>` (standard code block)
4. `MermaidNode.parseHTML()` expects `<div data-type="mermaid" data-code="...">` 
5. ❌ No match = plain text shown

## Solution ✅
Modified `markdownToHtml()` to:
1. **Detect** mermaid blocks BEFORE markdown-it conversion
2. **Extract** the mermaid code
3. **Convert** to proper HTML: `<div data-type="mermaid" data-code="...">`
4. **Let** markdown-it handle regular content

## Code Changes

### Before (Broken):
```typescript
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  if (markdown.startsWith('<')) return markdown;
  
  return md.render(markdown); // ❌ Converts ```mermaid to <pre><code>
};
```

### After (Fixed):
```typescript
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  if (markdown.startsWith('<')) return markdown;
  
  // Split by mermaid blocks
  const mermaidRegex = /(```mermaid[\s\S]*?```)/g;
  const parts = markdown.split(mermaidRegex);
  
  let html = '';
  parts.forEach((part) => {
    if (part.startsWith('```mermaid')) {
      // Extract code and create proper HTML div
      const code = part
        .replace(/```mermaid[\r\n]+/, '')
        .replace(/[\r\n]*```$/, '')
        .trim();
      
      html += `<div data-type="mermaid" data-code="${code}"></div>`;
    } else {
      // Regular markdown
      html += md.render(part);
    }
  });
  
  return html;
};
```

## Testing

### Test 1: Insert & Refresh
1. ✅ Insert diagram (Flowchart, Sequence, etc.)
2. ✅ See rendered diagram
3. ✅ Refresh page (F5 or Cmd+R)
4. ✅ Diagram still renders correctly

### Test 2: Multiple Diagrams
1. ✅ Insert multiple diagrams in one document
2. ✅ Add text between them
3. ✅ Refresh page
4. ✅ All diagrams render + text preserved

### Test 3: Markdown Mode Toggle
1. ✅ Insert diagram in WYSIWYG
2. ✅ Toggle to Markdown mode
3. ✅ See ` ```mermaid ` code block
4. ✅ Toggle back to WYSIWYG
5. ✅ Diagram renders

## Files Changed
- `src/components/editor/WYSIWYGEditor.tsx` (line 142-179)

## Status
✅ **FIXED** - Diagrams now persist correctly after page refresh!

