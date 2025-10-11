/**
 * MindmapLoadingScreen - Fancy loading screen with MD Reader logo
 * Shows while AI generates mindmap from document content
 */

import { useState, useEffect } from 'react';
import { Network, Sparkles, Zap } from 'lucide-react';

interface MindmapLoadingScreenProps {
  type: 'mindmap' | 'flowchart' | 'orgchart';
  progress?: number;
}

export function MindmapLoadingScreen({ type, progress = 0 }: MindmapLoadingScreenProps) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Analyzing your content...');

  const typeLabels = {
    mindmap: 'Mindmap',
    flowchart: 'Flowchart',
    orgchart: 'Organization Chart',
  };

  const loadingSteps = [
    'Analyzing your content...',
    'Extracting key concepts...',
    'Building connections...',
    `Creating your ${typeLabels[type].toLowerCase()}...`,
    'Almost there...',
  ];

  useEffect(() => {
    // Simulate progress if not provided
    if (progress === 0) {
      const interval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= 90) return prev; // Stop at 90% until actual completion
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setCurrentProgress(progress);
    }
  }, [progress]);

  useEffect(() => {
    // Update loading text based on progress
    const stepIndex = Math.floor((currentProgress / 100) * loadingSteps.length);
    setLoadingText(loadingSteps[Math.min(stepIndex, loadingSteps.length - 1)]);
  }, [currentProgress, loadingSteps, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 max-w-md px-6">
        {/* Animated Logo */}
        <div className="relative">
          {/* Rotating rings */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
          <div className="absolute inset-0 animate-spin-reverse" style={{ animationDuration: '3s' }}>
            <div className="w-32 h-32 rounded-full border-4 border-primary/10 border-b-primary/50" />
          </div>
          
          {/* Center icon */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
            <Network className="w-16 h-16 text-primary relative z-10 animate-pulse" />
          </div>
        </div>

        {/* MD Reader Text Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-glow mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            MD Creator
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">Powered by AI</p>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3 w-full">
          <p className="text-lg font-medium flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-primary animate-bounce" />
            {loadingText}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Progress Percentage */}
          <p className="text-sm text-muted-foreground">
            {Math.round(currentProgress)}%
          </p>
        </div>

        {/* Generating Type Label */}
        <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-primary">
            Generating {typeLabels[type]}
          </span>
        </div>

        {/* Fun fact */}
        <p className="text-xs text-muted-foreground text-center italic">
          💡 Tip: You can edit any node in the generated diagram!
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        .text-glow {
          text-shadow: 0 0 20px rgba(var(--primary), 0.3);
        }
      `}</style>
    </div>
  );
}

