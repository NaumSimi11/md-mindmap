/**
 * StreamingParser - Natural response parsing for AI chat
 * 
 * Features:
 * - Extracts text content from streaming response
 * - Detects and isolates function calls
 * - Provides clean, displayable content
 * - Handles partial JSON during streaming
 */

export interface ParsedStream {
  /** Clean text content for display */
  displayContent: string;
  /** Whether we're currently in a JSON block */
  inJson: boolean;
  /** Detected function call (if complete) */
  functionCall: {
    name: string;
    arguments: any;
  } | null;
  /** Raw content before any processing */
  raw: string;
  /** Status of parsing */
  status: 'streaming' | 'complete' | 'error';
}

export class StreamingParser {
  private buffer: string = '';
  private jsonStartIndex: number = -1;
  private functionCall: { name: string; arguments: any } | null = null;

  /**
   * Process incoming chunk and return parsed state
   */
  processChunk(chunk: string): ParsedStream {
    this.buffer += chunk;
    return this.parse();
  }

  /**
   * Parse current buffer
   */
  private parse(): ParsedStream {
    let displayContent = this.buffer;
    let inJson = false;

    // Look for JSON function call patterns
    const jsonPatterns = [
      /\{\s*"function"\s*:/,
      /```json\s*\{/,
      /\{\s*\\?"function\\?"\s*:/,
    ];

    for (const pattern of jsonPatterns) {
      const match = this.buffer.match(pattern);
      if (match && match.index !== undefined) {
        this.jsonStartIndex = match.index;
        inJson = true;
        // Extract text before JSON
        displayContent = this.buffer.substring(0, this.jsonStartIndex).trim();
        break;
      }
    }

    // Try to parse complete function call
    if (this.jsonStartIndex >= 0) {
      const jsonPart = this.buffer.substring(this.jsonStartIndex);
      const extractedJson = this.extractJson(jsonPart);
      
      if (extractedJson) {
        try {
          const parsed = JSON.parse(extractedJson);
          if (parsed.function && parsed.arguments) {
            this.functionCall = {
              name: parsed.function,
              arguments: parsed.arguments,
            };
          }
        } catch {
          // JSON not yet complete, keep streaming
        }
      }
    }

    // Clean up display content
    displayContent = this.cleanContent(displayContent);

    return {
      displayContent,
      inJson,
      functionCall: this.functionCall,
      raw: this.buffer,
      status: 'streaming',
    };
  }

  /**
   * Finalize parsing and return final state
   */
  finalize(): ParsedStream {
    const result = this.parse();
    return {
      ...result,
      status: result.functionCall ? 'complete' : 'streaming',
    };
  }

  /**
   * Extract complete JSON object from string
   */
  private extractJson(str: string): string | null {
    // Handle code block wrapped JSON
    const codeBlockMatch = str.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // Find matching braces
    let braceCount = 0;
    let inString = false;
    let escape = false;
    let startIndex = str.indexOf('{');
    
    if (startIndex === -1) return null;

    for (let i = startIndex; i < str.length; i++) {
      const char = str[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;

        if (braceCount === 0) {
          return str.substring(startIndex, i + 1);
        }
      }
    }

    return null; // Incomplete JSON
  }

  /**
   * Clean content for display
   */
  private cleanContent(content: string): string {
    let cleaned = content;

    // Remove incomplete JSON at the end
    cleaned = cleaned.replace(/\{[\s\S]*$/m, '');

    // Remove code block markers that might be partial
    cleaned = cleaned.replace(/```json?\s*$/m, '');
    cleaned = cleaned.replace(/```\s*$/m, '');

    // Remove trailing special characters
    cleaned = cleaned.replace(/[\{\[\]\}]+\s*$/m, '');

    // Clean up excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = '';
    this.jsonStartIndex = -1;
    this.functionCall = null;
  }

  /**
   * Get raw buffer content
   */
  getRawBuffer(): string {
    return this.buffer;
  }
}

/**
 * Create a new streaming parser instance
 */
export function createStreamingParser(): StreamingParser {
  return new StreamingParser();
}

/**
 * Parse a complete response (non-streaming)
 */
export function parseCompleteResponse(response: string): ParsedStream {
  const parser = new StreamingParser();
  parser.processChunk(response);
  return parser.finalize();
}

/**
 * Generate a friendly description for a function call
 */
export function getFunctionDescription(
  funcName: string,
  funcArgs: any
): string {
  switch (funcName) {
    case 'multi_edit':
      const editCount = funcArgs.edits?.length || 0;
      return `Making ${editCount} edit${editCount !== 1 ? 's' : ''} to your document`;
    
    case 'create_section':
      return `Adding section: "${funcArgs.title}"`;
    
    case 'edit_document':
      return `Updating "${funcArgs.target}"`;
    
    case 'create_folder':
      return `Creating folder: "${funcArgs.name}"`;
    
    case 'create_document':
      return `Creating document: "${funcArgs.title}"`;
    
    case 'batch_create':
      const opCount = funcArgs.operations?.length || 0;
      return `Creating ${opCount} item${opCount !== 1 ? 's' : ''}`;
    
    case 'create_plan':
      return `Creating plan: "${funcArgs.title}"`;
    
    case 'execute_plan':
      return 'Executing plan...';
    
    default:
      return `Executing ${funcName}...`;
  }
}

export default StreamingParser;
