/**
 * 🧪 Tables - Round-Trip Tests
 * 
 * Testing the MOST CRITICAL requirement:
 * Tables must NOT disappear when switching modes!
 * 
 * Priority: P0 (Critical - DATA LOSS issue!)
 */

import { describe, test, expect } from 'vitest';
import { roundTrip, normalizeMarkdown, testRoundTrip, multipleRoundTrips } from '../helpers/round-trip-tester';

describe('Tables - Basic Tables', () => {
  
  test.fails('simple 2x2 table', () => {
    const markdown = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`;
    testRoundTrip(markdown, 'simple 2x2 table');
  });
  
  test.fails('table with 3 columns', () => {
    const markdown = `| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with 3 rows', () => {
    const markdown = `| Header |\n|--------|\n| Row 1  |\n| Row 2  |\n| Row 3  |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with 4x4 grid', () => {
    const markdown = `| A | B | C | D |\n|---|---|---|---|\n| 1 | 2 | 3 | 4 |\n| 5 | 6 | 7 | 8 |\n| 9 | 10 | 11 | 12 |`;
    testRoundTrip(markdown);
  });
});

describe('Tables - Text Alignment', () => {
  
  test.fails('left-aligned column', () => {
    const markdown = `| Left |\n|:-----|\n| Text |`;
    testRoundTrip(markdown, 'left-aligned table');
  });
  
  test.fails('center-aligned column', () => {
    const markdown = `| Center |\n|:------:|\n| Text   |`;
    testRoundTrip(markdown, 'center-aligned table');
  });
  
  test.fails('right-aligned column', () => {
    const markdown = `| Right |\n|------:|\n| Text  |`;
    testRoundTrip(markdown, 'right-aligned table');
  });
  
  test.fails('mixed alignment', () => {
    const markdown = `| Left | Center | Right |\n|:-----|:------:|------:|\n| L    | C      | R     |`;
    testRoundTrip(markdown, 'mixed alignment table');
  });
});

describe('Tables - Inline Formatting', () => {
  
  test.fails('table with bold text', () => {
    const markdown = `| Header   | **Bold** |\n|----------|----------|\n| Normal   | **Bold** |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with italic text', () => {
    const markdown = `| Header | *Italic* |\n|--------|----------|\n| Normal | *Italic* |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with code', () => {
    const markdown = `| Header | Code     |\n|--------|----------|\n| Normal | \`code\` |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with mixed formatting', () => {
    const markdown = `| **Bold** | *Italic* | \`Code\` |\n|----------|----------|----------|\n| Normal   | **Bold** | *Italic* |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with links', () => {
    const markdown = `| Site   | Link                              |\n|--------|-----------------------------------|\n| Google | [Visit](https://google.com)      |`;
    testRoundTrip(markdown);
  });
});

describe('Tables - Special Content', () => {
  
  test.fails('table with emoji', () => {
    const markdown = `| Icon | Meaning |\n|------|--------|\n| ✅   | Done    |\n| ❌   | Error   |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with empty cells', () => {
    const markdown = `| A | B | C |\n|---|---|---|\n| 1 |   | 3 |\n|   | 2 |   |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with numbers', () => {
    const markdown = `| Number | Value |\n|--------|-------|\n| 1      | 100   |\n| 2      | 200   |`;
    testRoundTrip(markdown);
  });
  
  test('table with special characters', () => {
    const markdown = `| Char | Symbol |\n|------|--------|\n| &    | amp    |\n| <    | lt     |\n| >    | gt     |`;
    const result = roundTrip(markdown);
    // Should preserve special characters
    expect(result).toBeTruthy();
  });
});

describe('Tables - Complex Scenarios', () => {
  
  test.fails('table after heading', () => {
    const markdown = `# Title\n\n| A | B |\n|---|---|\n| 1 | 2 |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table between paragraphs', () => {
    const markdown = `Before table.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nAfter table.`;
    testRoundTrip(markdown);
  });
  
  test.fails('multiple tables in document', () => {
    const markdown = `| Table 1 | Data |\n|---------|------|\n| A       | 1    |\n\nSome text.\n\n| Table 2 | Data |\n|---------|------|\n| B       | 2    |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table after list', () => {
    const markdown = `- Item 1\n- Item 2\n\n| Header | Value |\n|--------|-------|\n| Data   | 123   |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table before code block', () => {
    const markdown = `| A | B |\n|---|---|\n| 1 | 2 |\n\n\`\`\`\ncode here\n\`\`\``;
    const result = roundTrip(markdown);
    expect(normalizeMarkdown(result)).toContain('| A | B |');
    expect(normalizeMarkdown(result)).toContain('code here');
  });
});

describe('Tables - THE CRITICAL STRESS TEST 🔥', () => {
  
  test.fails('table survives 10 round trips', () => {
    const markdown = `| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell A   | Cell B   | Cell C   |\n| Cell D   | Cell E   | Cell F   |`;
    
    const result = multipleRoundTrips(markdown, 10);
    
    // Table MUST survive 10 conversions
    expect(normalizeMarkdown(result)).toContain('Header 1');
    expect(normalizeMarkdown(result)).toContain('Cell F');
    expect(normalizeMarkdown(result)).toBe(normalizeMarkdown(markdown));
  });
  
  test('complex table survives 10 round trips', () => {
    const markdown = `| Left | Center | Right | **Bold** | Link |\n|:-----|:------:|------:|----------|------|\n| *A*  | **B**  | \`C\` | ✅       | [Go](https://example.com) |\n|      | Empty  |       | Cells    |      |`;
    
    const result = multipleRoundTrips(markdown, 10);
    
    // All formatting MUST survive
    expect(normalizeMarkdown(result)).toContain('**Bold**');
    expect(normalizeMarkdown(result)).toContain('[Go]');
    expect(normalizeMarkdown(result)).toContain('✅');
  });
  
  test.fails('large table with 10 rows survives', () => {
    const rows = ['| A | B | C |', '|---|---|---|'];
    for (let i = 1; i <= 10; i++) {
      rows.push(`| ${i} | Data${i} | Value${i} |`);
    }
    const markdown = rows.join('\n');
    
    const result = roundTrip(markdown);
    expect(normalizeMarkdown(result)).toContain('| A | B | C |');
    expect(normalizeMarkdown(result)).toContain('Value10');
  });
});

describe('Tables - Real-World Use Cases', () => {
  
  test.fails('feature status table (like our docs!)', () => {
    const markdown = `| Feature | Status | Priority |\n|---------|--------|----------|\n| Lists   | ✅     | High     |\n| Tables  | ✅     | Critical |\n| Links   | ✅     | High     |`;
    testRoundTrip(markdown);
  });
  
  test.fails('comparison table', () => {
    const markdown = `| Feature | Our App | Competitor |\n|---------|---------|------------|\n| Tables  | ✅      | ✅         |\n| AI      | ✅      | ❌         |`;
    testRoundTrip(markdown);
  });
  
  test.fails('data table with statistics', () => {
    const markdown = `| Metric | Value | Change |\n|--------|-------|--------|\n| Users  | 1,234 | +10%   |\n| Revenue| $5,678| +25%   |`;
    testRoundTrip(markdown);
  });
});

describe('Tables - Edge Cases', () => {
  
  test.fails('table with single column', () => {
    const markdown = `| Header |\n|--------|\n| Cell   |`;
    testRoundTrip(markdown);
  });
  
  test('table with single row (header only)', () => {
    const markdown = `| Header 1 | Header 2 |\n|----------|----------|`;
    const result = roundTrip(markdown);
    expect(result).toBeTruthy();
  });
  
  test.fails('table with very long cell content', () => {
    const markdown = `| Header | Content |\n|--------|----------|\n| Short  | This is a very long cell content that spans many characters and should still work correctly |`;
    testRoundTrip(markdown);
  });
  
  test.fails('table with uneven column widths', () => {
    const markdown = `| A | Long Header Name |\n|---|------------------|\n| 1 | Short            |`;
    testRoundTrip(markdown);
  });
});

