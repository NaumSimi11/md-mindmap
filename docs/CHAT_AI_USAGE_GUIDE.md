# 💬 AI Chat Assistant - Usage Guide

## 🎯 **How It Works**

The AI Chat Assistant uses **2-phase processing** to understand and execute your commands:

### **Phase 1: Natural Language Understanding (AI Parsing)**
The assistant sends your command to OpenAI with context about your mindmap to parse what you want:

```
User: "Add 3 marketing phases to the Marketing node"

AI Parses to:
{
  "action": "add",           // What to do
  "target": "Marketing",      // Which node
  "details": {
    "count": 3,              // How many
    "topic": "phases"        // What kind
  },
  "response": "Sure! I'll add 3 marketing phases to the Marketing node."
}
```

### **Phase 2: Execution**
Based on the parsed action, the system executes the appropriate function:
- **add** → Generates new child nodes with AI
- **analyze** → Runs Quality Audit
- **organize** → Runs AI Reorganize
- **query** → Answers questions about your mindmap

---

## 📝 **Example Commands**

### **✅ ADDING NODES:**

| Command | What Happens |
|---------|-------------|
| `"Add 3 phases"` | Adds 3 children to root/first node |
| `"Add 3 marketing strategies"` | Finds "Marketing" node, adds 3 children |
| `"Add 5 sub-tasks to Design Phase"` | Finds "Design Phase", adds 5 task children |
| `"Add more ideas"` | Adds 3 ideas to root node |

**How it finds nodes:**
1. Searches for node labels containing your target word (case-insensitive)
2. If "Marketing" → finds "Marketing Phase" or "Marketing" or "Digital Marketing"
3. If no match → uses root node (the one at the top)
4. If still no match → shows helpful error

---

### **✅ ANALYZING:**

| Command | What Happens |
|---------|-------------|
| `"What's missing?"` | Runs full Quality Audit |
| `"Analyze my mindmap"` | Shows structure analysis |
| `"Is my project complete?"` | AI evaluates completeness |
| `"What should I add?"` | Gets AI suggestions |

---

### **✅ ORGANIZING:**

| Command | What Happens |
|---------|-------------|
| `"Group all design tasks"` | Runs AI Reorganize |
| `"Organize my mindmap"` | Suggests structure improvements |
| `"Clean up the structure"` | Detects issues, suggests fixes |

---

### **✅ QUERYING:**

| Command | What Happens |
|---------|-------------|
| `"How many nodes do I have?"` | AI counts and responds |
| `"Show me all marketing nodes"` | AI lists matching nodes |
| `"What's the longest branch?"` | AI analyzes hierarchy |

---

## 🎨 **UI Flow**

```
1. User clicks floating purple button (bottom-right)
   ↓
2. Chat panel slides in from right
   ↓
3. User types command: "Add 3 phases to Marketing"
   ↓
4. User presses Enter or clicks "Send"
   ↓
5. Input disabled while processing
   ↓
6. AI parses command (Phase 1)
   ↓
7. System executes action (Phase 2)
   ↓
8. New nodes appear on canvas!
   ↓
9. Alert shows success message
   ↓
10. Input re-enabled, focus returns
```

---

## 🔧 **Technical Details**

### **Context Sent to AI:**
```typescript
{
  title: "Project Launch Plan",
  nodes: [
    { label: "Project Launch", description: "..." },
    { label: "Phase 1: Planning", description: "..." },
    { label: "Phase 2: Design", description: "..." },
    // ... all nodes
  ],
  edges: [
    { source: "node-1", target: "node-2" },
    // ... all connections
  ]
}
```

### **AI Prompt Structure:**
```
Parse this mindmap command:
"Add 3 marketing phases to Marketing"

Current Mindmap:
- Title: "Project Launch Plan"
- 16 nodes
- 15 connections

Respond with JSON:
{
  "action": "add" | "modify" | "analyze" | "organize" | "query",
  "target": "Marketing",
  "details": { count: 3, topic: "phases" },
  "response": "Conversational response"
}
```

### **Node Generation:**
Once parsed, if action is `"add"`:
1. Finds target node by label matching
2. Calls `mindmapAIService.generateChildNodes(nodeId, context, options)`
3. AI generates children based on:
   - Parent node label
   - Existing siblings (to avoid duplicates)
   - Full mindmap context
   - Specified focus topic
4. Creates React Flow nodes and edges
5. Adds to canvas at calculated positions

---

## 💡 **Smart Features**

