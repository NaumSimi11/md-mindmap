/**
 * PresentationProgressModal - Shows generation progress
 * 
 * Displays:
 * - Progress bar
 * - Current step
 * - API calls used
 * - Estimated time remaining
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { ProgressUpdate } from '@/services/presentation/SafePresentationService';

interface PresentationProgressModalProps {
  open: boolean;
  progress: ProgressUpdate | null;
  error: string | null;
}

export function PresentationProgressModal({
  open,
  progress,
  error,
}: PresentationProgressModalProps) {
  if (!progress && !error) return null;

  const steps = [
    { id: 'validate', label: 'Validating settings', icon: CheckCircle2 },
    { id: 'theme', label: 'Applying theme', icon: CheckCircle2 },
    { id: 'generate', label: 'Generating slides', icon: Loader2 },
    { id: 'complete', label: 'Complete!', icon: CheckCircle2 },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {error ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                Generation Failed
              </>
            ) : progress?.step === 'complete' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Presentation Generated!
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Generating Presentation...
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {error 
              ? 'Presentation generation failed' 
              : progress?.step === 'complete'
              ? 'Presentation generated successfully'
              : 'Generating your presentation, please wait'}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="py-6">
            <div className="rounded-lg p-4 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
            </div>
          </div>
        ) : progress ? (
          <div className="space-y-6 py-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                <span className="font-bold text-primary">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>

            {/* Steps Checklist */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isComplete = index < progress.current;
                const isCurrent = index === progress.current;
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-primary/10 border-2 border-primary'
                        : isComplete
                        ? 'bg-green-50 dark:bg-green-950/20'
                        : 'bg-muted/50'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isCurrent
                          ? 'text-primary'
                          : isComplete
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* API Usage */}
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  API Calls Used
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {progress.apiCallsUsed} / 20
                </span>
              </div>
              <Progress
                value={(progress.apiCallsUsed / 20) * 100}
                className="h-1 mt-2"
              />
            </div>

            {/* Tip */}
            {progress.step === 'generate' && (
              <div className="text-xs text-muted-foreground text-center italic">
                💡 This may take 30-60 seconds depending on slide count...
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

