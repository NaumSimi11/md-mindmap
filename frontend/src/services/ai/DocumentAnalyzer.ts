/**
 * DocumentAnalyzer - Deep Context Understanding
 * 
 * Analyzes documents to understand:
 * - What type of document is this? (tutorial, reference, checklist)
 * - What patterns are already being used? (checkboxes, bullets, tables)
 * - What does the user want to achieve? (fill, improve, format)
 * - What format would be best for this content?
 */

export interface DocumentContext {
  // Document Classification
  documentType: 'tutorial' | 'reference' | 'checklist' | 'guide' | 'comparison' | 'technical' | 'creative' | 'business';
  
  // Existing Patterns
  hasCheckboxes: boolean;
  hasBulletLists: boolean;
  hasNumberedLists: boolean;
  hasTables: boolean;
  hasCodeBlocks: boolean;
  hasIcons: boolean;
  
  // Structure Analysis
  mainSections: string[];
  totalSections: number;
  averageSectionLength: number;
  
  // Style Analysis
  tone: 'formal' | 'casual' | 'technical' | 'friendly';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  
  // Current Section Context
  currentSectionType?: 'prerequisites' | 'features' | 'steps' | 'completed' | 'todo' | 'comparison' | 'reference' | 'general';
  currentSectionTitle?: string;
}

export interface UserIntent {
  action: 'fill' | 'improve' | 'expand' | 'format' | 'create' | 'list';
  target?: string; // What section or content
  specificRequest?: 'checkboxes' | 'bullets' | 'table' | 'steps' | 'code' | 'none';
  urgency: 'normal' | 'immediate';
}

