# 🎤 Presentations Engine - Implementation Plan

> **Goal**: Turn Editor + Mindmap into beautiful slides with AI, leveraging existing context and services.

---

## 📋 Table of Contents

1. [Context & Assets Available](#context--assets-available)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Tasks](#implementation-tasks)
4. [User Flows](#user-flows)
5. [Technical Details](#technical-details)
6. [Testing Strategy](#testing-strategy)

---

## 🎯 Context & Assets Available

### **✅ WHAT WE HAVE (Leverage This!)**

#### **1. Rich Content Sources**
```typescript
// Editor Content
const editorContent = {
  markdown: string,              // Full markdown text
  headings: Heading[],           // Extracted structure
  mermaidDiagrams: string[],     // All diagrams
  codeBlocks: CodeBlock[],       // Code snippets
  images: string[],              // Image URLs
  lists: List[],                 // Bullet/numbered lists
  tables: Table[],               // Data tables
}

// Mindmap Structure
const mindmapData = {
  nodes: Node[],                 // Hierarchical nodes
  edges: Edge[],                 // Connections
  pmFields: {                    // Project management data
    tasks: Task[],               // Nodes with status/dates
    timeline: Date[],            // Start/end dates
    priorities: Priority[],      // High/medium/low
    progress: number[],          // 0-100%
  },
  structure: {
    depth: number,               // Max hierarchy level
    branches: number,            // Number of main branches
    totalNodes: number,          // Total node count
  }
}
```

#### **2. AI Services Ready**
- ✅ `AIService` - Content generation, summarization
- ✅ `MindmapAIService` - Structure analysis, insights
- ✅ `ChatContextManager` - Conversation memory
- ✅ `EditorStudioSession` - Round-trip context

#### **3. UI Components**
- ✅ `MarkdownEditor` - Content input
- ✅ `MindmapStudio2` - Visual structure
- ✅ `AIAssistantModal` - AI generation
- ✅ shadcn/ui components - Button, Dialog, etc.

#### **4. Styling & Themes**
- ✅ Tailwind CSS - Utility classes
- ✅ Theme system - Light/dark mode
- ✅ Gradient styles - Beautiful visuals

---

## 🏗️ Architecture Overview

### **Component Hierarchy**

```
/presentation/:presentationId
  ├── PresentationEditor (main page)
  │   ├── PresentationHeader (title, controls)
  │   ├── PresentationSidebar (slide list)
  │   ├── SlideCanvas (main editing area)
  │   │   └── SlideRenderer (active slide)
  │   │       ├── SlideLayoutTitle
  │   │       ├── SlideLayoutContent
  │   │       ├── SlideLayoutTwoColumn
  │   │       ├── SlideLayoutMindmap
  │   │       └── SlideLayoutDiagram
  │   └── SlideToolbar (add, delete, duplicate)
  │
  ├── PresenterMode (full-screen presentation)
  │   ├── SlideView (main slide)
  │   ├── SpeakerNotes (bottom panel)
  │   ├── SlideNavigation (prev/next)
  │   └── PresenterControls (timer, slide counter)
  │
  └── PresentationExportModal (PDF/PPTX)
      ├── FormatSelector
      ├── ThemeSelector
      └── ExportProgress
```

---

### **Service Layer**

```typescript
// 1. Presentation Generation Service
class PresentationGenerator {
  async generateFromContext(
    editorContent: string,
    mindmapData: MindmapData,
    options: GenerateOptions
  ): Promise<Presentation>
  
  async analyzeContent(): Promise<ContentAnalysis>
  async suggestStructure(): Promise<SlideStructure>
  async generateSlide(content: string): Promise<Slide>
  async generateSpeakerNotes(slide: Slide): Promise<string>
}

// 2. Slide Service
class SlideService {
  async createSlide(data: SlideData): Promise<Slide>
  async updateSlide(id: string, data: Partial<Slide>): Promise<Slide>
  async deleteSlide(id: string): Promise<void>
  async reorderSlides(ids: string[]): Promise<void>
  async duplicateSlide(id: string): Promise<Slide>
}

// 3. Export Service
class PresentationExporter {
  async exportToPDF(presentation: Presentation): Promise<Blob>
  async exportToPPTX(presentation: Presentation): Promise<Blob>
  async exportToImages(presentation: Presentation): Promise<Blob[]>
  async exportToHTML(presentation: Presentation): Promise<string>
}

// 4. Template Service
class SlideTemplateService {
  getTemplate(type: SlideType): SlideTemplate
  applyTheme(slide: Slide, theme: Theme): Slide
  getDefaultLayouts(): Layout[]
}
```

---

### **Data Models**

```typescript
// Presentation
interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: PresentationTheme;
  metadata: {
    sourceDocumentId?: string;      // Editor doc ID
    sourceMindmapId?: string;       // Mindmap ID
    createdFrom: 'editor' | 'mindmap' | 'both' | 'scratch';
    generatedBy: 'ai' | 'manual';
    createdAt: Date;
    updatedAt: Date;
  };
}

// Slide
interface Slide {
  id: string;
  order: number;
  layout: SlideLayout;
  content: SlideContent;
  speakerNotes?: string;
  transition?: 'fade' | 'slide' | 'none';
  background?: SlideBackground;
}

// Slide Content
interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string;                    // Markdown
  bullets?: string[];
  image?: string;
  diagram?: {
    type: 'mermaid' | 'mindmap';
    code: string;
  };
  columns?: {
    left: string;
    right: string;
  };
  chart?: {
    type: 'bar' | 'line' | 'pie';
    data: any;
  };
}

// Slide Layout Types
type SlideLayout = 
  | 'title'           // Title + subtitle (cover slide)
  | 'content'         // Title + body text
  | 'bullets'         // Title + bullet points
  | 'two-column'      // Title + left/right columns
  | 'image'           // Title + large image
  | 'diagram'         // Title + Mermaid diagram
  | 'mindmap'         // Title + mindmap visualization
  | 'quote'           // Large quote + author
  | 'section'         // Section divider
  | 'blank';          // Blank canvas

// Theme
interface PresentationTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: 'compact' | 'normal' | 'spacious';
}
```

---

## ✅ Implementation Tasks

### **PHASE 1: Core Generation (Week 1-2)**

#### **Task 1.1: Content Analysis Service** 
**File**: `src/services/presentation/ContentAnalyzer.ts`

```typescript
export class ContentAnalyzer {
  /**
   * Analyze editor content and extract structure
   */
  analyzeEditorContent(markdown: string): ContentAnalysis {
    return {
      headings: this.extractHeadings(markdown),
      sections: this.extractSections(markdown),
      diagrams: this.extractMermaidDiagrams(markdown),
      keyPoints: this.extractKeyPoints(markdown),
      images: this.extractImages(markdown),
      codeBlocks: this.extractCodeBlocks(markdown),
      wordCount: this.countWords(markdown),
    };
  }

  /**
   * Analyze mindmap structure
   */
  analyzeMindmapStructure(data: MindmapData): MindmapAnalysis {
    const rootNode = data.nodes.find(n => !data.edges.some(e => e.target === n.id));
    const tree = this.buildTree(data.nodes, data.edges);
    
    return {
      rootNode,
      tree,
      depth: this.calculateDepth(tree),
      branches: this.countBranches(tree),
      tasks: this.extractTasks(data.nodes),
      timeline: this.extractTimeline(data.nodes),
      insights: this.generateInsights(tree),
    };
  }

  /**
   * Suggest optimal slide structure
   */
  async suggestSlideStructure(
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis
  ): Promise<SlideStructure> {
    // Use AI to suggest structure
    const prompt = this.buildStructurePrompt(editorAnalysis, mindmapAnalysis);
    const aiResponse = await aiService.generateContent(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
    });
    
    return this.parseAIStructure(aiResponse);
  }

  private buildStructurePrompt(
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis
  ): string {
    return `
You are a presentation expert. Analyze this content and suggest an optimal slide structure.

EDITOR CONTENT:
- ${editorAnalysis.headings.length} headings
- ${editorAnalysis.sections.length} sections
- ${editorAnalysis.diagrams.length} diagrams
- ${editorAnalysis.wordCount} words

Key Sections:
${editorAnalysis.headings.map(h => `- ${h.level}: ${h.text}`).join('\n')}

MINDMAP STRUCTURE:
- Root: ${mindmapAnalysis.rootNode?.label}
- Depth: ${mindmapAnalysis.depth} levels
- Branches: ${mindmapAnalysis.branches}
- Tasks: ${mindmapAnalysis.tasks.length}

Respond with JSON:
{
  "suggestedSlides": [
    {
      "type": "title" | "content" | "bullets" | "diagram" | "mindmap",
      "title": "Slide title",
      "content": "Brief description of what goes here",
      "source": "editor" | "mindmap" | "both",
      "priority": "essential" | "optional"
    },
    ...
  ],
  "totalSlides": number,
  "estimatedDuration": number (in minutes),
  "rationale": "Why this structure works"
}

RULES:
1. Start with title slide
2. Use diagrams from editor as visual slides
3. Use mindmap structure for roadmap/timeline slides
4. Keep it concise (8-12 slides ideal)
5. Include section dividers for major topics
6. End with next steps or conclusion
    `;
  }
}
```

**Subtasks**:
- [ ] Create `ContentAnalyzer.ts`
- [ ] Implement `analyzeEditorContent()`
- [ ] Implement `analyzeMindmapStructure()`
- [ ] Implement `suggestSlideStructure()` with AI
- [ ] Write unit tests

---

#### **Task 1.2: Presentation Generator Service**
**File**: `src/services/presentation/PresentationGenerator.ts`

```typescript
export class PresentationGenerator {
  private contentAnalyzer = new ContentAnalyzer();
  
  /**
   * Main entry point: Generate presentation from context
   */
  async generateFromContext(
    editorContent: string,
    mindmapData: MindmapData | null,
    options: GenerateOptions = {}
  ): Promise<Presentation> {
    console.log('🎤 Generating presentation from context...');
    
    // 1. Analyze content
    const editorAnalysis = this.contentAnalyzer.analyzeEditorContent(editorContent);
    const mindmapAnalysis = mindmapData 
      ? this.contentAnalyzer.analyzeMindmapStructure(mindmapData)
      : null;
    
    // 2. Get AI suggestions
    const structure = await this.contentAnalyzer.suggestSlideStructure(
      editorAnalysis,
      mindmapAnalysis
    );
    
    // 3. Generate slides
    const slides = await this.generateSlides(structure, editorAnalysis, mindmapAnalysis);
    
    // 4. Generate speaker notes for all slides
    if (options.generateNotes !== false) {
      await this.generateAllSpeakerNotes(slides, editorAnalysis);
    }
    
    // 5. Create presentation object
    const presentation: Presentation = {
      id: `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.inferTitle(editorAnalysis, mindmapAnalysis),
      slides,
      theme: options.theme || this.getDefaultTheme(),
      metadata: {
        sourceDocumentId: options.documentId,
        sourceMindmapId: options.mindmapId,
        createdFrom: mindmapData ? 'both' : 'editor',
        generatedBy: 'ai',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    
    console.log(`✅ Generated ${slides.length} slides`);
    return presentation;
  }

  /**
   * Generate individual slides from structure
   */
  private async generateSlides(
    structure: SlideStructure,
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis | null
  ): Promise<Slide[]> {
    const slides: Slide[] = [];
    
    for (let i = 0; i < structure.suggestedSlides.length; i++) {
      const suggestion = structure.suggestedSlides[i];
      
      let slide: Slide;
      
      switch (suggestion.type) {
        case 'title':
          slide = this.createTitleSlide(suggestion, editorAnalysis);
          break;
        case 'content':
          slide = await this.createContentSlide(suggestion, editorAnalysis);
          break;
        case 'bullets':
          slide = await this.createBulletSlide(suggestion, editorAnalysis);
          break;
        case 'diagram':
          slide = this.createDiagramSlide(suggestion, editorAnalysis);
          break;
        case 'mindmap':
          slide = this.createMindmapSlide(suggestion, mindmapAnalysis!);
          break;
        default:
          slide = await this.createContentSlide(suggestion, editorAnalysis);
      }
      
      slides.push(slide);
    }
    
    return slides;
  }

  /**
   * Create title slide
   */
  private createTitleSlide(
    suggestion: SlideSuggestion,
    analysis: ContentAnalysis
  ): Slide {
    const firstHeading = analysis.headings[0];
    
    return {
      id: `slide-${Date.now()}-0`,
      order: 0,
      layout: 'title',
      content: {
        title: suggestion.title || firstHeading?.text || 'Presentation',
        subtitle: this.generateSubtitle(analysis),
      },
      transition: 'fade',
    };
  }

  /**
   * Create content slide with AI
   */
  private async createContentSlide(
    suggestion: SlideSuggestion,
    analysis: ContentAnalysis
  ): Promise<Slide> {
    // Find relevant section in editor
    const relevantSection = this.findRelevantSection(suggestion, analysis);
    
    // AI generates concise slide content
    const prompt = `
Create concise slide content for a presentation slide.

SLIDE TITLE: ${suggestion.title}
SLIDE PURPOSE: ${suggestion.content}

SOURCE CONTENT:
${relevantSection || 'No specific section found'}

Respond with JSON:
{
  "title": "Slide title (keep it short)",
  "body": "2-3 sentences max (markdown formatted)",
  "keyTakeaway": "One sentence summary"
}

RULES:
- Be extremely concise
- Use active voice
- Avoid jargon
- Make it visually scannable
    `;
    
    const response = await aiService.generateContent(prompt, { temperature: 0.5 });
    const parsed = this.parseAIResponse(response);
    
    return {
      id: `slide-${Date.now()}-${Math.random()}`,
      order: 0, // Will be set later
      layout: 'content',
      content: {
        title: parsed.title,
        body: parsed.body,
      },
      speakerNotes: parsed.keyTakeaway,
      transition: 'slide',
    };
  }

  /**
   * Create bullet point slide
   */
  private async createBulletSlide(
    suggestion: SlideSuggestion,
    analysis: ContentAnalysis
  ): Promise<Slide> {
    const relevantSection = this.findRelevantSection(suggestion, analysis);
    
    const prompt = `
Create 3-5 bullet points for a presentation slide.

SLIDE TITLE: ${suggestion.title}
CONTEXT: ${suggestion.content}

SOURCE CONTENT:
${relevantSection || 'Generate from context'}

Respond with JSON:
{
  "title": "Slide title",
  "bullets": [
    "Bullet point 1 (concise, actionable)",
    "Bullet point 2",
    ...
  ]
}

RULES:
- 3-5 bullets max
- Each bullet: 5-10 words
- Start with action verbs when possible
- No sub-bullets
    `;
    
    const response = await aiService.generateContent(prompt, { temperature: 0.5 });
    const parsed = this.parseAIResponse(response);
    
    return {
      id: `slide-${Date.now()}-${Math.random()}`,
      order: 0,
      layout: 'bullets',
      content: {
        title: parsed.title,
        bullets: parsed.bullets,
      },
      transition: 'slide',
    };
  }

  /**
   * Create diagram slide from Mermaid
   */
  private createDiagramSlide(
    suggestion: SlideSuggestion,
    analysis: ContentAnalysis
  ): Slide {
    // Find relevant diagram
    const diagram = analysis.diagrams.find(d => 
      suggestion.content.toLowerCase().includes('diagram') ||
      suggestion.content.toLowerCase().includes('chart')
    ) || analysis.diagrams[0];
    
    return {
      id: `slide-${Date.now()}-${Math.random()}`,
      order: 0,
      layout: 'diagram',
      content: {
        title: suggestion.title,
        diagram: {
          type: 'mermaid',
          code: diagram || 'graph LR\n  A[Start] --> B[End]',
        },
      },
      transition: 'fade',
    };
  }

  /**
   * Create mindmap slide
   */
  private createMindmapSlide(
    suggestion: SlideSuggestion,
    analysis: MindmapAnalysis
  ): Slide {
    // Convert mindmap to Mermaid mindmap format
    const mermaidCode = this.convertMindmapToMermaid(analysis.tree);
    
    return {
      id: `slide-${Date.now()}-${Math.random()}`,
      order: 0,
      layout: 'mindmap',
      content: {
        title: suggestion.title || 'Project Roadmap',
        diagram: {
          type: 'mindmap',
          code: mermaidCode,
        },
      },
      transition: 'fade',
    };
  }

  /**
   * Generate speaker notes for all slides
   */
  private async generateAllSpeakerNotes(
    slides: Slide[],
    analysis: ContentAnalysis
  ): Promise<void> {
    console.log('📝 Generating speaker notes...');
    
    for (const slide of slides) {
      if (!slide.speakerNotes) {
        slide.speakerNotes = await this.generateSpeakerNotes(slide, analysis);
      }
    }
  }

  /**
   * Generate speaker notes for one slide
   */
  private async generateSpeakerNotes(
    slide: Slide,
    analysis: ContentAnalysis
  ): Promise<string> {
    const prompt = `
Generate speaker notes for this presentation slide.

SLIDE:
Title: ${slide.content.title || 'N/A'}
${slide.content.body ? `Body: ${slide.content.body}` : ''}
${slide.content.bullets ? `Bullets:\n${slide.content.bullets.map(b => `- ${b}`).join('\n')}` : ''}

Respond with 2-3 sentences that the presenter should say. Make it:
- Conversational (not formal)
- Provide context/detail beyond what's on slide
- Include a transition to next topic if applicable
    `;
    
    const notes = await aiService.generateContent(prompt, { temperature: 0.7 });
    return notes.trim();
  }

  // Helper methods
  private inferTitle(editorAnalysis: ContentAnalysis, mindmapAnalysis: MindmapAnalysis | null): string {
    return editorAnalysis.headings[0]?.text 
      || mindmapAnalysis?.rootNode?.label 
      || 'Untitled Presentation';
  }

  private generateSubtitle(analysis: ContentAnalysis): string {
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    return date;
  }

  private findRelevantSection(suggestion: SlideSuggestion, analysis: ContentAnalysis): string {
    // Find section in editor that matches slide topic
    const matchingSection = analysis.sections.find(s => 
      s.heading.text.toLowerCase().includes(suggestion.title.toLowerCase()) ||
      suggestion.title.toLowerCase().includes(s.heading.text.toLowerCase())
    );
    
    return matchingSection?.content || '';
  }

  private convertMindmapToMermaid(tree: MindmapNode): string {
    // Convert hierarchical tree to Mermaid mindmap syntax
    let mermaid = 'mindmap\n';
    mermaid += `  root(${tree.label})\n`;
    
    const traverse = (node: MindmapNode, indent: number) => {
      if (node.children) {
        for (const child of node.children) {
          mermaid += `${'  '.repeat(indent)}${child.label}\n`;
          traverse(child, indent + 1);
        }
      }
    };
    
    traverse(tree, 2);
    return mermaid;
  }

  private parseAIResponse(response: string): any {
    // Extract JSON from AI response (handles markdown wrapping)
    let jsonStr = response;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI response');
  }

  private getDefaultTheme(): PresentationTheme {
    return {
      name: 'Modern',
      colors: {
        primary: '#6366f1',     // Indigo
        secondary: '#8b5cf6',   // Purple
        background: '#ffffff',
        text: '#1f2937',
        accent: '#f59e0b',      // Amber
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      spacing: 'normal',
    };
  }
}

// Export singleton
export const presentationGenerator = new PresentationGenerator();
```

**Subtasks**:
- [ ] Create `PresentationGenerator.ts`
- [ ] Implement `generateFromContext()`
- [ ] Implement slide type creators (title, content, bullets, diagram, mindmap)
- [ ] Implement `generateSpeakerNotes()`
- [ ] Add error handling & logging
- [ ] Write tests

---

### **PHASE 2: UI Components (Week 2-3)**

#### **Task 2.1: Presentation Editor Page**
**File**: `src/pages/PresentationEditor.tsx`

```typescript
export default function PresentationEditor() {
  const { presentationId } = useParams();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load presentation from localStorage or generate new
  useEffect(() => {
    loadOrGeneratePresentation();
  }, [presentationId]);

  const loadOrGeneratePresentation = async () => {
    // Check if coming from editor/studio
    const sessionKey = localStorage.getItem('presentation-session');
    
    if (sessionKey) {
      // Generate from context
      setIsGenerating(true);
      
      const editorContent = localStorage.getItem(`editor-${sessionKey}`) || '';
      const mindmapData = localStorage.getItem(`mindmap-${sessionKey}`);
      
      const presentation = await presentationGenerator.generateFromContext(
        editorContent,
        mindmapData ? JSON.parse(mindmapData) : null
      );
      
      setPresentation(presentation);
      savePresentationToStorage(presentation);
      setIsGenerating(false);
    } else if (presentationId) {
      // Load existing
      const saved = localStorage.getItem(`presentation-${presentationId}`);
      if (saved) {
        setPresentation(JSON.parse(saved));
      }
    }
  };

  const currentSlide = presentation?.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <PresentationHeader
        title={presentation?.title || 'Loading...'}
        onExport={() => setShowExportModal(true)}
        onPresent={() => navigate(`/presentation/${presentationId}/present`)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Slide List */}
        <PresentationSidebar
          slides={presentation?.slides || []}
          currentIndex={currentSlideIndex}
          onSlideSelect={setCurrentSlideIndex}
          onAddSlide={() => addSlide()}
          onDeleteSlide={(idx) => deleteSlide(idx)}
        />

        {/* Main Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          {isGenerating ? (
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-lg font-semibold">Generating slides from your content...</p>
              <p className="text-sm text-muted-foreground mt-2">Using AI to create the perfect presentation</p>
            </div>
          ) : currentSlide ? (
            <SlideRenderer
              slide={currentSlide}
              theme={presentation!.theme}
              isEditing={true}
              onUpdate={(updated) => updateSlide(currentSlideIndex, updated)}
            />
          ) : (
            <div>No slides</div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <PresentationExportModal
          presentation={presentation!}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
```

**Subtasks**:
- [ ] Create `PresentationEditor.tsx`
- [ ] Implement presentation loading/generation
- [ ] Add slide navigation
- [ ] Add CRUD operations (add/update/delete slides)
- [ ] Connect to export modal

---

#### **Task 2.2: Slide Renderer Component**
**File**: `src/components/presentation/SlideRenderer.tsx`

```typescript
export function SlideRenderer({
  slide,
  theme,
  isEditing = false,
  onUpdate,
}: SlideRendererProps) {
  const renderLayout = () => {
    switch (slide.layout) {
      case 'title':
        return <SlideLayoutTitle slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
      case 'content':
        return <SlideLayoutContent slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
      case 'bullets':
        return <SlideLayoutBullets slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
      case 'diagram':
        return <SlideLayoutDiagram slide={slide} theme={theme} />;
      case 'mindmap':
        return <SlideLayoutMindmap slide={slide} theme={theme} />;
      default:
        return <div>Unknown layout</div>;
    }
  };

  return (
    <div
      className="relative w-full h-full rounded-lg shadow-2xl overflow-hidden"
      style={{
        aspectRatio: '16/9',
        maxWidth: '900px',
        maxHeight: '506px',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {renderLayout()}
      
      {/* Slide Number */}
      <div className="absolute bottom-4 right-4 text-xs opacity-50">
        Slide {slide.order + 1}
      </div>
    </div>
  );
}
```

**Subtasks**:
- [ ] Create `SlideRenderer.tsx`
- [ ] Build layout components (Title, Content, Bullets, Diagram, Mindmap)
- [ ] Add editing mode (contentEditable)
- [ ] Style with theme system

---

#### **Task 2.3: Presenter Mode**
**File**: `src/pages/PresenterMode.tsx`

```typescript
export default function PresenterMode() {
  const { presentationId } = useParams();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        exitPresenterMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const currentSlide = presentation?.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Main Slide (80% height) */}
      <div className="flex-1 flex items-center justify-center">
        {currentSlide && (
          <SlideRenderer
            slide={currentSlide}
            theme={presentation!.theme}
            isEditing={false}
          />
        )}
      </div>

      {/* Speaker Notes Panel (20% height) */}
      <div className="h-1/5 bg-gray-900 text-white p-6 flex items-center justify-between border-t border-gray-700">
        {/* Notes */}
        <div className="flex-1">
          <p className="text-sm opacity-75 mb-2">Speaker Notes:</p>
          <p className="text-base">{currentSlide?.speakerNotes || 'No notes for this slide.'}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 ml-6">
          {/* Timer */}
          <div className="text-center">
            <p className="text-xs opacity-75">Time</p>
            <p className="text-2xl font-mono">{formatTime(elapsedTime)}</p>
          </div>

          {/* Slide Counter */}
          <div className="text-center">
            <p className="text-xs opacity-75">Slide</p>
            <p className="text-2xl font-mono">
              {currentSlideIndex + 1} / {presentation?.slides.length}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button size="sm" onClick={prevSlide} disabled={currentSlideIndex === 0}>
              ← Prev
            </Button>
            <Button size="sm" onClick={nextSlide} disabled={currentSlideIndex === presentation!.slides.length - 1}>
              Next →
            </Button>
          </div>

          {/* Exit */}
          <Button size="sm" variant="outline" onClick={exitPresenterMode}>
            Exit (Esc)
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Subtasks**:
- [ ] Create `PresenterMode.tsx`
- [ ] Implement full-screen mode
- [ ] Add keyboard navigation
- [ ] Add timer & slide counter
- [ ] Show speaker notes panel

---

### **PHASE 3: Export & Polish (Week 3-4)**

#### **Task 3.1: PDF Export**
**File**: `src/services/presentation/PresentationExporter.ts`

```typescript
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export class PresentationExporter {
  /**
   * Export presentation to PDF
   */
  async exportToPDF(presentation: Presentation): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1920, 1080], // 16:9 aspect ratio
    });

    for (let i = 0; i < presentation.slides.length; i++) {
      const slide = presentation.slides[i];
      
      // Render slide to canvas
      const canvas = await this.renderSlideToCanvas(slide, presentation.theme);
      
      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
    }

    return pdf.output('blob');
  }

  /**
   * Render slide to canvas for export
   */
  private async renderSlideToCanvas(
    slide: Slide,
    theme: PresentationTheme
  ): Promise<HTMLCanvasElement> {
    // Create temporary DOM element
    const container = document.createElement('div');
    container.style.width = '1920px';
    container.style.height = '1080px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Render slide (React → HTML)
    const root = ReactDOM.createRoot(container);
    root.render(
      <SlideRenderer slide={slide} theme={theme} isEditing={false} />
    );

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert to canvas
    const canvas = await html2canvas(container, {
      width: 1920,
      height: 1080,
      scale: 1,
    });

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    return canvas;
  }

  /**
   * Export to PowerPoint (PPTX)
   */
  async exportToPPTX(presentation: Presentation): Promise<Blob> {
    const pptxgen = new PptxGenJS();

    for (const slide of presentation.slides) {
      const pptxSlide = pptxgen.addSlide();
      
      // Add title
      if (slide.content.title) {
        pptxSlide.addText(slide.content.title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          fontSize: 32,
          bold: true,
          color: presentation.theme.colors.primary,
        });
      }

      // Add content based on layout
      if (slide.content.body) {
        pptxSlide.addText(slide.content.body, {
          x: 0.5,
          y: 2,
          w: '90%',
          fontSize: 18,
          color: presentation.theme.colors.text,
        });
      }

      if (slide.content.bullets) {
        pptxSlide.addText(slide.content.bullets.map(b => `• ${b}`).join('\n'), {
          x: 0.5,
          y: 2,
          w: '90%',
          fontSize: 18,
          bullet: true,
        });
      }

      // Add speaker notes
      if (slide.speakerNotes) {
        pptxSlide.addNotes(slide.speakerNotes);
      }
    }

    return pptxgen.write({ outputType: 'blob' });
  }
}

export const presentationExporter = new PresentationExporter();
```

**Subtasks**:
- [ ] Install `html2canvas`, `jspdf`, `pptxgenjs`
- [ ] Implement `exportToPDF()`
- [ ] Implement `exportToPPTX()`
- [ ] Add progress indicator
- [ ] Handle errors gracefully

---

#### **Task 3.2: "Prepare Presentation" Button**
**File**: Add to `src/pages/Editor.tsx` and `src/pages/MindmapStudio2.tsx`

```typescript
// In Editor.tsx header
<Button
  onClick={handlePreparePr esentation}
  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
>
  <Presentation className="h-4 w-4 mr-2" />
  📊 Prepare Presentation
</Button>

// Handler
const handlePreparePresentation = async () => {
  // Save current content to session
  const sessionKey = `pres-session-${Date.now()}`;
  localStorage.setItem('presentation-session', sessionKey);
  localStorage.setItem(`editor-${sessionKey}`, editorContent);
  
  // Check if mindmap exists
  const mindmapSessionKey = editorStudioSession.getCurrentSession();
  if (mindmapSessionKey) {
    const mindmapData = editorStudioSession.loadSession(mindmapSessionKey);
    localStorage.setItem(`mindmap-${sessionKey}`, JSON.stringify(mindmapData));
  }
  
  // Navigate to presentation generator
  const presentationId = `pres-${Date.now()}`;
  navigate(`/presentation/${presentationId}/edit`);
};
```

**Subtasks**:
- [ ] Add button to Editor header
- [ ] Add button to Studio2 header
- [ ] Implement session handoff
- [ ] Test round-trip flow

---

## 🎯 User Flows

### **Flow 1: Generate from Editor Only**
```
1. User writes content in Editor
2. Clicks "📊 Prepare Presentation"
3. AI analyzes content:
   - Extracts headings → Slide titles
   - Extracts sections → Slide content
   - Extracts diagrams → Visual slides
4. Shows preview: "8 slides generated"
5. User reviews slides
6. User clicks "Present" → Full-screen mode
7. User presents with speaker notes
8. User exports to PDF/PPTX
```

### **Flow 2: Generate from Editor + Mindmap**
```
1. User writes in Editor + creates Mindmap
2. Clicks "📊 Prepare Presentation" (from either Editor or Studio)
3. AI analyzes both:
   - Editor → Content slides
   - Mindmap → Roadmap/Timeline slides
4. Shows preview: "12 slides generated (3 from mindmap)"
5. User edits slides
6. User presents
7. User exports
```

### **Flow 3: Manual Creation**
```
1. User clicks "New Presentation" (from workspace)
2. Starts with blank title slide
3. Clicks "+ Add Slide" → Choose layout
4. Manually writes content
5. AI helps: "Generate speaker notes for this slide"
6. User presents
7. User exports
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- [ ] `ContentAnalyzer` - Extract headings, sections, diagrams
- [ ] `PresentationGenerator` - Generate slides from context
- [ ] `SlideService` - CRUD operations
- [ ] `PresentationExporter` - PDF/PPTX generation

### **Integration Tests**
- [ ] End-to-end: Editor → Presentation
- [ ] End-to-end: Mindmap → Presentation
- [ ] End-to-end: Both → Presentation
- [ ] Export flows (PDF, PPTX)

### **Manual Testing**
- [ ] Generate from various content types
- [ ] Test all slide layouts
- [ ] Test presenter mode navigation
- [ ] Test export quality (PDF/PPTX)
- [ ] Test speaker notes generation

---

## 📦 Dependencies to Install

```bash
npm install html2canvas jspdf pptxgenjs
npm install --save-dev @types/pptxgenjs
```

---

## 🎯 Success Criteria

### **Phase 1 (Week 2)**
- ✅ User can generate presentation from Editor content
- ✅ AI creates 8-12 slides automatically
- ✅ Slides look professional (not generic)

### **Phase 2 (Week 3)**
- ✅ User can edit slides in UI
- ✅ Presenter mode works (full-screen, navigation, notes)
- ✅ Mindmap data integrated (roadmap/timeline slides)

### **Phase 3 (Week 4)**
- ✅ Export to PDF works (high quality)
- ✅ Export to PPTX works (editable in PowerPoint)
- ✅ "Prepare Presentation" button visible in Editor/Studio
- ✅ 80%+ user satisfaction with generated slides

---

## 🚀 Next Steps

### **This Week**
1. ✅ Finalize implementation plan (done!)
2. 📋 Create GitHub issues for each task
3. 🎨 Design slide templates (5 layouts)
4. 💻 Start coding `ContentAnalyzer`

### **Week 1-2: Core Generation**
- Build `ContentAnalyzer` service
- Build `PresentationGenerator` service
- Test with sample content

### **Week 2-3: UI**
- Build `PresentationEditor` page
- Build `SlideRenderer` component
- Build `PresenterMode` page

### **Week 3-4: Export & Polish**
- Implement PDF/PPTX export
- Add "Prepare Presentation" button
- Test end-to-end flows
- Launch beta! 🎉

---

## 💬 Key Design Principles

1. **Context is King** - Leverage EVERYTHING (editor, mindmap, PM fields)
2. **AI Does the Heavy Lifting** - User tweaks, doesn't create from scratch
3. **Professional by Default** - Generated slides should look great
4. **Fast Iteration** - User can regenerate/edit quickly
5. **Export Fidelity** - PDF/PPTX should match preview exactly

---

**Ready to start building?** 🚀

**First task**: Create `ContentAnalyzer.ts` and implement editor content extraction!

Let's go! 💪

