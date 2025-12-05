/**
 * CardsBlock - Beautiful, Gamma-quality card grid component
 * 
 * Features:
 * - Responsive 2, 3, or 4 column grids
 * - Image overlays with gradients
 * - Icon badges
 * - Hover animations
 * - CTA buttons
 * - Theme-aware styling
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface CardsBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function CardsBlock({ block, theme, isEditing, onUpdate }: CardsBlockProps) {
  const cards = block.content.cards || [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Determine optimal column count
  const getColumnCount = () => {
    if (cards.length === 1) return 1;
    if (cards.length === 2) return 2;
    if (cards.length === 3) return 3;
    return 3; // Max 3 columns, wrap to new rows
  };

  const columns = getColumnCount();

  return (
    <div 
      className="w-full py-16 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div 
        className="grid gap-8 max-w-7xl mx-auto"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 1 ? '100%' : '280px'}, 1fr))`,
        }}
      >
        {cards.map((card, i) => (
          <div
            key={card.id || i}
            className="group relative overflow-hidden rounded-2xl 
                       transform transition-all duration-300 ease-out
                       cursor-pointer animate-in fade-in slide-in-from-bottom"
            style={{
              background: `linear-gradient(135deg, 
                ${theme.colors.primary.main}08, 
                ${theme.colors.secondary.main}08)`,
              boxShadow: hoveredIndex === i 
                ? `0 20px 60px ${theme.colors.primary.main}30, 0 0 0 1px ${theme.colors.primary.main}40`
                : theme.visual.shadows.lg,
              border: `1px solid ${theme.colors.primary.main}20`,
              animationDelay: `${i * 100}ms`,
              transform: hoveredIndex === i ? 'scale(1.05) translateY(-8px)' : 'scale(1) translateY(0)',
            }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Image Section with Overlay */}
            {card.image && (
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={card.image}
                  alt={card.imageAlt || card.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out"
                  style={{
                    transform: hoveredIndex === i ? 'scale(1.15)' : 'scale(1)',
                  }}
                  loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                    opacity: hoveredIndex === i ? 1 : 0.8,
                  }}
                />
                
                {/* Icon Badge */}
                {card.icon && (
                  <div 
                    className="absolute top-4 right-4 w-14 h-14 
                               rounded-full flex items-center justify-center
                               transform transition-all duration-300 ease-out"
                    style={{
                      background: theme.colors.primary.main,
                      boxShadow: `0 8px 24px ${theme.colors.primary.main}60`,
                      transform: hoveredIndex === i ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                    }}
                  >
                    <span className="text-3xl filter drop-shadow-lg">
                      {card.icon}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Content Section */}
            <div 
              className="p-8"
              style={{
                backgroundColor: theme.colors.background.paper,
              }}
            >
              {/* Title */}
              <h3 
                className="font-bold mb-4 transition-transform duration-200"
                style={{
                  fontSize: theme.typography.scale['2xl'],
                  color: theme.colors.primary.main,
                  lineHeight: 1.2,
                  transform: hoveredIndex === i ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                {card.title}
              </h3>
              
              {/* Body Text */}
              {card.body && (
                <p 
                  className="mb-6"
                  style={{
                    fontSize: theme.typography.scale.base,
                    color: theme.colors.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  {card.body}
                </p>
              )}
              
              {/* Tags/Labels */}
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {card.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${theme.colors.primary.main}20`,
                        color: theme.colors.primary.main,
                        fontSize: theme.typography.scale.xs,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* CTA Button */}
              {card.cta && (
                <button
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl
                             font-semibold transition-all duration-200
                             hover:shadow-xl active:scale-95"
                  style={{
                    background: hoveredIndex === i 
                      ? `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`
                      : theme.colors.primary.main,
                    color: 'white',
                    fontSize: theme.typography.scale.base,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (card.cta?.action) {
                      card.cta.action();
                    }
                  }}
                >
                  <span>{card.cta.label}</span>
                  <span 
                    className="text-xl transition-transform duration-200"
                    style={{
                      transform: hoveredIndex === i ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    →
                  </span>
                </button>
              )}
            </div>

            {/* Shimmer Effect on Hover */}
            {hoveredIndex === i && (
              <div 
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, 
                    transparent 0%, 
                    ${theme.colors.primary.main}20 50%, 
                    transparent 100%)`,
                  animation: 'shimmer 2s infinite',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-bottom {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation: fade-in 0.5s ease-out, slide-in-from-bottom 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

