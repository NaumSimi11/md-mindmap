# 🤖 AI Assistant Modal - Comprehensive Technical Documentation

## 📋 Overview

The AI Assistant Modal is a sophisticated interface component that enables users to generate Mermaid diagrams using AI. It provides intelligent diagram type suggestions, context-aware prompt generation, and a complete workflow for diagram creation, enhancement, and insertion.

## 🎯 Core Features

### 1. Intelligent Document Analysis
- **Content Type Detection**: Analyzes document content to determine optimal diagram types
- **Context Extraction**: Extracts key concepts, headings, and sentences for prompt generation
- **Smart Suggestions**: Provides contextually relevant diagram recommendations

### 2. Multiple Entry Points
- **Toolbar Button**: Primary access via "AI Assistant" button
- **Context Menu**: Right-click "Enhance with AI" for existing diagrams
- **Slash Commands**: `/ai-*` commands for text enhancement
- **Bubble Menu**: "✨ AI Improve" for selected text

### 3. Collapsible Interface
- **Space-Efficient Design**: Collapsible diagram selection to save space
- **Progressive Disclosure**: Show summary first, expand for details
- **Responsive Layout**: Works on desktop and mobile

## 🏗️ Technical Architecture

### Component Structure

```typescript
interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentContent: string;
  enhanceMode?: boolean;           // Enhancement vs creation mode
  initialDiagramCode?: string;     // Current diagram for enhancement
  onInsert?: (code: string) => void; // Callback to insert diagram
  initialTemplatePrompt?: string;  // Pre-filled prompt
}
```

### State Management

```typescript
// Core state variables
const [isGenerating, setIsGenerating] = useState(false);
const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
const [preselectedDiagram, setPreselectedDiagram] = useState<string | null>(null);
const [customPrompt, setCustomPrompt] = useState("");
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
const [generatedResult, setGeneratedResult] = useState<string | null>(null);
const [showResult, setShowResult] = useState(false);
const [resultDiagramType, setResultDiagramType] = useState<string>('');
const [diagramCardsCollapsed, setDiagramCardsCollapsed] = useState(false);
const [includeDocContext, setIncludeDocContext] = useState(!enhanceMode);
```

## 🔄 User Journey Scenarios

### Scenario 1: Basic Diagram Creation

#### Steps:
1. **User clicks "AI Assistant" button** in editor toolbar
2. **Modal opens** with document analysis and smart prompt
3. **User sees pre-selected diagram type** (based on content analysis)
4. **User can modify prompt** or use suggested prompt
5. **User selects diagram type** (or uses pre-selected)
6. **Generation starts** with loading indicator
7. **Result preview shows** with syntax-highlighted code
8. **User chooses action**: Insert, Enhance, Regenerate, or Back

#### Example:
```
Document: "Our API handles user authentication and data processing"

Smart Analysis → "Technical content detected"
Auto-Prompt → "Create a technical diagram that visualizes the key components and relationships in this structured content. Use these main sections as the primary nodes: API, Authentication, Data Processing."

Pre-selected Diagram → "Class Diagram" (best for technical content)
```

### Scenario 2: Diagram Enhancement

#### Steps:
1. **User right-clicks existing Mermaid diagram**
2. **Selects "Enhance with AI"** from context menu
3. **Modal opens in enhancement mode**
4. **Current diagram shown** (readonly preview)
5. **User enters enhancement prompt**
6. **Generation creates improved version**
7. **Result replaces original diagram**

#### Example:
```
Existing: flowchart TD
    A[Start] --> B[Process]
    B --> C[End]

Enhancement: "Add error handling and retry logic"
Result: Enhanced flowchart with error paths and retry loops
```

### Scenario 3: Text Enhancement via Bubble Menu

#### Steps:
1. **User selects text** in editor
2. **Bubble menu appears** with "✨ AI Improve" option
3. **Modal opens** with pre-filled improvement prompt
4. **AI enhances selected text**
5. **Enhanced text replaces original**

#### Example:
```
Selected: "This is good"
Prompt: "Improve this text for clarity and grammar: 'This is good'. Provide only the improved version, no explanations."
Result: "This solution is excellent and well-designed"
```

## 🧠 Intelligent Features

### Content Analysis Engine

