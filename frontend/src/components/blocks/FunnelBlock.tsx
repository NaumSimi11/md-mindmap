/**
 * FunnelBlock - Beautiful conversion funnel visualization
 * 
 * Features:
 * - Funnel/pyramid visualization
 * - Percentage/number display per stage
 * - Color gradients by stage
 * - Width-based visual hierarchy
 * - Hover animations
 * - Conversion rate indicators
 * - Theme-aware styling
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface FunnelBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function FunnelBlock({ block, theme, isEditing, onUpdate }: FunnelBlockProps) {
  const items = block.content.funnelItems || [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate conversion rates
  const getConversionRate = (index: number): number => {
    if (index === 0) return 100;
    const previousValue = parseFloat(items[index - 1]?.value) || 100;
    const currentValue = parseFloat(items[index]?.value) || 0;
    return previousValue > 0 ? (currentValue / previousValue) * 100 : 0;
  };

  // Get color for stage
  const getStageColor = (index: number, total: number): string => {
    const progress = index / (total - 1);
    // Interpolate between primary and secondary colors
    return `hsl(${240 + progress * 60}, 70%, ${60 - progress * 20}%)`;
  };

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

        {/* Funnel Visualization */}
        <div className="space-y-4">
          {items.map((item: any, i: number) => {
            const isHovered = hoveredIndex === i;
            const conversionRate = getConversionRate(i);
            const maxValue = Math.max(...items.map((it: any) => parseFloat(it.value) || 0));
            const widthPercentage = ((parseFloat(item.value) || 0) / maxValue) * 100;
            const isFirst = i === 0;
            const isLast = i === items.length - 1;

            return (
              <div
                key={i}
                className="relative animate-in fade-in-up"
                style={{
                  animationDelay: `${i * 100}ms`,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Main Funnel Stage */}
                <div
                  className="relative mx-auto transition-all duration-300 cursor-pointer group"
                  style={{
                    width: `${widthPercentage}%`,
                    minWidth: '60%',
                  }}
                >
                  <div
                    className="p-8 rounded-2xl transition-all duration-300"
                    style={{
                      background: isHovered
                        ? `linear-gradient(135deg, 
                            ${theme.colors.primary.main}, 
                            ${theme.colors.secondary.main})`
                        : `linear-gradient(135deg, 
                            ${getStageColor(i, items.length)}dd, 
                            ${getStageColor(i, items.length)}aa)`,
                      boxShadow: isHovered
                        ? `0 20px 60px ${theme.colors.primary.main}40, 0 0 0 2px ${theme.colors.primary.main}`
                        : theme.visual.shadows.lg,
                      transform: isHovered ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {/* Stage Number & Icon */}
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-transform duration-300"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: theme.typography.scale.xl,
                            backdropFilter: 'blur(10px)',
                            transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                          }}
                        >
                          {item.icon || (i + 1)}
                        </div>

                        {/* Label */}
                        <div>
                          <div
                            className="font-bold"
                            style={{
                              fontSize: theme.typography.scale['2xl'],
                              color: 'white',
                              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                          >
                            {item.label}
                          </div>
                          {item.description && (
                            <div
                              style={{
                                fontSize: theme.typography.scale.sm,
                                color: 'rgba(255,255,255,0.9)',
                                marginTop: '4px',
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Value */}
                      <div className="text-right">
                        <div
                          className="font-black"
                          style={{
                            fontSize: theme.typography.scale['4xl'],
                            color: 'white',
                            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          {item.value}
                          {item.unit || '%'}
                        </div>
                        {item.subtitle && (
                          <div
                            style={{
                              fontSize: theme.typography.scale.sm,
                              color: 'rgba(255,255,255,0.8)',
                            }}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator at bottom */}
                    <div
                      className="mt-4 h-2 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${widthPercentage}%`,
                          backgroundColor: 'rgba(255,255,255,0.6)',
                          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Conversion Rate Badge */}
                  {!isFirst && (
                    <div
                      className="absolute -top-3 right-8 px-4 py-2 rounded-full font-bold transition-all duration-300"
                      style={{
                        backgroundColor: conversionRate >= 80 
                          ? '#10b981' 
                          : conversionRate >= 60 
                          ? '#f59e0b' 
                          : '#ef4444',
                        color: 'white',
                        fontSize: theme.typography.scale.sm,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        transform: isHovered ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                      }}
                    >
                      {Math.round(conversionRate)}% conversion
                    </div>
                  )}
                </div>

                {/* Connecting Arrow */}
                {!isLast && (
                  <div className="flex justify-center py-2">
                    <div
                      className="text-4xl transition-transform duration-300"
                      style={{
                        color: theme.colors.primary.main,
                        opacity: 0.6,
                        transform: isHovered ? 'translateY(4px)' : 'translateY(0)',
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

        {/* Summary Stats */}
        {items.length > 1 && (
          <div
            className="mt-16 p-8 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, 
                ${theme.colors.primary.main}10, 
                ${theme.colors.secondary.main}10)`,
              border: `2px solid ${theme.colors.primary.main}30`,
            }}
          >
            <div className="grid grid-cols-3 gap-8 text-center">
              {/* Total Conversion */}
              <div>
                <div
                  className="font-black mb-2"
                  style={{
                    fontSize: theme.typography.scale['4xl'],
                    color: theme.colors.primary.main,
                  }}
                >
                  {Math.round(getConversionRate(items.length - 1))}%
                </div>
                <div
                  style={{
                    fontSize: theme.typography.scale.base,
                    color: theme.colors.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  Overall Conversion
                </div>
              </div>

              {/* Drop-off */}
              <div>
                <div
                  className="font-black mb-2"
                  style={{
                    fontSize: theme.typography.scale['4xl'],
                    color: '#ef4444',
                  }}
                >
                  {Math.round(100 - getConversionRate(items.length - 1))}%
                </div>
                <div
                  style={{
                    fontSize: theme.typography.scale.base,
                    color: theme.colors.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  Total Drop-off
                </div>
              </div>

              {/* Stages */}
              <div>
                <div
                  className="font-black mb-2"
                  style={{
                    fontSize: theme.typography.scale['4xl'],
                    color: theme.colors.secondary.main,
                  }}
                >
                  {items.length}
                </div>
                <div
                  style={{
                    fontSize: theme.typography.scale.base,
                    color: theme.colors.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  Stages
                </div>
              </div>
            </div>
          </div>
        )}
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
      `}</style>
    </div>
  );
}

