# 🏗️ Brainstorm Mode - Technical Architecture

## **System Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                     MINDMAP STUDIO2                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              AI CHAT PANEL                                  │ │
│  │                                                              │ │
│  │  [💬 Brainstorm]  [⚡ Command]  ← MODE TOGGLE                │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  Chat Messages Area                                  │   │ │
│  │  │                                                       │   │ │
│  │  │  [User Message]                                      │   │ │
│  │  │  [AI Response]                                       │   │ │
│  │  │  [User Message]                                      │   │ │
│  │  │  [AI Response]                                       │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  [Input: Tell me what you want to create...]                │ │
│  │  [Send Button]                                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              REACT FLOW CANVAS                              │ │
│  │                                                              │ │
│  │     [Node 1]                                                │ │
│  │        ├──── [Child 1]                                      │ │
│  │        ├──── [Child 2]                                      │ │
│  │        └──── [Child 3]                                      │ │
│  │                                                              │ │
│  │     [Node 2]                                                │ │
│  │        └──── [Child 4]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## **State Management**

### **Core State Variables:**
```typescript
// Mode selection
const [chatMode, setChatMode] = useState<'brainstorm' | 'command'>('brainstorm');

// Conversation tracking
const [conversationContext, setConversationContext] = useState<string[]>([]);

// Chat messages
const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

// Loading state
const [chatLoading, setChatLoading] = useState(false);
```

---

## **Data Flow: Brainstorm Mode**

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  USER INPUT                                                         │
│  "I want to plan a marketing campaign"                             │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  handleChatCommand(prompt)                                          │
│                                                                     │
│  1. Check chatMode → 'brainstorm'                                  │
│  2. Check for commit phrases → NOT FOUND                           │
│  3. Continue conversation                                           │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  AI SERVICE                                                         │
│                                                                     │
│  Prompt:                                                            │
│  "You are a brainstorming partner. Have a natural conversation."   │
│  "Current mindmap: [context]"                                      │
│  "Conversation so far: [last 5 messages]"                          │
│  "User: 'I want to plan a marketing campaign'"                     │
│                                                                     │
│  Role: Ask questions, suggest ideas, refine thoughts               │
│  Temperature: 0.7 (creative)                                        │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  AI RESPONSE                                                        │
│                                                                     │
│  "Great! Let's think this through.                                 │
│   What's your product and target audience?"                        │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  UPDATE STATE                                                       │
│                                                                     │
│  1. Add to chatMessages                                             │
│  2. Add to conversationContext                                      │
│  3. Display in UI                                                   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## **Data Flow: Commit to Mindmap**

```
┌────────────────────────────────────────────────────────────────────┐
│  USER INPUT (after conversation)                                    │
│  "yes add it"                                                       │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  handleChatCommand(prompt)                                          │
│                                                                     │
│  1. Check chatMode → 'brainstorm'                                  │
│  2. Check for commit phrases → FOUND! "add it"                     │
│  3. isReadyToCommit = true                                          │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  EXTRACT IDEAS FROM CONVERSATION                                    │
│                                                                     │
│  AI Prompt:                                                         │
│  "Based on our conversation, extract key ideas for mindmap nodes"  │
│                                                                     │
│  Conversation:                                                      │
│  - User: "marketing campaign"                                      │
│  - AI: "Product Hunt, LinkedIn, Content..."                        │
│  - User: "$10k budget, focus on PH and content"                    │
│  - AI: "PH: $2k, Content: $8k, breakdown..."                       │
│                                                                     │
│  Expected JSON:                                                     │
│  {                                                                  │
│    "action": "add",                                                 │
│    "details": {                                                     │
│      "count": 5,                                                    │
│      "topics": [                                                    │
│        "Product Hunt Launch",                                      │
│        "Content Marketing Strategy",                               │
│        "Budget Allocation",                                         │
│        "Timeline Planning",                                         │
│        "Success Metrics"                                            │
│      ]                                                              │
│    }                                                                │
│  }                                                                  │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  GENERATE NODES                                                     │
│                                                                     │
│  1. Find root node (no incoming edges)                             │
│  2. Create new nodes from extracted topics                         │
│  3. Calculate positions (spread horizontally from root)            │
│  4. Create edges (connect to root)                                 │
│                                                                     │
│  Example:                                                           │
│  newNodes = [                                                       │
│    { id: "node-1", label: "Product Hunt Launch", x: 150, y: 450 } │
│    { id: "node-2", label: "Content Strategy", x: 400, y: 450 }    │
│    { id: "node-3", label: "Budget Allocation", x: 650, y: 450 }   │
│    ...                                                              │
│  ]                                                                  │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  UPDATE CANVAS                                                      │
│                                                                     │
│  setNodes(nds => [...nds, ...newNodes])                             │
│  setEdges(eds => [...eds, ...newEdges])                             │
│                                                                     │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  CONFIRM & RESET                                                    │
│                                                                     │
│  1. Show success message                                            │
│  2. Clear conversationContext                                       │
│  3. Ask "What would you like to explore next?"                     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## **Decision Tree: handleChatCommand**

```
┌─────────────────────────────────────────────┐
│  User sends message                          │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ chatMode?             │
        └─────┬────────────┬───┘
              │            │
    brainstorm│            │command
              │            │
              ▼            ▼
    ┌──────────────┐  ┌──────────────────────┐
    │ Check for    │  │ Parse command        │
    │ commit       │  │ Execute immediately  │
    │ phrases      │  │ (original behavior)  │
    └─────┬────────┘  └──────────────────────┘
          │
          ▼
    ┌──────────────────┐
    │ isReadyToCommit? │
    └─────┬────────┬───┘
          │        │
        Yes│        │No
          │        │
          ▼        ▼
    ┌──────────┐  ┌────────────────────┐
    │ Extract  │  │ Continue           │
    │ ideas    │  │ conversation       │
    │ from     │  │                    │
    │ convo    │  │ - Ask questions    │
    └────┬─────┘  │ - Suggest ideas    │
         │        │ - Refine thoughts  │
         ▼        └────────────────────┘
    ┌──────────┐
    │ Generate │
    │ nodes    │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ Add to   │
    │ canvas   │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ Clear    │
    │ context  │
    └──────────┘
