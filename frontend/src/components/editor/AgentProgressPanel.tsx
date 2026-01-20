/**
 * AgentProgressPanel - UI for showing agent execution progress
 * 
 * Features:
 * - Shows current agent and status
 * - Progress bar with percentage
 * - Step-by-step progress list
 * - Plan preview
 * - Cancel/pause controls
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  FileText,
  Folder,
  Check,
  X,
  Loader2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';
import { AgentProgress, AgentStep, AgentType } from '@/services/ai/AgentService';
import { Plan } from '@/services/ai/AgentTools';
import { cn } from '@/lib/utils';

interface AgentProgressPanelProps {
  progress: AgentProgress;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onExecutePlan?: (planId: string) => void;
  isPaused?: boolean;
  className?: string;
}

const AGENT_LABELS: Record<AgentType, { label: string; icon: React.ReactNode; color: string }> = {
  planner: { label: 'Planner', icon: <FileText className="w-4 h-4" />, color: 'text-blue-500' },
  writer: { label: 'Writer', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-500' },
  organizer: { label: 'Organizer', icon: <Folder className="w-4 h-4" />, color: 'text-green-500' },
};

const STATUS_COLORS: Record<AgentProgress['status'], string> = {
  idle: 'bg-gray-500',
  planning: 'bg-blue-500',
  executing: 'bg-purple-500',
  complete: 'bg-green-500',
  error: 'bg-red-500',
};

/**
 * Step item component
 */
const StepItem: React.FC<{ step: AgentStep }> = ({ step }) => {
  const getIcon = () => {
    switch (step.status) {
      case 'done':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={cn(
      'flex items-start gap-2 py-1.5',
      step.status === 'in-progress' && 'bg-blue-50 dark:bg-blue-950/20 -mx-2 px-2 rounded',
      step.status === 'failed' && 'bg-red-50 dark:bg-red-950/20 -mx-2 px-2 rounded'
    )}>
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          step.status === 'done' && 'text-muted-foreground line-through',
          step.status === 'failed' && 'text-red-600 dark:text-red-400'
        )}>
          {step.description}
        </p>
        {step.error && (
          <p className="text-xs text-red-500 mt-0.5">{step.error}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Plan preview component
 */
const PlanPreview: React.FC<{ 
  plan: Plan; 
  onExecute?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ plan, onExecute, isExpanded, onToggle }) => {
  const folders = plan.items.filter(i => i.type === 'folder');
  const documents = plan.items.filter(i => i.type === 'document');

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{plan.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {folders.length} folders, {documents.length} docs
          </Badge>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Structure preview */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">Structure</p>
            <div className="space-y-0.5 text-sm">
              {plan.items.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {item.type === 'folder' ? (
                    <Folder className="w-3.5 h-3.5 text-yellow-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
              {plan.items.length > 10 && (
                <p className="text-xs text-muted-foreground pl-5">
                  ... and {plan.items.length - 10} more
                </p>
              )}
            </div>
          </div>

          {/* Tasks preview */}
          {plan.tasks.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Tasks</p>
              <div className="space-y-0.5 text-sm">
                {plan.tasks.slice(0, 5).map((task, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      checked={task.status === 'done'} 
                      readOnly 
                      className="w-3.5 h-3.5"
                    />
                    <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execute button */}
          {onExecute && plan.status === 'draft' && (
            <Button onClick={onExecute} className="w-full" size="sm">
              <Play className="w-3.5 h-3.5 mr-1" />
              Execute Plan
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const AgentProgressPanel: React.FC<AgentProgressPanelProps> = ({
  progress,
  onCancel,
  onPause,
  onResume,
  onExecutePlan,
  isPaused = false,
  className,
}) => {
  const [planExpanded, setPlanExpanded] = React.useState(true);
  const agentInfo = AGENT_LABELS[progress.agent];

  // Don't show if idle with no steps
  if (progress.status === 'idle' && progress.steps.length === 0 && !progress.plan) {
    return null;
  }

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-full bg-primary/10', agentInfo.color)}>
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{agentInfo.label} Agent</span>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs capitalize',
                  progress.status === 'complete' && 'border-green-500 text-green-600',
                  progress.status === 'error' && 'border-red-500 text-red-600',
                  progress.status === 'executing' && 'border-blue-500 text-blue-600'
                )}
              >
                {progress.status}
              </Badge>
            </div>
            {progress.currentStep && (
              <p className="text-xs text-muted-foreground">{progress.currentStep}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {progress.status === 'executing' && (
            <>
              {isPaused ? (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onResume}>
                  <Play className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPause}>
                  <Pause className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
          {(progress.status === 'planning' || progress.status === 'executing') && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-red-500 hover:text-red-600"
              onClick={onCancel}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress.status !== 'idle' && (
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-1.5" />
        </div>
      )}

      {/* Steps */}
      {progress.steps.length > 0 && (
        <ScrollArea className="max-h-48">
          <div className="p-3 pt-0 space-y-0.5">
            {progress.steps.map((step) => (
              <StepItem key={step.id} step={step} />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Plan preview */}
      {progress.plan && (
        <div className="p-3 pt-0">
          <PlanPreview
            plan={progress.plan}
            onExecute={onExecutePlan ? () => onExecutePlan(progress.plan!.id) : undefined}
            isExpanded={planExpanded}
            onToggle={() => setPlanExpanded(!planExpanded)}
          />
        </div>
      )}

      {/* Error message */}
      {progress.error && (
        <div className="px-3 pb-3">
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{progress.error}</p>
          </div>
        </div>
      )}

      {/* Complete message */}
      {progress.status === 'complete' && !progress.error && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            <p>Agent completed successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProgressPanel;
