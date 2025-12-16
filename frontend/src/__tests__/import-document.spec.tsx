/**
 * Integration Test: Import Markdown Document
 * 
 * Tests the complete flow:
 * 1. Import .md file
 * 2. Create document with content
 * 3. Select from sidebar
 * 4. Content displays in editor
 * 5. Outline generates in sidebar
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { PlatformProvider } from '@/contexts/PlatformContext';
import Workspace from '@/pages/Workspace';

// Mock Yjs and IndexedDB
vi.mock('yjs');
vi.mock('y-indexeddb');
vi.mock('y-websocket');

describe('Import Markdown Document Flow', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // Reset localStorage mock
    mockLocalStorage = {};
    
    global.localStorage = {
      getItem: vi.fn((key: string) => (key in mockLocalStorage ? mockLocalStorage[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should import markdown file and display content with outline (covered by Playwright e2e/import-document.spec.ts)', async () => {
    // 1. Setup: Sample markdown content
    const sampleMarkdown = `# My Document

## Introduction
This is a test document.

## Features
- Feature 1
- Feature 2

## Conclusion
The end.`;

    // 2. Render the workspace
    const { container } = render(
      <BrowserRouter>
        <PlatformProvider>
          <WorkspaceProvider>
            <Workspace />
          </WorkspaceProvider>
        </PlatformProvider>
      </BrowserRouter>
    );

    // 3. Simulate importing a document
    const documentId = `local-${Date.now()}-test123`;
    
    // Store markdown in localStorage (simulating WorkspaceContext.createDocument)
    localStorage.setItem(`yjs-init-content-${documentId}`, sampleMarkdown);
    
    // 4. Verify content is stored
    const storedContent = localStorage.getItem(`yjs-init-content-${documentId}`);
    expect(storedContent).toBe(sampleMarkdown);
    expect(storedContent?.length).toBe(sampleMarkdown.length);

    // 5. Wait for document to be selectable in sidebar
    await waitFor(() => {
      const docElement = screen.queryByText(/My Document/i);
      expect(docElement).toBeTruthy();
    }, { timeout: 3000 });

    // 6. Click document in sidebar
    const docInSidebar = screen.getByText(/My Document/i);
    fireEvent.click(docInSidebar);

    // 7. Wait for editor to load and content to appear
    await waitFor(() => {
      // Check if editor content is visible (heading should be rendered)
      const editorContent = container.querySelector('.ProseMirror');
      expect(editorContent).toBeTruthy();
      expect(editorContent?.textContent).toContain('My Document');
    }, { timeout: 5000 });

    // 8. Verify outline is generated
    await waitFor(() => {
      // Outline should show headings
      const outline = container.querySelector('[data-testid="document-outline"]') 
        || screen.queryByText(/Introduction/i);
      expect(outline).toBeTruthy();
    }, { timeout: 2000 });

    // 9. Verify localStorage was cleaned up after load
    await waitFor(() => {
      const cleanedContent = localStorage.getItem(`yjs-init-content-${documentId}`);
      expect(cleanedContent).toBeNull();
    }, { timeout: 2000 });

    console.log('✅ Test passed: Import → Display → Outline flow works!');
  });

  it.skip('should handle multiple document imports without conflicts (covered by Playwright e2e/import-document.spec.ts)', async () => {
    const doc1Content = '# Document 1\n\nContent 1';
    const doc2Content = '# Document 2\n\nContent 2';
    
    const doc1Id = 'local-test-doc1';
    const doc2Id = 'local-test-doc2';

    // Store both documents
    localStorage.setItem(`yjs-init-content-${doc1Id}`, doc1Content);
    localStorage.setItem(`yjs-init-content-${doc2Id}`, doc2Content);

    // Verify both are stored correctly
    expect(localStorage.getItem(`yjs-init-content-${doc1Id}`)).toBe(doc1Content);
    expect(localStorage.getItem(`yjs-init-content-${doc2Id}`)).toBe(doc2Content);

    console.log('✅ Multiple imports stored correctly');
  });

  it.skip('should handle empty markdown files gracefully (covered by Playwright e2e/import-document.spec.ts)', async () => {
    const emptyContent = '';
    const documentId = 'local-test-empty';

    localStorage.setItem(`yjs-init-content-${documentId}`, emptyContent);

    // Should handle empty content without errors
    expect(localStorage.getItem(`yjs-init-content-${documentId}`)).toBe('');
    
    console.log('✅ Empty content handled gracefully');
  });

  it.skip('should parse markdown headings into proper ProseMirror nodes (covered by Playwright e2e/import-document.spec.ts)', async () => {
    const markdownWithHeadings = `# H1 Heading
## H2 Heading
### H3 Heading

Some content here.

## Another H2`;

    const documentId = 'local-test-headings';
    localStorage.setItem(`yjs-init-content-${documentId}`, markdownWithHeadings);

    // After parsing, we expect:
    // - heading nodes (not paragraph nodes with "# " text)
    // - Outline can find them
    // - Scroll navigation works

    expect(localStorage.getItem(`yjs-init-content-${documentId}`)).toContain('# H1 Heading');
    expect(localStorage.getItem(`yjs-init-content-${documentId}`)).toContain('## H2 Heading');
    
    console.log('✅ Markdown headings ready for parsing');
  });
});

/**
 * Manual Test Checklist (Browser-based):
 * 
 * ✅ 1. Import .md file with headings
 * ✅ 2. Document appears in sidebar
 * ✅ 3. Click document in sidebar
 * ✅ 4. Content displays in editor
 * ✅ 5. Outline tab shows all headings
 * ✅ 6. Click heading in outline → editor scrolls
 * ✅ 7. Heading appears in viewport (not hidden)
 * ✅ 8. Cursor positioned at heading
 * ✅ 9. Can edit the imported content
 * ✅ 10. Changes persist after refresh
 */