export class DocumentAnalyzer {
  /**
   * Main analysis entry point
   */
  static analyzeDocument(content: string, title: string): DocumentContext {
    return {
      documentType: this.detectDocumentType(content, title),
      hasCheckboxes: this.hasPattern(content, /- \[[x ]\]/),
      hasBulletLists: this.hasPattern(content, /^[-*+] /m),
      hasNumberedLists: this.hasPattern(content, /^\d+\. /m),
      hasTables: this.hasPattern(content, /^\|.*\|.*\|$/m),
      hasCodeBlocks: this.hasPattern(content, /```/),
      hasIcons: this.hasPattern(content, /[🔑🛡️📱🎫🔧🚀📚⚠️✅💡🌟📊]/),
      mainSections: this.extractMainSections(content),
      totalSections: this.countSections(content),
      averageSectionLength: this.calculateAverageSectionLength(content),
      tone: this.detectTone(content),
      complexity: this.detectComplexity(content),
    };
  }

  /**
   * Analyze current section context
   */
  static analyzeCurrentSection(sectionTitle: string, sectionContent: string): Pick<DocumentContext, 'currentSectionType' | 'currentSectionTitle'> {
    const title = sectionTitle.toLowerCase();
    const content = sectionContent.toLowerCase();
    const combined = title + ' ' + content;

    let sectionType: DocumentContext['currentSectionType'] = 'general';

    // Pattern matching for section types
    if (this.matchesKeywords(combined, ['prerequisite', 'requirement', 'need', 'before you start', 'setup needed'])) {
      sectionType = 'prerequisites';
    } else if (this.matchesKeywords(combined, ['feature', 'benefit', 'capability', 'advantage', 'what it does'])) {
      sectionType = 'features';
    } else if (this.matchesKeywords(combined, ['step', 'installation', 'setup', 'how to', 'getting started', 'tutorial'])) {
      sectionType = 'steps';
    } else if (this.matchesKeywords(combined, ['completed', 'done', 'finished', 'accomplished', 'achieved'])) {
      sectionType = 'completed';
    } else if (this.matchesKeywords(combined, ['todo', 'action', 'task', 'must do', 'next step', 'remaining'])) {
      sectionType = 'todo';
    } else if (this.matchesKeywords(combined, ['compare', 'versus', 'vs', 'difference', 'comparison'])) {
      sectionType = 'comparison';
    } else if (this.matchesKeywords(combined, ['api', 'reference', 'command', 'method', 'function', 'parameter'])) {
      sectionType = 'reference';
    }

    return {
      currentSectionType: sectionType,
      currentSectionTitle: sectionTitle,
    };
  }

  /**
   * Detect user intent from their message
   */
  static detectUserIntent(userMessage: string, documentContext: DocumentContext): UserIntent {
    const msg = userMessage.toLowerCase();

    // Detect action
    let action: UserIntent['action'] = 'improve';
    if (this.matchesKeywords(msg, ['fill', 'complete', 'add content', 'populate'])) {
      action = 'fill';
    } else if (this.matchesKeywords(msg, ['improve', 'enhance', 'better', 'polish'])) {
      action = 'improve';
    } else if (this.matchesKeywords(msg, ['expand', 'more detail', 'elaborate', 'explain more'])) {
      action = 'expand';
    } else if (this.matchesKeywords(msg, ['format', 'structure', 'organize', 'clean up'])) {
      action = 'format';
    } else if (this.matchesKeywords(msg, ['create', 'add', 'write', 'make'])) {
      action = 'create';
    } else if (this.matchesKeywords(msg, ['list', 'show', 'what are', 'give me'])) {
      action = 'list';
    }

    // Detect specific format request
    let specificRequest: UserIntent['specificRequest'] = 'none';
    if (this.matchesKeywords(msg, ['checkbox', 'checklist', 'check box', 'tick box'])) {
      specificRequest = 'checkboxes';
    } else if (this.matchesKeywords(msg, ['bullet', 'list', 'points'])) {
      specificRequest = 'bullets';
    } else if (this.matchesKeywords(msg, ['table', 'comparison table', 'grid'])) {
      specificRequest = 'table';
    } else if (this.matchesKeywords(msg, ['step', 'tutorial', 'guide', 'how to'])) {
      specificRequest = 'steps';
    } else if (this.matchesKeywords(msg, ['code', 'example', 'snippet'])) {
      specificRequest = 'code';
    }

    // Detect urgency
    const urgency = this.matchesKeywords(msg, ['directly', 'just do', 'now', 'immediately', 'right now'])
      ? 'immediate'
      : 'normal';

    return {
      action,
      specificRequest,
      urgency,
    };
  }

  // ==================== Private Helper Methods ====================

  private static detectDocumentType(content: string, title: string): DocumentContext['documentType'] {
    const text = (title + ' ' + content).toLowerCase();

    if (this.matchesKeywords(text, ['tutorial', 'how to', 'guide', 'getting started', 'walkthrough'])) {
      return 'tutorial';
    }
    if (this.matchesKeywords(text, ['api', 'reference', 'documentation', 'specification', 'command'])) {
      return 'reference';
    }
    if (this.matchesKeywords(text, ['checklist', 'todo', 'task list', 'action items'])) {
      return 'checklist';
    }
    if (this.matchesKeywords(text, ['compare', 'comparison', 'vs', 'versus', 'difference'])) {
      return 'comparison';
    }
    if (this.matchesKeywords(text, ['technical', 'architecture', 'system', 'implementation'])) {
      return 'technical';
    }
    if (this.matchesKeywords(text, ['business', 'strategy', 'proposal', 'report'])) {
      return 'business';
    }
    if (this.matchesKeywords(text, ['creative', 'story', 'blog', 'article'])) {
      return 'creative';
    }

    return 'guide'; // default
  }

  private static detectTone(content: string): DocumentContext['tone'] {
    const text = content.toLowerCase();

    const formalIndicators = ['therefore', 'furthermore', 'consequently', 'hereby', 'pursuant'];
    const casualIndicators = ['hey', 'cool', 'awesome', 'btw', 'fyi', 'gonna', 'wanna'];
    const technicalIndicators = ['implementation', 'algorithm', 'instantiate', 'polymorphism', 'asynchronous'];

    const formalCount = formalIndicators.filter(w => text.includes(w)).length;
    const casualCount = casualIndicators.filter(w => text.includes(w)).length;
    const technicalCount = technicalIndicators.filter(w => text.includes(w)).length;

    if (technicalCount > 2) return 'technical';
    if (casualCount > formalCount) return 'casual';
    if (formalCount > casualCount) return 'formal';
    return 'friendly';
  }

  private static detectComplexity(content: string): DocumentContext['complexity'] {
    const avgWordLength = content.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / content.split(/\s+/).length;
    const hasAdvancedTerms = this.matchesKeywords(content, [
      'architecture', 'polymorphism', 'asynchronous', 'paradigm', 'abstraction',
      'optimization', 'scalability', 'implementation', 'infrastructure'
    ]);

    if (avgWordLength > 6 || hasAdvancedTerms) return 'advanced';
    if (avgWordLength > 4.5) return 'intermediate';
    return 'beginner';
  }

  private static extractMainSections(content: string): string[] {
    const headingRegex = /^##\s+(.+)$/gm;
    const matches = [...content.matchAll(headingRegex)];
    return matches.map(m => m[1].trim()).slice(0, 10); // Top 10 sections
  }

  private static countSections(content: string): number {
    return (content.match(/^##\s+/gm) || []).length;
  }

  private static calculateAverageSectionLength(content: string): number {
    const sections = content.split(/^##\s+/gm).filter(s => s.trim().length > 0);
    if (sections.length === 0) return 0;
    const totalLength = sections.reduce((sum, section) => sum + section.length, 0);
    return Math.round(totalLength / sections.length);
  }

  private static hasPattern(text: string, pattern: RegExp): boolean {
    return pattern.test(text);
  }

  private static matchesKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }
}



