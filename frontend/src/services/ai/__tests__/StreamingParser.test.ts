/**
 * Tests for StreamingParser - Natural response parsing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  StreamingParser, 
  createStreamingParser, 
  parseCompleteResponse,
  getFunctionDescription 
} from '../StreamingParser';

describe('StreamingParser', () => {
  let parser: StreamingParser;

  beforeEach(() => {
    parser = createStreamingParser();
  });

  describe('processChunk', () => {
    it('should accumulate text content', () => {
      parser.processChunk('Hello ');
      const result = parser.processChunk('World!');
      
      expect(result.displayContent).toBe('Hello World!');
      expect(result.inJson).toBe(false);
      expect(result.functionCall).toBeNull();
    });

    it('should detect JSON function call start', () => {
      parser.processChunk('I will help you. ');
      const result = parser.processChunk('{"function": "edit_document"');
      
      expect(result.displayContent).toBe('I will help you.');
      expect(result.inJson).toBe(true);
    });

    it('should extract complete function call', () => {
      const response = `I'll update your document.

{
  "function": "edit_document",
  "arguments": {
    "target": "Introduction",
    "newContent": "# Updated Content"
  }
}`;
      
      const result = parseCompleteResponse(response);
      
      expect(result.displayContent).toBe("I'll update your document.");
      expect(result.functionCall).not.toBeNull();
      expect(result.functionCall?.name).toBe('edit_document');
      expect(result.functionCall?.arguments.target).toBe('Introduction');
    });

    it('should handle code block wrapped JSON', () => {
      const response = `Here's what I'll do:

\`\`\`json
{
  "function": "create_section",
  "arguments": {
    "title": "New Section",
    "content": "Content here"
  }
}
\`\`\``;
      
      const result = parseCompleteResponse(response);
      
      expect(result.displayContent).toBe("Here's what I'll do:");
      expect(result.functionCall).not.toBeNull();
      expect(result.functionCall?.name).toBe('create_section');
    });

    it('should handle streaming chunks naturally', () => {
      // Simulate streaming
      parser.processChunk('I will ');
      parser.processChunk('help you ');
      parser.processChunk('update ');
      const midResult = parser.processChunk('your document.');
      
      expect(midResult.displayContent).toBe('I will help you update your document.');
      
      // Now the JSON starts
      parser.processChunk('\n\n{');
      parser.processChunk('"function": "edit_document",');
      parser.processChunk('"arguments": {"target": "Intro"}}');
      
      const finalResult = parser.finalize();
      
      expect(finalResult.displayContent).toBe('I will help you update your document.');
      expect(finalResult.functionCall).not.toBeNull();
    });
  });

  describe('cleanContent', () => {
    it('should remove incomplete JSON at end', () => {
      const result = parseCompleteResponse('Some text {"function":');
      expect(result.displayContent).toBe('Some text');
    });

    it('should clean excessive newlines', () => {
      const result = parseCompleteResponse('Line 1\n\n\n\n\nLine 2');
      expect(result.displayContent).toBe('Line 1\n\nLine 2');
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      parser.processChunk('Some content');
      parser.reset();
      
      const result = parser.processChunk('New content');
      expect(result.displayContent).toBe('New content');
      expect(result.raw).toBe('New content');
    });
  });
});

describe('getFunctionDescription', () => {
  it('should return friendly descriptions for known functions', () => {
    expect(getFunctionDescription('multi_edit', { edits: [{}, {}, {}] }))
      .toBe('Making 3 edits to your document');
    
    expect(getFunctionDescription('create_section', { title: 'Introduction' }))
      .toBe('Adding section: "Introduction"');
    
    expect(getFunctionDescription('edit_document', { target: 'Summary' }))
      .toBe('Updating "Summary"');
    
    expect(getFunctionDescription('create_folder', { name: 'docs' }))
      .toBe('Creating folder: "docs"');
    
    expect(getFunctionDescription('create_document', { title: 'README' }))
      .toBe('Creating document: "README"');
    
    expect(getFunctionDescription('batch_create', { operations: [{}, {}] }))
      .toBe('Creating 2 items');
    
    expect(getFunctionDescription('create_plan', { title: 'My Plan' }))
      .toBe('Creating plan: "My Plan"');
    
    expect(getFunctionDescription('execute_plan', {}))
      .toBe('Executing plan...');
  });

  it('should handle singular/plural correctly', () => {
    expect(getFunctionDescription('multi_edit', { edits: [{}] }))
      .toBe('Making 1 edit to your document');
    
    expect(getFunctionDescription('batch_create', { operations: [{}] }))
      .toBe('Creating 1 item');
  });

  it('should handle unknown functions', () => {
    expect(getFunctionDescription('unknown_function', {}))
      .toBe('Executing unknown_function...');
  });
});
