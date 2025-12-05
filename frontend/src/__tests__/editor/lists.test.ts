/**
 * 🧪 Lists - Round-Trip Tests
 * 
 * Testing the CRITICAL requirement:
 * Lists must survive conversion: Markdown ↔ WYSIWYG ↔ Markdown
 * 
 * Priority: P0 (Critical - Lists are broken!)
 */

import { describe, test, expect } from 'vitest';
import { roundTrip, normalizeMarkdown, testRoundTrip, multipleRoundTrips } from '../helpers/round-trip-tester';

describe('Lists - Unordered Lists', () => {
  
  test('simple unordered list with 3 items', () => {
    const markdown = `- Item 1\n- Item 2\n- Item 3`;
    const result = roundTrip(markdown);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });
  
  test('unordered list with empty lines between items', () => {
    const markdown = `- Item 1\n\n- Item 2\n\n- Item 3`;
    const result = roundTrip(markdown);
    expect(normalizeMarkdown(result)).toContain('Item 1');
    expect(normalizeMarkdown(result)).toContain('Item 2');
  });
  
  test('unordered list with inline formatting', () => {
    const markdown = `- **Bold** item\n- *Italic* item\n- \`code\` item`;
    testRoundTrip(markdown, 'unordered list with formatting');
  });
  
  test('unordered list with links', () => {
    const markdown = `- [Google](https://google.com)\n- [GitHub](https://github.com)`;
    testRoundTrip(markdown);
  });
  
  test('single item unordered list', () => {
    const markdown = `- Single item`;
    testRoundTrip(markdown);
  });
  
  test('unordered list with long items', () => {
    const markdown = `- This is a very long list item that spans multiple words and should still work correctly\n- Short item`;
    testRoundTrip(markdown);
  });
});

describe('Lists - Ordered Lists', () => {
  
  test('simple ordered list with 3 items', () => {
    const markdown = `1. First\n2. Second\n3. Third`;
    testRoundTrip(markdown, 'simple ordered list');
  });
  
  test('ordered list starting from 1', () => {
    const markdown = `1. Item 1\n1. Item 2\n1. Item 3`;
    // Note: This tests if parser handles "1. 1. 1." style
    const result = roundTrip(markdown);
    expect(normalizeMarkdown(result)).toContain('Item 1');
    expect(normalizeMarkdown(result)).toContain('Item 2');
  });
  
  test('ordered list with inline formatting', () => {
    const markdown = `1. **First** item\n2. *Second* item\n3. \`Third\` item`;
    testRoundTrip(markdown);
  });
  
  test('ordered list with large numbers', () => {
    const markdown = `1. Item 1\n2. Item 2\n3. Item 3\n4. Item 4\n5. Item 5\n6. Item 6\n7. Item 7\n8. Item 8\n9. Item 9\n10. Item 10`;
    testRoundTrip(markdown);
  });
});

describe('Lists - Nested Lists', () => {
  
  test('nested unordered lists (2 levels)', () => {
    const markdown = `- Parent 1\n  - Child 1\n  - Child 2\n- Parent 2`;
    testRoundTrip(markdown, 'nested unordered lists');
  });
  
  test('nested ordered lists (2 levels)', () => {
    const markdown = `1. Parent 1\n   1. Child 1\n   2. Child 2\n2. Parent 2`;
    testRoundTrip(markdown, 'nested ordered lists');
  });
  
  test('mixed nested lists (unordered parent, ordered children)', () => {
    const markdown = `- Unordered parent\n  1. Ordered child 1\n  2. Ordered child 2\n- Unordered parent 2`;
    testRoundTrip(markdown);
  });
  
  test('mixed nested lists (ordered parent, unordered children)', () => {
    const markdown = `1. Ordered parent\n   - Unordered child 1\n   - Unordered child 2\n2. Ordered parent 2`;
    testRoundTrip(markdown);
  });
  
  test('deeply nested lists (3 levels)', () => {
    const markdown = `- Level 1\n  - Level 2\n    - Level 3\n  - Level 2 again\n- Level 1 again`;
    testRoundTrip(markdown, 'deeply nested lists');
  });
});

describe('Lists - Complex Scenarios', () => {
  
  test('list after heading', () => {
    const markdown = `# Heading\n\n- Item 1\n- Item 2`;
    testRoundTrip(markdown);
  });
  
  test('list before and after paragraph', () => {
    const markdown = `Paragraph before.\n\n- Item 1\n- Item 2\n\nParagraph after.`;
    testRoundTrip(markdown);
  });
  
  test('multiple separate lists', () => {
    const markdown = `- List 1 Item 1\n- List 1 Item 2\n\nSome text.\n\n- List 2 Item 1\n- List 2 Item 2`;
    testRoundTrip(markdown);
  });
  
  test('list with blockquote', () => {
    const markdown = `- Item 1\n- Item 2\n\n> Quote here\n\n- Item 3`;
    const result = roundTrip(markdown);
    expect(normalizeMarkdown(result)).toContain('Item 1');
    expect(normalizeMarkdown(result)).toContain('Quote here');
  });
});

describe('Lists - Stress Tests', () => {
  
  test('list survives 5 round trips', () => {
    const markdown = `- Item 1\n- Item 2\n- Item 3`;
    const result = multipleRoundTrips(markdown, 5);
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });
  
  test('nested list survives 5 round trips', () => {
    const markdown = `- Parent\n  - Child 1\n  - Child 2`;
    const result = multipleRoundTrips(markdown, 5);
    expect(normalizeMarkdown(result)).toContain('Parent');
    expect(normalizeMarkdown(result)).toContain('Child');
  });
  
  test('large list with 50 items', () => {
    const items = Array.from({ length: 50 }, (_, i) => `- Item ${i + 1}`).join('\n');
    const result = roundTrip(items);
    expect(normalizeMarkdown(result)).toContain('Item 1');
    expect(normalizeMarkdown(result)).toContain('Item 50');
  });
});

describe('Lists - Edge Cases', () => {
  
  test('empty list item', () => {
    const markdown = `- Item 1\n- \n- Item 3`;
    const result = roundTrip(markdown);
    // Should handle empty items gracefully
    expect(result).toBeTruthy();
  });
  
  test('list with special characters', () => {
    const markdown = `- Item with & ampersand\n- Item with <brackets>\n- Item with "quotes"`;
    testRoundTrip(markdown);
  });
  
  test('list with emoji', () => {
    const markdown = `- ✅ Done\n- ❌ Not done\n- 🚀 In progress`;
    testRoundTrip(markdown);
  });
  
  test('list with numbers in text', () => {
    const markdown = `- Item 1 has 123 numbers\n- Item 2 has 456 numbers`;
    testRoundTrip(markdown);
  });
});

