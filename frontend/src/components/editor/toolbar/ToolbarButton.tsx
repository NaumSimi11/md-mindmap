import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ToolbarAction } from '@/hooks/useEditorToolbar';
import { cn } from '@/lib/utils';

interface ToolbarButtonProps {
  action: ToolbarAction;
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  action, 
  size = 'sm',
  showLabel = false,
}) => {
  const Icon = action.icon;
  
  const button = (
    <Button
      variant={action.isActive ? 'default' : 'ghost'}
      size={size}
      onClick={action.action}
      disabled={action.isDisabled}
      className={cn(
        'gap-1',
        action.isActive && 'bg-primary text-primary-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span className="text-xs">{action.label}</span>}
    </Button>
  );

  if (action.shortcut) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">
              {action.label} <span className="text-muted-foreground">({action.shortcut})</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

