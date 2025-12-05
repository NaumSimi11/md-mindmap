/**
 * Round-Trip Testing Utilities
 * 
 * These utilities test the critical conversion:
 * Markdown → HTML → ProseMirror → Markdown
 * 
 * GOAL: Input markdown should be IDENTICAL to output markdown
 */

import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';

// Initialize markdown parser (same as in WYSIWYGEditor.tsx)
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// Initialize HTML to markdown converter (same as in WYSIWYGEditor.tsx)
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

/**
 * Convert markdown to HTML
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown || markdown.trim() === '') {
    return '';
  }
  
  if (markdown.trim().startsWith('<')) {
    return markdown;
  }
  
  return md.render(markdown);
};

/**
 * Convert HTML to markdown
 */
export const htmlToMarkdown = (html: string): string => {
  try {
    if (!html || html.trim() === '') {
      return '';
    }
    
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Error converting HTML to markdown:', error);
    return html || '';
  }
};

/**
 * Normalize markdown for comparison
 * Handles whitespace differences that don't affect meaning
 */
export const normalizeMarkdown = (md: string): string => {
  return md
    .trim()
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/\s+$/gm, '') // Remove trailing spaces per line
    .replace(/\t/g, '  '); // Normalize tabs to spaces
};

/**
 * Perform a single round-trip conversion
 * Markdown → HTML → Markdown
 */
export const roundTrip = (markdown: string): string => {
  // 1. Convert markdown to HTML
  const html = markdownToHtml(markdown);
  
  // 2. Convert HTML back to markdown
  const result = htmlToMarkdown(html);
  
  return result;
};

/**
 * Perform multiple round trips (stress test)
 * Tests if format degrades over multiple conversions
 */
export const multipleRoundTrips = (markdown: string, count: number = 5): string => {
  let current = markdown;
  
  for (let i = 0; i < count; i++) {
    current = roundTrip(current);
  }
  
  return current;
};

/**
 * Assert that markdown survives round-trip conversion
 */
export const expectRoundTrip = (markdown: string) => {
  const result = roundTrip(markdown);
  const normalized = normalizeMarkdown(result);
  const expected = normalizeMarkdown(markdown);
  
  return {
    result: normalized,
    expected: expected,
    matches: normalized === expected,
  };
};

/**
 * Generate a detailed diff for debugging
 */
export const getDiff = (expected: string, actual: string): string => {
  const exp = expected.split('\n');
  const act = actual.split('\n');
  const maxLines = Math.max(exp.length, act.length);
  
  let diff = '\n';
  let diffCount = 0;
  
  for (let i = 0; i < maxLines; i++) {
    if (exp[i] !== act[i]) {
      diffCount++;
      diff += `╔═ Line ${i + 1} ═══════════════════════════════\n`;
      diff += `║ Expected: "${exp[i] || '(empty)'}"\n`;
      diff += `║ Actual:   "${act[i] || '(empty)'}"\n`;
      diff += `╚═══════════════════════════════════════════\n\n`;
    }
  }
  
  if (diffCount === 0) {
    return 'No differences found';
  }
  
  return `Found ${diffCount} difference(s):\n${diff}`;
};

/**
 * Test helper: expect round-trip equality with detailed error message
 */
export const testRoundTrip = (markdown: string, description?: string) => {
  const { result, expected, matches } = expectRoundTrip(markdown);
  
  if (!matches) {
    const diff = getDiff(expected, result);
    const error = `
╔═══════════════════════════════════════════════════════════════
║ Round-Trip Test Failed${description ? `: ${description}` : ''}
╠═══════════════════════════════════════════════════════════════
║ Original Markdown:
║ ${markdown.split('\n').join('\n║ ')}
╠═══════════════════════════════════════════════════════════════
║ After Round-Trip:
║ ${result.split('\n').join('\n║ ')}
╠═══════════════════════════════════════════════════════════════
${diff}
╚═══════════════════════════════════════════════════════════════
`;
    throw new Error(error);
  }
  
  return true;
};

