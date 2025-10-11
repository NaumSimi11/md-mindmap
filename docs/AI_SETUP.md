# 🤖 AI Features Setup Guide

## ✅ What's Included:

All AI features are now **fully connected** to the AI service:
1. ✅ **AI Diagram Help** - Generate diagrams from text
2. ✅ **Smart AI Modal** - Content generation, summarization, etc.
3. ✅ **AI Autocomplete** - Inline suggestions
4. ✅ **Auto-format** - Structure your content

---

## 🚀 Quick Setup (2 minutes)

### **Step 1: Create `.env` file**

Create a new file called `.env` in the root directory (`mdreader-main/.env`):

```bash
# In the project root:
touch .env
```

### **Step 2: Add your API key**

Add this to your `.env` file:

```env
# Enable AI features
VITE_AI_ENABLED=true

# Default provider
VITE_AI_DEFAULT_PROVIDER=openai

# Your OpenAI API key
VITE_OPENAI_API_KEY=sk-your-actual-key-here

# Optional: Customize settings
VITE_OPENAI_MODEL=gpt-4
VITE_AI_MAX_TOKENS=2000
VITE_AI_TEMPERATURE=0.7
```

### **Step 3: Restart the dev server**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

**That's it!** All AI features will now work! 🎉

---

## 📋 All Configuration Options:

### **Required:**
```env
VITE_AI_ENABLED=true
VITE_AI_DEFAULT_PROVIDER=openai
VITE_OPENAI_API_KEY=your_key_here
```

### **Optional (with defaults):**
```env
# OpenAI Settings
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4

# Generation Settings
VITE_AI_MAX_TOKENS=2000
VITE_AI_TEMPERATURE=0.7
VITE_AI_TIMEOUT_MS=30000
VITE_AI_RETRY_ATTEMPTS=3
VITE_AI_RATE_LIMIT_PER_MINUTE=20

# Debug mode (logs requests)
VITE_AI_DEBUG=false
```

### **Alternative: Use Anthropic (Claude)**
```env
VITE_AI_DEFAULT_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=your_anthropic_key_here
VITE_ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

---

## 🧪 Test Your Setup:

### **Test 1: AI Diagram Help**
1. Open editor
2. Right-click → Select "Diagram"
3. Choose a diagram type (e.g., Flowchart)
4. Click "✨ AI Diagram Help"
5. Click any Quick Action
6. ✅ If configured correctly: Diagram generates in ~2-5 seconds
7. ❌ If not configured: Red error banner appears

### **Test 2: Smart AI Modal**
1. Write some text in editor
2. Select the text
3. Click "AI" button in toolbar
4. Click "Improve"
5. ✅ Success: Improved text appears
6. ❌ Error: Check your API key

### **Test 3: AI Autocomplete**
1. Enable "AI Autocomplete" toggle in toolbar
2. Start typing a heading: "# How to"
3. Wait 2 seconds
4. ✅ Success: Gray suggestion appears
5. Press `Tab` to accept

---

## ⚠️ Common Issues:

### **Issue 1: "AI service not configured"**

**Cause:** API key not found or invalid

**Solution:**
1. Check `.env` file exists in root directory
2. Check `VITE_OPENAI_API_KEY=sk-...` (must start with `sk-`)
3. Restart dev server
4. Check console for errors

---

### **Issue 2: "Rate limit exceeded"**

**Cause:** Too many requests in 1 minute

**Solution:**
- Wait 60 seconds
- Or increase limit: `VITE_AI_RATE_LIMIT_PER_MINUTE=50`

---

### **Issue 3: "Request timed out"**

**Cause:** Slow network or complex prompt

**Solution:**
- Try again
- Or increase timeout: `VITE_AI_TIMEOUT_MS=60000`

---

### **Issue 4: Features not working after adding `.env`**

**Cause:** Server needs restart to read new env vars

**Solution:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 🔐 Security Notes:

1. ⚠️ **Never commit `.env` to git**
   - Already in `.gitignore`
   - Contains sensitive API keys

2. ✅ **API keys are safe**
   - Only loaded in your browser
   - Never sent to our servers
   - Direct connection to OpenAI/Anthropic

3. 💰 **Usage costs**
   - You pay for your own API usage
   - GPT-4 costs vary per token
   - Consider using GPT-3.5 for lower costs:
     ```env
     VITE_OPENAI_MODEL=gpt-3.5-turbo
     ```

---

## 📊 Where AI is Used:

### **1. AI Diagram Help** (`AIAssistantModal.tsx`)
- **What:** Generate/refine Mermaid diagrams
- **Tokens per request:** ~500
- **Temperature:** 0.7

### **2. Smart AI Modal** (`SmartAIModal.tsx`)
- **What:** Generate, improve, summarize content
- **Tokens per request:** ~1000
- **Temperature:** 0.7

### **3. AI Autocomplete** (`AIAutocompleteExtension.tsx`)
- **What:** Inline suggestions while typing
- **Tokens per request:** ~200
- **Temperature:** 0.8
- **Cooldown:** 3 seconds

### **4. Auto-format** (`autoFormat.ts`)
- **What:** Structure unformatted text
- **Tokens per request:** ~500
- **Temperature:** 0.5

---

## 🎯 Recommended Settings:

### **For Development (Fast & Cheap):**
```env
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_AI_MAX_TOKENS=1000
VITE_AI_TEMPERATURE=0.7
```

### **For Production (Best Quality):**
```env
VITE_OPENAI_MODEL=gpt-4
VITE_AI_MAX_TOKENS=2000
VITE_AI_TEMPERATURE=0.7
```

### **For Debugging:**
```env
VITE_AI_DEBUG=true
```
This will log all AI requests/responses to the console.

---

## ✅ Verification Checklist:

- [ ] `.env` file created in root directory
- [ ] `VITE_AI_ENABLED=true` set
- [ ] `VITE_OPENAI_API_KEY` contains valid key (starts with `sk-`)
- [ ] Dev server restarted after adding `.env`
- [ ] Tested AI Diagram Help - works!
- [ ] Tested Smart AI Modal - works!
- [ ] No errors in browser console

---

## 🎉 You're All Set!

All AI features should now work seamlessly. Enjoy building with AI! 🚀

**Need help?** Check the console (F12) for detailed error messages.

