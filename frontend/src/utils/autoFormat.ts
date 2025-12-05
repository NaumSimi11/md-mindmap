/**
 * Auto-Format Utility
 * Intelligently formats plain text into structured markdown
 */

export interface FormatOptions {
  mode: 'rules' | 'ai' | 'hybrid';
  preserveExisting: boolean;
}

/**
 * Split text blob into lines by detecting natural boundaries
 */
function splitTextIntoLines(text: string): string {
  // Detect patterns like "TitleHere" followed by text (no space between)
  // e.g., "Router Application RoadmapThis document..." → split at "Roadmap"
  
  let result = text;
  
  // Pattern 1: Split before Title Case words that follow lowercase
  // e.g., "text.Table of" → "text.\nTable of"
  result = result.replace(/([a-z\.!?])([A-Z][a-z]+\s+[A-Z])/g, '$1\n$2');
  
  // Pattern 2: Split before common section headers
  const headers = ['Table of Contents', 'Overview', 'Features', 'Introduction', 'Conclusion', 
                   'Development', 'Timeline', 'Phase', 'Future', 'Key', 'User', 'Control', 
                   'Additional', 'Planning', 'Testing', 'Deployment'];
  
  for (const header of headers) {
    const regex = new RegExp(`([a-z\.!?])${header}`, 'g');
    result = result.replace(regex, `$1\n${header}`);
  }
  
  // Pattern 3: Split numbered lists (1. 2. 3.)
  result = result.replace(/(\.)(\d+\.)/g, '$1\n$2');
  
  // Pattern 4: Split after sentences (. followed by capital letter)
  result = result.replace(/(\.\s*)([A-Z][a-z]{3,})/g, '$1\n$2');
  
  return result;
}

/**
 * Rule-based auto-formatting
 * Fast, deterministic formatting based on text patterns
 */
export function autoFormatText(text: string, options: FormatOptions = { mode: 'rules', preserveExisting: true }): string {
  if (!text || !text.trim()) return text;

  // CRITICAL FIX: If text is one giant blob (no newlines), split it intelligently
  if (!text.includes('\n') && text.length > 200) {
    text = splitTextIntoLines(text);
  }

  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim());
  
  // SMART DETECTION: Check if this looks like a list of short items
  const looksLikeList = nonEmptyLines.length > 1 && 
                        nonEmptyLines.every(l => l.trim().length < 80) &&
                        nonEmptyLines.every(l => !l.trim().match(/^[#\-\*>]/)) &&
                        !nonEmptyLines.some(l => l.trim().length > 150);
  
  const formatted: string[] = [];
  let inListBlock = false;
  let previousWasEmpty = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const next = lines[i + 1]?.trim() || '';

    // Skip if already formatted (preserve existing)
    if (options.preserveExisting && isAlreadyFormatted(line)) {
      formatted.push(line);
      previousWasEmpty = false;
      continue;
    }

    // Empty line
    if (!trimmed) {
      formatted.push('');
      previousWasEmpty = true;
      inListBlock = false;
      continue;
    }

    // RULE 1: ALL CAPS lines → H1 Heading
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 60 && /^[A-Z\s]+$/.test(trimmed)) {
      formatted.push(`# ${trimmed}`);
      previousWasEmpty = false;
      continue;
    }

    // RULE 2: Lines ending with colon → H2 Heading
    if (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.includes(',')) {
      formatted.push(`## ${trimmed.slice(0, -1)}`);
      previousWasEmpty = false;
      continue;
    }

    // RULE 3: Short lines (< 50 chars) after empty line → H2 Heading
    if (previousWasEmpty && trimmed.length < 50 && !trimmed.match(/^[\d\-\*\+]/) && next && next.length > 50) {
      formatted.push(`## ${trimmed}`);
      previousWasEmpty = false;
      continue;
    }

    // RULE 4: Lines starting with dash or asterisk → List item
    if (trimmed.match(/^[\-\*]\s/)) {
      const content = trimmed.replace(/^[\-\*]\s+/, '');
      formatted.push(`- ${content}`);
      inListBlock = true;
      previousWasEmpty = false;
      continue;
    }

    // RULE 5: Numbered lines → Ordered list
    if (trimmed.match(/^\d+[\.\)]\s/)) {
      const content = trimmed.replace(/^\d+[\.\)]\s+/, '');
      const number = parseInt(trimmed.match(/^\d+/)?.[0] || '1');
      formatted.push(`${number}. ${content}`);
      inListBlock = true;
      previousWasEmpty = false;
      continue;
    }

    // RULE 6: Lines that look like bullet points (but without dash)
    if (inListBlock && trimmed.length < 100 && !previousWasEmpty) {
      formatted.push(`- ${trimmed}`);
      previousWasEmpty = false;
      continue;
    }

    // RULE 7: Standalone words/phrases in a list context → Bold
    if (inListBlock && trimmed.split(/\s+/).length <= 4 && trimmed.length < 40) {
      formatted.push(`- **${trimmed}**`);
      previousWasEmpty = false;
      continue;
    }

    // RULE 8: Key-value pairs (contains: or =) → Bold key
    const kvMatch = trimmed.match(/^([^:=]+)[:=]\s*(.+)$/);
    if (kvMatch && kvMatch[1].split(/\s+/).length <= 3) {
      formatted.push(`**${kvMatch[1].trim()}**: ${kvMatch[2].trim()}`);
      previousWasEmpty = false;
      continue;
    }

    // RULE 9: If document looks like a list of items, convert to list
    if (looksLikeList && trimmed.length > 0) {
      formatted.push(`- ${trimmed}`);
      previousWasEmpty = false;
      continue;
    }

    // Default: Keep as is
    formatted.push(line);
    previousWasEmpty = false;
  }

  return formatted.join('\n');
}

