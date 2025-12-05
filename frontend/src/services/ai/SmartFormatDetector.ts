/**
 * SmartFormatDetector - Perfect Format Selection
 * 
 * Decides EXACTLY what format to use based on:
 * - Content type
 * - User intent
 * - Document context
 * - Existing patterns
 */

import { DocumentContext, UserIntent } from './DocumentAnalyzer';

export type ContentFormat = 
  | 'checkbox-unchecked'
  | 'checkbox-checked'
  | 'checkbox-mixed'
  | 'bullets-plain'
  | 'bullets-with-icons'
  | 'numbered-list'
  | 'table'
  | 'code-block'
  | 'definition-list'
  | 'paragraph';

export interface FormatDecision {
  format: ContentFormat;
  reason: string;
  icon?: string;
  structure: 'flat' | 'nested' | 'grouped';
  confidence: 'high' | 'medium' | 'low';
}

export class SmartFormatDetector {
  /**
   * Main decision engine
   */
  static detectOptimalFormat(
    userIntent: UserIntent,
    documentContext: DocumentContext,
    contentType?: string
  ): FormatDecision {
    // 1. Explicit user request overrides everything
    if (userIntent.specificRequest && userIntent.specificRequest !== 'none') {
      return this.handleExplicitRequest(userIntent.specificRequest);
    }

    // 2. Use section type if available
    if (documentContext.currentSectionType) {
      const decision = this.formatForSectionType(documentContext.currentSectionType, documentContext);
      if (decision) return decision;
    }

    // 3. Infer from content type keywords
    if (contentType) {
      const decision = this.inferFromContentKeywords(contentType, documentContext);
      if (decision) return decision;
    }

    // 4. Match existing document patterns
    return this.matchDocumentPatterns(documentContext);
  }

  /**
   * Handle explicit format requests from user
   */
  private static handleExplicitRequest(request: NonNullable<UserIntent['specificRequest']>): FormatDecision {
    const formatMap: Record<NonNullable<UserIntent['specificRequest']>, FormatDecision> = {
      'checkboxes': {
        format: 'checkbox-unchecked',
        reason: 'User explicitly requested checkboxes',
        structure: 'flat',
        confidence: 'high'
      },
      'bullets': {
        format: 'bullets-with-icons',
        reason: 'User explicitly requested bullet points',
        structure: 'flat',
        confidence: 'high'
      },
      'table': {
        format: 'table',
        reason: 'User explicitly requested a table',
        structure: 'grouped',
        confidence: 'high'
      },
      'steps': {
        format: 'numbered-list',
        reason: 'User explicitly requested steps',
        structure: 'flat',
        confidence: 'high'
      },
      'code': {
        format: 'code-block',
        reason: 'User explicitly requested code examples',
        structure: 'flat',
        confidence: 'high'
      },
      'none': {
        format: 'paragraph',
        reason: 'Default paragraph format',
        structure: 'flat',
        confidence: 'medium'
      }
    };

    return formatMap[request];
  }

  /**
   * Determine format based on section type
   */
  private static formatForSectionType(
    sectionType: NonNullable<DocumentContext['currentSectionType']>,
    context: DocumentContext
  ): FormatDecision {
    const formatMap: Record<NonNullable<DocumentContext['currentSectionType']>, FormatDecision> = {
      'prerequisites': {
        format: 'checkbox-unchecked',
        reason: 'Prerequisites are action items that need to be completed',
        icon: '🔧',
        structure: 'flat',
        confidence: 'high'
      },
      'todo': {
        format: 'checkbox-unchecked',
        reason: 'Todo items need to be checked off as completed',
        icon: '✅',
        structure: 'flat',
        confidence: 'high'
      },
      'completed': {
        format: 'checkbox-checked',
        reason: 'These items are already completed',
        icon: '✅',
        structure: 'flat',
        confidence: 'high'
      },
      'features': {
        format: 'bullets-with-icons',
        reason: 'Features are best displayed as bullet points with icons',
        icon: '🌟',
        structure: 'flat',
        confidence: 'high'
      },
      'steps': {
        format: 'numbered-list',
        reason: 'Steps must be followed in order',
        structure: 'flat',
        confidence: 'high'
      },
      'comparison': {
        format: 'table',
        reason: 'Comparisons are clearest in table format',
        structure: 'grouped',
        confidence: 'high'
      },
      'reference': {
        format: context.hasCodeBlocks ? 'code-block' : 'definition-list',
        reason: 'Reference documentation needs structured format',
        structure: 'grouped',
        confidence: 'high'
      },
      'general': {
        format: context.hasBulletLists ? 'bullets-with-icons' : 'paragraph',
        reason: 'General content follows document patterns',
        structure: 'flat',
        confidence: 'medium'
      }
    };

    return formatMap[sectionType];
  }

