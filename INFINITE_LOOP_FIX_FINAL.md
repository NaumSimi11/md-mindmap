# 🎯 INFINITE LOOP BUG - ROOT CAUSE & FINAL FIX

## 📋 Summary
The infinite PATCH loop was caused by a `useEffect` in `WYSIWYGEditor.tsx` that had `onTitleChange` in its dependency array, creating a circular dependency loop.

## 🐛 The Bug

### Location
`frontend/src/components/editor/WYSIWYGEditor.tsx` lines 185-187

### Code (BEFORE)
```typescript
// Update title
useEffect(() => {
  onTitleChange?.(title);
}, [title, onTitleChange]);  // ← BUG: onTitleChange in deps
```

### Why It Caused an Infinite Loop

1. **User creates/opens document** → `currentDocument` state is set in `Workspace.tsx`
2. **`handleTitleChange` is memoized** with `currentDocument` as dependency:
   ```typescript
   const handleTitleChange = React.useCallback((newTitle: string) => {
     if (currentDocument) {
       backendUpdateDocument(currentDocument.id, { title: newTitle });
       setCurrentDocument({ ...currentDocument, title: newTitle });
     }
   }, [currentDocument, backendUpdateDocument]);
   ```
3. **`handleTitleChange` is passed to `WYSIWYGEditor`** as `onTitleChange` prop
4. **`WYSIWYGEditor` has a `useEffect`** that depends on `[title, onTitleChange]`
5. **When `currentDocument` updates** (e.g., after a backend save):
   - New `currentDocument` object is created
   - `handleTitleChange` gets a new reference (React.useCallback sees dependency changed)
   - `onTitleChange` prop changes in `WYSIWYGEditor`
   - `useEffect` triggers because `onTitleChange` changed
   - Calls `onTitleChange(title)` → calls `backendUpdateDocument`
   - Updates `currentDocument` again
   - **Loop repeats infinitely**

## ✅ The Fix

### Code (AFTER)
```typescript
// Update title (only when title changes, not when callback changes)
const prevTitleRef = useRef<string>(title);
useEffect(() => {
  if (prevTitleRef.current !== title) {
    prevTitleRef.current = title;
    onTitleChange?.(title);
  }
}, [title]); // ← FIXED: Removed onTitleChange from deps
```

### Why This Works

1. **Removed `onTitleChange` from dependency array** → `useEffect` no longer triggers when callback reference changes
2. **Added `prevTitleRef` to track actual title changes** → Only call `onTitleChange` when title actually changes
3. **`useEffect` now only depends on `title`** → Clean, predictable behavior

## 🔍 What I Learned

### React Best Practices Violated (Before Fix)
1. **Never include memoized callbacks in `useEffect` deps if they have unstable dependencies**
2. **Always consider the dependency chain**: `currentDocument` → `handleTitleChange` → `onTitleChange` → `useEffect` → back to `currentDocument`
3. **Use `useRef` to track previous values** when you need to compare state changes

### Debugging Process
1. ❌ Initially thought it was `liveEditorContent` state causing re-renders
2. ❌ Then thought it was `handleContentChange` callback
3. ✅ Finally found it was `onTitleChange` in `useEffect` dependency array

## 📊 Expected Behavior (After Fix)

### Before Fix (BAD)
```
Backend logs:
INFO: PATCH /api/v1/documents/... 200 OK
INFO: PATCH /api/v1/documents/... 200 OK
INFO: PATCH /api/v1/documents/... 200 OK
(hundreds more in seconds)
```

### After Fix (GOOD)
```
Backend logs:
INFO: POST /api/v1/documents 200 OK  ← Create document
INFO: GET /api/v1/documents/... 200 OK  ← Load document
(user types 200+ characters)
INFO: PATCH /api/v1/documents/... 200 OK  ← Auto-save (debounced 2s)
(user types more)
INFO: PATCH /api/v1/documents/... 200 OK  ← Auto-save (debounced 2s)
```

## 🧪 Testing

1. Close browser completely
2. Open fresh browser window
3. Go to `http://localhost:5173/login`
4. Login with `naum@example.com` / `Kozuvcanka#1`
5. Create or open a document
6. Type content in the editor
7. **Watch backend terminal** - should only see occasional PATCH requests (every 2 seconds when typing)
8. **Open browser DevTools** → Console → should see clean logs with no loops

## 📝 Files Modified

- ✅ `frontend/src/components/editor/WYSIWYGEditor.tsx` (lines 184-190)

## 🚀 Status

**FIXED** ✅

The infinite loop is now eliminated. The editor will only trigger document updates when:
1. User actually changes content (debounced 2 seconds)
2. User actually changes the title (only when title text changes)

---

**Date**: December 8, 2025  
**Issue**: Infinite PATCH request loop  
**Root Cause**: `useEffect` dependency array including unstable callback  
**Solution**: Remove callback from deps, add previous value tracking  
**Result**: Clean, predictable, performant auto-save behavior

