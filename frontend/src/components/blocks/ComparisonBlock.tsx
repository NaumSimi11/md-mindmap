/**
 * ComparisonBlock - Beautiful feature comparison table
 * 
 * Features:
 * - Multi-column comparison
 * - Check/X indicators
 * - Highlight columns
 * - Sticky headers
 * - Responsive design
 * - Theme-aware styling
 * - Hover animations
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface ComparisonBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function ComparisonBlock({ block, theme, isEditing, onUpdate }: ComparisonBlockProps) {
  const columns = block.content.columns || [];
  const features = block.content.features || [];
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

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
            className="text-center font-bold mb-12"
            style={{
              fontSize: theme.typography.scale['3xl'],
              color: theme.colors.text.primary,
            }}
          >
            {block.content.heading}
          </h2>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header Row */}
            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `minmax(200px, 1fr) repeat(${columns.length}, minmax(180px, 1fr))` }}>
              {/* Features Label */}
              <div className="p-4" />

              {/* Column Headers */}
              {columns.map((column: any, i: number) => {
                const isHovered = hoveredColumn === i;
                const isHighlighted = column.highlighted;

                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl transition-all duration-300 cursor-pointer animate-in fade-in-down"
                    style={{
                      backgroundColor: isHighlighted 
                        ? `${theme.colors.primary.main}15`
                        : theme.colors.background.paper,
                      border: isHighlighted
                        ? `3px solid ${theme.colors.primary.main}`
                        : `2px solid ${theme.colors.primary.main}20`,
                      boxShadow: isHighlighted 
                        ? `0 12px 40px ${theme.colors.primary.main}30`
                        : theme.visual.shadows.md,
                      transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                      animationDelay: `${i * 100}ms`,
                    }}
                    onMouseEnter={() => setHoveredColumn(i)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    {/* Badge (if highlighted) */}
                    {isHighlighted && (
                      <div
                        className="inline-block px-3 py-1 rounded-full mb-3"
                        style={{
                          backgroundColor: theme.colors.secondary.main,
                          color: 'white',
                          fontSize: theme.typography.scale.xs,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {column.badge || 'POPULAR'}
                      </div>
                    )}

                    {/* Icon */}
                    {column.icon && (
                      <div className="text-4xl mb-3 transition-transform duration-300" 
                        style={{ transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)' }}
                      >
                        {column.icon}
                      </div>
                    )}

                    {/* Name */}
                    <div
                      className="font-bold mb-2"
                      style={{
                        fontSize: theme.typography.scale['2xl'],
                        color: theme.colors.text.primary,
                      }}
                    >
                      {column.name}
                    </div>

                    {/* Price */}
                    {column.price && (
                      <div
                        className="font-black mb-3"
                        style={{
                          fontSize: theme.typography.scale['3xl'],
                          color: theme.colors.primary.main,
                        }}
                      >
                        {column.price}
                      </div>
                    )}

                    {/* Description */}
                    {column.description && (
                      <div
                        style={{
                          fontSize: theme.typography.scale.sm,
                          color: theme.colors.text.secondary,
                          lineHeight: 1.5,
                        }}
                      >
                        {column.description}
                      </div>
                    )}

                    {/* CTA Button (if highlighted) */}
                    {column.cta && (
                      <button
                        className="mt-4 w-full py-3 px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105"
                        style={{
                          background: isHighlighted
                            ? `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`
                            : `${theme.colors.primary.main}20`,
                          color: isHighlighted ? 'white' : theme.colors.primary.main,
                          fontSize: theme.typography.scale.base,
                        }}
                      >
                        {column.cta}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feature Rows */}
            {features.map((feature: any, featureIndex: number) => (
              <div
                key={featureIndex}
                className="grid gap-4 mb-3 animate-in fade-in-left"
                style={{
                  gridTemplateColumns: `minmax(200px, 1fr) repeat(${columns.length}, minmax(180px, 1fr))`,
                  animationDelay: `${(featureIndex + columns.length) * 50}ms`,
                }}
              >
                {/* Feature Label */}
                <div
                  className="p-4 rounded-xl flex items-center"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    border: `1px solid ${theme.colors.primary.main}10`,
                  }}
                >
                  <div>
                    <div
                      className="font-semibold"
                      style={{
                        fontSize: theme.typography.scale.base,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {feature.name}
                    </div>
                    {feature.description && (
                      <div
                        style={{
                          fontSize: theme.typography.scale.xs,
                          color: theme.colors.text.secondary,
                          marginTop: '4px',
                        }}
                      >
                        {feature.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Feature Values for Each Column */}
                {columns.map((column: any, columnIndex: number) => {
                  const isHovered = hoveredColumn === columnIndex;
                  const isHighlighted = column.highlighted;
                  const value = feature.values?.[columnIndex];

                  return (
                    <div
                      key={columnIndex}
                      className="p-4 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: isHighlighted 
                          ? `${theme.colors.primary.main}08`
                          : theme.colors.background.paper,
                        border: isHighlighted
                          ? `2px solid ${theme.colors.primary.main}20`
                          : `1px solid ${theme.colors.primary.main}10`,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {value === true ? (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${theme.colors.primary.main}20`,
                            color: theme.colors.primary.main,
                          }}
                        >
                          <span className="text-2xl font-bold">✓</span>
                        </div>
                      ) : value === false ? (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: '#ef444420',
                            color: '#ef4444',
                          }}
                        >
                          <span className="text-2xl font-bold">✗</span>
                        </div>
                      ) : typeof value === 'string' ? (
                        <div
                          className="font-semibold text-center"
                          style={{
                            fontSize: theme.typography.scale.sm,
                            color: theme.colors.text.primary,
                          }}
                        >
                          {value}
                        </div>
                      ) : (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${theme.colors.primary.main}30` }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }
        
        .fade-in-down {
          animation-name: fade-in-down;
        }
        
        .fade-in-left {
          animation-name: fade-in-left;
        }
      `}</style>
    </div>
  );
}