  /**
   * Infer format from content keywords
   */
  private static inferFromContentKeywords(content: string, context: DocumentContext): FormatDecision | null {
    const lower = content.toLowerCase();

    // Priority 1: Prerequisites/Requirements
    if (this.matchesAny(lower, ['prerequisite', 'requirement', 'need to have', 'before you', 'must have'])) {
      return {
        format: 'checkbox-unchecked',
        reason: 'Content indicates prerequisites that need to be met',
        icon: '🔧',
        structure: 'flat',
        confidence: 'high'
      };
    }

    // Priority 2: Completed/Done
    if (this.matchesAny(lower, ['completed', 'done', 'finished', 'accomplished', 'achieved'])) {
      return {
        format: 'checkbox-checked',
        reason: 'Content indicates completed items',
        icon: '✅',
        structure: 'flat',
        confidence: 'high'
      };
    }

    // Priority 3: Action Items
    if (this.matchesAny(lower, ['action', 'todo', 'task', 'must do', 'need to do'])) {
      return {
        format: 'checkbox-unchecked',
        reason: 'Content indicates action items for the user',
        icon: '✅',
        structure: 'flat',
        confidence: 'high'
      };
    }

    // Priority 4: Sequential Steps
    if (this.matchesAny(lower, ['step', 'installation', 'setup', 'how to', 'tutorial', 'guide'])) {
      return {
        format: 'numbered-list',
        reason: 'Content requires sequential steps',
        structure: 'flat',
        confidence: 'high'
      };
    }

    // Priority 5: Features/Benefits
    if (this.matchesAny(lower, ['feature', 'benefit', 'capability', 'advantage', 'option', 'method'])) {
      return {
        format: 'bullets-with-icons',
        reason: 'Content lists features or options',
        icon: '🌟',
        structure: 'flat',
        confidence: 'high'
      };
    }

    // Priority 6: Comparison
    if (this.matchesAny(lower, ['compare', 'versus', 'vs', 'difference', 'comparison'])) {
      return {
        format: 'table',
        reason: 'Content requires comparison format',
        structure: 'grouped',
        confidence: 'high'
      };
    }

    return null;
  }

  /**
   * Match existing document patterns
   */
  private static matchDocumentPatterns(context: DocumentContext): FormatDecision {
    // If document already uses checkboxes heavily, continue that pattern
    if (context.hasCheckboxes && context.documentType === 'checklist') {
      return {
        format: 'checkbox-mixed',
        reason: 'Matching existing checkbox pattern in document',
        structure: 'flat',
        confidence: 'medium'
      };
    }

    // If document uses numbered lists, continue that
    if (context.hasNumberedLists && context.documentType === 'tutorial') {
      return {
        format: 'numbered-list',
        reason: 'Matching existing tutorial style',
        structure: 'flat',
        confidence: 'medium'
      };
    }

    // If document uses tables, continue that
    if (context.hasTables && context.documentType === 'comparison') {
      return {
        format: 'table',
        reason: 'Matching existing comparison format',
        structure: 'grouped',
        confidence: 'medium'
      };
    }

    // Default: bullets with icons (safest, most versatile)
    return {
      format: 'bullets-with-icons',
      reason: 'Default format - versatile and readable',
        icon: '📌',
      structure: 'flat',
      confidence: 'low'
    };
  }

  /**
   * Get icon for content type
   */
  static getIconForContent(content: string): string {
    const iconMap: Record<string, string> = {
      'auth|security|password|login': '🔑',
      'protect|shield|safe|secure': '🛡️',
      'mobile|phone|biometric|device': '📱',
      'token|session|ticket|cookie': '🎫',
      'config|setting|setup|install': '🔧',
      'deploy|launch|production|ship': '🚀',
      'document|guide|reference|docs': '📚',
      'warning|caution|important|alert': '⚠️',
      'success|complete|done|finish': '✅',
      'tip|advice|best|practice': '💡',
      'feature|capability|ability': '🌟',
      'data|database|storage': '💾',
      'api|endpoint|service': '🔌',
      'test|testing|quality': '🧪',
      'performance|speed|fast': '⚡',
      'user|account|profile': '👤',
      'file|folder|directory': '📁',
      'code|programming|development': '💻',
      'bug|error|issue': '🐛',
      'idea|innovation|creative': '💡',
    };

    const lower = content.toLowerCase();
    for (const [keywords, icon] of Object.entries(iconMap)) {
      if (keywords.split('|').some(k => lower.includes(k))) {
        return icon;
      }
    }

    return '📌'; // default
  }

  /**
   * Should use checked or unchecked checkbox?
   */
  static getCheckboxState(content: string): 'checked' | 'unchecked' | 'mixed' {
    const lower = content.toLowerCase();

    // Completed/Done → Checked
    if (this.matchesAny(lower, ['completed', 'done', 'finished', 'accomplished', 'achieved', 'success'])) {
      return 'checked';
    }

    // Prerequisites/Todo → Unchecked
    if (this.matchesAny(lower, ['prerequisite', 'requirement', 'todo', 'action', 'must do', 'need to'])) {
      return 'unchecked';
    }

    // Validation checklist → Mixed (some checked, some not)
    if (this.matchesAny(lower, ['validate', 'check', 'verify', 'review', 'audit'])) {
      return 'mixed';
    }

    return 'unchecked'; // default
  }

  // ==================== Helper Methods ====================

  private static matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}



