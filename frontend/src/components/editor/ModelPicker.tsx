/**
 * Model Picker Component
 * Allows users to select AI model and enables auto-switching
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, ChevronDown, Sparkles } from 'lucide-react';
import AI_CONFIG from '@/config/aiConfig';

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  description: string;
  bestFor: string[];
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'gemini',
    description: 'Fast, cost-effective',
    bestFor: ['writing', 'quick edits', 'general tasks'],
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'gemini',
    description: 'Better reasoning, larger context',
    bestFor: ['complex reasoning', 'brainstorming', 'analysis'],
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Best for code, complex tasks',
    bestFor: ['code generation', 'complex tasks', 'technical writing'],
  },
  {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    description: 'Great for analysis',
    bestFor: ['analysis', 'long documents', 'research'],
  },
];

const TASK_TO_MODEL: Record<string, string> = {
  writing: 'gemini-flash',
  code: 'gpt-4',
  reasoning: 'gemini-pro',
  brainstorm: 'gemini-pro',
};

interface ModelPickerProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  autoSwitch: boolean;
  taskType?: 'writing' | 'code' | 'reasoning' | 'brainstorm';
}

export const ModelPicker: React.FC<ModelPickerProps> = ({
  currentModel,
  onModelChange,
  autoSwitch,
  taskType = 'writing',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];
  const recommendedModel = autoSwitch ? TASK_TO_MODEL[taskType] : currentModel;
  const shouldSwitch = autoSwitch && recommendedModel !== currentModel;

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

  const handleAutoSwitch = () => {
    if (autoSwitch && shouldSwitch) {
      onModelChange(recommendedModel);
    }
  };

  // Auto-switch when task type changes
  React.useEffect(() => {
    if (autoSwitch && shouldSwitch) {
      handleAutoSwitch();
    }
  }, [taskType, autoSwitch]);

  return (
    <div className="border-t border-border p-3 bg-muted/30">
      <div className="space-y-2">
        {/* Current Model */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Model:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  {currentModelInfo.name}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {shouldSwitch && (
                  <>
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="font-semibold">Recommended for {taskType}:</span>
                      </div>
                    </div>
                    {AVAILABLE_MODELS.filter((m) => m.id === recommendedModel).map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className="bg-primary/10"
                      >
                        <div>
                          <div className="font-semibold">{model.name}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {AVAILABLE_MODELS.map((model) => {
                  const isConfigured = AI_CONFIG.isProviderConfigured(model.provider);
                  return (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      disabled={!isConfigured}
                      className={model.id === currentModel ? 'bg-accent' : ''}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{model.name}</span>
                          {!isConfigured && (
                            <Badge variant="outline" className="text-xs">
                              Not configured
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Best for: {model.bestFor.join(', ')}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Auto-switch indicator */}
        {autoSwitch && shouldSwitch && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>Auto-switching to {AVAILABLE_MODELS.find((m) => m.id === recommendedModel)?.name} for {taskType}</span>
          </div>
        )}

        {autoSwitch && !shouldSwitch && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-green-500" />
            <span>Using optimal model for {taskType}</span>
          </div>
        )}
      </div>
    </div>
  );
};

