# ✅ TEST CHECKLIST - Do This NOW!

**Time**: 15 minutes  
**Goal**: Verify everything works from login to editing

---

## 🎯 **Test 1: LOGIN** (5 min)

### Steps:
1. Open: http://localhost:5173/login
2. Enter credentials:
   ```
   Email: naum@example.com
   Password: Kozuvcanka#1
   ```
3. Click "Sign In"

### ✅ Success Looks Like:
- No error message
- Redirects to `/workspace`
- Can see workspace home page

### ❌ If It Fails:
- Screenshot the error
- Open browser console (F12)
- Copy the error message
- Check Terminal 18 (backend logs)

---

## 🎯 **Test 2: WORKSPACE HOME** (5 min)

### Steps:
1. You should be at: http://localhost:5173/workspace
2. Look for:
   - "New Document" button or "+" button
   - List of existing documents (or empty state)

### ✅ Success Looks Like:
- Page loads without errors
- Can see the UI (not blank page)
- Browser console shows: `✅ Workspace loaded: My Workspace`

### ❌ If It Fails:
- Blank page? → Check browser console
- Loading forever? → Check backend logs
- Error? → Screenshot and share

---

## 🎯 **Test 3: CREATE DOCUMENT** (5 min)

### Steps:
1. Click "New Document" or "+" button
2. Modal should open
3. Enter title: "Test Document"
4. Click "Create" or "Save"

### ✅ Success Looks Like:
- Modal closes
- Navigates to: `/workspace/doc/[some-id]/edit`
- Editor loads with empty content

### Check Backend Logs (Terminal 18):
```
Should see:
POST /api/v1/documents/ 201 Created

Should NOT see:
Hundreds of PATCH requests!
```

### ❌ If It Fails:
- Modal doesn't open? → Button not wired up
- Create fails? → Check backend logs
- No navigation? → Route issue

---

## 🎯 **Test 4: EDITOR & AUTO-SAVE** (5 min)

### Steps:
1. You should be in the editor
2. Type: "Hello world, this is a test!"
3. Wait 3 seconds
4. Check browser console

### ✅ Success Looks Like:
**Browser Console**:
```
💾 Auto-saving document: [document-id]
⏭️ Content unchanged, skipping save (on subsequent unchanged saves)
```

**Backend Logs (Terminal 18)**:
```
PATCH /api/v1/documents/[id] 200 OK
(Only ONE request every 2-3 seconds, NOT hundreds!)
```

### Test Persistence:
1. Refresh the page (F5)
2. Content should still be there (loaded from backend)

### ❌ If It Fails:
- Infinite PATCH requests? → Share Terminal 18 logs
- Content doesn't save? → Check network tab
- Content doesn't persist? → Backend save failed

---

## 🎯 **Test 5: NAVIGATION** (2 min)

### Steps:
1. From editor, click back to workspace home
2. You should see your "Test Document" in the list
3. Click it again
4. Should open the editor with saved content

### ✅ Success Looks Like:
- Can navigate back and forth
- Document appears in list
- Content persists

---

## 📊 **Report Results**

After testing, report back:

```
Test 1 (Login): ✅ / ❌
Test 2 (Workspace): ✅ / ❌
Test 3 (Create Doc): ✅ / ❌
Test 4 (Auto-Save): ✅ / ❌
Test 5 (Navigation): ✅ / ❌

Issues encountered:
[Describe any issues]

Screenshots:
[Attach if needed]
```

---

## 🚨 **Common Issues & Quick Fixes**

### **Issue: "Invalid credentials" on login**
**Fix**: User might not exist. Try signup first:
```
http://localhost:5173/signup
Email: test@test.com
Username: testuser
Password: TestPass123
```

### **Issue: "Cannot read property of undefined"**
**Fix**: Hard refresh browser (Cmd+Shift+R)

### **Issue: Blank white page**
**Fix**: Check browser console, share error

### **Issue: "Network Error" or "ERR_CONNECTION_REFUSED"**
**Fix**: Backend not running. Restart:
```bash
cd /Users/naum/Desktop/mdreader/mdreader-main/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 7001 --reload
```

### **Issue: Infinite PATCH loop still happening**
**Fix**: 
1. Stop frontend (pkill -f "vite")
2. Restart: `cd frontend && npm run dev`
3. Hard refresh browser

---

## 🎯 **Bottom Line**

**Time to test**: 15 minutes  
**Goal**: Login → Workspace → Create Doc → Edit → Save  
**If all ✅**: We're ready for next features!  
**If any ❌**: We debug together with exact error messages

---

**START NOW** → http://localhost:5173/login 🚀

