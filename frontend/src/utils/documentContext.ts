/**
 * Document Context Utilities
 * Helper functions for understanding document structure and finding sections
 */

import { Editor } from '@tiptap/react';

export interface DocumentContext {
  selectedText: string;
  currentSection: string | null;
  wordCount: number;
  sections: Array<{ name: string; level: number; position: { from: number; to: number } }>;
}

export interface SectionMatch {
  section: string;
  confidence: number;
  position?: { from: number; to: number };
  content?: string;
}

/**
 * Get current document context
 */
export function getDocumentContext(editor: Editor | null, documentContent: string): DocumentContext {
  if (!editor) {
    return {
      selectedText: '',
      currentSection: null,
      wordCount: documentContent.split(/\s+/).filter(Boolean).length,
      sections: [],
    };
  }

  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to, ' ');

  // Find current section by finding the nearest heading before cursor
  const currentSection = findCurrentSection(editor, from);

  // Extract all sections (headings)
  const sections = extractSections(editor);

  return {
    selectedText,
    currentSection,
    wordCount: documentContent.split(/\s+/).filter(Boolean).length,
    sections,
  };
}

/**
 * Find section in document based on user query - IMPROVED with better semantic matching
 */
export function findSectionInDocument(
  query: string,
  documentContent: string,
  editor: Editor | null
): SectionMatch | null {
  if (!editor) return null;

  const sections = extractSections(editor);
  const queryLower = query.toLowerCase().trim();

  // Extract potential section names from query - be smarter about it
  // Look for phrases like "the X section", "in X", "X section", etc.
  const sectionPatterns = [
    /(?:the\s+)?([a-z\s]+?)\s+section/i,
    /in\s+the\s+([a-z\s]+?)(?:\s+section)?/i,
    /([a-z\s]+?)\s+section/i,
    /section\s+([a-z\s]+?)/i,
  ];

  let extractedSectionName = '';
  for (const pattern of sectionPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      extractedSectionName = match[1].trim().toLowerCase();
      break;
    }
  }

  // If no pattern match, try to find section keywords
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'make', 'change', 'edit', 'improve', 'update'].includes(w))
    .slice(0, 4); // Take first 4 meaningful words

  let bestMatch: SectionMatch | null = null;
  let bestScore = 0;

  for (const section of sections) {
    const sectionLower = section.name.toLowerCase();
    
    // Calculate confidence score with multiple strategies
    let score = 0;
    
    // Strategy 1: Exact extracted section name match
    if (extractedSectionName && sectionLower.includes(extractedSectionName)) {
      score = 0.95;
    }
    // Strategy 2: Exact section name in query
    else if (queryLower.includes(sectionLower) || sectionLower.includes(queryLower)) {
      score = 0.90;
    }
    // Strategy 3: Word overlap with better matching
    else if (queryWords.length > 0) {
      const sectionWords = sectionLower.split(/\s+/);
      let matchingCount = 0;
      
      for (const qw of queryWords) {
        // Check for partial matches (e.g., "model" matches "models")
        if (sectionWords.some(sw => 
          sw.includes(qw) || 
          qw.includes(sw) || 
          sw.startsWith(qw) || 
          qw.startsWith(sw)
        )) {
          matchingCount++;
        }
      }
      
      if (matchingCount > 0) {
        score = (matchingCount / Math.max(queryWords.length, sectionWords.length)) * 0.8;
      }
    }

    // Boost score if section is near cursor (user is likely looking at it)
    const { from } = editor.state.selection;
    const distance = Math.abs(section.position.from - from);
    const docLength = editor.state.doc.content.size;
    if (docLength > 0) {
      const distanceScore = Math.max(0, 1 - (distance / docLength));
      score = score * 0.75 + distanceScore * 0.25;
    }

    // Boost score if section is a main heading (H1 or H2)
    if (section.level <= 2) {
      score *= 1.1;
    }

    if (score > bestScore) {
      bestScore = score;
      const sectionEnd = Math.min(section.position.to || section.position.from + 1000, section.position.from + 1000);
      bestMatch = {
        section: section.name,
        confidence: Math.min(score, 1), // Cap at 1.0
        position: section.position,
        content: editor.state.doc.textBetween(
          section.position.from,
          sectionEnd,
          ' '
        ),
      };
    }
  }

  // Only return if we have reasonable confidence (>= 0.4)
  // Lower threshold means AI should ask for clarification if unsure
  if (bestMatch && bestMatch.confidence >= 0.4) {
    return bestMatch;
  }

  // If no good match, try content search as last resort
  if (!bestMatch || bestScore < 0.4) {
    const contentMatch = searchContent(editor, queryWords);
    if (contentMatch && contentMatch.confidence >= 0.4) {
      return contentMatch;
    }
  }

  // Return null if confidence is too low - let AI ask for clarification
  return null;
}

/**
 * Find current section based on cursor position
 */
function findCurrentSection(editor: Editor, position: number): string | null {
  const sections = extractSections(editor);
  
  // Find the last section before cursor
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].position.from <= position) {
      return sections[i].name;
    }
  }

  return null;
}

/**
 * Extract all sections (headings) from document
 */
function extractSections(editor: Editor): Array<{
  name: string;
  level: number;
  position: { from: number; to: number };
}> {
  const sections: Array<{ name: string; level: number; position: { from: number; to: number } }> = [];
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level || 1;
      const text = node.textContent;
      sections.push({
        name: text,
        level,
        position: { from: pos, to: pos + node.nodeSize },
      });
    }
  });

  return sections;
}

/**
 * Search document content for keywords
 */
function searchContent(editor: Editor, keywords: string[]): SectionMatch | null {
  const docText = editor.state.doc.textContent.toLowerCase();
  let bestMatch: { text: string; position: number } | null = null;
  let bestScore = 0;

  // Search for keywords in document
  for (const keyword of keywords) {
    const index = docText.indexOf(keyword);
    if (index !== -1) {
      // Find nearest section
      const sections = extractSections(editor);
      let nearestSection: { name: string; position: { from: number; to: number } } | null = null;
      let minDistance = Infinity;

      for (const section of sections) {
        const distance = Math.abs(section.position.from - index);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSection = section;
        }
      }

      if (nearestSection) {
        const score = 0.6; // Lower confidence for content match
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            text: nearestSection.name,
            position: nearestSection.position.from,
          };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      section: bestMatch.text,
      confidence: bestScore,
      position: { from: bestMatch.position, to: bestMatch.position + 100 },
    };
  }

  return null;
}

