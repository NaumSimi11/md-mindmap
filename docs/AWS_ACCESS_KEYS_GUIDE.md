# 🔑 How to Get AWS Access Keys for CLI

**Problem**: You created an IAM user but don't see Access Key ID and Secret Access Key.

---

## ✅ **SOLUTION: Access Keys Are Created Separately**

The screen you're seeing shows **console login** credentials, not **programmatic access** keys.

---

## 🎯 **OPTION 1: If You Just Created the User**

When you created the user with "Programmatic access" enabled, AWS should show you the Access Keys on the **final step**. 

**Look for:**
- A section titled "Access keys" or "Access key credentials"
- Access Key ID: `AKIA...`
- Secret Access Key: `...` (long string)

**If you clicked through too fast:**
- The keys might be lost! (AWS only shows them once)
- Use Option 2 below to create new ones

---

## 🎯 **OPTION 2: Create Access Keys Manually (RECOMMENDED)**

### **Step-by-Step:**

1. **Go to**: IAM → Users
2. **Click** on your user: `mdreader-admin`
3. **Click** the "Security credentials" tab
4. **Scroll down** to "Access keys" section
5. **Click**: "Create access key"
6. **Choose use case**: 
   - Select: "Command Line Interface (CLI)" ✅
   - Check: "I understand the above recommendation..."
7. **Click**: "Next"
8. **Optional**: Add description tag (e.g., "CLI Access")
9. **Click**: "Create access key"

### **⚠️ CRITICAL: Save These Now!**

AWS will show you:
- **Access Key ID**: `AKIAIOSFODNN7EXAMPLE`
- **Secret Access Key**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**⚠️ This is the ONLY time you'll see the Secret Access Key!**

**Actions:**
1. ✅ **Copy both** to a secure password manager
2. ✅ **Download .csv file** (click "Download .csv file" button)
3. ✅ **Save CSV** in a secure location (NOT in git!)

---

## 🔧 **Configure AWS CLI**

Now that you have the keys:

```bash
aws configure
```

**Enter:**
- AWS Access Key ID: `AKIA...` (paste from above)
- AWS Secret Access Key: `...` (paste from above)
- Default region: `us-east-1`
- Default output format: `json`

**Test:**
```bash
aws sts get-caller-identity
```

Should return:
```json
{
    "UserId": "AIDA...",
    "Account": "916851444018",
    "Arn": "arn:aws:iam::916851444018:user/mdreader-admin"
}
```

✅ **Success!**

---

## 🔍 **Where to Find Your Keys**

**In AWS Console:**
1. IAM → Users → `mdreader-admin`
2. Security credentials tab
3. Access keys section

**Note**: You can see Access Key IDs, but **NOT** Secret Access Keys (for security). If you lose the Secret Access Key, you must create a new one.

---

## ⚠️ **SECURITY BEST PRACTICES**

1. ✅ **Never commit** Access Keys to git
2. ✅ **Never share** Access Keys publicly
3. ✅ **Use IAM roles** when possible (instead of access keys)
4. ✅ **Rotate** access keys regularly (every 90 days)
5. ✅ **Delete** unused access keys

---

## 🆘 **TROUBLESHOOTING**

**Issue**: "Access key not found"
- **Solution**: Make sure you enabled "Programmatic access" when creating the user

**Issue**: "Access denied" when running `aws configure`
- **Solution**: Check that your IAM user has the right permissions

**Issue**: "Unable to locate credentials"
- **Solution**: Run `aws configure` again with correct keys

---

**Need help?** Check `docs/AWS_SETUP_STEP_BY_STEP.md` for full setup guide! 🚀


