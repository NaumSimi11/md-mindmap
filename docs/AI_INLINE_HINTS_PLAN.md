# 🤖 AI Inline Hints Implementation Plan

> **Ghost Text Suggestions** - Like Gmail Smart Compose, GitHub Copilot, and Notion AI

---

## 📋 Research: Best Practices from Leading Platforms

### **1. Gmail Smart Compose**
**When it triggers:**
- ✅ After user **stops typing for 500ms** (debounce)
- ✅ At the **end of sentences** (after periods, commas)
- ✅ When starting **new paragraphs**
- ✅ When typing **common phrases** ("Looking forward to", "Thank you for")

**Where it appears:**
- Gray text at the **cursor position**
- Continues the current sentence naturally
- **Never interrupts** mid-word

**How to accept:**
- **Tab** or **→ (Right Arrow)** to accept
- Keep typing to ignore
- Disappears on **Esc** or new word

**Smart features:**
- Context-aware (reads previous sentences)
- Learns from your writing style
- Only suggests when **confidence is high**

---

### **2. GitHub Copilot**
**When it triggers:**
- After **300-500ms pause**
- When cursor is at **end of line**
- After typing **function declarations**, comments, or natural stopping points

**Where it appears:**
- Inline gray text
- Can suggest **multiple lines**

