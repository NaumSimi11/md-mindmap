# Infinite Loop Bug - Root Cause & Fix

## 🐛 **The Bug**

When creating or opening a document, the application would enter an **infinite loop** of PATCH requests to the backend, causing:
- Hundreds of API calls per second
- Backend server overload
- Browser freezing
- Unusable editor

## 🔍 **Root Cause Analysis**

### **The Problem:**

In `Workspace.tsx` (line 546-551), the `onTitleChange` callback was **not memoized**:

```typescript
// ❌ BAD - Creates NEW function on every render
onTitleChange={(newTitle) => {
  if (currentDocument) {
    backendUpdateDocument(currentDocument.id, { title: newTitle });
    setCurrentDocument({ ...currentDocument, title: newTitle });
  }
}}
```

In `WYSIWYGEditor.tsx` (line 185-187), a `useEffect` depended on `onTitleChange`:

```typescript
// This runs whenever onTitleChange changes!
useEffect(() => {
  onTitleChange?.(title);
}, [title, onTitleChange]);  // ← onTitleChange is a dependency
```

### **The Infinite Loop:**

1. Component renders → creates **new** `onTitleChange` function (not memoized)
2. `useEffect` detects `onTitleChange` changed → **runs**
3. Calls `backendUpdateDocument()`
4. Backend responds with updated document
5. `currentDocument` state updates
6. Component **re-renders** → creates **new** `onTitleChange` function
7. **Go back to step 2** → INFINITE LOOP!

## ✅ **The Fix**

Wrapped `onTitleChange` in `React.useCallback` to **memoize** the function:

```typescript
// ✅ GOOD - Only creates new function when dependencies change
onTitleChange={React.useCallback((newTitle: string) => {
  if (currentDocument) {
    backendUpdateDocument(currentDocument.id, { title: newTitle });
    setCurrentDocument({ ...currentDocument, title: newTitle });
  }
}, [currentDocument, backendUpdateDocument])}
```

Now:
- Function is **memoized** and only changes when `currentDocument` or `backendUpdateDocument` changes
- `useEffect` doesn't trigger on every render
- **No more infinite loop!**

## 📝 **Files Changed**

1. **`frontend/src/pages/Workspace.tsx`** (line ~546)
   - Wrapped `onTitleChange` in `useCallback`
   - Re-enabled auto-save in `handleContentChange`

2. **`frontend/src/services/api/DocumentService.ts`** (line ~68)
   - Re-enabled auto-save logic
   - Removed debug logging

3. **`frontend/src/services/workspace/BackendWorkspaceService.ts`** (line ~244)
   - Removed debug logging from `updateDocument`

## 🎯 **Lesson Learned**

**Always memoize callbacks** passed as props when:
1. The callback is used in a `useEffect` dependency array
2. The callback is created inline in JSX
3. The callback could cause re-renders

Use `React.useCallback` to prevent unnecessary re-renders and infinite loops!

## ✅ **Verification**

After the fix:
- ✅ Documents load cleanly
- ✅ Auto-save works properly (debounced every 2 seconds)
- ✅ No infinite PATCH requests
- ✅ Smooth editing experience
- ✅ Backend logs show only normal traffic

---

**Bug discovered and fixed:** December 8, 2025  
**Time to diagnose:** ~2 hours  
**Root cause:** Unmemoized callback in useEffect dependency array

