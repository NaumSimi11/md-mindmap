/**
 * ContentAnalyzer - Extract structure and content from Editor and Mindmap
 * 
 * This service analyzes markdown content and mindmap data to prepare
 * context for AI-powered slide generation.
 */

import type { Node, Edge } from "@xyflow/react";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface Section {
  heading: Heading;
  content: string;
  startLine: number;
  endLine: number;
}

export interface MermaidDiagram {
  type: string; // flowchart, mindmap, timeline, etc.
  code: string;
  line: number;
}

export interface CodeBlock {
  language: string;
  code: string;
  line: number;
}

export interface ContentAnalysis {
  headings: Heading[];
  sections: Section[];
  diagrams: MermaidDiagram[];
  codeBlocks: CodeBlock[];
  images: string[];
  lists: string[][];
  tables: string[][];
  keyPoints: string[];
  wordCount: number;
  estimatedReadTime: number; // minutes
}

export interface MindmapNode {
  id: string;
  label: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  assignee?: string;
  estimate?: number;
  progress?: number;
  tags?: string[];
  children?: MindmapNode[];
  level: number;
}

export interface Task {
  id: string;
  label: string;
  description?: string;
  status: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  assignee?: string;
  estimate?: number;
  progress?: number;
  parent?: string;
}

export interface MindmapAnalysis {
  rootNode: MindmapNode | null;
  tree: MindmapNode | null;
  depth: number;
  branches: number;
  totalNodes: number;
  tasks: Task[];
  timeline: { earliest?: Date; latest?: Date };
  insights: string;
}

export interface SlideStructure {
  suggestedSlides: SlideSuggestion[];
  totalSlides: number;
  estimatedDuration: number; // minutes
  rationale: string;
}

export interface SlideSuggestion {
  type: 'title' | 'content' | 'bullets' | 'diagram' | 'mindmap' | 'section' | 'quote';
  title: string;
  content: string; // Description of what goes on slide
  source: 'editor' | 'mindmap' | 'both';
  priority: 'essential' | 'optional';
}

// ============================================================================
// ContentAnalyzer Class
// ============================================================================

export class ContentAnalyzer {
  /**
   * Analyze markdown content from editor
   */
  analyzeEditorContent(markdown: string): ContentAnalysis {
    console.log('📝 Analyzing editor content...');

    const headings = this.extractHeadings(markdown);
    const sections = this.extractSections(markdown, headings);
    const diagrams = this.extractMermaidDiagrams(markdown);
    const codeBlocks = this.extractCodeBlocks(markdown);
    const images = this.extractImages(markdown);
    const lists = this.extractLists(markdown);
    const tables = this.extractTables(markdown);
    const keyPoints = this.extractKeyPoints(markdown, sections);
    const wordCount = this.countWords(markdown);
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    console.log(`✅ Analysis complete: ${headings.length} headings, ${sections.length} sections, ${diagrams.length} diagrams`);

    return {
      headings,
      sections,
      diagrams,
      codeBlocks,
      images,
      lists,
      tables,
      keyPoints,
      wordCount,
      estimatedReadTime,
    };
  }

  /**
   * Analyze mindmap structure
   */
  analyzeMindmapStructure(nodes: Node[], edges: Edge[]): MindmapAnalysis {
    console.log('🧠 Analyzing mindmap structure...');

    // Find root node (no incoming edges)
    const rootNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
    
    if (!rootNode) {
      return {
        rootNode: null,
        tree: null,
        depth: 0,
        branches: 0,
        totalNodes: 0,
        tasks: [],
        timeline: {},
        insights: 'Empty mindmap',
      };
    }

    // Build hierarchical tree
    const tree = this.buildTree(nodes, edges, rootNode.id);

    // Calculate metrics
    const depth = this.calculateDepth(tree);
    const branches = this.countBranches(tree);
    const tasks = this.extractTasks(nodes);
    const timeline = this.extractTimeline(nodes);
    const insights = this.generateInsights(tree, tasks, timeline);

    console.log(`✅ Mindmap analysis: ${nodes.length} nodes, ${depth} levels, ${tasks.length} tasks`);

    return {
      rootNode: this.nodeToMindmapNode(rootNode, 0),
      tree,
      depth,
      branches,
      totalNodes: nodes.length,
      tasks,
      timeline,
      insights,
    };
  }

  // ==========================================================================
  // Editor Content Extraction Methods
  // ==========================================================================

