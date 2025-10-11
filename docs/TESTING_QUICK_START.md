# 🧪 Quick Testing Guide - AI & Context Features

**Last Updated:** October 7, 2025  
**Ready to Test:** YES ✅

---

## 🚀 What's Ready to Test

### ✅ **COMPLETED:**
1. **Smart AI Modal** - New AI interface with Quick Actions
2. **AI Service Integration** - Connected to OpenAI API
3. **Context Files Integration** - Use uploaded files as AI context
4. **Context Persistence** - Saves to localStorage (per document)
5. **AI Result Insertion** - Inserts generated text into editor

---

## 🔑 Setup (Required!)

### **Step 1: Add OpenAI API Key**

Create or edit `.env` file in the root:

```env
VITE_OPENAI_API_KEY=sk-your-actual-key-here
```

**Where to get API key:**
- Go to: https://platform.openai.com/api-keys
- Create new secret key
- Copy and paste into `.env`

**Important:** Restart dev server after adding key:
```bash
npm run dev
```

---

## 📋 Testing Checklist

### **Test 1: Basic AI Generation (No Context)**

**Steps:**
1. Open a document in workspace
2. Click **✨ AI** button in toolbar
3. Click **"Write for me"** Quick Action
4. Type: "the benefits of exercise"
5. Click **Generate**

**Expected:**
- ✅ AI generates paragraph about exercise
- ✅ Text inserted into editor
- ✅ Toast notification "Content generated!"

---

### **Test 2: Context Files Upload**

**Steps:**
1. Create a `.txt` file on desktop with content:
   ```
   Research Notes:
   - Walking improves cardiovascular health
   - 30 minutes daily reduces stress
   - Helps maintain healthy weight
   ```
2. In sidebar, click **Context** tab
3. Click **Add Folder** → name it "Research"
4. Click **Add File** → upload your `.txt` file
5. Click file to preview → verify content shows

**Expected:**
- ✅ File appears in folder
- ✅ Preview shows file content
- ✅ File saved (refresh page, still there!)

---

### **Test 3: AI with Context**

**Steps:**
1. With research file uploaded (from Test 2)
2. Click **✨ AI** button
3. In "Context Files" section, **check the box** next to your file
4. Click **"Summarize"** Quick Action
5. Type: "Summarize the key points"
6. Click **Generate**

**Expected:**
- ✅ AI reads your file content
- ✅ Generates summary based on YOUR data
- ✅ Summary appears in editor

---

### **Test 4: Improve Text with AI**

**Steps:**
1. Type in editor: "exercise is good you should do it"
2. Select that text
3. Click **✨ AI** button
4. Notice it says "Working with 6 selected words"
5. Click **"Improve text"** Quick Action
6. Click **Generate**

**Expected:**
- ✅ AI improves grammar and style
- ✅ Better version inserted below original
- ✅ Professional tone

---

### **Test 5: Context Persistence**

**Steps:**
1. Upload files to Context tab
2. Close browser tab completely
3. Reopen document
4. Check Context tab

**Expected:**
- ✅ All files still there!
- ✅ Content preserved

---

### **Test 6: Multiple Context Files**

**Steps:**
1. Upload 2-3 different `.txt` files
2. Click **✨ AI**
3. Check ALL files
4. Type prompt: "Compare these sources"
5. Generate

**Expected:**
- ✅ AI reads all selected files
- ✅ Generates analysis comparing them

---

## ⚠️ Troubleshooting

### **"AI service not configured" Warning**

**Problem:** Yellow warning banner in modal  
**Fix:**
1. Check `.env` file exists
2. Check `VITE_OPENAI_API_KEY` is set
3. Restart dev server (`npm run dev`)
4. Refresh browser

---

### **No Response from AI**

**Check:**
- Console for errors (F12 → Console tab)
- Network tab for API calls
- API key is valid (not expired)
- You have OpenAI credits

---

### **Context Files Not Showing**

**Check:**
- File is `.txt` or `.md` (only these load content)
- File uploaded successfully (check folder)
- Refresh the AI modal

---

### **Files Lost After Refresh**

**Problem:** Context files disappear  
**Check:**
- localStorage not cleared
- Same document opened (files are per-document)
- Browser not in incognito mode

---

## 🎯 Quick Actions Explained

| Action | Purpose | Best For |
|--------|---------|----------|
| **Write for me** | Generate new content | Starting from scratch |
| **Improve text** | Enhance selected text | Polishing drafts |
| **Summarize** | Condense long content | TL;DR generation |
| **Extract tasks** | Find action items | Meeting notes |
| **Brainstorm** | Generate ideas | Creative thinking |
| **Auto-format** | Add markdown structure | Unformatted text |

---

## 💡 Pro Tips

### **Tip 1: Better Prompts**
```
❌ Bad: "write something"
✅ Good: "Write a professional email introducing our new product"
```

### **Tip 2: Use Context Wisely**
- Only check files relevant to your prompt
- More files = more tokens = slower/expensive

### **Tip 3: Iterative Improvement**
1. Generate initial content
2. Select part of it
3. Use "Improve" to refine
4. Repeat!

### **Tip 4: Organize Context**
- Create folders by topic
- Name files descriptively
- Keep files small (<10KB for speed)

---

## 📊 Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| AI Generation (no context) | 2-5 seconds |
| AI Generation (with context) | 5-10 seconds |
| File upload (.txt) | Instant |
| File preview | Instant |
| Context save | Instant (auto) |

---

## 🐛 Known Limitations

1. **PDF files** - Can upload, but can't read content yet
2. **Word files** - Can upload, but can't read content yet
3. **Large files** - May be slow (>1MB)
4. **Binary files** - Preview not available

**Coming Soon:**
- PDF text extraction
- Word document parsing
- Image context (OCR)

---

## ✅ Success Criteria

**You'll know it's working when:**

1. ✅ Upload `.txt` file → Preview shows content
2. ✅ Click AI → See your files listed
3. ✅ Check file → Generate → Text appears in editor
4. ✅ Refresh page → Files still there
5. ✅ AI uses file content in response

**All 5 working? You're good to go!** 🎉

---

## 📞 Still Having Issues?

**Check these files for errors:**
- Console (F12)
- `.env` file format
- `docs/AI_SETUP.md` for detailed setup

**Quick Debug:**
```javascript
// In browser console:
localStorage.getItem('context-folders-YOUR_DOC_ID')
// Should show saved folders
```

---

## 🎉 Example Workflow

**Research Paper Writing:**

1. Upload research papers (`.txt` versions)
2. Click AI → Check relevant papers
3. Prompt: "Based on these papers, write an introduction"
4. Review output
5. Select paragraph → "Improve text"
6. Continue iterating!

**Meeting Notes Processing:**

1. Paste raw notes in editor
2. Click AI → "Extract tasks"
3. Get formatted action items
4. Click AI → "Summarize"
5. Get executive summary

---

**Happy Testing! 🚀**

Questions? Check `docs/CONTEXT_AI_INTEGRATION.md` for full documentation.