```

---

## **AI Prompt Engineering**

### **Brainstorm Mode Prompt:**
```typescript
const brainstormPrompt = `You are a brainstorming partner for mindmap creation. Have a natural conversation like ChatGPT.

Current Mindmap: "${title}" with ${nodes.length} nodes
Conversation so far:
${conversationContext.slice(-5).join('\n')}

User: "${prompt}"

YOUR ROLE:
1. Ask clarifying questions to understand their goal
2. Suggest 5-7 specific, actionable ideas
3. Discuss and refine ideas based on feedback
4. Be conversational and helpful like ChatGPT
5. DO NOT add nodes yet - just brainstorm

When suggesting ideas:
- Be specific and actionable
- Group related ideas
- Ask which ones resonate
- Offer to explore deeper

Keep responses concise (3-5 sentences) unless providing a list of ideas.

IMPORTANT: Do NOT include JSON or commands. Just have a natural conversation.`;
```

**Key Features:**
- **Temperature: 0.7** (creative, conversational)
- **Context window: Last 5 messages** (prevents token overflow)
- **Role clarity: "DO NOT add nodes yet"** (prevents premature execution)
- **Conversation style: "Like ChatGPT"** (natural, helpful)

---

### **Commit Detection Prompt:**
```typescript
const extractPrompt = `Based on our conversation, extract the key ideas that should be added to the mindmap.

Conversation so far:
${conversationContext.slice(-5).join('\n')}

Latest user message: "${prompt}"

Extract the main topics/ideas that should become mindmap nodes. Respond with JSON:
{
  "action": "add",
  "target": "root",
  "details": {
    "count": number,
    "topics": ["topic 1", "topic 2", ...],
    "topic": "overall theme"
  },
  "response": "Brief confirmation"
}`;
```

**Key Features:**
- **Temperature: 0.3** (precise, structured)
- **JSON format** (easy parsing)
- **Full conversation context** (accurate extraction)

---

## **Conversation Context Management**

### **State Structure:**
```typescript
conversationContext: string[] = [
  "User: I want to plan a marketing campaign",
  "AI: Great! What's your product?",
  "User: AI productivity tool for remote teams",
  "AI: Here are 5 channels: [list]",
  "User: Focus on PH and content",
  "AI: Smart! Breakdown: PH $2k, Content $8k",
]
```

### **Context Lifecycle:**
```
1. User sends message
   ↓
2. Add to conversationContext
   ↓
3. AI generates response
   ↓
4. Add AI response to conversationContext
   ↓
5. Keep only last 5 messages (slice(-5))
   ↓
6. User says "add it"
   ↓
7. Extract ideas using full context
   ↓
8. Generate nodes
   ↓
9. Clear conversationContext = []
   ↓