```typescript
const getAutoPrompt = () => {
  // Extract key sentences and headings
  const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const headings = documentContent.match(/^#{1,6}\s+.*/gm) || [];

  // Analyze document type
  const lowerContent = documentContent.toLowerCase();
  const isTechnical = /api|database|server|client|function|class|method|variable/.test(lowerContent);
  const isBusiness = /customer|product|service|market|sales|revenue|profit|strategy/.test(lowerContent);
  const isProcess = /process|workflow|step|stage|phase|milestone|procedure/.test(lowerContent);

  // Generate context-aware prompt
  if (isTechnical) {
    return `Create a technical diagram that visualizes the key components and relationships in this structured content. Use these main sections as the primary nodes: ${headings.slice(0, 3).map(h => h.replace(/^#{1,6}\s+/, '')).join(', ')}.`;
  }
  // ... other content types
};
```

### Smart Diagram Type Selection

```typescript
const handleSmartGenerate = useCallback(() => {
  const lowerContent = documentContent.toLowerCase();
  let bestDiagramType = 'flowchart'; // Default

  if (/mindmap|concept|idea|brainstorm|knowledge/.test(lowerContent)) {
    bestDiagramType = 'mindmap';
  } else if (/process|workflow|step|stage|procedure|algorithm|flow|procedure/.test(lowerContent)) {
    bestDiagramType = 'flowchart';
  } else if (/relationship|connection|link|network|system|component|entity/.test(lowerContent)) {
    bestDiagramType = 'graph';
  } else if (/sequence|interaction|communication|timeline|order|step|phase/.test(lowerContent)) {
    bestDiagramType = 'sequence';
  } else if (/class|object|structure|architecture|inheritance|attribute|method/.test(lowerContent)) {
    bestDiagramType = 'class';
  }

  setPreselectedDiagram(bestDiagramType);
  handleDiagramSelect(bestDiagramType);
}, [documentContent]);
```

## 🎨 Visual Interface Components

### Diagram Selection Cards

#### Expanded View (Grid Layout):
- **6 diagram type cards** in responsive grid (1-2-3 columns)
- **Visual icons** and descriptions for each type
- **Hover effects** with scale animation
- **Selected state** with primary color highlighting
- **"Selected" badge** for chosen diagram type

#### Collapsed View (Compact Summary):
- **Icon pills** showing all diagram types
- **Color-coded** by diagram type
- **"Show Diagram Selection" button** to expand

### Result Preview

#### Success State:
- **Green checkmark** indicator
- **Syntax-highlighted code** in scrollable preview
- **Action buttons**: Insert, Enhance, Regenerate, Back
- **Validation warnings** for problematic content

#### Loading State:
- **Animated spinner** with progress indication
- **Contextual message** showing what's being generated
- **Diagram type display** in loading message

## 🔧 Generation Pipeline

### 1. Prompt Composition

```typescript
const userParts: string[] = [];
if (customPrompt) userParts.push(customPrompt);
const userPrompt = userParts.join('\n');

const systemPrompt = [
  'You are an expert in Mermaid diagrams. Return ONLY valid Mermaid code.',
  'Do not include triple backticks or any explanations.',
  'For mindmaps, use proper Mermaid mindmap syntax with valid node IDs.',
  'Node IDs should be simple alphanumeric strings without spaces or special characters.',
  'Ensure all generated code follows Mermaid syntax exactly.',
].join(' ');
```

### 2. AI Service Integration

```typescript
const fullPrompt = [
  contextBlock,           // Current diagram (if enhancing)
  docContext,             // Document content (if included)
  'REQUEST:', userPrompt, // User instructions
  'CONSTRAINTS:',         // AI rules
].join('');

const mermaidCode = await aiService.generateContent(fullPrompt, {
  systemPrompt,
  temperature: 0.3,       // Low for accuracy
  maxTokens: 1200,        // Reasonable size
});
```

### 3. Validation Pipeline

```typescript
// Clean and validate generated code
let cleanCode = mermaidCode.trim().replace(/^```mermaid\n?/i, '').replace(/```\s*$/i, '').trim();

// Extract Mermaid code if wrapped in other content
const match = cleanCode.match(/(flowchart|graph|sequenceDiagram|classDiagram|mindmap|journey)[\s\S]*/i);
if (match) cleanCode = match[0].trim();

// Validate with Mermaid.js
try {
  const id = `validate-${Date.now()}`;
  await mermaid.render(id, cleanCode);
} catch (e: any) {
  // Provide helpful error messages based on diagram type
  // Show validation errors to user
}
```

## 🎯 Action Buttons & Workflows

### Primary Actions

#### Insert Diagram
- **Inserts generated code** into editor at cursor position
- **Handles both desktop and mobile** editors
- **Moves cursor** after inserted diagram
- **Resets modal state** for next use

#### Enhance This
- **Switches to edit mode** with generated code as custom prompt
- **Preserves context** for iterative improvement
- **Allows refinement** of generated results

#### Regenerate
- **Tries generation again** with same settings
- **Useful for variations** or when first attempt fails
- **Maintains prompt and diagram type**

#### Back to Edit
- **Returns to editing mode** without inserting
- **Preserves all settings** for later use
- **Clears result state**

### Keyboard Shortcuts

#### Ctrl+Enter (Smart Generate)
- **Triggers smart generation** with auto-selected diagram type
- **Fills prompt** with auto-generated content
- **Starts generation** immediately

## 🛠️ Error Handling & Edge Cases

### Validation Errors

#### Mindmap Node ID Issues:
```typescript
// Detection
if (diagramId === 'mindmap' && errorMessage.includes('MINDMAP')) {
  helpfulMessage = 'Mindmap generation failed. The AI may have included invalid node names. Try regenerating or use a different diagram type.';
}
```

#### General Parse Errors:
```typescript
// Helpful context
if (errorMessage.includes('Parse error')) {
  helpfulMessage = `Mermaid syntax error: ${errorMessage}. The generated code may not follow proper Mermaid syntax.`;
}
```

### Content Edge Cases

#### Empty Document:
- **Auto-prompt:** `'Create a diagram based on the content of this document.'`
- **Default diagram:** flowchart
- **Graceful fallback** for minimal content

#### Very Technical Content:
- **Detection:** `/api|database|server|client|function|class|method|variable/`
- **Suggested type:** Class diagram or flowchart
- **Prompt focus:** Component relationships

#### Business Content:
- **Detection:** `/customer|product|service|market|sales|revenue|profit|strategy/`
- **Suggested type:** Process flow or org chart
- **Prompt focus:** Workflow visualization

## 📱 Responsive Design

### Desktop Layout
- **Full grid** of 6 diagram cards (3 columns on large screens)
- **Expanded interface** with all features visible
- **Hover effects** and animations

### Mobile Layout
- **Collapsed view** by default (space saving)
- **Touch-friendly** button sizes
- **Responsive grid** adapts to screen size

### Collapsible States
- **Default:** Expanded for full functionality
- **User choice:** Can collapse to save space
- **State persistence:** Could be enhanced to remember preference

## 🔄 State Management Flow

### Modal Opening
```typescript
// Initialize based on props
const autoPrompt = getAutoPrompt();
setIncludeDocContext(!enhanceMode);

// Pre-select diagram type if in creation mode
if (!enhanceMode) {
  // Analyze document and set preselectedDiagram
}
```

### Diagram Selection
```typescript
// User clicks diagram card
setSelectedDiagram(option.id);
setPreselectedDiagram(null); // Clear preselection

// Start generation
handleDiagramSelect(option.id);
```

### Generation Process
```typescript
// Set loading state
setIsGenerating(true);
setSelectedDiagram(diagramId);

// Compose prompts and call AI
const mermaidCode = await aiService.generateContent(fullPrompt, options);

// Validate and show result
setGeneratedResult(cleanCode);
setResultDiagramType(diagramId);
setShowResult(true);
```

### Result Actions
```typescript
// Insert
if (onInsert) onInsert(generatedResult);

// Enhance
setShowResult(false);
setCustomPrompt(`Enhance this diagram: ${generatedResult}`);

// Regenerate
setShowResult(false);
handleSmartGenerate();

// Back
setShowResult(false);
```

## 🎨 Visual Design System

### Color Scheme
- **Primary:** Purple gradient (`bg-primary`, `border-primary`)
- **Success:** Green (`text-green-600`, `bg-green-50`)
- **Warning:** Amber (`text-amber-700`, `bg-amber-50`)
- **Error:** Red (`text-destructive`, `bg-destructive/10`)

### Typography
- **Headings:** Semibold, responsive sizing
- **Body:** Regular weight, good contrast
- **Labels:** Muted foreground for secondary text
- **Code:** Monospace in previews

### Spacing & Layout
- **Consistent padding:** `p-4`, `p-6` for main sections
- **Gap management:** `gap-3`, `gap-5` for element spacing
- **Responsive grid:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## 🔧 Technical Implementation Details

### Performance Optimizations
- **Debounced analysis** - Auto-prompt updates only when content changes
- **useCallback hooks** - Prevents unnecessary re-renders
- **Efficient regex** - Fast content pattern matching
- **Lazy state updates** - Batched for better performance

### Accessibility
- **Keyboard navigation** - Full keyboard support
- **Screen reader friendly** - Proper ARIA labels
- **Focus management** - Clear focus indicators
- **Color contrast** - WCAG compliant colors

### Error Boundaries
- **Graceful degradation** - Falls back to basic functionality
- **User feedback** - Clear error messages
- **Recovery options** - Retry and alternative actions

## 📊 Usage Analytics & Metrics

### Key Metrics to Track
- **Generation success rate** - Percentage of successful generations
- **User preference** - Most used diagram types
- **Error frequency** - Common failure points
- **Usage patterns** - Time spent in different modes

### User Behavior Insights
- **Template usage** - Which quick prompts are most popular
- **Enhancement patterns** - How often users enhance vs create new
- **Error recovery** - How users respond to errors
- **Mobile vs desktop** - Usage differences by platform

## 🚀 Future Enhancement Opportunities

### Advanced Features
1. **Template Gallery** - Visual template browser with previews
2. **Collaborative AI** - Share AI suggestions with team members
3. **Custom Templates** - User-created prompt templates
4. **Batch Operations** - Generate multiple diagrams at once

### UX Improvements
1. **Usage Analytics** - Show user's most used diagram types
2. **Smart Defaults** - Remember user's preferences
3. **Tutorial Mode** - Guide new users through features
4. **Keyboard Shortcuts** - More power user shortcuts

### Technical Enhancements
1. **Offline Mode** - Basic functionality without AI
2. **Caching** - Cache successful generations for reuse
3. **Multi-language** - Support for non-English content
4. **Plugin System** - Extensible diagram type support

## 🎯 Best Practices & Guidelines

### For Users
- **Start with Smart Generate** - Let AI suggest the best approach
- **Use templates** - Leverage pre-built prompts for common tasks
- **Iterate with Enhance** - Refine results until perfect
- **Save frequently** - Don't lose work during experimentation

### For Developers
- **Clear error messages** - Help users understand issues
- **Progressive enhancement** - Graceful degradation for older browsers
- **Performance monitoring** - Track and optimize slow operations
- **Accessibility testing** - Ensure all users can use the features

## 📝 Example Use Cases

### Technical Documentation
```
Document: "API endpoints for user management and data processing"

Smart Analysis → Technical content detected
Auto-Prompt → "Create a technical diagram that visualizes the key components and relationships in this structured content. Use these main sections as the primary nodes: API, User Management, Data Processing."

Result → Class diagram showing API structure and relationships
```

### Business Process
```
Document: "Customer acquisition through marketing and sales funnels"

Smart Analysis → Business content detected
Auto-Prompt → "Create a business process diagram showing the workflow described in this content. Key process: Customer acquisition through marketing and sales funnels."

Result → Process flowchart with marketing → sales → customer stages
```

### Project Planning
```
Document: "Project phases: planning, development, testing, deployment"

Smart Analysis → Process content detected
Auto-Prompt → "Create a flowchart that maps out the process steps mentioned in this document. Start with: Project phases: planning, development, testing, deployment."

Result → Timeline or Gantt-style diagram
```

## 🔚 Conclusion

The AI Assistant Modal represents a sophisticated blend of AI-powered content analysis, intelligent UI design, and seamless user experience. It transforms the complex task of diagram generation into an intuitive, guided process that adapts to user needs and content types.

This comprehensive system provides:
- **Intelligent automation** through content analysis
- **User control** through multiple interaction modes
- **Visual feedback** through responsive design
- **Error resilience** through robust validation
- **Extensibility** through modular architecture

The result is a professional-grade AI assistant that makes diagram creation accessible, efficient, and enjoyable for users of all skill levels.
