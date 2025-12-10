/**
 * MDFileAnalyzerService
 * 
 * Analyzes markdown files and suggests actions based on content structure.
 * Handles different user states (offline/online, logged in/out).
 */

import type { FileAnalysisResult } from '@/components/landing/MDFileDropZone';

export interface ActionSuggestion {
  id: string;
  type: 'mindmap' | 'document' | 'summary' | 'actionItems';
  title: string;
  description: string;
  icon: string;
  priority: number;
  estimatedNodes?: number;
  requiresAuth?: boolean;
}

export interface AnalysisInsights {
  summary: string;
  suggestions: ActionSuggestion[];
  complexity: 'simple' | 'medium' | 'complex';
  bestSuggestion: ActionSuggestion;
}

class MDFileAnalyzerService {
  /**
   * Main analysis function
   * Takes file analysis result and returns actionable insights
   */
  async generateInsights(
    fileAnalysis: FileAnalysisResult,
    userState?: {
      isOnline: boolean;
      isLoggedIn: boolean;
      creditsRemaining?: number;
    }
  ): Promise<AnalysisInsights> {
    const { analysis, content } = fileAnalysis;

    // Determine complexity
    const complexity = this.calculateComplexity(analysis);

    // Generate suggestions based on content
    const suggestions = this.generateSuggestions(fileAnalysis);

    // Create summary
    const summary = this.generateSummary(fileAnalysis);

    // Pick best suggestion (highest priority)
    const bestSuggestion = suggestions.reduce((best, current) =>
      current.priority > best.priority ? current : best
    );

    return {
      summary,
      suggestions,
      complexity,
      bestSuggestion,
    };
  }