10. Ready for next brainstorm!
```

---

## **UI Components Architecture**

```
MindmapStudio2.tsx
│
├── ChatPanel (Floating)
│   │
│   ├── Header
│   │   ├── Title: "AI Chat Assistant"
│   │   ├── Mode Toggle: [💬 Brainstorm] [⚡ Command]
│   │   ├── Undo/Redo Buttons
│   │   └── Close Button
│   │
│   ├── Messages Area
│   │   ├── Welcome Message (dynamic)
│   │   │   ├── Brainstorm: "I'm your brainstorming partner..."
│   │   │   └── Command: "I can help you add nodes..."
│   │   │
│   │   └── Chat History
│   │       ├── User Messages (right-aligned, blue)
│   │       └── AI Messages (left-aligned, white)
│   │
│   └── Input Area
│       ├── Input Field (dynamic placeholder)
│       │   ├── Brainstorm: "Tell me what you want to create..."
│       │   └── Command: "Type your command..."
│       │
│       └── Send Button
│
└── ReactFlow Canvas
    ├── Nodes
    ├── Edges
    └── Background
```

---

## **Error Handling**

### **Scenarios & Handling:**

1. **AI Response Parsing Error:**
   ```typescript
   try {
     const parsed = JSON.parse(jsonMatch[0]);
   } catch (error) {
     setChatMessages(prev => [...prev, { 
       role: 'ai', 
       content: `❌ Sorry, I encountered an error: ${error.message}`
     }]);
   }
   ```

2. **Empty Commit (No Ideas Extracted):**
   ```typescript
   if (!parsed.details.topics || parsed.details.topics.length === 0) {
     setChatMessages(prev => [...prev, { 
       role: 'ai', 
       content: `❌ I couldn't extract any clear ideas from our conversation. Can you be more specific?`
     }]);
     return;
   }
   ```

3. **Network/AI Service Failure:**
   ```typescript
   catch (error) {
     console.error('❌ Brainstorm error:', error);
     setChatMessages(prev => [...prev, { 
       role: 'ai', 
       content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
     }]);
   }
   ```

---

## **Performance Considerations**

### **Optimization Strategies:**

1. **Context Window Limiting:**
   - Store only last 5 messages
   - Prevents token overflow
   - Keeps conversations focused

2. **Lazy Execution:**
   - Only parse/execute when commit phrase detected
   - No unnecessary AI calls during conversation

3. **State Updates:**
   - Batch updates where possible
   - Use functional setState to avoid race conditions

4. **Memory Management:**
   - Clear conversationContext after commit
   - Prevents memory leaks over long sessions

---

## **Future Enhancements**

### **Planned Improvements:**

1. **Auto-Mode Detection:**
   ```typescript
   // If user types like ChatGPT, auto-switch to brainstorm
   if (promptSeemsChatty(prompt)) {
     setChatMode('brainstorm');
   }
   ```

2. **Conversation Templates:**
   ```typescript
   const templates = [
     { name: "Project Planning", starter: "Help me plan a..." },
     { name: "Brainstorm Ideas", starter: "I need ideas for..." },
   ];
   ```

3. **Save/Export Conversations:**
   ```typescript
   const exportConversation = () => {
     const markdown = chatMessages.map(m => 
       `**${m.role}:** ${m.content}`
     ).join('\n\n');
     downloadFile(markdown, 'conversation.md');
   };
   ```

4. **Voice Input:**
   ```typescript
   const startVoiceInput = () => {
     const recognition = new SpeechRecognition();
     recognition.onresult = (event) => {
       const transcript = event.results[0][0].transcript;
       handleChatCommand(transcript);
     };
   };
   ```

---

## **Testing Strategy**

### **Unit Tests:**
```typescript
describe('Brainstorm Mode', () => {
  it('should detect commit phrases', () => {
    expect(isReadyToCommit('add it')).toBe(true);
    expect(isReadyToCommit('create nodes')).toBe(true);
    expect(isReadyToCommit('what do you think?')).toBe(false);
  });
  
  it('should extract topics from conversation', () => {
    const context = [
      'User: marketing campaign',
      'AI: Product Hunt, LinkedIn, Content',
    ];
    const topics = extractTopics(context);
    expect(topics).toContain('Product Hunt');
  });
});
```

### **Integration Tests:**
```typescript
describe('Brainstorm → Command Flow', () => {
  it('should switch modes seamlessly', () => {
    // Start in brainstorm
    setChatMode('brainstorm');
    handleChatCommand('I want to plan...');
    
    // Switch to command
    setChatMode('command');
    handleChatCommand('Add 3 nodes');
    
    // Both should work
    expect(nodes.length).toBeGreaterThan(0);
  });
});
```

---

## **Conclusion**

This architecture provides:
- ✅ **Dual-mode flexibility** - Conversational + Command
- ✅ **Context awareness** - Tracks conversation history
- ✅ **Smart commit detection** - Only executes when asked
- ✅ **Seamless mode switching** - No data loss
- ✅ **Error handling** - Graceful failures
- ✅ **Performance optimized** - Minimal overhead
- ✅ **Extensible** - Easy to add features

**Result: A ChatGPT-like experience within the mindmap studio!** 🎉

---

*Technical Documentation - 2025-01-04*

