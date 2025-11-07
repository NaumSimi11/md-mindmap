/**
 * PyramidBlock - Beautiful hierarchy/pyramid visualization
 * 
 * Features:
 * - Stacked pyramid layers
 * - Width-based hierarchy
 * - Color gradients by level
 * - Icon support
 * - Hover animations
 * - Theme-aware styling
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface PyramidBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function PyramidBlock({ block, theme, isEditing, onUpdate }: PyramidBlockProps) {
  const items = block.content.pyramidItems || [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
            className="text-center font-bold mb-12"
            style={{
              fontSize: theme.typography.scale['3xl'],
              color: theme.colors.text.primary,
            }}
          >
            {block.content.heading}
          </h2>
        )}

        {/* Pyramid */}
        <div className="flex flex-col items-center gap-4">
          {items.map((item: any, i: number) => {
            const isHovered = hoveredIndex === i;
            const widthPercentage = 30 + ((i + 1) / items.length) * 70; // 30% to 100%
            const colorIntensity = (i / (items.length - 1)) * 100;

            return (
              <div
                key={i}
                className="relative transition-all duration-500 cursor-pointer animate-in fade-in-scale"
                style={{
                  width: `${widthPercentage}%`,
                  animationDelay: `${i * 150}ms`,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Layer */}
                <div
                  className="p-6 rounded-2xl transition-all duration-300"
                  style={{
                    background: isHovered
                      ? `linear-gradient(135deg, 
                          ${theme.colors.primary.main}, 
                          ${theme.colors.secondary.main})`
                      : `linear-gradient(135deg, 
                          hsl(${240 + colorIntensity * 0.6}, 70%, ${50 + colorIntensity * 0.2}%), 
                          hsl(${240 + colorIntensity * 0.6}, 60%, ${45 + colorIntensity * 0.2}%))`,
                    boxShadow: isHovered
                      ? `0 20px 60px ${theme.colors.primary.main}50, 0 0 0 3px ${theme.colors.primary.main}`
                      : theme.visual.shadows.lg,
                    transform: isHovered ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Level Indicator */}
                    <div className="flex items-center gap-4">
                      {item.icon && (
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                          }}
                        >
                          <span className="text-3xl">{item.icon}</span>
                        </div>
                      )}

                      <div>
                        {/* Label */}
                        <div
                          className="font-bold mb-1"
                          style={{
                            fontSize: theme.typography.scale['2xl'],
                            color: 'white',
                            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          {item.label}
                        </div>

                        {/* Description */}
                        {item.description && (
                          <div
                            style={{
                              fontSize: theme.typography.scale.sm,
                              color: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Value/Count */}
                    {item.value && (
                      <div
                        className="font-black"
                        style={{
                          fontSize: theme.typography.scale['4xl'],
                          color: 'white',
                          textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {item.value}
                        {item.unit && <span className="text-2xl ml-1">{item.unit}</span>}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {item.percentage !== undefined && (
                    <div
                      className="mt-4 h-2 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Level Number Badge */}
                <div
                  className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full
                             flex items-center justify-center font-bold transition-all duration-300"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    color: theme.colors.primary.main,
                    border: `3px solid ${theme.colors.primary.main}`,
                    fontSize: theme.typography.scale.lg,
                    boxShadow: theme.visual.shadows.lg,
                    transform: isHovered 
                      ? 'translateY(-50%) scale(1.2) rotate(12deg)' 
                      : 'translateY(-50%) scale(1)',
                  }}
                >
                  {i + 1}
                </div>

                {/* Arrow (if not last) */}
                {i < items.length - 1 && (
                  <div
                    className="flex justify-center py-2 transition-all duration-300"
                    style={{
                      opacity: isHovered ? 1 : 0.6,
                    }}
                  >
                    <div
                      className="text-4xl transition-transform duration-300"
                      style={{
                        color: theme.colors.primary.main,
                        transform: isHovered ? 'translateY(4px) scale(1.2)' : 'translateY(0) scale(1)',
                      }}
                    >
                      ↓
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div
            className="mt-16 p-8 rounded-2xl text-center"
            style={{
              background: `linear-gradient(135deg, 
                ${theme.colors.primary.main}10, 
                ${theme.colors.secondary.main}10)`,
              border: `2px solid ${theme.colors.primary.main}30`,
            }}
          >
            <div
              className="font-black mb-2"
              style={{
                fontSize: theme.typography.scale['4xl'],
                color: theme.colors.primary.main,
              }}
            >
              {items.length}
            </div>
            <div
              style={{
                fontSize: theme.typography.scale.lg,
                color: theme.colors.text.secondary,
                fontWeight: 600,
              }}
            >
              Levels in Hierarchy
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation: fade-in-scale 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

