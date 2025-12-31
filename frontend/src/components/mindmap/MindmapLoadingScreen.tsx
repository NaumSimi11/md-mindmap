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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/20 backdrop-blur-xl">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-8 max-w-md px-6">
        {/* Animated Logo */}
        <div className="relative">
          {/* Rotating rings */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="w-32 h-32 rounded-full border-4 border-orange-300/30 dark:border-orange-500/30 border-t-orange-500 dark:border-t-orange-400" />
          </div>
          <div className="absolute inset-0 animate-spin-reverse" style={{ animationDuration: '3s' }}>
            <div className="w-32 h-32 rounded-full border-4 border-amber-200/20 dark:border-amber-500/20 border-b-amber-500/60 dark:border-b-amber-400/60" />
          </div>
          
          {/* Center icon */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 animate-pulse" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
              <Network className="w-10 h-10 text-white relative z-10" />
            </div>
          </div>
        </div>

        {/* App Text Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
            Mindmap Studio
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Powered by AI</p>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-4 w-full">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-orange-500 animate-bounce" />
            {loadingText}
          </p>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out rounded-full shadow-lg shadow-orange-500/30"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Progress Percentage */}
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {Math.round(currentProgress)}%
          </p>
        </div>

        {/* Generating Type Label */}
        <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300/40 dark:border-orange-500/30 shadow-sm">
          <span className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Generating {typeLabels[type]}
          </span>
        </div>

        {/* Fun fact */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
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
      `}</style>
    </div>
  );
}