### **1. Fuzzy Matching:**
- `"Marketing"` matches `"Marketing Phase"`, `"Digital Marketing"`, `"Marketing Strategy"`
- Case-insensitive
- Partial matches work

### **2. Contextual Defaults:**
- No target specified? → Uses root node
- No count specified? → Defaults to 3
- No topic specified? → AI infers from context

### **3. Conversational Responses:**
The AI always responds conversationally:
```
User: "Add 3 phases"
AI: "✅ Sure! I added 3 phases to your mindmap. Added 3 new nodes!"
```

### **4. Error Handling:**
- Target not found → Helpful error with examples
- AI fails → "Failed to understand, please rephrase"
- Empty command → "Please provide a command!"

---

## 🚀 **Examples in Action**

### **Example 1: Adding Marketing Phases**
```
User: "Add 3 marketing phases to the Marketing node"

1. AI parses:
   action: "add"
   target: "Marketing"
   count: 3
   topic: "phases"

2. System finds node with "Marketing" in label

3. AI generates 3 children:
   - "Phase 1: Market Research"
   - "Phase 2: Campaign Planning"
   - "Phase 3: Launch Execution"

4. Nodes added to canvas below Marketing node

5. Success message shown
```

### **Example 2: Asking Questions**
```
User: "What's missing from my project?"

1. AI parses:
   action: "analyze"
   target: "none"

2. System runs Quality Audit

3. Shows detailed report:
   - Score: 75/100
   - Strengths: Good structure
   - Issues: Missing testing phase
   - Suggestions: Add QA milestone

4. User reviews and acts on suggestions
```

### **Example 3: Organizing Content**
```
User: "Group all design tasks"

1. AI parses:
   action: "organize"
   target: "all"
   topic: "design"

2. System runs AI Reorganize

3. AI suggests:
   - Create "Design" milestone
   - Move 5 design-related nodes into it
   - Rename for consistency

4. User reviews suggestions (not auto-applied yet)
```

---

## ⚙️ **Configuration**

### **AI Model:**
- Provider: OpenAI
- Model: `gpt-4o-mini`
- Temperature: 0.3 (low for consistent parsing)
- Max Tokens: 500 (for parsing), 1000 (for generation)

### **Rate Limiting:**
- Uses `aiService` with built-in rate limiting
- Guest users: 10 AI runs/day
- Authenticated: Unlimited (future)

### **Context Window:**
- Sends full mindmap structure (nodes + edges)
- Limits large descriptions to 50 chars in prompt
- Total context: ~2000 tokens

---

## 🐛 **Troubleshooting**

### **"Couldn't find node matching X"**
- Node doesn't exist with that name
- Try: "Add 3 ideas" (uses root node)
- Or be more specific: "Add 3 ideas to Design Phase"

### **"Failed to understand command"**
- Command too ambiguous
- Try simpler phrasing
- Example: Instead of "Can you maybe add some stuff?", say "Add 3 ideas"

### **Nothing happens after pressing Send:**
- Check console for errors
- Check API key in `.env.local`
- Verify `VITE_OPENAI_API_KEY` is set
- Check browser network tab for API call

### **AI generates wrong nodes:**
- Context might be unclear
- Be more specific: "Add 3 marketing strategies focusing on social media"
- Or: "Add 3 technical tasks for backend development"

---

## 🔮 **Future Enhancements**

### **Phase 3: Chat History**
- Store messages in state
- Display user and AI messages
- Allow referencing previous commands

### **Phase 4: Multi-turn Conversations**
- "Add more" → Expands last action
- "Do the same for Design" → Applies to different node
- "Undo that" → Removes last AI action

### **Phase 5: Proactive Suggestions**
- AI monitors your work
- Suggests improvements: "Want me to expand this node?"
- "Your Marketing branch looks thin. Add more?"

### **Phase 6: Voice Input**
- Speak commands instead of typing
- "Hey AI, add 3 marketing phases"

---

## 📊 **Success Metrics**

**Current (MVP):**
- ✅ Parse natural language commands
- ✅ Find target nodes intelligently
- ✅ Generate contextual children
- ✅ Execute actions (add, analyze, organize)
- ✅ Show conversational responses

**Next:**
- 📋 Chat history display
- 🔄 Multi-turn context
- 💬 Conversational refinement
- 🎯 Proactive suggestions
- 🎤 Voice input

---

**Last Updated**: October 2024  
**Status**: ✅ Fully Functional - Ready for Testing

