/**
 * SlideRenderer - Render and edit slides
 * 
 * Supports all slide layouts and editing mode
 */

import { useState } from 'react';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';
import type { Slide, PresentationTheme } from '@/services/presentation/PresentationGenerator';

interface SlideRendererProps {
  slide: Slide;
  theme: PresentationTheme;
  isEditing?: boolean;
  onUpdate?: (slide: Slide) => void;
}

export function SlideRenderer({
  slide,
  theme,
  isEditing = false,
  onUpdate,
}: SlideRendererProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Render Mermaid diagrams
  useEffect(() => {
    if (slide.content.diagram && mermaidRef.current) {
      const renderDiagram = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(
            `mermaid-${slide.id}`,
            slide.content.diagram!.code
          );
          mermaidRef.current!.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
          mermaidRef.current!.innerHTML = `<div class="text-red-500 text-sm">Failed to render diagram</div>`;
        }
      };
      renderDiagram();
    }
  }, [slide.content.diagram, slide.id]);

  const handleTitleChange = (newTitle: string) => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: {
          ...slide.content,
          title: newTitle,
        },
      });
    }
  };

  const handleBodyChange = (newBody: string) => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: {
          ...slide.content,
          body: newBody,
        },
      });
    }
  };

  const handleBulletChange = (index: number, newText: string) => {
    if (onUpdate && slide.content.bullets) {
      const newBullets = [...slide.content.bullets];
      newBullets[index] = newText;
      onUpdate({
        ...slide,
        content: {
          ...slide.content,
          bullets: newBullets,
        },
      });
    }
  };

  // Layout rendering
  const renderLayout = () => {
    switch (slide.layout) {
      case 'title':
        return <TitleLayout slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
      case 'content':
        return <ContentLayout slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
      case 'bullets':
        return <BulletsLayout slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
      case 'diagram':
        return <DiagramLayout slide={slide} theme={theme} mermaidRef={mermaidRef} />;
      case 'mindmap':
        return <MindmapLayout slide={slide} theme={theme} mermaidRef={mermaidRef} />;
      case 'section':
        return <SectionLayout slide={slide} theme={theme} />;
      default:
        return <ContentLayout slide={slide} theme={theme} isEditing={isEditing} onUpdate={onUpdate} />;
    }
  };

  return (
    <div
      className="relative w-full rounded-lg shadow-2xl overflow-hidden"
      style={{
        aspectRatio: '16/9',
        maxWidth: '1000px',
        maxHeight: '562px',
        backgroundColor: slide.background?.type === 'color' ? slide.background.value : theme.colors.background,
        backgroundImage: slide.background?.type === 'gradient' ? slide.background.value : undefined,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      {renderLayout()}

      {/* Slide Number (bottom right) */}
      <div className="absolute bottom-4 right-6 text-xs opacity-40 pointer-events-none">
        Slide {slide.order + 1}
      </div>
    </div>
  );
}

// ============================================================================
// Layout Components
// ============================================================================

function TitleLayout({ slide, theme, isEditing, onUpdate }: any) {
  const [title, setTitle] = useState(slide.content.title || '');
  const [subtitle, setSubtitle] = useState(slide.content.subtitle || '');

  const handleTitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, title },
      });
    }
  };

  const handleSubtitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, subtitle },
      });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      {isEditing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-5xl font-bold mb-4 bg-transparent border-b-2 border-dashed border-gray-300 focus:border-indigo-500 outline-none text-center w-full"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
          />
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={handleSubtitleBlur}
            className="text-2xl bg-transparent border-b-2 border-dashed border-gray-300 focus:border-indigo-500 outline-none text-center w-full"
            style={{ color: theme.colors.text, opacity: 0.7 }}
          />
        </>
      ) : (
        <>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
          >
            {slide.content.title}
          </h1>
          <p className="text-2xl" style={{ color: theme.colors.text, opacity: 0.7 }}>
            {slide.content.subtitle}
          </p>
        </>
      )}
    </div>
  );
}

function ContentLayout({ slide, theme, isEditing, onUpdate }: any) {
  const [title, setTitle] = useState(slide.content.title || '');
  const [body, setBody] = useState(slide.content.body || '');

  const handleTitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, title },
      });
    }
  };

  const handleBodyBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, body },
      });
    }
  };

  return (
    <div className="h-full flex flex-col p-12">
      {isEditing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-3xl font-bold mb-6 bg-transparent border-b-2 border-dashed border-gray-300 focus:border-indigo-500 outline-none"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={handleBodyBlur}
            className="flex-1 text-xl bg-transparent border-2 border-dashed border-gray-300 focus:border-indigo-500 outline-none p-4 rounded resize-none"
            style={{ color: theme.colors.text, lineHeight: '1.6' }}
          />
        </>
      ) : (
        <>
          <h2
            className="text-3xl font-bold mb-6"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
          >
            {slide.content.title}
          </h2>
          <div
            className="text-xl"
            style={{ color: theme.colors.text, lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: slide.content.body?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '' }}
          />
        </>
      )}
    </div>
  );
}

function BulletsLayout({ slide, theme, isEditing, onUpdate }: any) {
  const [title, setTitle] = useState(slide.content.title || '');
  const [bullets, setBullets] = useState(slide.content.bullets || []);

  const handleTitleBlur = () => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, title },
      });
    }
  };

  const handleBulletBlur = (index: number) => {
    if (onUpdate) {
      onUpdate({
        ...slide,
        content: { ...slide.content, bullets },
      });
    }
  };

  return (
    <div className="h-full flex flex-col p-12">
      {isEditing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-3xl font-bold mb-8 bg-transparent border-b-2 border-dashed border-gray-300 focus:border-indigo-500 outline-none"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
          />
          <div className="space-y-4">
            {bullets.map((bullet: string, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <span className="text-2xl mt-1" style={{ color: theme.colors.accent }}>
                  •
                </span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...bullets];
                    newBullets[index] = e.target.value;
                    setBullets(newBullets);
                  }}
                  onBlur={() => handleBulletBlur(index)}
                  className="flex-1 text-xl bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none"
                  style={{ color: theme.colors.text }}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2
            className="text-3xl font-bold mb-8"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
          >
            {slide.content.title}
          </h2>
          <ul className="space-y-4">
            {slide.content.bullets?.map((bullet: string, index: number) => (
              <li key={index} className="flex items-start gap-4">
                <span className="text-2xl mt-1" style={{ color: theme.colors.accent }}>
                  •
                </span>
                <span className="text-xl" style={{ color: theme.colors.text }}>
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DiagramLayout({ slide, theme, mermaidRef }: any) {
  return (
    <div className="h-full flex flex-col p-12">
      <h2
        className="text-3xl font-bold mb-6"
        style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
      >
        {slide.content.title}
      </h2>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div ref={mermaidRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
}

function MindmapLayout({ slide, theme, mermaidRef }: any) {
  return (
    <div className="h-full flex flex-col p-12">
      <h2
        className="text-3xl font-bold mb-6"
        style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
      >
        {slide.content.title}
      </h2>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div ref={mermaidRef} className="max-w-full max-h-full" />
      </div>
    </div>
  );
}

function SectionLayout({ slide, theme }: any) {
  return (
    <div className="h-full flex items-center justify-center p-12 text-center">
      <h1
        className="text-6xl font-bold"
        style={{ color: 'white', fontFamily: theme.fonts.heading }}
      >
        {slide.content.title}
      </h1>
    </div>
  );
}