  private extractHeadings(markdown: string): Heading[] {
    const headings: Heading[] = [];
    const lines = markdown.split('\n');

    lines.forEach((line, index) => {
      // Match markdown headings: # Title, ## Title, etc.
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: index + 1,
        });
      }
    });

    return headings;
  }

  private extractSections(markdown: string, headings: Heading[]): Section[] {
    const sections: Section[] = [];
    const lines = markdown.split('\n');

    for (let i = 0; i < headings.length; i++) {
      const currentHeading = headings[i];
      const nextHeading = headings[i + 1];

      const startLine = currentHeading.line;
      const endLine = nextHeading ? nextHeading.line - 1 : lines.length;

      // Extract content between headings
      const content = lines
        .slice(startLine, endLine)
        .join('\n')
        .trim();

      sections.push({
        heading: currentHeading,
        content,
        startLine,
        endLine,
      });
    }

    return sections;
  }

  private extractMermaidDiagrams(markdown: string): MermaidDiagram[] {
    const diagrams: MermaidDiagram[] = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let currentDiagram = '';
    let diagramType = '';
    let startLine = 0;

    lines.forEach((line, index) => {
      if (line.trim().startsWith('```mermaid')) {
        inCodeBlock = true;
        startLine = index + 1;
        currentDiagram = '';
      } else if (inCodeBlock && line.trim() === '```') {
        inCodeBlock = false;
        // Detect diagram type from first line
        const firstLine = currentDiagram.split('\n')[0].trim();
        diagramType = this.detectMermaidType(firstLine);
        
        diagrams.push({
          type: diagramType,
          code: currentDiagram.trim(),
          line: startLine,
        });
      } else if (inCodeBlock) {
        currentDiagram += line + '\n';
      }
    });

    return diagrams;
  }

  private detectMermaidType(firstLine: string): string {
    if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) return 'flowchart';
    if (firstLine.startsWith('mindmap')) return 'mindmap';
    if (firstLine.startsWith('timeline')) return 'timeline';
    if (firstLine.startsWith('gantt')) return 'gantt';
    if (firstLine.startsWith('sequenceDiagram')) return 'sequence';
    if (firstLine.startsWith('classDiagram')) return 'class';
    if (firstLine.startsWith('stateDiagram')) return 'state';
    if (firstLine.startsWith('erDiagram')) return 'er';
    if (firstLine.startsWith('pie')) return 'pie';
    return 'unknown';
  }

  private extractCodeBlocks(markdown: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let currentCode = '';
    let language = '';
    let startLine = 0;

    lines.forEach((line, index) => {
      const match = line.trim().match(/^```(\w+)?$/);
      if (match && !inCodeBlock) {
        inCodeBlock = true;
        language = match[1] || 'text';
        startLine = index + 1;
        currentCode = '';
      } else if (inCodeBlock && line.trim() === '```') {
        inCodeBlock = false;
        // Skip mermaid diagrams (handled separately)
        if (language !== 'mermaid') {
          codeBlocks.push({
            language,
            code: currentCode.trim(),
            line: startLine,
          });
        }
      } else if (inCodeBlock) {
        currentCode += line + '\n';
      }
    });

    return codeBlocks;
  }

  private extractImages(markdown: string): string[] {
    const images: string[] = [];
    // Match markdown images: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(markdown)) !== null) {
      images.push(match[2]); // URL
    }

    return images;
  }

  private extractLists(markdown: string): string[][] {
    const lists: string[][] = [];
    const lines = markdown.split('\n');
    let currentList: string[] = [];

    lines.forEach((line) => {
      // Match bullet points: -, *, or numbered lists
      const match = line.match(/^\s*[-*]\s+(.+)$/) || line.match(/^\s*\d+\.\s+(.+)$/);
      if (match) {
        currentList.push(match[1].trim());
      } else if (currentList.length > 0) {
        lists.push([...currentList]);
        currentList = [];
      }
    });

    if (currentList.length > 0) {
      lists.push(currentList);
    }

    return lists;
  }

  private extractTables(markdown: string): string[][] {
    const tables: string[][] = [];
    const lines = markdown.split('\n');
    let inTable = false;
    let currentTable: string[] = [];

    lines.forEach((line) => {
      if (line.includes('|')) {
        inTable = true;
        // Skip separator line (e.g., |---|---|)
        if (!line.match(/^\s*\|[\s-:|]+\|\s*$/)) {
          currentTable.push(line.trim());
        }
      } else if (inTable) {
        inTable = false;
        if (currentTable.length > 0) {
          tables.push([...currentTable]);
          currentTable = [];
        }
      }
    });

    if (currentTable.length > 0) {
      tables.push(currentTable);
    }

    return tables;
  }

  private extractKeyPoints(markdown: string, sections: Section[]): string[] {
    const keyPoints: string[] = [];

    // Extract first sentence from each section as key point
    sections.forEach((section) => {
      // Remove heading line
      const content = section.content.replace(/^#+\s+.+\n?/, '').trim();
      if (content) {
        // Get first sentence (split by period, exclamation, or question mark)
        const firstSentence = content.split(/[.!?]\s/)[0];
        if (firstSentence && firstSentence.length > 20) {
          keyPoints.push(firstSentence.trim());
        }
      }
    });

    return keyPoints.slice(0, 10); // Max 10 key points
  }

  private countWords(markdown: string): number {
    // Remove code blocks, images, links
    const cleaned = markdown
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '') // Images
      .replace(/\[.*?\]\(.*?\)/g, '') // Links
      .replace(/[#*_~`]/g, ''); // Markdown syntax

    return cleaned.split(/\s+/).filter(word => word.length > 0).length;
  }

  // ==========================================================================
  // Mindmap Structure Methods
  // ==========================================================================

  private buildTree(
    nodes: Node[],
    edges: Edge[],
    rootId: string,
    level: number = 0
  ): MindmapNode {
    const node = nodes.find(n => n.id === rootId);
    if (!node) {
      throw new Error(`Node ${rootId} not found`);
    }

    const mindmapNode = this.nodeToMindmapNode(node, level);

    // Find children
    const childEdges = edges.filter(e => e.source === rootId);
    mindmapNode.children = childEdges.map(edge => 
      this.buildTree(nodes, edges, edge.target, level + 1)
    );

    return mindmapNode;
  }

  private nodeToMindmapNode(node: Node, level: number): MindmapNode {
    return {
      id: node.id,
      label: node.data.label || 'Untitled',
      description: node.data.description,
      status: node.data.status,
      priority: node.data.priority,
      startDate: node.data.startDate ? new Date(node.data.startDate) : undefined,
      endDate: node.data.endDate ? new Date(node.data.endDate) : undefined,
      assignee: node.data.assignee,
      estimate: node.data.estimate,
      progress: node.data.progress,
      tags: node.data.tags,
      children: [],
      level,
    };
  }

  private calculateDepth(node: MindmapNode | null): number {
    if (!node || !node.children || node.children.length === 0) {
      return 0;
    }

    return 1 + Math.max(...node.children.map(child => this.calculateDepth(child)));
  }

  private countBranches(node: MindmapNode | null): number {
    if (!node || !node.children) {
      return 0;
    }

    return node.children.length;
  }

  private extractTasks(nodes: Node[]): Task[] {
    return nodes
      .filter(node => node.data.status || node.data.assignee) // Has PM fields
      .map(node => ({
        id: node.id,
        label: node.data.label || 'Untitled',
        description: node.data.description,
        status: node.data.status || 'todo',
        priority: node.data.priority,
        startDate: node.data.startDate ? new Date(node.data.startDate) : undefined,
        endDate: node.data.endDate ? new Date(node.data.endDate) : undefined,
        assignee: node.data.assignee,
        estimate: node.data.estimate,
        progress: node.data.progress || 0,
      }));
  }

  private extractTimeline(nodes: Node[]): { earliest?: Date; latest?: Date } {
    const dates = nodes
      .flatMap(node => [node.data.startDate, node.data.endDate])
      .filter(Boolean)
      .map(d => new Date(d!));

    if (dates.length === 0) {
      return {};
    }

    return {
      earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
      latest: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  }

  private generateInsights(
    tree: MindmapNode | null,
    tasks: Task[],
    timeline: { earliest?: Date; latest?: Date }
  ): string {
    if (!tree) return 'No structure';

    const insights: string[] = [];

    // Task completion insights
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

    if (tasks.length > 0) {
      const completionRate = Math.round((completedTasks / tasks.length) * 100);
      insights.push(`${completionRate}% tasks complete (${completedTasks}/${tasks.length})`);
      
      if (inProgressTasks > 0) {
        insights.push(`${inProgressTasks} tasks in progress`);
      }
      if (blockedTasks > 0) {
        insights.push(`⚠️ ${blockedTasks} tasks blocked`);
      }
    }

    // Timeline insights
    if (timeline.earliest && timeline.latest) {
      const duration = Math.ceil(
        (timeline.latest.getTime() - timeline.earliest.getTime()) / (1000 * 60 * 60 * 24)
      );
      insights.push(`Timeline: ${duration} days`);
    }

    // Structure insights
    insights.push(`${tree.children?.length || 0} main branches`);

    return insights.join(' • ');
  }
}

// Export singleton instance
export const contentAnalyzer = new ContentAnalyzer();

