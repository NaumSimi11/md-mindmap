/**
 * CalloutBlock - Beautiful callout/alert component
 * 
 * Features:
 * - Multiple types (info, warning, success, error, tip)
 * - Icon support
 * - Gradient backgrounds
 * - Dismissible option
 * - Theme-aware styling
 * - Animations
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface CalloutBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function CalloutBlock({ block, theme, isEditing, onUpdate }: CalloutBlockProps) {
  const calloutType = block.content.calloutType || 'info'; // 'info' | 'warning' | 'success' | 'error' | 'tip'
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible && !isEditing) return null;

  const typeConfig = getTypeConfig(calloutType, theme);

  return (
    <div 
      className="w-full py-8 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl transition-all duration-500 animate-in slide-in-from-bottom"
          style={{
            background: `linear-gradient(135deg, ${typeConfig.gradient.start}, ${typeConfig.gradient.end})`,
            boxShadow: isHovered 
              ? `0 20px 60px ${typeConfig.shadowColor}, 0 0 0 3px ${typeConfig.borderColor}`
              : `0 12px 40px ${typeConfig.shadowColor}`,
            transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
            border: `2px solid ${typeConfig.borderColor}`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full"
              style={{
                background: typeConfig.decorColor,
                filter: 'blur(80px)',
                transform: isHovered ? 'scale(1.5)' : 'scale(1)',
                transition: 'transform 1s ease-out',
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full"
              style={{
                background: typeConfig.decorColor,
                filter: 'blur(60px)',
                transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 1s ease-out',
                transitionDelay: '0.1s',
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div
                className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center
                           transition-all duration-300"
                style={{
                  backgroundColor: typeConfig.iconBg,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 8px 24px ${typeConfig.shadowColor}`,
                  transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                }}
              >
                <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                  {typeConfig.icon}
                </span>
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                {block.content.title && (
                  <h3
                    className="font-black mb-3"
                    style={{
                      fontSize: theme.typography.scale['2xl'],
                      color: typeConfig.textColor,
                      textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      lineHeight: 1.2,
                    }}
                  >
                    {block.content.title}
                  </h3>
                )}

                {/* Body */}
                {block.content.body && (
                  <div
                    className="mb-4"
                    style={{
                      fontSize: theme.typography.scale.base,
                      color: typeConfig.textColor,
                      lineHeight: 1.7,
                      opacity: 0.95,
                    }}
                  >
                    {block.content.body}
                  </div>
                )}

                {/* Action Items */}
                {block.content.actions && (
                  <div className="flex flex-wrap gap-3 mt-6">
                    {block.content.actions.map((action: any, i: number) => (
                      <button
                        key={i}
                        className="px-6 py-3 rounded-xl font-bold transition-all duration-300
                                   hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: action.primary 
                            ? 'rgba(255,255,255,0.95)'
                            : 'rgba(255,255,255,0.2)',
                          color: action.primary 
                            ? typeConfig.primaryButtonColor
                            : typeConfig.textColor,
                          fontSize: theme.typography.scale.sm,
                          backdropFilter: 'blur(10px)',
                          boxShadow: action.primary 
                            ? `0 4px 12px ${typeConfig.shadowColor}`
                            : 'none',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (action.onClick) action.onClick();
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tags/Labels */}
                {block.content.tags && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {block.content.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          color: typeConfig.textColor,
                          fontSize: theme.typography.scale.xs,
                          fontWeight: 600,
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button (if dismissible) */}
              {block.content.dismissible && (
                <button
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                             transition-all duration-300 hover:scale-110 active:scale-90"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: typeConfig.textColor,
                    backdropFilter: 'blur(10px)',
                  }}
                  onClick={() => setIsVisible(false)}
                >
                  <span className="text-2xl font-bold">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Animated Border Shimmer */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-3xl animate-shimmer"
              style={{
                background: `linear-gradient(90deg, 
                  transparent, 
                  ${typeConfig.shimmerColor}, 
                  transparent)`,
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          from {
            background-position: -200% 0;
          }
          to {
            background-position: 200% 0;
          }
        }
        
        .animate-in {
          animation: slide-in-from-bottom 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Type Configuration
function getTypeConfig(type: string, theme: BeautifulTheme) {
  const configs: Record<string, any> = {
    info: {
      gradient: { start: '#3b82f680', end: '#1d4ed880' },
      borderColor: '#3b82f6',
      shadowColor: '#3b82f650',
      iconBg: 'rgba(59, 130, 246, 0.3)',
      textColor: 'white',
      decorColor: '#60a5fa',
      shimmerColor: 'rgba(147, 197, 253, 0.3)',
      primaryButtonColor: '#3b82f6',
      icon: 'ℹ️',
    },
    warning: {
      gradient: { start: '#f59e0b80', end: '#d9770680' },
      borderColor: '#f59e0b',
      shadowColor: '#f59e0b50',
      iconBg: 'rgba(245, 158, 11, 0.3)',
      textColor: 'white',
      decorColor: '#fbbf24',
      shimmerColor: 'rgba(252, 211, 77, 0.3)',
      primaryButtonColor: '#f59e0b',
      icon: '⚠️',
    },
    success: {
      gradient: { start: '#10b98180', end: '#059   66980' },
      borderColor: '#10b981',
      shadowColor: '#10b98150',
      iconBg: 'rgba(16, 185, 129, 0.3)',
      textColor: 'white',
      decorColor: '#34d399',
      shimmerColor: 'rgba(110, 231, 183, 0.3)',
      primaryButtonColor: '#10b981',
      icon: '✓',
    },
    error: {
      gradient: { start: '#ef444480', end: '#dc262680' },
      borderColor: '#ef4444',
      shadowColor: '#ef444450',
      iconBg: 'rgba(239, 68, 68, 0.3)',
      textColor: 'white',
      decorColor: '#f87171',
      shimmerColor: 'rgba(252, 165, 165, 0.3)',
      primaryButtonColor: '#ef4444',
      icon: '✗',
    },
    tip: {
      gradient: { start: theme.colors.primary.main + '80', end: theme.colors.secondary.main + '80' },
      borderColor: theme.colors.primary.main,
      shadowColor: theme.colors.primary.main + '50',
      iconBg: `${theme.colors.primary.main}30`,
      textColor: 'white',
      decorColor: theme.colors.secondary.main,
      shimmerColor: `${theme.colors.primary.main}30`,
      primaryButtonColor: theme.colors.primary.main,
      icon: '💡',
    },
  };

  return configs[type] || configs.info;
}

