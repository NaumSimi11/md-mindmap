/**
 * Markdown Service - Pure domain logic
 * 
 * All functions are pure (no side effects, no dependencies).
 * Testable in isolation.
 */

import { HeadingNode } from '../entities/Mindmap';

export class MarkdownService {
    /**
     * Extract headings from markdown content
     */
    static extractHeadings(markdown: string): HeadingNode[] {
        const lines = markdown.split('\n');
        const headings: HeadingNode[] = [];

        for (const line of lines) {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2].trim(),
                });
            }
        }

        return headings;
    }

    /**
     * Count words in markdown (excluding code blocks)
     */
    static countWords(markdown: string): number {
        // Remove code blocks
        const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
        // Remove inline code
        const withoutInlineCode = withoutCode.replace(/`[^`]+`/g, '');
        // Count words
        return withoutInlineCode
            .split(/\s+/)
            .filter(word => word.length > 0).length;
    }

    /**
     * Count characters (excluding code blocks)
     */
    static countCharacters(markdown: string): number {
        const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
        return withoutCode.length;
    }

    /**
     * Extract all links from markdown
     */
    static extractLinks(markdown: string): string[] {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links: string[] = [];
        let match;

        while ((match = linkRegex.exec(markdown)) !== null) {
            links.push(match[2]);
        }

        return links;
    }

    /**
     * Extract all images from markdown
     */
    static extractImages(markdown: string): Array<{ alt: string; url: string }> {
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const images: Array<{ alt: string; url: string }> = [];
        let match;

        while ((match = imageRegex.exec(markdown)) !== null) {
            images.push({
                alt: match[1],
                url: match[2],
            });
        }

        return images;
    }

    /**
     * Extract code blocks with language
     */
    static extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const blocks: Array<{ language: string; code: string }> = [];
        let match;

        while ((match = codeBlockRegex.exec(markdown)) !== null) {
            blocks.push({
                language: match[1] || 'text',
                code: match[2].trim(),
            });
        }

        return blocks;
    }

    /**
     * Check if markdown contains Mermaid diagrams
     */
    static hasMermaidDiagrams(markdown: string): boolean {
        return /```mermaid\n[\s\S]*?```/.test(markdown);
    }

    /**
     * Extract Mermaid diagram code
     */
    static extractMermaidDiagrams(markdown: string): string[] {
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        const diagrams: string[] = [];
        let match;

        while ((match = mermaidRegex.exec(markdown)) !== null) {
            diagrams.push(match[1].trim());
        }

        return diagrams;
    }

    /**
     * Generate table of contents from headings
     */
    static generateTableOfContents(markdown: string): string {
        const headings = this.extractHeadings(markdown);
        const lines: string[] = ['## Table of Contents\n'];

        for (const heading of headings) {
            const indent = '  '.repeat(heading.level - 1);
            const anchor = heading.text.toLowerCase().replace(/\s+/g, '-');
            lines.push(`${indent}- [${heading.text}](#${anchor})`);
        }

        return lines.join('\n');
    }

    /**
     * Estimate reading time (words per minute)
     */
    static estimateReadingTime(markdown: string, wordsPerMinute: number = 200): number {
        const wordCount = this.countWords(markdown);
        return Math.ceil(wordCount / wordsPerMinute);
    }

    /**
     * Check if markdown is empty (ignoring whitespace)
     */
    static isEmpty(markdown: string): boolean {
        return markdown.trim().length === 0;
    }

    /**
     * Sanitize markdown (remove potentially dangerous content)
     */
    static sanitize(markdown: string): string {
        // Remove HTML script tags
        let sanitized = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Remove HTML event handlers
        sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
        return sanitized;
    }

    /**
     * Extract frontmatter (YAML metadata at top of file)
     */
    static extractFrontmatter(markdown: string): Record<string, any> | null {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = markdown.match(frontmatterRegex);

        if (!match) return null;

        const frontmatter: Record<string, any> = {};
        const lines = match[1].split('\n');

        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                frontmatter[key.trim()] = valueParts.join(':').trim();
            }
        }

        return frontmatter;
    }

    /**
     * Remove frontmatter from markdown
     */
    static removeFrontmatter(markdown: string): string {
        return markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
    }
}
