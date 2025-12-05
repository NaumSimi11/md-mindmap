/**
 * StepsBlock - Beautiful sequential process/timeline component
 * 
 * Features:
 * - Numbered steps with connecting lines
 * - Icon support for each step
 * - Progress indicators
 * - Vertical timeline layout
 * - Hover animations
 * - Theme-aware styling
 * - Staggered entrance animations
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface StepsBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function StepsBlock({ block, theme, isEditing, onUpdate }: StepsBlockProps) {
  const steps = block.content.steps || [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepClick = (index: number) => {
    if (!isEditing) return;
    
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  return (
    <div 
      className="w-full py-16 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Connecting Line */}
          <div 
            className="absolute left-8 top-0 bottom-0 w-1"
            style={{
              background: `linear-gradient(to bottom, 
                ${theme.colors.primary.main}40, 
                ${theme.colors.secondary.main}40)`,
              borderRadius: '2px',
            }}
          />

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, i) => {
              const isHovered = hoveredIndex === i;
              const isCompleted = completedSteps.has(i);
              const isLast = i === steps.length - 1;

              return (
                <div
                  key={step.id || i}
                  className="relative animate-in fade-in slide-in-from-left"
                  style={{
                    animationDelay: `${i * 150}ms`,
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleStepClick(i)}
                >
                  <div 
                    className="flex gap-6 items-start cursor-pointer
                               transform transition-all duration-300"
                    style={{
                      transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
                    }}
                  >
                    {/* Step Number Circle */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center
                                   font-bold transition-all duration-300 relative z-10"
                        style={{
                          background: isCompleted
                            ? `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`
                            : isHovered
                            ? `linear-gradient(135deg, ${theme.colors.primary.main}90, ${theme.colors.secondary.main}90)`
                            : theme.colors.background.paper,
                          color: isCompleted || isHovered ? 'white' : theme.colors.primary.main,
                          fontSize: theme.typography.scale['2xl'],
                          border: `3px solid ${isCompleted ? theme.colors.primary.main : theme.colors.primary.main}40`,
                          boxShadow: isHovered 
                            ? `0 12px 40px ${theme.colors.primary.main}60, 0 0 0 8px ${theme.colors.primary.main}20`
                            : `0 4px 16px ${theme.colors.primary.main}30`,
                          transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        {isCompleted ? '✓' : i + 1}
                      </div>

                      {/* Icon Badge (if provided) */}
                      {step.icon && (
                        <div
                          className="absolute -top-2 -right-2 w-10 h-10 rounded-full
                                     flex items-center justify-center z-20
                                     transition-all duration-300"
                          style={{
                            background: theme.colors.secondary.main,
                            boxShadow: `0 4px 12px ${theme.colors.secondary.main}60`,
                            transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                          }}
                        >
                          <span className="text-xl">{step.icon}</span>
                        </div>
                      )}

                      {/* Pulse Effect on Hover */}
                      {isHovered && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping opacity-30"
                          style={{
                            background: theme.colors.primary.main,
                          }}
                        />
                      )}
                    </div>

                    {/* Content Card */}
                    <div
                      className="flex-1 p-6 rounded-2xl transition-all duration-300"
                      style={{
                        background: isHovered
                          ? `linear-gradient(135deg, 
                              ${theme.colors.background.paper}, 
                              ${theme.colors.primary.main}08)`
                          : theme.colors.background.paper,
                        border: `2px solid ${isHovered ? theme.colors.primary.main : theme.colors.primary.main}20`,
                        boxShadow: isHovered
                          ? `0 12px 40px ${theme.colors.primary.main}30`
                          : theme.visual.shadows.md,
                      }}
                    >
                      {/* Title */}
                      <h3
                        className="font-bold mb-3 transition-colors duration-200"
                        style={{
                          fontSize: theme.typography.scale['2xl'],
                          color: isHovered ? theme.colors.primary.main : theme.colors.text.primary,
                          lineHeight: 1.2,
                        }}
                      >
                        {step.title}
                      </h3>

                      {/* Description */}
                      {step.description && (
                        <p
                          className="mb-4"
                          style={{
                            fontSize: theme.typography.scale.base,
                            color: theme.colors.text.secondary,
                            lineHeight: 1.7,
                          }}
                        >
                          {step.description}
                        </p>
                      )}

                      {/* Details/Substeps */}
                      {step.details && (
                        <ul className="space-y-2">
                          {step.details.map((detail, detailIndex) => (
                            <li
                              key={detailIndex}
                              className="flex items-start gap-3"
                              style={{
                                fontSize: theme.typography.scale.sm,
                                color: theme.colors.text.secondary,
                              }}
                            >
                              <span
                                className="mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: `${theme.colors.primary.main}20`,
                                  color: theme.colors.primary.main,
                                  fontSize: '10px',
                                }}
                              >
                                ✓
                              </span>
                              <span className="flex-1">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Duration Badge */}
                      {step.duration && (
                        <div
                          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
                          style={{
                            backgroundColor: `${theme.colors.secondary.main}20`,
                            color: theme.colors.secondary.main,
                            fontSize: theme.typography.scale.sm,
                            fontWeight: 600,
                          }}
                        >
                          <span>⏱️</span>
                          <span>{step.duration}</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      {step.status && (
                        <div
                          className="inline-flex items-center gap-2 mt-4 ml-2 px-4 py-2 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(step.status, theme),
                            color: 'white',
                            fontSize: theme.typography.scale.xs,
                            fontWeight: 600,
                          }}
                        >
                          {getStatusIcon(step.status)}
                          <span>{step.status}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connecting Dot (animated line continuation) */}
                  {!isLast && (
                    <div
                      className="absolute left-8 top-20 w-1 h-8 transition-all duration-500"
                      style={{
                        background: isHovered
                          ? `linear-gradient(to bottom, 
                              ${theme.colors.primary.main}, 
                              ${theme.colors.secondary.main})`
                          : `${theme.colors.primary.main}40`,
                        transform: `translateX(-50%) scaleY(${isHovered ? 1.5 : 1})`,
                        transformOrigin: 'top',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Completion Progress Bar */}
          {completedSteps.size > 0 && (
            <div
              className="mt-12 p-6 rounded-2xl transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, 
                  ${theme.colors.primary.main}10, 
                  ${theme.colors.secondary.main}10)`,
                border: `2px solid ${theme.colors.primary.main}30`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  style={{
                    fontSize: theme.typography.scale.lg,
                    fontWeight: 600,
                    color: theme.colors.text.primary,
                  }}
                >
                  Progress
                </span>
                <span
                  style={{
                    fontSize: theme.typography.scale['2xl'],
                    fontWeight: 700,
                    color: theme.colors.primary.main,
                  }}
                >
                  {Math.round((completedSteps.size / steps.length) * 100)}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{
                  backgroundColor: `${theme.colors.primary.main}20`,
                }}
              >
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(completedSteps.size / steps.length) * 100}%`,
                    background: `linear-gradient(90deg, 
                      ${theme.colors.primary.main}, 
                      ${theme.colors.secondary.main})`,
                    boxShadow: `0 0 20px ${theme.colors.primary.main}60`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-from-left {
          from {
            transform: translateX(-30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation: fade-in 0.5s ease-out, slide-in-from-left 0.5s ease-out;
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

// Helper functions
function getStatusColor(status: string, theme: BeautifulTheme): string {
  const statusColors: Record<string, string> = {
    'completed': '#10b981', // green
    'in-progress': theme.colors.primary.main,
    'pending': '#6b7280', // gray
    'blocked': '#ef4444', // red
    'optional': theme.colors.secondary.main,
  };
  return statusColors[status.toLowerCase()] || theme.colors.primary.main;
}

function getStatusIcon(status: string): string {
  const statusIcons: Record<string, string> = {
    'completed': '✓',
    'in-progress': '⟳',
    'pending': '○',
    'blocked': '⊗',
    'optional': '◐',
  };
  return statusIcons[status.toLowerCase()] || '•';
}

