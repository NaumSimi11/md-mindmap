# 🚀 **HOW TO START THE PROJECT**

**Complete guide to starting all services**

---

## 📋 **QUICK START (Recommended)**
 Stop everything
./stop-services.sh

# Start again (keep data)
./start-services.sh

# Fresh start (wipe DB + seed users)
./start-services.sh --clean --with-user

# Check status
./check-services.sh

# View logs
tail -f /tmp/mdreader-backend.log
tail -f /tmp/mdreader-frontend.log


clear storage and indexeddb :

run in dev tools consoel 

// Clear IndexedDB
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    indexedDB.deleteDatabase(db.name);
    console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
  });
});

// Clear localStorage
localStorage.clear();
console.log('🗑️ Cleared localStorage');

// Clear sessionStorage
sessionStorage.clear();
console.log('🗑️ Cleared sessionStorage');

// Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log('🗑️ Cleared cookies');

console.log('✅ All browser storage cleared! Reload the page.');

---

## 🎉 **NEW FEATURE: BATCH DOCUMENT SYNC**

**What is it?**
- Sync multiple documents in **1 API call** instead of N calls
- Automatically triggered on login
- **6-13x faster** than individual sync

**How to test:**
1. **Logout** (go offline)
2. **Create 5-10 documents** with content
3. **Login** (go online)
4. **Check console** for batch sync logs:
   ```
   🔄 [SyncContext] Starting batch sync after login...
   📦 [BatchSync] Collected 5 pending operations
   ☁️ [BatchSync] Pushing 5 operations to cloud...
   ✅ [BatchSync] Batch completed: 5/5 successful
   ```
5. **Verify** all documents show "synced" icon

**Documentation:**
- 📖 Full docs: `BATCH_SYNC_DOCUMENTATION.md`
- 📊 Visual guide: `BATCH_SYNC_VISUAL.md`
- 📝 Summary: `BATCH_SYNC_SUMMARY.md`

---

