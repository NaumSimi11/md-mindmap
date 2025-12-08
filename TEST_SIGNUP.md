# 🧪 Test Signup Flow

## Quick Test Command

After you signup, run this to see your user in the database:

```bash
cd backend
.\venv\Scripts\Activate.ps1
python -c "from app.database import SessionLocal; from app.models.user import User; db = SessionLocal(); users = db.query(User).all(); [print(f'\n✅ User Created:\n   ID: {u.id}\n   Username: {u.username}\n   Email: {u.email}\n   Name: {u.full_name}\n   Active: {u.is_active}\n   Created: {u.created_at}') for u in users]; db.close()"
```

## Expected Result

```
✅ User Created:
   ID: some-uuid-here
   Username: naum
   Email: naum@example.com
   Name: Naum
   Active: True
   Created: 2025-12-06 00:XX:XX
```

## Test Credentials

After signup, test login with:
- **Email**: naum@example.com
- **Password**: Kozuvcanka#1

Go to: http://localhost:5173/login

Should redirect to: http://localhost:5173/workspace

---

## What Should Happen

1. **Signup** → Creates user in database
2. **Returns JWT tokens** → Stored in localStorage
3. **Redirects to /workspace** → Protected route
4. **Welcome toast** → "🎉 Welcome aboard!"

---

## If It Still Fails

Check:
1. **Backend is running**: http://localhost:8000/docs
2. **Frontend refreshed**: Hard refresh (Ctrl+Shift+R)
3. **Console errors**: Open DevTools → Console tab
4. **Network tab**: Check request/response
5. **Backend logs**: Look at terminal running backend


