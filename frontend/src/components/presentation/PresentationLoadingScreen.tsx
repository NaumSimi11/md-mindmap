/**
 * PresentationLoadingScreen - Full-screen beautiful loader
 * 
 * Features:
 * - Full-screen centered design
 * - Animated spinner with icon
 * - Real-time progress steps
 * - API call counter
 * - Smooth animations
 */

import { useEffect, useState } from 'react';
import { Presentation as PresentationIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ProgressUpdate } from '@/services/presentation/SafePresentationService';

interface PresentationLoadingScreenProps {
  progress: ProgressUpdate | null;
}

export function PresentationLoadingScreen({ progress }: PresentationLoadingScreenProps) {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (progress) {
      setCurrentProgress(progress.percentage);
    }
  }, [progress]);

  const steps = [
    { id: 'validate', label: 'Validating settings', done: false },
    { id: 'theme', label: 'Applying theme', done: false },
    { id: 'generate', label: 'Generating slides', done: false },
    { id: 'complete', label: 'Finalizing presentation', done: false },
  ];

  // Update step completion based on progress
  if (progress) {
    steps.forEach((step, index) => {
      step.done = index < progress.current;
    });
  }

  const currentStepIndex = progress?.current || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 max-w-md px-6">
        {/* Animated Spinner with Icon */}
        <div className="relative">
          {/* Rotating ring */}
          <div className="absolute inset-0 animate-spin">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
          
          {/* Center icon */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
            <PresentationIcon className="w-16 h-16 text-primary relative z-10" />
          </div>
        </div>

        {/* App Text Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-glow mb-2 flex items-center gap-2 justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            Collaboration
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">Powered by AI</p>
        </div>

        {/* Main Title */}
        <div className="text-center space-y-2 w-full">
          <h2 className="text-2xl font-bold">Generating Your Presentation</h2>
          <p className="text-muted-foreground">
            AI is analyzing your content and creating professional slides...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progress?.message || 'Preparing...'}
            </span>
            <span className="font-bold text-primary">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 w-full">
          {steps.map((step, index) => {
            const isComplete = step.done;
            const isCurrent = index === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 text-sm transition-all ${
                  isCurrent
                    ? 'text-primary font-medium'
                    : isComplete
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* API Usage Counter */}
        {progress && (
          <div className="w-full rounded-lg p-4 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                API Calls Used
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {progress.apiCallsUsed} / 20
              </span>
            </div>
            <Progress
              value={(progress.apiCallsUsed / 20) * 100}
              className="h-1"
            />
          </div>
        )}

        {/* Tip */}
        <div className="text-xs text-muted-foreground text-center italic">
          💡 This may take 30-60 seconds depending on slide count...
        </div>
      </div>
    </div>
  );
}

