/**
 * Response Post-Processor
 * 
 * Cleans, formats, and enhances AI responses before user sees them.
 * This is where we apply final polish and consistency.
 */

export interface ProcessedResponse {
  content: string;
  hasChanges: boolean;
  improvements: string[];
}

export class ResponseProcessor {
  /**
   * Main processing pipeline
   */
  static process(rawResponse: string): ProcessedResponse {
    let content = rawResponse;
    const improvements: string[] = [];

    // Pipeline stages
    content = this.removeSystemTags(content, improvements);
    content = this.fixMarkdownFormatting(content, improvements);
    content = this.enhanceListFormatting(content, improvements);
    content = this.addVisualSeparators(content, improvements);
    content = this.improveCodeBlocks(content, improvements);
    content = this.enhanceEmphasis(content, improvements);
    content = this.cleanupWhitespace(content, improvements);

    return {
      content,
      hasChanges: improvements.length > 0,
      improvements,
    };
  }

  /**
   * Remove any system/debug tags that leaked through
   */
  private static removeSystemTags(content: string, improvements: string[]): string {
    const patterns = [
      /\[SYSTEM:.*?\]/gi,
      /\[DEBUG:.*?\]/gi,
      /\[THINKING:.*?\]/gi,
      /<thinking>.*?<\/thinking>/gis,
    ];

    let cleaned = content;
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '');
        improvements.push('Removed system tags');
      }
    }

    return cleaned;
  }

  /**
   * Fix common markdown formatting issues
   */
  private static fixMarkdownFormatting(content: string, improvements: string[]): string {
    let fixed = content;

    // Fix heading spacing (need blank line before heading)
    const headingPattern = /([^\n])\n(#{1,6} )/g;
    if (headingPattern.test(fixed)) {
      fixed = fixed.replace(headingPattern, '$1\n\n$2');
      improvements.push('Fixed heading spacing');
    }

    // Fix list spacing (need blank line before list)
    const listPattern = /([^\n])\n([-*+] )/g;
    if (listPattern.test(fixed)) {
      fixed = fixed.replace(listPattern, '$1\n\n$2');
      improvements.push('Fixed list spacing');
    }

    // Fix bold/italic syntax
    fixed = fixed.replace(/\*\*\*(.+?)\*\*\*/g, '**$1**'); // Remove triple asterisks
    fixed = fixed.replace(/___(.+?)___/g, '**$1**'); // Convert underscores to asterisks

    return fixed;
  }

  /**
   * Enhance list formatting with proper icons and structure
   */
  private static enhanceListFormatting(content: string, improvements: string[]): string {
    let enhanced = content;

    // Fix checkbox formatting (common mistakes)
    // Fix: - [] → - [ ]
    enhanced = enhanced.replace(/- \[\]/g, '- [ ]');
    // Fix: - [X] → - [x] (lowercase x is preferred)
    enhanced = enhanced.replace(/- \[X\]/g, '- [x]');
    // Fix: -[ ] → - [ ] (add space after hyphen)
    enhanced = enhanced.replace(/-\[([x ])\]/g, '- [$1]');

    // Detect plain lists without icons and add appropriate ones
    // But DON'T add icons to checkboxes!
    const listSections: Record<string, string> = {
      'auth|security|password': '🔑',
      'protect|shield|safe': '🛡️',
      'mobile|phone|biometric': '📱',
      'token|session|ticket': '🎫',
      'config|setting|setup': '🔧',
      'deploy|launch|production': '🚀',
      'document|guide|reference': '📚',
      'warning|caution|important': '⚠️',
      'success|complete|done': '✅',
      'tip|advice|best': '💡',
    };

    // Find lists and add icons if missing (but NOT checkboxes)
    const listItemPattern = /^(\s*[-*+] )(?!\[[x ]\])(?![🔑🛡️📱🎫🔧🚀📚⚠️✅💡])(.+)$/gm;
    const matches = enhanced.match(listItemPattern);

    if (matches) {
      matches.forEach((match) => {
        const text = match.toLowerCase();
        for (const [keywords, icon] of Object.entries(listSections)) {
          const keywordList = keywords.split('|');
          if (keywordList.some(keyword => text.includes(keyword))) {
            const newItem = match.replace(/^(\s*[-*+] )/, `$1${icon} `);
            enhanced = enhanced.replace(match, newItem);
            improvements.push(`Added ${icon} icon to list item`);
            break;
          }
        }
      });
    }

    return enhanced;
  }

  /**
   * Add visual separators for better readability
   */
  private static addVisualSeparators(content: string, improvements: string[]): string {
    let separated = content;

    // Add separator before major sections (## headings)
    // But not at the very start
    const majorHeadingPattern = /(?<!^)\n\n(## [^\n]+)/g;
    if (majorHeadingPattern.test(separated)) {
      separated = separated.replace(majorHeadingPattern, '\n\n---\n\n$1');
      improvements.push('Added section separators');
    }

    return separated;
  }

  /**
   * Improve code block formatting
   */
  private static improveCodeBlocks(content: string, improvements: string[]): string {
    let improved = content;

    // Add language tags to code blocks without them
    const untaggedCodeBlock = /```\n([^`]+)```/g;
    const matches = improved.match(untaggedCodeBlock);

    if (matches) {
      matches.forEach((match) => {
        const code = match.slice(4, -3);
        let language = 'text';

        // Detect language from content
        if (code.includes('npm install') || code.includes('yarn add')) {
          language = 'bash';
        } else if (code.includes('import ') || code.includes('export ')) {
          language = 'typescript';
        } else if (code.includes('function ') || code.includes('const ')) {
          language = 'javascript';
        } else if (code.includes('def ') || code.includes('import ')) {
          language = 'python';
        } else if (code.includes('{') && code.includes('}')) {
          language = 'json';
        }

        improved = improved.replace(match, `\`\`\`${language}\n${code}\`\`\``);
        improvements.push(`Added ${language} syntax highlighting`);
      });
    }

    return improved;
  }

  /**
   * Enhance emphasis (bold important terms)
   */
  private static enhanceEmphasis(content: string, improvements: string[]): string {
    let emphasized = content;

    // Bold important technical terms if not already bold
    const importantTerms = [
      'authentication',
      'authorization',
      'session',
      'token',
      'security',
      'encryption',
      'API',
      'OAuth',
      'JWT',
      'HTTPS',
    ];

    importantTerms.forEach((term) => {
      // Only bold if it's at the start of a sentence or after ": "
      const pattern = new RegExp(`(^|: )(${term})(?!\\*\\*)`, 'gmi');
      if (pattern.test(emphasized)) {
        emphasized = emphasized.replace(pattern, '$1**$2**');
        improvements.push(`Emphasized "${term}"`);
      }
    });

    return emphasized;
  }

  /**
   * Final cleanup of whitespace
   */
  private static cleanupWhitespace(content: string, improvements: string[]): string {
    let cleaned = content;

    // Remove excessive blank lines (max 2 in a row)
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    // Remove trailing whitespace on each line
    cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');

    // Ensure file ends with single newline
    cleaned = cleaned.trimEnd() + '\n';

    return cleaned;
  }

  /**
   * Extract structure info from response (for analytics)
   */
  static analyzeStructure(content: string): {
    hasHeadings: boolean;
    hasLists: boolean;
    hasCodeBlocks: boolean;
    hasTables: boolean;
    hasIcons: boolean;
    wordCount: number;
  } {
    return {
      hasHeadings: /^#{1,6} /m.test(content),
      hasLists: /^[-*+] /m.test(content),
      hasCodeBlocks: /```/.test(content),
      hasTables: /^\|.*\|$/m.test(content),
      hasIcons: /[🔑🛡️📱🎫🔧🚀📚⚠️✅💡]/.test(content),
      wordCount: content.split(/\s+/).length,
    };
  }
}

