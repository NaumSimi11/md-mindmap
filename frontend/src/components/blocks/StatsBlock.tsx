/**
 * StatsBlock - Beautiful statistics visualization component
 * 
 * Features:
 * - Multiple visualization types (ring, bar, pie, circle)
 * - Animated number counters (count-up effect)
 * - Icon support for each stat
 * - Color coding by value/status
 * - Progress indicators
 * - Responsive grid layouts
 * - Theme-aware styling
 * - Smooth animations
 */

import { useState, useEffect, useRef } from 'react';
import type { Block } from '@/services/presentation/BlockSystem';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface StatsBlockProps {
  block: Block;
  theme: BeautifulTheme;
  isEditing?: boolean;
  onUpdate?: (block: Block) => void;
}

export function StatsBlock({ block, theme, isEditing, onUpdate }: StatsBlockProps) {
  const stats = block.content.stats || [];
  const statType = block.content.statType || 'ring'; // 'ring' | 'bar' | 'pie' | 'circle'
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [hasAnimated, setHasAnimated] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  // Animate numbers on mount or when visible
  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasAnimated(true);
          animateNumbers();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateNumbers = () => {
    stats.forEach((stat: any, index: number) => {
      const targetValue = parseFloat(stat.value) || 0;
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutExpo)
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentValue = eased * targetValue;

        setAnimatedValues(prev => ({
          ...prev,
          [index]: currentValue
        }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      // Stagger animations
      setTimeout(animate, index * 150);
    });
  };

  const formatValue = (value: number, format?: string): string => {
    if (format === 'percentage') return `${Math.round(value)}%`;
    if (format === 'currency') return `$${Math.round(value).toLocaleString()}`;
    if (format === 'compact') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    }
    return Math.round(value).toLocaleString();
  };

  return (
    <div 
      ref={blockRef}
      className="w-full py-16 px-8"
      style={{
        backgroundColor: theme.colors.background.default,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Title (optional) */}
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

        {/* Stats Grid */}
        <div 
          className="grid gap-8"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${stats.length > 4 ? '200px' : '250px'}, 1fr))`,
          }}
        >
          {stats.map((stat: any, i: number) => (
            <div
              key={i}
              className="animate-in fade-in-up"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            >
              {statType === 'ring' && (
                <RingStat stat={stat} index={i} theme={theme} animatedValue={animatedValues[i] || 0} formatValue={formatValue} />
              )}
              {statType === 'bar' && (
                <BarStat stat={stat} index={i} theme={theme} animatedValue={animatedValues[i] || 0} formatValue={formatValue} />
              )}
              {statType === 'circle' && (
                <CircleStat stat={stat} index={i} theme={theme} animatedValue={animatedValues[i] || 0} formatValue={formatValue} />
              )}
              {statType === 'pie' && (
                <PieStat stat={stat} index={i} theme={theme} animatedValue={animatedValues[i] || 0} formatValue={formatValue} />
              )}
            </div>
          ))}
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
      `}</style>
    </div>
  );
}

// Ring/Circular Progress Stat
function RingStat({ stat, index, theme, animatedValue, formatValue }: any) {
  const percentage = (animatedValue / (stat.max || 100)) * 100;
  const circumference = 2 * Math.PI * 58; // radius = 58
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl group hover:scale-105 transition-all duration-300"
      style={{
        backgroundColor: theme.colors.background.paper,
        border: `2px solid ${theme.colors.primary.main}20`,
        boxShadow: theme.visual.shadows.lg,
      }}
    >
      {/* Ring Chart */}
      <div className="relative w-40 h-40 mb-6">
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background Circle */}
          <circle
            cx="80"
            cy="80"
            r="58"
            stroke={`${theme.colors.primary.main}20`}
            strokeWidth="12"
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx="80"
            cy="80"
            r="58"
            stroke={`url(#gradient-${index})`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.colors.primary.main} />
              <stop offset="100%" stopColor={theme.colors.secondary.main} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {stat.icon && (
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </span>
          )}
          <div
            className="font-black"
            style={{
              fontSize: theme.typography.scale['2xl'],
              color: theme.colors.primary.main,
            }}
          >
            {formatValue(animatedValue, stat.format)}
          </div>
        </div>
      </div>

      {/* Label */}
      <div
        className="text-center font-semibold"
        style={{
          fontSize: theme.typography.scale.base,
          color: theme.colors.text.primary,
        }}
      >
        {stat.label}
      </div>

      {/* Description */}
      {stat.description && (
        <div
          className="text-center mt-2"
          style={{
            fontSize: theme.typography.scale.sm,
            color: theme.colors.text.secondary,
          }}
        >
          {stat.description}
        </div>
      )}
    </div>
  );
}

