# 🤖 AI Diagram Help - Complete Workflow Design

## 📊 Scenarios & Solutions

---

### **Scenario 1: Text Selected in Editor → Open Diagram**

#### What Happens:
1. User selects text in editor
2. Opens diagram dialog
3. ✅ **Blue banner shows**: "Selected text detected"
4. User selects diagram type (e.g., Flowchart)

#### When User Clicks "AI Diagram Help":
```
┌─────────────────────────────────────────────────┐
│  🤖 AI Diagram Assistant                         │
├─────────────────────────────────────────────────┤
│  ℹ️ Using selected text as context:             │
│  "Mobile App Development Process..."            │
├─────────────────────────────────────────────────┤
│  What do you want to do?                        │
│                                                  │
│  ⚡ Quick Actions:                               │
│  [ Generate Flowchart from this text ]          │
│  [ Extract process steps as diagram ]           │
│  [ Convert to visual workflow ]                 │
│  [ Create structure diagram ]                   │
│                                                  │
│  ✍️ Or describe what you want:                  │
│  ┌──────────────────────────────────────┐      │
│  │ "Create a flowchart showing the      │      │
│  │  mobile app development stages..."    │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  [ Cancel ]              [ Generate Diagram ]   │
└─────────────────────────────────────────────────┘
```

**Result:**
- AI analyzes selected text
- Generates appropriate diagram code
- Shows in code editor for preview/editing

---

### **Scenario 2: No Text Selected → Open Diagram**

#### What Happens:
1. User opens diagram dialog (no selection)
2. User selects diagram type (e.g., Sequence Diagram)
3. Empty code template shown

#### When User Clicks "AI Diagram Help":
```
┌─────────────────────────────────────────────────┐
│  🤖 AI Diagram Assistant                         │
├─────────────────────────────────────────────────┤
│  Create a Sequence Diagram                      │
│                                                  │
│  ⚡ Quick Starts:                                │
│  [ Simple login flow ]                           │
│  [ API request/response ]                        │
│  [ User authentication ]                         │
│  [ Payment process ]                             │
│                                                  │
│  ✍️ Or describe your diagram:                   │
│  ┌──────────────────────────────────────┐      │
│  │ Example: "User logs in, system       │      │
│  │  verifies credentials, sends token,  │      │
│  │  user accesses dashboard"             │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  📎 Or paste content to convert:                │
│  ┌──────────────────────────────────────┐      │
│  │ [Paste text, bullet points, etc.]    │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  [ Cancel ]              [ Generate Diagram ]   │
└─────────────────────────────────────────────────┘
```

**Result:**
- AI generates diagram from description
- Or converts pasted content
- Or uses quick start template

---

### **Scenario 3: User Already Has Code → Clicks AI Help**

#### What Happens:
User has existing diagram code, wants to improve it

#### AI Help Dialog:
```
┌─────────────────────────────────────────────────┐
│  🤖 AI Diagram Assistant                         │
├─────────────────────────────────────────────────┤
│  Current diagram detected ✓                     │
│                                                  │
│  ⚡ Quick Actions:                               │
│  [ Improve this diagram ]                        │
│  [ Add more detail ]                             │
│  [ Simplify structure ]                          │
│  [ Fix syntax errors ]                           │
│  [ Change diagram type ]                         │
│                                                  │
│  ✍️ Or tell me what to change:                  │
│  ┌──────────────────────────────────────┐      │
│  │ "Add error handling steps"            │      │
│  │ "Make it more detailed"               │      │
│  │ "Add 3 more nodes for validation"    │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  [ Cancel ]              [ Apply Changes ]       │
└─────────────────────────────────────────────────┘
```

**Result:**
- AI modifies existing code
- Shows changes in code editor
- User can preview

---

## 🔄 AI Generation Flow

### **Step 1: User Clicks "Generate"**

```
┌─────────────────────────────────────────────────┐
│  🤖 Generating diagram...                        │
│                                                  │
│  [▓▓▓▓▓▓▓▓▓░░░░░░░] 60%                         │
│                                                  │
│  Analyzing your request...                      │
└─────────────────────────────────────────────────┘
```

### **Step 2: AI Returns Result**

Dialog closes, code editor updates with generated code:

```
┌────────────────────────────────────────────────┐
│  Code Editor (80%)                              │
│                                                 │
│  flowchart TD                                   │
│    A[Start] --> B{Login?}                      │
│    B -->|Yes| C[Dashboard]                     │
│    B -->|No| D[Signup]                         │
│                                                 │
│  ✨ AI Generated this diagram!                  │
│  Not quite right? Click AI Help to refine      │
│                                                 │
│  [✨ AI Diagram Help]    [👁️ Show Preview]      │
└────────────────────────────────────────────────┘
```

---

## ❌ User Doesn't Like Result

### **Option 1: Refine with AI**
1. Click "AI Diagram Help" again
2. Dialog opens with new options:

```
┌─────────────────────────────────────────────────┐
│  🤖 Refine Diagram                               │
├─────────────────────────────────────────────────┤
│  ⚡ Quick Fixes:                                 │
│  [ Make it more complex ]                        │
│  [ Make it simpler ]                             │
│  [ Add more steps ]                              │
│  [ Change layout direction ]                     │
│  [ Try different style ]                         │
│                                                  │
│  ✍️ What's wrong with it?                       │
│  ┌──────────────────────────────────────┐      │
│  │ "Add authentication steps between    │      │
│  │  login and dashboard"                 │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  [ Cancel ]              [ Regenerate ]          │
└─────────────────────────────────────────────────┘
```

### **Option 2: Manual Edit**
- User directly edits code in editor
- Can toggle preview to see changes
- Full control

### **Option 3: Start Over**
- Select different diagram type from left
- Start fresh with new template

---

