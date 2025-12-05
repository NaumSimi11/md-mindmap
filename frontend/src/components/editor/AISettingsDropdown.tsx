/**
 * AI Settings Dropdown
 * Unified control for AI features with clear descriptions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Zap, ChevronDown, Info } from 'lucide-react';

interface AISettingsDropdownProps {
  aiAutocompleteEnabled: boolean;
  onAIAutocompleteChange: (enabled: boolean) => void;
  aiHintsEnabled: boolean;
  onAIHintsChange: (enabled: boolean) => void;
}

export const AISettingsDropdown: React.FC<AISettingsDropdownProps> = ({
  aiAutocompleteEnabled,
  onAIAutocompleteChange,
  aiHintsEnabled,
  onAIHintsChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className={`gap-1 ${(aiAutocompleteEnabled || aiHintsEnabled) ? 'gradient-border' : ''}`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-xs">AI</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel className="text-xs flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          AI Writing Assistance
        </DropdownMenuLabel>
        
        <div className="px-2 py-3 space-y-4">
          {/* AI Autocomplete */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Autocomplete</span>
              </div>
              <Switch
                checked={aiAutocompleteEnabled}
                onCheckedChange={onAIAutocompleteChange}
              />
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Smart inline suggestions for headings, lists, and sentence completions.
              <br />
              <span className="text-primary">→ Appears as you type (30+ chars)</span>
            </p>
            <div className="flex items-start gap-1 pl-6 text-xs text-muted-foreground/80">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Tab</kbd> to accept</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* AI Hints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI Hints</span>
              </div>
              <Switch
                checked={aiHintsEnabled}
                onCheckedChange={onAIHintsChange}
              />
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Contextual phrase continuations as ghosted text.
              <br />
              <span className="text-purple-500">→ Appears after 800ms pause</span>
            </p>
            <div className="flex items-start gap-1 pl-6 text-xs text-muted-foreground/80">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Tab</kbd> to accept, <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to dismiss</span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-2">
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Use <strong>AI Autocomplete</strong> for structured content (headings, lists).
              Use <strong>AI Hints</strong> for natural writing flow.
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