// Bar Chart Stat
function BarStat({ stat, index, theme, animatedValue, formatValue }: any) {
  const percentage = (animatedValue / (stat.max || 100)) * 100;

  return (
    <div className="p-6 rounded-2xl group hover:scale-105 transition-all duration-300"
      style={{
        backgroundColor: theme.colors.background.paper,
        border: `2px solid ${theme.colors.primary.main}20`,
        boxShadow: theme.visual.shadows.lg,
      }}
    >
      {/* Icon & Label */}
      <div className="flex items-center gap-3 mb-4">
        {stat.icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`,
            }}
          >
            <span className="text-2xl">{stat.icon}</span>
          </div>
        )}
        <div className="flex-1">
          <div
            className="font-bold"
            style={{
              fontSize: theme.typography.scale.lg,
              color: theme.colors.text.primary,
            }}
          >
            {stat.label}
          </div>
          {stat.description && (
            <div
              style={{
                fontSize: theme.typography.scale.xs,
                color: theme.colors.text.secondary,
              }}
            >
              {stat.description}
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div
        className="font-black mb-3"
        style={{
          fontSize: theme.typography.scale['3xl'],
          color: theme.colors.primary.main,
        }}
      >
        {formatValue(animatedValue, stat.format)}
      </div>

      {/* Bar */}
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{
          backgroundColor: `${theme.colors.primary.main}20`,
        }}
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            background: `linear-gradient(90deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`,
            boxShadow: `0 0 10px ${theme.colors.primary.main}60`,
          }}
        />
      </div>

      {/* Percentage */}
      <div
        className="text-right mt-2 font-semibold"
        style={{
          fontSize: theme.typography.scale.sm,
          color: theme.colors.primary.main,
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}

// Circle Stat (Simple)
function CircleStat({ stat, index, theme, animatedValue, formatValue }: any) {
  return (
    <div className="flex flex-col items-center p-8 rounded-2xl group hover:scale-105 transition-all duration-300"
      style={{
        backgroundColor: theme.colors.background.paper,
        border: `2px solid ${theme.colors.primary.main}20`,
        boxShadow: theme.visual.shadows.lg,
      }}
    >
      {/* Icon Circle */}
      {stat.icon && (
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`,
            boxShadow: `0 8px 24px ${theme.colors.primary.main}40`,
          }}
        >
          <span className="text-4xl">{stat.icon}</span>
        </div>
      )}

      {/* Value */}
      <div
        className="font-black mb-2"
        style={{
          fontSize: theme.typography.scale['4xl'],
          color: theme.colors.primary.main,
        }}
      >
        {formatValue(animatedValue, stat.format)}
      </div>

      {/* Label */}
      <div
        className="text-center font-semibold"
        style={{
          fontSize: theme.typography.scale.base,
          color: theme.colors.text.primary,
        }}
      >
        {stat.label}
      </div>

      {/* Description */}
      {stat.description && (
        <div
          className="text-center mt-2"
          style={{
            fontSize: theme.typography.scale.sm,
            color: theme.colors.text.secondary,
          }}
        >
          {stat.description}
        </div>
      )}

      {/* Trend Indicator */}
      {stat.trend && (
        <div
          className="mt-3 px-3 py-1 rounded-full font-semibold"
          style={{
            backgroundColor: stat.trend > 0 
              ? '#10b98120' 
              : stat.trend < 0 
              ? '#ef444420' 
              : `${theme.colors.primary.main}20`,
            color: stat.trend > 0 
              ? '#10b981' 
              : stat.trend < 0 
              ? '#ef4444' 
              : theme.colors.primary.main,
            fontSize: theme.typography.scale.xs,
          }}
        >
          {stat.trend > 0 ? '↑' : stat.trend < 0 ? '↓' : '→'} {Math.abs(stat.trend)}%
        </div>
      )}
    </div>
  );
}

// Pie Chart Stat (Semi-circle gauge)
function PieStat({ stat, index, theme, animatedValue, formatValue }: any) {
  const percentage = (animatedValue / (stat.max || 100)) * 100;
  const rotation = (percentage / 100) * 180; // Semi-circle (180 degrees)

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl group hover:scale-105 transition-all duration-300"
      style={{
        backgroundColor: theme.colors.background.paper,
        border: `2px solid ${theme.colors.primary.main}20`,
        boxShadow: theme.visual.shadows.lg,
      }}
    >
      {/* Semi-Circle Gauge */}
      <div className="relative w-40 h-20 mb-4 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 h-40 rounded-t-full border-8 transition-all duration-700"
          style={{
            borderColor: `${theme.colors.primary.main}20`,
            borderBottomColor: 'transparent',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-40 rounded-t-full border-8 transition-all duration-700 origin-bottom"
          style={{
            borderColor: theme.colors.primary.main,
            borderBottomColor: 'transparent',
            clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
            transform: `rotate(${rotation}deg)`,
          }}
        />

        {/* Needle/Indicator */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-16 bg-gradient-to-t origin-bottom transition-transform duration-700"
          style={{
            background: `linear-gradient(to top, ${theme.colors.secondary.main}, ${theme.colors.primary.main})`,
            transform: `translateX(-50%) rotate(${rotation - 90}deg)`,
            boxShadow: `0 0 10px ${theme.colors.primary.main}`,
          }}
        />
      </div>

      {/* Icon */}
      {stat.icon && (
        <span className="text-3xl mb-2">{stat.icon}</span>
      )}

      {/* Value */}
      <div
        className="font-black mb-2"
        style={{
          fontSize: theme.typography.scale['3xl'],
          color: theme.colors.primary.main,
        }}
      >
        {formatValue(animatedValue, stat.format)}
      </div>

      {/* Label */}
      <div
        className="text-center font-semibold"
        style={{
          fontSize: theme.typography.scale.base,
          color: theme.colors.text.primary,
        }}
      >
        {stat.label}
      </div>

      {/* Description */}
      {stat.description && (
        <div
          className="text-center mt-2"
          style={{
            fontSize: theme.typography.scale.sm,
            color: theme.colors.text.secondary,
          }}
        >
          {stat.description}
        </div>
      )}
    </div>
  );
}

