/**
 * AI Thinking Animation - Cursor/Claude-style thinking indicator
 * 
 * Shows beautiful, smooth animation while AI is processing
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Brain, Zap, CheckCircle } from 'lucide-react';

interface AIThinkingAnimationProps {
  phase?: 'analyzing' | 'planning' | 'writing' | 'finalizing';
}

export const AIThinkingAnimation: React.FC<AIThinkingAnimationProps> = ({ phase = 'analyzing' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const phaseConfig = {
    analyzing: {
      icon: Brain,
      text: 'Analyzing document',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    planning: {
      icon: Sparkles,
      text: 'Planning changes',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    writing: {
      icon: Zap,
      text: 'Writing content',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    finalizing: {
      icon: CheckCircle,
      text: 'Finalizing',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  };

  const config = phaseConfig[phase];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
      {/* Animated Icon */}
      <div className={`${config.bgColor} p-2 rounded-lg animate-pulse`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Thinking Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {config.text}
          </span>
          <span className="text-sm text-muted-foreground font-mono w-6">
            {dots}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${config.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
            style={{ 
              width: phase === 'analyzing' ? '25%' 
                   : phase === 'planning' ? '50%' 
                   : phase === 'writing' ? '75%' 
                   : '95%',
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