  /**
   * Calculate content complexity
   */
  private calculateComplexity(analysis: FileAnalysisResult['analysis']): 'simple' | 'medium' | 'complex' {
    const { wordCount, headings, mermaidDiagrams, codeBlocks } = analysis;

    const complexityScore =
      (wordCount > 2000 ? 2 : wordCount > 500 ? 1 : 0) +
      (headings.length > 15 ? 2 : headings.length > 5 ? 1 : 0) +
      (mermaidDiagrams > 3 ? 2 : mermaidDiagrams > 0 ? 1 : 0) +
      (codeBlocks > 5 ? 1 : 0);

    if (complexityScore >= 5) return 'complex';
    if (complexityScore >= 3) return 'medium';
    return 'simple';
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(fileAnalysis: FileAnalysisResult): string {
    const { analysis, fileName } = fileAnalysis;
    const { wordCount, headings, mermaidDiagrams, codeBlocks, hasActionItems } = analysis;

    const h1Count = headings.filter(h => h.level === 1).length;
    const h2Count = headings.filter(h => h.level === 2).length;

    const parts: string[] = [];

    // Word count
    if (wordCount > 0) {
      parts.push(`${wordCount.toLocaleString()} words`);
    }

    // Headings
    if (h1Count > 0) {
      parts.push(`${h1Count} main ${h1Count === 1 ? 'section' : 'sections'}`);
    }
    if (h2Count > 0) {
      parts.push(`${h2Count} ${h2Count === 1 ? 'subsection' : 'subsections'}`);
    }

    // Special content
    if (mermaidDiagrams > 0) {
      parts.push(`${mermaidDiagrams} ${mermaidDiagrams === 1 ? 'diagram' : 'diagrams'}`);
    }
    if (codeBlocks > 0) {
      parts.push(`${codeBlocks} code ${codeBlocks === 1 ? 'block' : 'blocks'}`);
    }
    if (hasActionItems) {
      parts.push('action items');
    }

    const summary = parts.join(', ');
    return summary ? `Found: ${summary}` : 'File analyzed successfully';
  }

  /**
   * Generate action suggestions based on content structure
   * PRIORITY: Editor is always recommended, Mindmap is secondary feature
   */
  private generateSuggestions(fileAnalysis: FileAnalysisResult): ActionSuggestion[] {
    const { analysis } = fileAnalysis;
    const { wordCount, headings, mermaidDiagrams, hasActionItems } = analysis;

    const suggestions: ActionSuggestion[] = [];
    const h1Count = headings.filter(h => h.level === 1).length;
    const h2Count = headings.filter(h => h.level === 2).length;

    // SUGGESTION 1: Beautify & Edit (ALWAYS RECOMMENDED)
    // This is our primary feature - premium WYSIWYG editor
    suggestions.push({
      id: 'beautify',
      type: 'document',
      title: 'Open in Editor',
      description: 'Edit with premium WYSIWYG editor',
      icon: '✍️',
      priority: 100, // Highest priority - always recommended
    });

    // SUGGESTION 2: Mindmap (FEATURE, not primary)
    // Good for: Hierarchical structure, many headings
    if (headings.length >= 4) {
      const estimatedNodes = Math.min(headings.length + 5, 50);
      suggestions.push({
        id: 'mindmap',
        type: 'mindmap',
        title: 'Create Mindmap',
        description: `Visualize ${headings.length} topics as interactive nodes`,
        icon: '🧠',
        priority: headings.length >= 10 ? 80 : 70,
        estimatedNodes,
      });
    }

    // SUGGESTION 3: Extract Summary
    // Good for: Long documents
    if (wordCount > 500) {
      suggestions.push({
        id: 'summary',
        type: 'summary',
        title: 'Generate Summary',
        description: 'AI-powered TL;DR version',
        icon: '📋',
        priority: wordCount > 2000 ? 65 : 55,
      });
    }

    // SUGGESTION 4: Extract Action Items
    // Good for: Documents with todos/tasks
    if (hasActionItems || wordCount > 300) {
      suggestions.push({
        id: 'action-items',
        type: 'actionItems',
        title: 'Extract Action Items',
        description: 'Find and organize todos',
        icon: '🎯',
        priority: hasActionItems ? 75 : 50,
      });
    }

    // Sort by priority (highest first)
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * PLACEHOLDER: Check if user can perform action
   * TODO: Implement actual auth/credit checking
   */
  canPerformAction(
    actionType: ActionSuggestion['type'],
    userState?: {
      isOnline: boolean;
      isLoggedIn: boolean;
      creditsRemaining?: number;
    }
  ): { allowed: boolean; reason?: string } {
    // PLACEHOLDER LOGIC - Replace with actual implementation

    // For now, allow everything in guest mode
    const isGuest = !userState?.isLoggedIn;

    if (isGuest) {
      const guestCredits = this.getGuestCredits();
      
      if (guestCredits <= 0) {
        return {
          allowed: false,
          reason: 'Out of free credits. Sign up for unlimited access!',
        };
      }

      return { allowed: true };
    }

    // Logged-in users
    // TODO: Check subscription tier, credits, etc.
    return { allowed: true };
  }

  /**
   * PLACEHOLDER: Get guest credits from localStorage
   * TODO: Sync with backend
   */
  private getGuestCredits(): number {
    const credits = localStorage.getItem('guest-credits-remaining');
    return credits ? parseInt(credits, 10) : 3;
  }

  /**
   * PLACEHOLDER: Consume a credit
   * TODO: Sync with backend
   */
  useCredit(): void {
    const current = this.getGuestCredits();
    if (current > 0) {
      localStorage.setItem('guest-credits-remaining', (current - 1).toString());
    }
  }

  /**
   * PLACEHOLDER: Handle offline mode
   * TODO: Implement offline analysis capabilities
   */
  async analyzeOffline(
    fileAnalysis: FileAnalysisResult
  ): Promise<AnalysisInsights> {
    // For now, just use regular analysis
    // TODO: Add offline-specific limitations/features
    console.log('🔌 OFFLINE MODE - Limited AI features');
    return this.generateInsights(fileAnalysis, {
      isOnline: false,
      isLoggedIn: false,
    });
  }

  /**
   * PLACEHOLDER: Save analysis to backend
   * TODO: Implement backend persistence
   */
  async saveAnalysis(
    fileAnalysis: FileAnalysisResult,
    insights: AnalysisInsights,
    userId?: string
  ): Promise<void> {
    console.log('💾 TODO: Save analysis to backend', {
      fileName: fileAnalysis.fileName,
      userId,
      insights,
    });
    // TODO: POST to backend API
  }
}

// Export singleton instance
export const mdFileAnalyzerService = new MDFileAnalyzerService();

