/**
 * HeroBlock - Stunning full-width hero section component
 * 
 * Features:
 * - Large title + subtitle
 * - Background image or gradient
 * - CTA buttons with animations
 * - Text overlays
 * - Parallax effects
 * - Theme-aware styling
 * - Multiple layout variants
 */

import { useState } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface HeroBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function HeroBlock({ block, theme, isEditing, onUpdate }: HeroBlockProps) {
  const content = block.content;
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  // Get layout variant
  const variant = content.heroVariant || 'centered'; // 'centered' | 'left' | 'right' | 'split'
  const hasImage = !!content.image;

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '600px',
        height: variant === 'split' ? '700px' : '600px',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Background Layer */}
      <div className="absolute inset-0">
        {hasImage ? (
          <>
            {/* Background Image with Parallax */}
            <div
              className="absolute inset-0 transition-transform duration-700"
              style={{
                backgroundImage: `url(${content.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `translate(${mousePosition.x * 20 - 10}px, ${mousePosition.y * 20 - 10}px) scale(1.1)`,
              }}
            />
            
            {/* Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: variant === 'centered'
                  ? 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
                  : variant === 'left'
                  ? 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)'
                  : variant === 'right'
                  ? 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)'
                  : 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.9) 50%, transparent 50%)',
              }}
            />
          </>
        ) : (
          // Gradient Background
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, 
                ${theme.colors.primary.main}20 0%, 
                ${theme.colors.secondary.main}20 50%,
                ${theme.colors.primary.main}10 100%)`,
            }}
          />
        )}

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl animate-float-slow"
            style={{
              background: theme.colors.primary.main,
              top: '10%',
              left: '10%',
            }}
          />
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl animate-float-slower"
            style={{
              background: theme.colors.secondary.main,
              bottom: '10%',
              right: '10%',
              animationDelay: '2s',
            }}
          />
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 h-full flex items-center">
        <div 
          className={`
            w-full px-16 py-20
            ${variant === 'centered' ? 'text-center' : ''}
            ${variant === 'right' ? 'flex justify-end' : ''}
          `}
        >
          <div
            className={`
              max-w-5xl
              ${variant === 'centered' ? 'mx-auto' : ''}
              ${variant === 'split' ? 'max-w-2xl' : ''}
            `}
          >
            {/* Subtitle/Eyebrow */}
            {content.subtitle && (
              <div
                className="inline-block px-6 py-2 rounded-full mb-6
                           animate-in fade-in slide-in-from-top"
                style={{
                  backgroundColor: `${theme.colors.primary.main}30`,
                  color: hasImage ? 'white' : theme.colors.primary.main,
                  fontSize: theme.typography.scale.sm,
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.colors.primary.main}40`,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  animationDelay: '0ms',
                }}
              >
                {content.subtitle}
              </div>
            )}

            {/* Main Title */}
            <h1
              className="font-black mb-8 leading-tight
                         animate-in fade-in slide-in-from-bottom"
              style={{
                fontSize: variant === 'centered' ? '72px' : '64px',
                color: hasImage ? 'white' : theme.colors.text.primary,
                textShadow: hasImage ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
                animationDelay: '100ms',
                lineHeight: 1.1,
              }}
            >
              {content.heading || content.title || 'Hero Title'}
            </h1>

            {/* Description */}
            {content.body && (
              <p
                className="mb-12 leading-relaxed
                           animate-in fade-in slide-in-from-bottom"
                style={{
                  fontSize: theme.typography.scale['2xl'],
                  color: hasImage ? 'rgba(255,255,255,0.95)' : theme.colors.text.secondary,
                  maxWidth: variant === 'centered' ? '800px' : '600px',
                  margin: variant === 'centered' ? '0 auto 3rem' : '0 0 3rem',
                  textShadow: hasImage ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
                  animationDelay: '200ms',
                  lineHeight: 1.6,
                }}
              >
                {content.body}
              </p>
            )}

            {/* CTA Buttons */}
            <div
              className={`
                flex gap-6 
                ${variant === 'centered' ? 'justify-center' : ''}
                animate-in fade-in slide-in-from-bottom
              `}
              style={{
                animationDelay: '300ms',
              }}
            >
              {/* Primary CTA */}
              {content.cta && (
                <button
                  className="group relative px-10 py-5 rounded-2xl font-bold
                             transform transition-all duration-300
                             hover:scale-105 active:scale-95
                             overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, 
                      ${theme.colors.primary.main}, 
                      ${theme.colors.secondary.main})`,
                    color: 'white',
                    fontSize: theme.typography.scale.lg,
                    boxShadow: `0 10px 40px ${theme.colors.primary.main}60`,
                  }}
                  onMouseEnter={() => setIsHoveringCTA(true)}
                  onMouseLeave={() => setIsHoveringCTA(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (content.cta?.action) {
                      content.cta.action();
                    }
                  }}
                >
                  {/* Button Background Animation */}
                  <div
                    className="absolute inset-0 transition-transform duration-300"
                    style={{
                      background: `linear-gradient(135deg, 
                        ${theme.colors.secondary.main}, 
                        ${theme.colors.primary.main})`,
                      transform: isHoveringCTA ? 'scale(1)' : 'scale(0)',
                      transformOrigin: 'center',
                    }}
                  />
                  
                  {/* Button Text */}
                  <span className="relative z-10 flex items-center gap-3">
                    {content.cta.label}
                    <span
                      className="text-2xl transition-transform duration-200"
                      style={{
                        transform: isHoveringCTA ? 'translateX(4px)' : 'translateX(0)',
                      }}
                    >
                      →
                    </span>
                  </span>

                  {/* Shine Effect */}
                  {isHoveringCTA && (
                    <div
                      className="absolute inset-0 animate-shine"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      }}
                    />
                  )}
                </button>
              )}

              {/* Secondary CTA */}
              {content.secondaryCta && (
                <button
                  className="px-10 py-5 rounded-2xl font-bold
                             transform transition-all duration-300
                             hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: hasImage ? 'rgba(255,255,255,0.2)' : `${theme.colors.primary.main}20`,
                    color: hasImage ? 'white' : theme.colors.primary.main,
                    fontSize: theme.typography.scale.lg,
                    border: `2px solid ${hasImage ? 'rgba(255,255,255,0.4)' : theme.colors.primary.main}`,
                    backdropFilter: 'blur(10px)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (content.secondaryCta?.action) {
                      content.secondaryCta.action();
                    }
                  }}
                >
                  {content.secondaryCta.label}
                </button>
              )}
            </div>

            {/* Stats/Social Proof (optional) */}
            {content.stats && (
              <div
                className="mt-16 flex gap-12 
                           ${variant === 'centered' ? 'justify-center' : ''}
                           animate-in fade-in"
                style={{
                  animationDelay: '400ms',
                }}
              >
                {content.stats.map((stat: any, i: number) => (
                  <div key={i} className="text-center">
                    <div
                      className="font-black mb-2"
                      style={{
                        fontSize: '48px',
                        color: hasImage ? 'white' : theme.colors.primary.main,
                        textShadow: hasImage ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: theme.typography.scale.sm,
                        color: hasImage ? 'rgba(255,255,255,0.8)' : theme.colors.text.secondary,
                        textShadow: hasImage ? '0 1px 5px rgba(0,0,0,0.3)' : 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator (if not editing) */}
      {!isEditing && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2
                     animate-bounce cursor-pointer opacity-70 hover:opacity-100
                     transition-opacity"
          style={{
            color: hasImage ? 'white' : theme.colors.primary.main,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span style={{ fontSize: theme.typography.scale.xs }}>SCROLL</span>
            <div className="text-2xl">↓</div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-from-top {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-bottom {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        
        .animate-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 25s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}