**How to accept:**
- **Tab** for full suggestion
- **Alt+]** for next suggestion
- **Alt+[** for previous suggestion

**Smart features:**
- Shows suggestions only when relevant
- Multiple suggestions available
- Code-context aware

---

### **3. Notion AI Autocomplete**
**When it triggers:**
- After **800ms-1s pause** (less aggressive)
- At **paragraph starts**
- When user types **Space Space** (manual trigger)

**Where it appears:**
- Floating gray text
- Block-level suggestions

**How to accept:**
- **Tab** to accept
- **Cmd+Enter** for AI menu

**Smart features:**
- Very conservative (doesn't distract)
- High-quality suggestions only
- Manual trigger option

---

### **4. Claude.ai / ChatGPT** (No inline hints)
- They DON'T use inline hints
- Reason: **Distracting for long-form content**
- Better to have **on-demand AI** instead

---

## 🎯 Our Strategy: Best of All Worlds

### **Core Principles:**
1. **Non-intrusive** - Don't distract from writing flow
2. **High confidence** - Only show when AI is sure
3. **Context-aware** - Read recent text for relevance
4. **Fast** - <500ms response time
5. **Smart triggering** - Know when to help vs. stay quiet

---

## ⚙️ Technical Implementation

### **Phase 1: Trigger Detection** ✅ (Start Here)

#### **When to trigger:**
```typescript
const shouldTriggerHint = (
  text: string,
  cursorPosition: number,
  timeSinceLastKeystroke: number
) => {
  // Rule 1: User stopped typing for 800ms
  if (timeSinceLastKeystroke < 800) return false;

  // Rule 2: Cursor at end of text (not editing middle)
  if (cursorPosition < text.length) return false;

  // Rule 3: Minimum context (at least 10 words)
  const words = text.trim().split(/\s+/).length;
  if (words < 10) return false;

  // Rule 4: Last character is a space or punctuation
  const lastChar = text[cursorPosition - 1];
  if (!/[\s.,!?;:]/.test(lastChar)) return false;

  // Rule 5: Not at the very start of document
  if (text.trim().length < 20) return false;

  return true;
};
```

#### **Context to send to AI:**
```typescript
const getContextForAI = (fullText: string, cursorPos: number) => {
  // Last 200 words or 1000 characters (whichever is smaller)
  const context = fullText.slice(Math.max(0, cursorPos - 1000), cursorPos);
  
  // Clean up context
  const cleaned = context.trim();
  
  return {
    context: cleaned,
    lastSentence: getLastSentence(cleaned),
    documentType: detectDocumentType(fullText), // essay, email, notes, etc.
  };
};
```

---

### **Phase 2: AI Request** 🤖

#### **Prompt Template:**
```typescript
const createSuggestionPrompt = (context: string) => `
You are a writing assistant. Continue the following text naturally.

RULES:
1. Provide ONLY the next 3-8 words
2. Match the writing style and tone
3. Be contextually relevant
4. Complete the current thought
5. Do NOT repeat the context
6. Do NOT use quotation marks

Context:
${context}

Next words:`;
```

#### **API Configuration:**
```typescript
const AI_CONFIG = {
  model: "gpt-3.5-turbo", // Fast and cheap
  maxTokens: 20, // ~10-15 words
  temperature: 0.7, // Balanced creativity
  stopSequences: ["\n\n", ".", "?", "!"], // Stop at sentence end
  timeout: 1500, // 1.5s max
};
```

---

### **Phase 3: Ghost Text Rendering** 👻

#### **Visual Design:**
```css
.ghost-text {
  color: #888; /* Gray */
  opacity: 0.6;
  font-style: italic;
  pointer-events: none;
  user-select: none;
}

/* Dark mode */
.dark .ghost-text {
  color: #666;
  opacity: 0.5;
}
```

#### **TipTap Decoration:**
```typescript
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const createGhostTextDecoration = (
  position: number,
  text: string
) => {
  return Decoration.widget(position, () => {
    const span = document.createElement('span');
    span.className = 'ghost-text';
    span.textContent = text;
    return span;
  });
};
```

---

### **Phase 4: User Interactions** ⌨️

#### **Keyboard Shortcuts:**
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  if (!ghostText) return;

  // Tab - Accept suggestion
  if (event.key === 'Tab') {
    event.preventDefault();
    acceptSuggestion();
  }

  // Escape - Reject suggestion
  if (event.key === 'Escape') {
    rejectSuggestion();
  }

  // Right Arrow - Accept word by word
  if (event.key === 'ArrowRight' && event.ctrlKey) {
    event.preventDefault();
    acceptNextWord();
  }

  // Any other key - Dismiss
  if (event.key.length === 1) {
    rejectSuggestion();
  }
};
```

---

## 🚦 Smart Triggering Rules

### **When to SHOW hints:**
✅ User is actively writing (not editing)
✅ Context is clear (10+ words)
✅ At natural pause points (end of sentence, after comma)
✅ User has paused for 800ms+
✅ Cursor is at end of document
✅ AI suggestions toggle is ON

### **When to HIDE hints:**
❌ User is editing middle of text
❌ Too little context (<10 words)
❌ User just started typing (<500ms)
❌ Last suggestion was rejected (wait 5s before trying again)
❌ User is selecting text
❌ Cursor is not at end

---

## 📊 Quality Control

### **Suggestion Filtering:**
```typescript
const isGoodSuggestion = (suggestion: string, context: string) => {
  // Must be 3-15 words
  const wordCount = suggestion.split(/\s+/).length;
  if (wordCount < 3 || wordCount > 15) return false;

  // Must not repeat the last words from context
  const lastWords = context.split(/\s+/).slice(-5).join(' ');
  if (suggestion.toLowerCase().includes(lastWords.toLowerCase())) {
    return false;
  }

  // Must start with a letter or number
  if (!/^[a-zA-Z0-9]/.test(suggestion)) return false;

  // Must not be too generic
  const generic = ['the', 'a', 'an', 'is', 'was', 'will', 'would'];
  const firstWord = suggestion.split(/\s+/)[0].toLowerCase();
  if (generic.includes(firstWord)) return false;

  return true;
};
```

---

## 🎨 UX Enhancements

### **Loading State:**
```typescript
// Show subtle indicator while AI is thinking
<span className="text-muted-foreground text-xs">
  <Sparkles className="w-3 h-3 animate-pulse inline" /> Thinking...
</span>
```

### **Acceptance Feedback:**
```typescript
// Brief highlight animation when accepted
.ghost-text-accepted {
  animation: flash-success 200ms ease-out;
}

@keyframes flash-success {
  0% { background: rgba(34, 197, 94, 0.2); }
  100% { background: transparent; }
}
```

### **Rejection Feedback:**
```typescript
// Fade out smoothly when rejected
.ghost-text-rejected {
  animation: fade-out 150ms ease-out forwards;
}

@keyframes fade-out {
  to { opacity: 0; }
}
```

---

## 📈 Performance Optimization

### **Debouncing:**
```typescript
import { debounce } from 'lodash';

const debouncedTrigger = debounce(async (context) => {
  const suggestion = await getAISuggestion(context);
  showGhostText(suggestion);
}, 800); // Wait 800ms after last keystroke
```

### **Caching:**
```typescript
const suggestionCache = new Map<string, string>();

const getCachedOrFetch = async (context: string) => {
  const cacheKey = context.slice(-200); // Last 200 chars as key
  
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey);
  }
  
  const suggestion = await fetchAISuggestion(context);
  suggestionCache.set(cacheKey, suggestion);
  
  return suggestion;
};
```

### **Request Cancellation:**
```typescript
let currentRequest: AbortController | null = null;

