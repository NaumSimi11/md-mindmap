/**
 * PresentationGenerator - Generate presentations from Editor + Mindmap content
 * 
 * This service orchestrates AI-powered slide generation, using ContentAnalyzer
 * to extract structure and AIService to generate content.
 */

import { aiService } from '../ai/AIService';
import { 
  contentAnalyzer, 
  type ContentAnalysis, 
  type MindmapAnalysis,
  type SlideStructure,
  type SlideSuggestion,
} from './ContentAnalyzer';
import type { Node, Edge } from '@xyflow/react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: PresentationTheme;
  metadata: PresentationMetadata;
}

export interface Slide {
  id: string;
  order: number;
  layout: SlideLayout;
  content: SlideContent;
  speakerNotes?: string;
  transition?: 'fade' | 'slide' | 'none';
  background?: SlideBackground;
}

export type SlideLayout = 
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

export interface SlideContent {
  title?: string;
  subtitle?: string;
  body?: string; // Markdown
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
  quote?: {
    text: string;
    author: string;
  };
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export interface PresentationTheme {
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

export interface PresentationMetadata {
  sourceDocumentId?: string;
  sourceMindmapId?: string;
  createdFrom: 'editor' | 'mindmap' | 'both' | 'scratch';
  generatedBy: 'ai' | 'manual';
  createdAt: Date;
  updatedAt: Date;
  author?: string;
}

export interface GenerateOptions {
  documentId?: string;
  mindmapId?: string;
  theme?: PresentationTheme;
  generateNotes?: boolean;
  maxSlides?: number;
  temperature?: number;
}

// ============================================================================
// PresentationGenerator Class
// ============================================================================

export class PresentationGenerator {
  /**
   * Main entry point: Generate presentation from context
   */
  async generateFromContext(
    editorContent: string,
    mindmapData: { nodes: Node[]; edges: Edge[] } | null,
    options: GenerateOptions = {}
  ): Promise<Presentation> {
    console.log('🎤 ========================================');
    console.log('🎤 GENERATING PRESENTATION FROM CONTEXT');
    console.log('🎤 ========================================');

    try {
      // 1. Analyze content
      console.log('📝 Step 1: Analyzing content...');
      const editorAnalysis = contentAnalyzer.analyzeEditorContent(editorContent);
      const mindmapAnalysis = mindmapData
        ? contentAnalyzer.analyzeMindmapStructure(mindmapData.nodes, mindmapData.edges)
        : null;

      console.log(`✅ Editor: ${editorAnalysis.headings.length} headings, ${editorAnalysis.diagrams.length} diagrams`);
      if (mindmapAnalysis) {
        console.log(`✅ Mindmap: ${mindmapAnalysis.totalNodes} nodes, ${mindmapAnalysis.tasks.length} tasks`);
      }

      // 2. Get AI suggestions for structure
      console.log('🤖 Step 2: Getting AI suggestions...');
      const structure = await this.suggestSlideStructure(editorAnalysis, mindmapAnalysis, options);
      console.log(`✅ Suggested ${structure.totalSlides} slides (${structure.estimatedDuration} min)`);

      // 3. Generate slides
      console.log('✨ Step 3: Generating slides...');
      const slides = await this.generateSlides(structure, editorAnalysis, mindmapAnalysis);
      console.log(`✅ Generated ${slides.length} slides`);

      // 4. Generate speaker notes
      if (options.generateNotes !== false) {
        console.log('📝 Step 4: Generating speaker notes...');
        await this.generateAllSpeakerNotes(slides, editorAnalysis);
        console.log('✅ Speaker notes complete');
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

      console.log('🎉 PRESENTATION GENERATION COMPLETE!');
      console.log(`   Title: ${presentation.title}`);
      console.log(`   Slides: ${slides.length}`);
      console.log(`   Theme: ${presentation.theme.name}`);
      console.log('🎤 ========================================');

      return presentation;
    } catch (error) {
      console.error('❌ Presentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Suggest optimal slide structure using AI
   */
  private async suggestSlideStructure(
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis | null,
    options: GenerateOptions
  ): Promise<SlideStructure> {
    const prompt = this.buildStructurePrompt(editorAnalysis, mindmapAnalysis);

    const response = await aiService.generateContent(prompt, {
      temperature: options.temperature || 0.3,
      maxTokens: 2000,
    });

    return this.parseAIStructure(response, options.maxSlides);
  }

  /**
   * Build AI prompt for structure suggestion
   */
  private buildStructurePrompt(
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis | null
  ): string {
    const nodeList = mindmapAnalysis
      ? `- Root: ${mindmapAnalysis.rootNode?.label}\n- Depth: ${mindmapAnalysis.depth} levels\n- Branches: ${mindmapAnalysis.branches}\n- Tasks: ${mindmapAnalysis.tasks.length}`
      : 'No mindmap data';

    return `
You are a presentation expert. Analyze this content and suggest an optimal slide structure for a professional presentation.

EDITOR CONTENT:
- ${editorAnalysis.headings.length} headings
- ${editorAnalysis.sections.length} sections
- ${editorAnalysis.diagrams.length} diagrams
- ${editorAnalysis.wordCount} words

Key Sections:
${editorAnalysis.headings.map(h => `${'  '.repeat(h.level - 1)}- Level ${h.level}: ${h.text}`).join('\n')}

${editorAnalysis.diagrams.length > 0 ? `\nAvailable Diagrams:\n${editorAnalysis.diagrams.map(d => `- ${d.type} diagram`).join('\n')}` : ''}

MINDMAP STRUCTURE:
${nodeList}

${mindmapAnalysis?.insights ? `Insights: ${mindmapAnalysis.insights}` : ''}

Respond with JSON ONLY (no markdown, no explanation):
{
  "suggestedSlides": [
    {
      "type": "title" | "content" | "bullets" | "diagram" | "mindmap" | "section",
      "title": "Slide title (short, punchy)",
      "content": "What content goes here (1-2 sentences)",
      "source": "editor" | "mindmap" | "both",
      "priority": "essential" | "optional"
    }
  ],
  "totalSlides": number,
  "estimatedDuration": number (minutes),
  "rationale": "Why this structure works (1-2 sentences)"
}

RULES:
1. Start with a title slide (use first heading or mindmap root)
2. Use section dividers for major topics (H1 headings)
3. Convert diagrams into visual slides
4. Use mindmap for roadmap/timeline slides if available
5. Keep it concise: 8-12 slides ideal (max 15)
6. End with conclusion or next steps
7. Prioritize visual slides over text-heavy ones
8. Each slide should have ONE clear message

SLIDE TYPE GUIDE:
- "title": Cover slide (title + subtitle)
- "content": Text-focused slide (1-2 paragraphs max)
- "bullets": Key points (3-5 bullets)
- "diagram": Visual from editor diagrams
- "mindmap": Roadmap/structure from mindmap data
- "section": Section divider (transition between topics)
    `.trim();
  }

  /**
   * Parse AI response into slide structure
   */
  private parseAIStructure(response: string, maxSlides?: number): SlideStructure {
    let jsonStr = response;

    // Remove markdown code blocks if present
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Apply maxSlides limit if specified
    if (maxSlides && parsed.suggestedSlides.length > maxSlides) {
      parsed.suggestedSlides = parsed.suggestedSlides.slice(0, maxSlides);
      parsed.totalSlides = maxSlides;
    }

    return parsed;
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

      console.log(`  📄 Generating slide ${i + 1}/${structure.suggestedSlides.length}: ${suggestion.title}`);

      let slide: Slide;

      switch (suggestion.type) {
        case 'title':
          slide = this.createTitleSlide(suggestion, editorAnalysis, mindmapAnalysis);
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
        case 'section':
          slide = this.createSectionSlide(suggestion);
          break;
        default:
          slide = await this.createContentSlide(suggestion, editorAnalysis);
      }

      slide.order = i;
      slides.push(slide);
    }

    return slides;
  }

  // ==========================================================================
  // Slide Creation Methods
  // ==========================================================================

  private createTitleSlide(
    suggestion: SlideSuggestion,
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis | null
  ): Slide {
    const firstHeading = editorAnalysis.headings[0];
    const title = suggestion.title || firstHeading?.text || mindmapAnalysis?.rootNode?.label || 'Presentation';
    const subtitle = this.generateSubtitle(editorAnalysis);

    return {
      id: this.generateSlideId(),
      order: 0,
      layout: 'title',
      content: {
        title,
        subtitle,
      },
      transition: 'fade',
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    };
  }

  private async createContentSlide(
    suggestion: SlideSuggestion,
    editorAnalysis: ContentAnalysis
  ): Promise<Slide> {
    // Find relevant section in editor
    const relevantSection = this.findRelevantSection(suggestion, editorAnalysis);

    const prompt = `
Create concise slide content for a professional presentation.

SLIDE TITLE: ${suggestion.title}
SLIDE PURPOSE: ${suggestion.content}

SOURCE CONTENT:
${relevantSection || 'Create content based on the title and purpose above'}

Respond with JSON ONLY:
{
  "title": "Slide title (keep it short and punchy)",
  "body": "2-3 sentences max, markdown formatted. Use **bold** for emphasis.",
  "keyTakeaway": "One sentence summary for speaker notes"
}

RULES:
- Extremely concise (presentation, not essay)
- Use active voice
- Avoid jargon
- Make it visually scannable
- Focus on ONE key message
    `.trim();

    const response = await aiService.generateContent(prompt, { temperature: 0.5 });
    const parsed = this.parseAIResponse(response);

    return {
      id: this.generateSlideId(),
      order: 0,
      layout: 'content',
      content: {
        title: parsed.title,
        body: parsed.body,
      },
      speakerNotes: parsed.keyTakeaway,
      transition: 'slide',
    };
  }

  private async createBulletSlide(
    suggestion: SlideSuggestion,
    editorAnalysis: ContentAnalysis
  ): Promise<Slide> {
    const relevantSection = this.findRelevantSection(suggestion, editorAnalysis);

    const prompt = `
Create 3-5 bullet points for a presentation slide.

SLIDE TITLE: ${suggestion.title}
CONTEXT: ${suggestion.content}

SOURCE CONTENT:
${relevantSection || 'Generate from context'}

Respond with JSON ONLY:
{
  "title": "Slide title",
  "bullets": [
    "Bullet point 1 (concise, actionable)",
    "Bullet point 2",
    "Bullet point 3"
  ]
}

RULES:
- 3-5 bullets max
- Each bullet: 5-10 words
- Start with action verbs when possible
- No sub-bullets
- No full sentences (fragments are fine)
- Focus on key takeaways
    `.trim();

    const response = await aiService.generateContent(prompt, { temperature: 0.5 });
    const parsed = this.parseAIResponse(response);

    return {
      id: this.generateSlideId(),
      order: 0,
      layout: 'bullets',
      content: {
        title: parsed.title,
        bullets: parsed.bullets,
      },
      transition: 'slide',
    };
  }

  private createDiagramSlide(
    suggestion: SlideSuggestion,
    editorAnalysis: ContentAnalysis
  ): Slide {
    // Find first relevant diagram or use any available
    const diagram = editorAnalysis.diagrams[0];

    if (!diagram) {
      // Fallback: create simple diagram
      return {
        id: this.generateSlideId(),
        order: 0,
        layout: 'diagram',
        content: {
          title: suggestion.title,
          diagram: {
            type: 'mermaid',
            code: 'graph LR\n  A[Start] --> B[Process] --> C[End]',
          },
        },
        transition: 'fade',
      };
    }

    return {
      id: this.generateSlideId(),
      order: 0,
      layout: 'diagram',
      content: {
        title: suggestion.title,
        diagram: {
          type: 'mermaid',
          code: diagram.code,
        },
      },
      transition: 'fade',
    };
  }

  private createMindmapSlide(
    suggestion: SlideSuggestion,
    mindmapAnalysis: MindmapAnalysis
  ): Slide {
    if (!mindmapAnalysis.tree) {
      throw new Error('No mindmap tree available');
    }

    // Convert mindmap tree to Mermaid mindmap format
    const mermaidCode = this.convertMindmapToMermaid(mindmapAnalysis.tree);

    return {
      id: this.generateSlideId(),
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

  private createSectionSlide(suggestion: SlideSuggestion): Slide {
    return {
      id: this.generateSlideId(),
      order: 0,
      layout: 'section',
      content: {
        title: suggestion.title,
      },
      transition: 'fade',
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    };
  }

  // ==========================================================================
  // Speaker Notes Generation
  // ==========================================================================

  private async generateAllSpeakerNotes(
    slides: Slide[],
    editorAnalysis: ContentAnalysis
  ): Promise<void> {
    for (const slide of slides) {
      if (!slide.speakerNotes) {
        slide.speakerNotes = await this.generateSpeakerNotes(slide, editorAnalysis);
      }
    }
  }

  private async generateSpeakerNotes(
    slide: Slide,
    editorAnalysis: ContentAnalysis
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
- Natural speaking style

Do NOT use markdown formatting. Just plain text.
    `.trim();

    const notes = await aiService.generateContent(prompt, { temperature: 0.7 });
    return notes.trim();
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private inferTitle(
    editorAnalysis: ContentAnalysis,
    mindmapAnalysis: MindmapAnalysis | null
  ): string {
    return (
      editorAnalysis.headings[0]?.text ||
      mindmapAnalysis?.rootNode?.label ||
      'Untitled Presentation'
    );
  }

  private generateSubtitle(editorAnalysis: ContentAnalysis): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return date;
  }

  private findRelevantSection(
    suggestion: SlideSuggestion,
    editorAnalysis: ContentAnalysis
  ): string {
    // Find section that matches slide topic
    const matchingSection = editorAnalysis.sections.find(
      (s) =>
        s.heading.text.toLowerCase().includes(suggestion.title.toLowerCase()) ||
        suggestion.title.toLowerCase().includes(s.heading.text.toLowerCase())
    );

    return matchingSection?.content || '';
  }

  private convertMindmapToMermaid(node: any): string {
    // Convert hierarchical tree to Mermaid mindmap syntax
    let mermaid = 'mindmap\n';
    mermaid += `  root((${node.label}))\n`;

    const traverse = (node: any, indent: number) => {
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          mermaid += `${'  '.repeat(indent)}${child.label}\n`;
          traverse(child, indent + 1);
        }
      }
    };

    traverse(node, 2);
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

  private generateSlideId(): string {
    return `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultTheme(): PresentationTheme {
    return {
      name: 'Modern',
      colors: {
        primary: '#6366f1', // Indigo
        secondary: '#8b5cf6', // Purple
        background: '#ffffff',
        text: '#1f2937',
        accent: '#f59e0b', // Amber
      },
      fonts: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
      },
      spacing: 'normal',
    };
  }
}

// Export singleton instance
export const presentationGenerator = new PresentationGenerator();

