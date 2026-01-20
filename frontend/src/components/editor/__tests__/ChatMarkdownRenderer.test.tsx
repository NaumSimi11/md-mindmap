/**
 * Tests for ChatMarkdownRenderer component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMarkdownRenderer, extractTextSummary, TypingIndicator } from '../ChatMarkdownRenderer';

describe('ChatMarkdownRenderer', () => {
  describe('basic rendering', () => {
    it('should render plain text', () => {
      render(<ChatMarkdownRenderer content="Hello, world!" />);
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('should render nothing for empty content', () => {
      const { container } = render(<ChatMarkdownRenderer content="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('markdown rendering', () => {
    it('should render headers', () => {
      render(<ChatMarkdownRenderer content="# Heading 1\n## Heading 2" />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should render lists', () => {
      render(<ChatMarkdownRenderer content="- Item 1\n- Item 2" />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should render code blocks', () => {
      render(<ChatMarkdownRenderer content="```js\nconst x = 1;\n```" />);
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });

    it('should render inline code', () => {
      render(<ChatMarkdownRenderer content="Use `npm install` to install." />);
      expect(screen.getByText('npm install')).toBeInTheDocument();
    });

    it('should render links', () => {
      render(<ChatMarkdownRenderer content="Visit [Google](https://google.com)." />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://google.com');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('content cleaning', () => {
    it('should remove JSON function calls', () => {
      const content = `I'll help you.

{"function": "edit_document", "arguments": {"target": "intro"}}`;
      
      render(<ChatMarkdownRenderer content={content} />);
      expect(screen.getByText("I'll help you.")).toBeInTheDocument();
      expect(screen.queryByText('function')).not.toBeInTheDocument();
    });

    it('should convert checkboxes', () => {
      const content = '- [ ] Unchecked\n- [x] Checked';
      render(<ChatMarkdownRenderer content={content} />);
      
      // Checkboxes are converted to special characters
      expect(screen.getByText(/Unchecked/)).toBeInTheDocument();
      expect(screen.getByText(/Checked/)).toBeInTheDocument();
    });
  });

  describe('streaming mode', () => {
    it('should apply streaming class when streaming', () => {
      const { container } = render(
        <ChatMarkdownRenderer content="Loading..." isStreaming={true} />
      );
      expect(container.firstChild).toHaveClass('streaming');
    });
  });
});

describe('TypingIndicator', () => {
  it('should render three dots', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('span');
    expect(dots).toHaveLength(3);
  });

  it('should apply custom className', () => {
    const { container } = render(<TypingIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('extractTextSummary', () => {
  it('should remove markdown formatting', () => {
    const markdown = '# Header\n\nSome **bold** and *italic* text.';
    const summary = extractTextSummary(markdown);
    
    expect(summary).not.toContain('#');
    expect(summary).not.toContain('**');
    expect(summary).not.toContain('*');
    expect(summary).toContain('Header');
    expect(summary).toContain('bold');
  });

  it('should truncate long text', () => {
    const longText = 'A'.repeat(200);
    const summary = extractTextSummary(longText, 100);
    
    expect(summary.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(summary).toEndWith('...');
  });

  it('should remove links but keep text', () => {
    const markdown = 'Visit [Google](https://google.com) for more.';
    const summary = extractTextSummary(markdown);
    
    expect(summary).toContain('Google');
    expect(summary).not.toContain('https://');
  });

  it('should remove code blocks', () => {
    const markdown = 'Before `code` after.';
    const summary = extractTextSummary(markdown);
    
    expect(summary).not.toContain('`');
  });
});