const fetchSuggestion = async (context: string) => {
  // Cancel previous request
  if (currentRequest) {
    currentRequest.abort();
  }
  
  currentRequest = new AbortController();
  
  try {
    const response = await fetch('/api/ai/suggest', {
      signal: currentRequest.signal,
      // ... other options
    });
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      // Ignore - was cancelled
      return null;
    }
    throw error;
  }
};
```

---

## 🔧 Configuration Options

### **User Preferences:**
```typescript
interface AIHintsConfig {
  enabled: boolean;
  triggerDelay: number; // 500-2000ms
  minContextWords: number; // 10-50
  maxSuggestionWords: number; // 5-20
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  acceptKey: 'tab' | 'right-arrow' | 'both';
}

const PRESETS = {
  conservative: {
    triggerDelay: 1500,
    minContextWords: 20,
    maxSuggestionWords: 8,
  },
  balanced: {
    triggerDelay: 800,
    minContextWords: 10,
    maxSuggestionWords: 12,
  },
  aggressive: {
    triggerDelay: 500,
    minContextWords: 5,
    maxSuggestionWords: 15,
  },
};
```

---

## 🎯 Implementation Roadmap

### **Week 1: Foundation**
- [x] Research best practices
- [ ] Create trigger detection system
- [ ] Implement debouncing
- [ ] Add context extraction

### **Week 2: AI Integration**
- [ ] Create AI prompt templates
- [ ] Integrate OpenAI API
- [ ] Add suggestion filtering
- [ ] Implement caching

### **Week 3: UI/UX**
- [ ] Ghost text rendering
- [ ] Keyboard shortcuts
- [ ] Animations
- [ ] Loading states

### **Week 4: Polish**
- [ ] Smart triggering rules
- [ ] Performance optimization
- [ ] User preferences
- [ ] Testing & refinement

---

## 🧪 Testing Checklist

### **Functionality:**
- [ ] Triggers after correct delay
- [ ] Shows ghost text correctly
- [ ] Tab accepts suggestion
- [ ] Esc rejects suggestion
- [ ] Disappears when typing
- [ ] Works in dark mode

### **Edge Cases:**
- [ ] Empty document
- [ ] Very short text (<10 words)
- [ ] Cursor in middle of text
- [ ] Multiple rapid suggestions
- [ ] API timeout/failure
- [ ] Network offline

### **Performance:**
- [ ] No lag when typing
- [ ] Smooth animations
- [ ] Efficient API calls
- [ ] Memory management
- [ ] CPU usage <5%

---

## 💡 Future Enhancements

1. **Multi-suggestion cycling** (like Copilot)
2. **Custom AI models** (document-specific training)
3. **Collaborative learning** (learns from accepted suggestions)
4. **Language detection** (multilingual support)
5. **Style adaptation** (formal/casual/technical)
6. **Keyboard-only mode** (for power users)
7. **Analytics dashboard** (acceptance rate, most helpful contexts)

---

## 📚 References

- Gmail Smart Compose: https://ai.googleblog.com/2018/05/smart-compose-using-neural-networks-to.html
- GitHub Copilot UX: https://github.blog/2021-06-29-introducing-github-copilot-ai-pair-programmer/
- TipTap Decorations: https://tiptap.dev/guide/node-views/decorations
- Debouncing Best Practices: https://www.freecodecamp.org/news/javascript-debounce-example/

---

**Ready to implement!** 🚀