/**
 * Check if a line is already formatted
 */
function isAlreadyFormatted(line: string): boolean {
  const trimmed = line.trim();
  
  // Already has markdown formatting
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('>') ||
    trimmed.startsWith('```') ||
    trimmed.match(/^\d+\./) ||
    trimmed.includes('**') ||
    trimmed.includes('__') ||
    trimmed.includes('*') ||
    trimmed.includes('`')
  ) {
    return true;
  }

  return false;
}

/**
 * AI-powered formatting
 * Uses AI to intelligently structure the text
 */
export function generateAIFormatPrompt(text: string): string {
  return `You are a markdown formatting assistant. Transform this plain text into well-structured markdown.

RULES:
1. Add markdown headings (# ## ###) where appropriate
2. Convert bullet points to proper lists (-)
3. Make key terms and important words **bold**
4. Keep all original content - ONLY add formatting
5. Detect natural sections and add hierarchy
6. Convert numbered items to ordered lists (1. 2. 3.)
7. Add blank lines between sections for readability
8. Do NOT add any commentary or explanation

Text to format:
${text}

Formatted markdown:`;
}

/**
 * Detect if text needs formatting
 */
export function needsFormatting(text: string): boolean {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return false;

  let formattedLines = 0;
  
  for (const line of lines) {
    if (isAlreadyFormatted(line)) {
      formattedLines++;
    }
  }

  // If less than 30% of lines are formatted, suggest formatting
  return (formattedLines / lines.length) < 0.3;
}

/**
 * Format selection or entire document
 */
export function formatContent(content: string, selectionStart?: number, selectionEnd?: number): {
  formatted: string;
  newSelectionStart?: number;
  newSelectionEnd?: number;
} {
  // If no selection, format entire document
  if (selectionStart === undefined || selectionEnd === undefined) {
    return {
      formatted: autoFormatText(content),
    };
  }

  // Format only selection
  const before = content.substring(0, selectionStart);
  const selection = content.substring(selectionStart, selectionEnd);
  const after = content.substring(selectionEnd);

  const formattedSelection = autoFormatText(selection);

  return {
    formatted: before + formattedSelection + after,
    newSelectionStart: selectionStart,
    newSelectionEnd: selectionStart + formattedSelection.length,
  };
}
