# 🚀 **PRESENTATION SYSTEM - QUICK START**

## ✅ **WHAT'S NEW**

We've completely upgraded the presentation generation system with:

1. **Pre-Generation Wizard** - Configure before generating
2. **6 Professional Themes** - Modern, Professional, Minimal, Dark, Vibrant, Corporate
3. **Smart Rate Limiting** - Prevents API errors before they happen
4. **Real-Time Progress** - See exactly what's happening
5. **Better Error Handling** - Clear, actionable messages

---

## 🎯 **HOW TO USE**

### **Step 1: Open Mindmap Studio 2**
Navigate to: `http://localhost:8084/workspace/doc/{your-doc-id}/mindmap`

### **Step 2: Create Your Mindmap**
Add nodes with your content.

### **Step 3: Click "Presentation" Button**
In the top-right corner of the toolbar.

### **Step 4: Configure in Wizard**

**Slide Count:**
- Use slider to select 3-20 slides
- See real-time API call estimation
- Warning if >20 calls (rate limit)

**Theme:**
- Choose from 6 professional themes
- Preview description for each

**Background:**
- Gradient (default)
- Solid color
- AI Image (Pro only, coming soon)

**Speaker Notes:**
- Toggle ON/OFF
- Adds +N API calls (where N = slide count)

**API Estimation:**
- Shows total calls needed
- Percentage of 20/min limit
- Color-coded warnings:
  - 🟢 Green: Safe (<15 calls)
  - 🟡 Yellow: Near limit (15-20 calls)
  - 🔴 Red: Over limit (>20 calls)

### **Step 5: Generate**
Click "Generate Presentation" button.

### **Step 6: Watch Progress**
Progress modal shows:
- Progress bar (0-100%)
- Current step
- API calls used (X/20)
- Estimated time remaining

### **Step 7: View Presentation**
Automatically navigates to presentation editor when complete!

---

## 🎨 **THEME EXAMPLES**

### **Modern (Default)**
- Purple/pink gradient background
- Clean, contemporary design
- Perfect for: Tech talks, startups, creative projects

### **Professional**
- Navy blue gradient
- Corporate, trustworthy
- Perfect for: Business presentations, reports, proposals

### **Minimal**
- Black & white
- Simple, elegant
- Perfect for: Academic papers, minimalist design, focus on content

### **Dark**
- Dark gradient with gold accents
- Tech-focused, modern
- Perfect for: Developer talks, tech demos, night mode

### **Vibrant**
- Pink/purple gradient
- Energetic, bold
- Perfect for: Marketing, creative pitches, energetic talks

### **Corporate**
- Green gradient
- Business-oriented
- Perfect for: Corporate training, sustainability, finance

---

## ⚠️ **RATE LIMIT GUIDE**

**Free Tier:** 20 API calls per minute

**How calls are calculated:**
```
Total Calls = 1 (structure) + N (slides) + N (notes if enabled)
```

**Examples:**
- 6 slides + notes = 1 + 6 + 6 = **13 calls** ✅ Safe
- 10 slides + notes = 1 + 10 + 10 = **21 calls** ❌ Over limit!
- 10 slides, no notes = 1 + 10 = **11 calls** ✅ Safe
- 15 slides + notes = 1 + 15 + 15 = **31 calls** ❌ Way over!

**Tips:**
- For 10+ slides, disable speaker notes
- Generate in batches (5-8 slides at a time)
- Wait 1 minute between large generations

---

## 🐛 **TROUBLESHOOTING**

### **"Too many API calls" error**
**Solution:** Reduce slide count or disable speaker notes.

### **"Rate limit exceeded" error**
**Solution:** Wait 1 minute and try again.

### **"API quota exceeded" error**
**Solution:** You've run out of free credits. Add your own API key or upgrade to Pro.

### **"Request timed out" error**
**Solution:** Try again with fewer slides.

### **Wizard won't open**
**Solution:** Make sure you have at least 1 node in your mindmap.

### **Progress stuck**
**Solution:** Check console for errors. Refresh page and try again.

---

## 💡 **PRO TIPS**

1. **Start Small:** Generate 5-6 slides first to test
2. **Use Templates:** Start with a template for better structure
3. **Disable Notes:** If you don't need speaker notes, turn them off to save API calls
4. **Choose Theme Wisely:** Match theme to your audience
5. **Check Estimation:** Always check the API call estimation before generating

---

## 🔮 **COMING SOON**

- AI-generated backgrounds (DALL-E)
- Custom theme builder
- Slide templates library
- Export to PPTX
- Animations & transitions
- Charts/graphs integration

---

## 📚 **MORE DOCS**

- **Full Research:** `docs/PRESENTATION_SYSTEM_RESEARCH.md`
- **Implementation Details:** `docs/PRESENTATION_SYSTEM_UPGRADE_COMPLETE.md`
- **Backend Plan:** `docs/BACKEND_IMPLEMENTATION_PLAN.md`

---

## ✅ **READY TO GO!**

Run the dev server and try it out:
```bash
npm run dev
```

Navigate to Mindmap Studio 2 and click "Presentation"! 🎉

