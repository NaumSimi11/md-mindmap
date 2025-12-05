import React, { useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { List } from 'lucide-react';

interface Heading {
  level: number;
  text: string;
  id: string;
}

export default function TOCNodeView({ editor }: any) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  // Extract headings from editor content
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const extractedHeadings: Heading[] = [];
      const { state } = editor;
      const { doc } = state;

      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          const id = `heading-${pos}`;
          extractedHeadings.push({
            level: node.attrs.level,
            text: node.textContent,
            id,
          });
        }
      });

      setHeadings(extractedHeadings);
    };

    // Extract on mount
    extractHeadings();

    // Re-extract when content changes
    const updateHandler = () => extractHeadings();
    editor.on('update', updateHandler);

    return () => {
      editor.off('update', updateHandler);
    };
  }, [editor]);

  const handleHeadingClick = (heading: Heading) => {
    if (!editor) return;

    // Find the heading in the document and scroll to it
    const { state } = editor;
    const { doc } = state;

    doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading' && node.textContent === heading.text) {
        // Use the editor's built-in scroll
        editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
        return false; // Stop searching
      }
    });
  };

  return (
    <NodeViewWrapper className="toc-wrapper">
      <div className="toc-container">
        <div className="toc-header">
          <List className="toc-icon" size={20} />
          <h3 className="toc-title">Table of Contents</h3>
        </div>
        
        {headings.length === 0 ? (
          <div className="toc-empty">
            <p>No headings found. Add headings to your document to generate a table of contents.</p>
          </div>
        ) : (
          <nav className="toc-nav">
            {headings.map((heading, index) => (
              <a
                key={`${heading.id}-${index}`}
                className={`toc-link toc-level-${heading.level}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleHeadingClick(heading);
                }}
                href={`#${heading.id}`}
              >
                {heading.text}
              </a>
            ))}
          </nav>
        )}
      </div>
    </NodeViewWrapper>
  );
}

