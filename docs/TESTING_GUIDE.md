# 🧪 TESTING GUIDE - Workspace Buttons

## 🔍 **DEBUGGING THE BUTTONS**

I've added console logs to help debug. Here's what to check:

---

## 🚀 **HOW TO TEST**

### **1. Start the Dev Server**
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main
npm run dev
```

### **2. Open Browser Console**
- Open DevTools (F12 or Cmd+Option+I)
- Go to Console tab
- Keep it open while testing

### **3. Navigate to Workspace**
```
http://localhost:8080/workspace
```

---

## 🎯 **TEST EACH BUTTON**

### **Test 1: [+ New] Button (Top Right)**

**Expected**:
1. Click [+ New] button
2. Console shows: `🆕 Opening new document modal...`
3. Modal appears with template options
4. State log shows: `showNewDocModal: true`

**If it doesn't work**:
- Check console for errors
- Check if modal is rendering (look for `NewDocumentModal` in React DevTools)

---

### **Test 2: "New Document" Card**

**Expected**:
1. Click "New Document" card (first card)
2. Console shows: `🆕 Opening new document modal...`
3. Modal appears
4. State log shows: `showNewDocModal: true`

**If it doesn't work**:
- Same as Test 1

---

### **Test 3: "Quick Search" Card**

**Expected**:
1. Click "Quick Search" card (second card)
2. Console shows: `🔍 Opening quick switcher...`
3. Quick switcher modal appears
4. State log shows: `showQuickSwitcher: true`

**If it doesn't work**:
- Check console for errors
- Check if `QuickSwitcher` component exists

---

### **Test 4: "AI Generate" Card**

**Expected**:
1. Click "AI Generate" card (third card)
2. Redirects to `/` (AI Landing page)
3. No modal (this is correct!)

**Status**: ✅ This one works!

---

### **Test 5: Cmd+K Shortcut**

**Expected**:
1. Press Cmd+K (or Ctrl+K on Windows)
2. Console shows: `🔍 Opening quick switcher...`
3. Quick switcher modal appears

**If it doesn't work**:
- Check if keyboard event is being captured

---

## 🐛 **COMMON ISSUES**

### **Issue 1: Modal doesn't appear but console log shows**

**Cause**: Modal component might have rendering issues

**Fix**:
- Check if `NewDocumentModal` or `QuickSwitcher` have errors
- Check if they're wrapped in proper providers
- Check z-index (modal might be behind other elements)

---

### **Issue 2: Console log doesn't show**

**Cause**: Click event not firing

**Fix**:
- Check if button has `pointer-events: none` in CSS
- Check if button is disabled
- Check if there's an overlay blocking clicks

---

### **Issue 3: State changes but modal doesn't render**

**Cause**: Conditional rendering issue

**Check**:
```typescript
{showNewDocModal && (
  <NewDocumentModal ... />
)}
```

**Fix**:
- Verify the condition is correct
- Check if modal is returning `null`

---

## 📊 **CONSOLE OUTPUT TO EXPECT**

### **On Page Load**:
```
🔍 Workspace state: {
  viewMode: 'home',
  documentId: null,
  showQuickSwitcher: false,
  showNewDocModal: false,
  currentDocument: undefined
}
```

### **After Clicking [+ New]**:
```
🆕 Opening new document modal...
🔍 Workspace state: {
  viewMode: 'home',
  documentId: null,
  showQuickSwitcher: false,
  showNewDocModal: true,  ← Changed!
  currentDocument: undefined
}
```

### **After Clicking Quick Search**:
```
🔍 Opening quick switcher...
🔍 Workspace state: {
  viewMode: 'home',
  documentId: null,
  showQuickSwitcher: true,  ← Changed!
  showNewDocModal: false,
  currentDocument: undefined
}
```

---

## 🔧 **IF NOTHING WORKS**

### **Check 1: Are components imported?**
```typescript
import { NewDocumentModal } from '@/components/workspace/NewDocumentModal';
import { QuickSwitcher } from '@/components/workspace/QuickSwitcher';
```

### **Check 2: Do components exist?**
```bash
ls -la src/components/workspace/NewDocumentModal.tsx
ls -la src/components/workspace/QuickSwitcher.tsx
```

### **Check 3: Are they exported?**
```typescript
// In NewDocumentModal.tsx
export function NewDocumentModal(...) { ... }

// In QuickSwitcher.tsx
export function QuickSwitcher(...) { ... }
```

---

## 🚨 **REPORT BACK**

**After testing, tell me**:
1. Which buttons work?
2. Which buttons don't work?
3. What console logs do you see?
4. Any errors in console?

**I'll fix whatever isn't working!** 🔧

---

## 💡 **QUICK FIX IF MODALS DON'T EXIST**

If `NewDocumentModal` or `QuickSwitcher` don't exist, I can create simple versions:

```typescript
// Simple NewDocumentModal
export function NewDocumentModal({ onClose, onDocumentCreated }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg">
        <h2>New Document</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

**Let me know what you find!** 🕵️