## ✅ User Likes Result

### **Option 1: Insert Immediately**
1. Code looks good
2. Click "Insert Diagram" button
3. ✅ Inserted into document!

### **Option 2: Make Small Tweaks First**
1. AI generated good base
2. User manually tweaks (change labels, colors, etc.)
3. Toggle preview to verify
4. Click "Insert Diagram"

### **Option 3: Ask AI for Minor Changes**
1. Like it overall, but want one small change
2. Click "AI Diagram Help"
3. Quick request: "Add a timeout step"
4. AI makes small modification
5. Insert

---

## 🎨 User Wants Changes Before Inserting

### **Flow:**
```
1. AI generates → Code in editor
   ↓
2. User edits manually OR asks AI for changes
   ↓
3. Click "Show Preview" → See how it looks
   ↓
4. Not satisfied? → Back to step 2
   ↓
5. Satisfied? → Click "Insert Diagram"
```

### **Key Features:**
- ✅ **Iterative**: Can refine multiple times
- ✅ **Hybrid**: AI + manual editing
- ✅ **Preview**: Always see before inserting
- ✅ **Non-destructive**: Original text unchanged until insert

---

## 🔧 Technical Implementation

### **AI Help Button Opens Modal**
```typescript
const handleAIHelp = () => {
  setShowAIModal(true);
  
  // Pass context
  setAIContext({
    selectedText: selectedText,           // From editor
    currentCode: editableCode,            // Current diagram
    diagramType: selectedTemplate.type,   // Flowchart, Sequence, etc.
    hasExistingCode: editableCode.trim() !== selectedTemplate.code
  });
};
```

### **AI Modal Component**
```typescript
<AIAssistantModal
  isOpen={showAIModal}
  onClose={() => setShowAIModal(false)}
  context={aiContext}
  onGenerate={(generatedCode) => {
    setEditableCode(generatedCode);
    setShowAIModal(false);
    setShowPreview(true); // Auto-show preview
  }}
/>
```

### **AI Service Call**
```typescript
const generateDiagram = async (prompt: string, context: AIContext) => {
  const systemPrompt = `You are a Mermaid diagram expert.
  Generate ${context.diagramType} diagram code.
  ${context.selectedText ? `Based on this text: ${context.selectedText}` : ''}
  ${context.currentCode ? `Modify this existing diagram: ${context.currentCode}` : ''}
  Return ONLY mermaid code, no explanations.`;

  const result = await AIService.generateContent(
    prompt,
    { systemPrompt, maxTokens: 500 }
  );
  
  return result;
};
```

---

## 🎯 User Experience Goals

### **1. Smart Context Detection**
- ✅ Auto-detect selected text
- ✅ Know if code exists
- ✅ Understand diagram type

### **2. Multiple Entry Points**
- ✅ Quick action buttons (common patterns)
- ✅ Natural language description
- ✅ Paste content to convert

### **3. Iterative Refinement**
- ✅ Easy to regenerate
- ✅ Can make small changes
- ✅ Keep trying until satisfied

### **4. Always Reviewable**
- ✅ See code before inserting
- ✅ Preview rendering
- ✅ Edit manually if needed

### **5. Non-Destructive**
- ✅ Original text unchanged
- ✅ Can cancel anytime
- ✅ Multiple attempts allowed

---

## 📝 Conversation Flow Examples

### **Example 1: From Scratch**
```
User: [Opens diagram, selects Flowchart, clicks AI Help]
Modal: "Describe your diagram:"
User: "User login process with error handling"
AI: [Generates flowchart with login steps, success/error paths]
User: [Previews] "Looks good!" [Inserts]
```

### **Example 2: From Selected Text**
```
User: [Selects text about mobile app dev, opens diagram]
Banner: "Selected text detected"
User: [Clicks AI Help]
Modal: Quick Action: "Generate Flowchart from this text"
User: [Clicks quick action]
AI: [Generates diagram from text structure]
User: [Previews, manually adds one step, inserts]
```

### **Example 3: Refinement**
```
User: [AI generates diagram]
User: "Hmm, too simple" [Clicks AI Help again]
Modal: "What's wrong with it?"
User: "Add 3 more validation steps between login and dashboard"
AI: [Modifies diagram to add steps]
User: [Previews] "Perfect!" [Inserts]
```

---

## 🚀 Next Steps for Implementation

### **Phase 1: Basic AI Modal**
1. Create `AIAssistantModal.tsx`
2. Add prompt input
3. Quick action buttons
4. Connect to AI service

### **Phase 2: Context Detection**
1. Pass selected text
2. Pass current code
3. Detect diagram type

### **Phase 3: Refinement Flow**
1. "Regenerate" option
2. "Modify" option
3. Show diff/changes

### **Phase 4: Quick Actions**
1. Common diagram templates
2. Pattern library
3. One-click generation

---

## 💡 Key Decisions Needed

1. **Modal or Inline?**
   - ✅ Modal (like Smart AI Modal in editor)
   - Focused experience
   - Don't lose diagram context

2. **Auto-preview after generation?**
   - ✅ Yes! Show preview automatically
   - User wants to see result immediately

3. **Keep AI modal open after generation?**
   - ❌ No, close and show result
   - User can reopen if not satisfied

4. **Show "AI Generated" badge?**
   - ✅ Yes, small hint below code
   - Encourages refinement if needed

5. **Limit regeneration attempts?**
   - ❌ No limit
   - Let user iterate freely

---

## 🎉 End Result

**User gets:**
- 🤖 AI-powered diagram generation
- 📝 Natural language interface
- 🔄 Iterative refinement
- 👁️ Always preview before insert
- ✏️ Can manually edit
- ⚡ Quick start templates
- 🎯 Context-aware suggestions

**Perfect workflow for both AI beginners and power users!**

