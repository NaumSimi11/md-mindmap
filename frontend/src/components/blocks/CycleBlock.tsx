/**
 * CycleBlock - Beautiful circular process/cycle visualization
 * 
 * Features:
 * - Circular layout with connecting arrows
 * - Icon support for each stage
 * - Rotating animations
 * - Theme-aware styling
 * - Responsive sizing
 * - Hover interactions
 * - Central label/title
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface CycleBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function CycleBlock({ block, theme, isEditing, onUpdate }: CycleBlockProps) {
  const items = block.content.cycleItems || [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Calculate position on circle
  const getPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start at top
    const radius = 200; // Distance from center
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      angle: angle,
    };
  };

  return (
    <div 
      className="w-full py-16 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div className="max-w-6xl mx-auto">
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

        {/* Cycle Visualization */}
        <div className="relative" style={{ minHeight: '600px' }}>
          {/* Center Circle */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                       flex flex-col items-center justify-center rounded-full z-10
                       transition-all duration-500"
            style={{
              width: '200px',
              height: '200px',
              background: `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`,
              boxShadow: `0 20px 60px ${theme.colors.primary.main}40`,
            }}
          >
            {block.content.centerIcon && (
              <span className="text-6xl mb-3">{block.content.centerIcon}</span>
            )}
            <div
              className="font-bold text-center px-4"
              style={{
                fontSize: theme.typography.scale.xl,
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {block.content.centerLabel || 'Cycle'}
            </div>
          </div>

          {/* Circular Path */}
          <svg
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            width="500"
            height="500"
            style={{ overflow: 'visible' }}
          >
            {/* Circle path */}
            <circle
              cx="250"
              cy="250"
              r="200"
              fill="none"
              stroke={`${theme.colors.primary.main}30`}
              strokeWidth="3"
              strokeDasharray="10,5"
            />

            {/* Animated circle on path */}
            <circle
              cx="250"
              cy="250"
              r="200"
              fill="none"
              stroke={theme.colors.primary.main}
              strokeWidth="3"
              strokeDasharray="1256.64" // Circumference = 2 * PI * 200
              strokeDashoffset="0"
              className="animate-dash"
            />

            {/* Connecting arrows */}
            {items.map((item: any, i: number) => {
              const nextIndex = (i + 1) % items.length;
              const pos = getPosition(i, items.length);
              const nextPos = getPosition(nextIndex, items.length);
              
              return (
                <g key={`arrow-${i}`}>
                  <defs>
                    <marker
                      id={`arrowhead-${i}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3, 0 6"
                        fill={hoveredIndex === i ? theme.colors.secondary.main : theme.colors.primary.main}
                        style={{ transition: 'fill 0.3s' }}
                      />
                    </marker>
                  </defs>
                  <path
                    d={`M ${250 + pos.x * 0.7} ${250 + pos.y * 0.7} 
                        Q ${250 + (pos.x + nextPos.x) * 0.4} ${250 + (pos.y + nextPos.y) * 0.4}
                        ${250 + nextPos.x * 0.7} ${250 + nextPos.y * 0.7}`}
                    fill="none"
                    stroke={hoveredIndex === i ? theme.colors.secondary.main : `${theme.colors.primary.main}60`}
                    strokeWidth={hoveredIndex === i ? "3" : "2"}
                    markerEnd={`url(#arrowhead-${i})`}
                    style={{ transition: 'all 0.3s' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Cycle Items */}
          {items.map((item: any, i: number) => {
            const pos = getPosition(i, items.length);
            const isHovered = hoveredIndex === i;
            const isActive = activeIndex === i;

            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  zIndex: isHovered ? 20 : 15,
                }}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  setActiveIndex(i);
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Item Card */}
                <div
                  className="relative cursor-pointer animate-in fade-in-scale"
                  style={{
                    animationDelay: `${i * 150}ms`,
                  }}
                >
                  {/* Main Circle */}
                  <div
                    className="w-32 h-32 rounded-full flex flex-col items-center justify-center
                               transition-all duration-300"
                    style={{
                      background: isHovered || isActive
                        ? `linear-gradient(135deg, ${theme.colors.secondary.main}, ${theme.colors.primary.main})`
                        : theme.colors.background.paper,
                      border: `3px solid ${isHovered || isActive ? theme.colors.secondary.main : theme.colors.primary.main}`,
                      boxShadow: isHovered
                        ? `0 20px 50px ${theme.colors.secondary.main}60`
                        : `0 10px 30px ${theme.colors.primary.main}30`,
                      transform: isHovered ? 'scale(1.15)' : isActive ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {/* Icon */}
                    {item.icon && (
                      <span 
                        className="text-4xl mb-1 transition-transform duration-300"
                        style={{
                          transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg)',
                        }}
                      >
                        {item.icon}
                      </span>
                    )}

                    {/* Step Number */}
                    <div
                      className="font-bold"
                      style={{
                        fontSize: theme.typography.scale.sm,
                        color: isHovered || isActive ? 'white' : theme.colors.primary.main,
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Label Card (appears on hover) */}
                  <div
                    className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2
                               px-6 py-4 rounded-xl whitespace-nowrap transition-all duration-300"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      border: `2px solid ${theme.colors.primary.main}30`,
                      boxShadow: theme.visual.shadows.lg,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered 
                        ? 'translateX(-50%) translateY(0)' 
                        : 'translateX(-50%) translateY(-10px)',
                      pointerEvents: isHovered ? 'auto' : 'none',
                    }}
                  >
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: theme.typography.scale.base,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {item.label}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: theme.typography.scale.sm,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {item.description}
                      </div>
                    )}

                    {/* Arrow pointer */}
                    <div
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: `8px solid ${theme.colors.primary.main}30`,
                      }}
                    />
                  </div>

                  {/* Pulse effect on active */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        backgroundColor: theme.colors.secondary.main,
                        opacity: 0.3,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend/Summary */}
        {items.length > 0 && (
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl cursor-pointer transition-all duration-300"
                style={{
                  backgroundColor: activeIndex === i 
                    ? `${theme.colors.primary.main}20` 
                    : theme.colors.background.paper,
                  border: `2px solid ${activeIndex === i ? theme.colors.primary.main : theme.colors.primary.main}20`,
                }}
                onClick={() => setActiveIndex(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${theme.colors.primary.main}20`,
                      color: theme.colors.primary.main,
                      fontSize: theme.typography.scale.sm,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold truncate"
                      style={{
                        fontSize: theme.typography.scale.sm,
                        color: theme.colors.text.primary,
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation: fade-in-scale 0.5s ease-out;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: -1256.64;
          }
        }
        
        .animate-dash {
          animation: dash 10s linear infinite;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

