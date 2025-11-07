/**
 * TimelineBlock - Beautiful timeline visualization
 * 
 * Features:
 * - Horizontal or vertical layout
 * - Milestone markers with dates
 * - Connecting lines
 * - Icon support
 * - Progress indicators
 * - Image support for milestones
 * - Responsive design
 * - Theme-aware styling
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface TimelineBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function TimelineBlock({ block, theme, isEditing, onUpdate }: TimelineBlockProps) {
  const items = block.content.timelineItems || [];
  const layout = block.content.timelineLayout || 'horizontal'; // 'horizontal' | 'vertical'
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (layout === 'vertical') {
    return <VerticalTimeline items={items} block={block} theme={theme} hoveredIndex={hoveredIndex} setHoveredIndex={setHoveredIndex} />;
  }

  return <HorizontalTimeline items={items} block={block} theme={theme} hoveredIndex={hoveredIndex} setHoveredIndex={setHoveredIndex} />;
}

// Horizontal Timeline
function HorizontalTimeline({ items, block, theme, hoveredIndex, setHoveredIndex }: any) {
  return (
    <div 
      className="w-full py-16 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        {block.content.heading && (
          <h2
            className="text-center font-bold mb-16"
            style={{
              fontSize: theme.typography.scale['3xl'],
              color: theme.colors.text.primary,
            }}
          >
            {block.content.heading}
          </h2>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Horizontal Line */}
          <div
            className="absolute top-16 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(to right, 
                ${theme.colors.primary.main}40, 
                ${theme.colors.secondary.main}40)`,
              borderRadius: '2px',
            }}
          />

          {/* Progress Line (animated) */}
          <div
            className="absolute top-16 left-0 h-1 transition-all duration-1000 ease-out"
            style={{
              width: hoveredIndex !== null ? `${((hoveredIndex + 1) / items.length) * 100}%` : '0%',
              background: `linear-gradient(to right, 
                ${theme.colors.primary.main}, 
                ${theme.colors.secondary.main})`,
              boxShadow: `0 0 20px ${theme.colors.primary.main}60`,
            }}
          />

          {/* Timeline Items */}
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((item: any, i: number) => {
              const isHovered = hoveredIndex === i;
              const isFirst = i === 0;
              const isLast = i === items.length - 1;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center relative animate-in fade-in-up"
                  style={{
                    animationDelay: `${i * 150}ms`,
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Milestone Circle */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center
                               cursor-pointer transition-all duration-300 relative z-10"
                    style={{
                      background: isHovered
                        ? `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`
                        : theme.colors.background.paper,
                      border: `4px solid ${isHovered ? theme.colors.secondary.main : theme.colors.primary.main}`,
                      boxShadow: isHovered
                        ? `0 12px 40px ${theme.colors.primary.main}60, 0 0 0 8px ${theme.colors.primary.main}20`
                        : `0 4px 16px ${theme.colors.primary.main}30`,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {item.icon ? (
                      <span className="text-2xl">{item.icon}</span>
                    ) : (
                      <span
                        className="font-bold"
                        style={{
                          color: isHovered ? 'white' : theme.colors.primary.main,
                          fontSize: theme.typography.scale.lg,
                        }}
                      >
                        {i + 1}
                      </span>
                    )}

                    {/* Pulse effect */}
                    {isHovered && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor: theme.colors.primary.main,
                          opacity: 0.3,
                        }}
                      />
                    )}
                  </div>

                  {/* Content Card */}
                  <div
                    className="mt-8 p-6 rounded-2xl transition-all duration-300"
                    style={{
                      backgroundColor: isHovered 
                        ? `${theme.colors.primary.main}10` 
                        : theme.colors.background.paper,
                      border: `2px solid ${isHovered ? theme.colors.primary.main : theme.colors.primary.main}20`,
                      boxShadow: isHovered ? theme.visual.shadows.xl : theme.visual.shadows.md,
                      transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                      minHeight: '180px',
                      width: '100%',
                    }}
                  >
                    {/* Date */}
                    {item.date && (
                      <div
                        className="inline-block px-3 py-1 rounded-full mb-3"
                        style={{
                          backgroundColor: `${theme.colors.secondary.main}20`,
                          color: theme.colors.secondary.main,
                          fontSize: theme.typography.scale.xs,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {item.date}
                      </div>
                    )}

                    {/* Title */}
                    <h3
                      className="font-bold mb-2"
                      style={{
                        fontSize: theme.typography.scale.lg,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p
                        style={{
                          fontSize: theme.typography.scale.sm,
                          color: theme.colors.text.secondary,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    {/* Image (if provided) */}
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="mt-4 rounded-lg w-full h-32 object-cover"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: fade-in-up 0.6s ease-out;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// Vertical Timeline (Alternate Layout)
function VerticalTimeline({ items, block, theme, hoveredIndex, setHoveredIndex }: any) {
  return (
    <div 
      className="w-full py-16 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        {block.content.heading && (
          <h2
            className="text-center font-bold mb-16"
            style={{
              fontSize: theme.typography.scale['3xl'],
              color: theme.colors.text.primary,
            }}
          >
            {block.content.heading}
          </h2>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div
            className="absolute left-8 top-0 bottom-0 w-1"
            style={{
              background: `linear-gradient(to bottom, 
                ${theme.colors.primary.main}40, 
                ${theme.colors.secondary.main}40)`,
              borderRadius: '2px',
            }}
          />

          {/* Timeline Items */}
          <div className="space-y-12">
            {items.map((item: any, i: number) => {
              const isHovered = hoveredIndex === i;
              const isEven = i % 2 === 0;

              return (
                <div
                  key={i}
                  className="relative flex items-start gap-8 animate-in fade-in-left"
                  style={{
                    animationDelay: `${i * 150}ms`,
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Milestone Circle */}
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center
                               cursor-pointer transition-all duration-300 relative z-10"
                    style={{
                      background: isHovered
                        ? `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`
                        : theme.colors.background.paper,
                      border: `4px solid ${isHovered ? theme.colors.secondary.main : theme.colors.primary.main}`,
                      boxShadow: isHovered
                        ? `0 12px 40px ${theme.colors.primary.main}60, 0 0 0 8px ${theme.colors.primary.main}20`
                        : `0 4px 16px ${theme.colors.primary.main}30`,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {item.icon ? (
                      <span className="text-2xl">{item.icon}</span>
                    ) : (
                      <span
                        className="font-bold"
                        style={{
                          color: isHovered ? 'white' : theme.colors.primary.main,
                          fontSize: theme.typography.scale.lg,
                        }}
                      >
                        {i + 1}
                      </span>
                    )}

                    {/* Pulse effect */}
                    {isHovered && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          backgroundColor: theme.colors.primary.main,
                          opacity: 0.3,
                        }}
                      />
                    )}
                  </div>

                  {/* Content Card */}
                  <div
                    className="flex-1 p-6 rounded-2xl transition-all duration-300"
                    style={{
                      backgroundColor: isHovered 
                        ? `${theme.colors.primary.main}10` 
                        : theme.colors.background.paper,
                      border: `2px solid ${isHovered ? theme.colors.primary.main : theme.colors.primary.main}20`,
                      boxShadow: isHovered ? theme.visual.shadows.xl : theme.visual.shadows.md,
                      transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
                    }}
                  >
                    {/* Date */}
                    {item.date && (
                      <div
                        className="inline-block px-3 py-1 rounded-full mb-3"
                        style={{
                          backgroundColor: `${theme.colors.secondary.main}20`,
                          color: theme.colors.secondary.main,
                          fontSize: theme.typography.scale.xs,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {item.date}
                      </div>
                    )}

                    {/* Title */}
                    <h3
                      className="font-bold mb-2"
                      style={{
                        fontSize: theme.typography.scale.xl,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p
                        className="mb-4"
                        style={{
                          fontSize: theme.typography.scale.base,
                          color: theme.colors.text.secondary,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    {/* Image (if provided) */}
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="rounded-lg w-full h-48 object-cover"
                      />
                    )}

                    {/* Tags */}
                    {item.tags && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {item.tags.map((tag: string, tagIndex: number) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: `${theme.colors.primary.main}15`,
                              color: theme.colors.primary.main,
                              fontSize: theme.typography.scale.xs,
                              fontWeight: 600,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation: fade-in-left 0.6s ease-out;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

