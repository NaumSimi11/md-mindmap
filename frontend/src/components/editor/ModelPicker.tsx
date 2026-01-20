/**
 * Model Picker Component
 * Allows users to select AI model and enables auto-switching
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Zap, ChevronDown, Sparkles } from 'lucide-react';
import AI_CONFIG from '@/config/aiConfig';

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  description: string;
  bestFor: string[];
  contextWindow?: number;
  costPerToken?: string;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  // Gemini Models
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'Fast, efficient, 1M context',
    bestFor: ['writing', 'quick edits', 'general tasks'],
    contextWindow: 1000000,
    costPerToken: 'Free tier available',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Advanced reasoning, 1M context',
    bestFor: ['complex reasoning', 'brainstorming', 'analysis'],
    contextWindow: 1000000,
    costPerToken: 'Low cost',
  },
  // OpenAI Models
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Most capable, 8K context',
    bestFor: ['code generation', 'complex tasks', 'technical writing'],
    contextWindow: 8192,
    costPerToken: '$0.03/1K tokens',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Fast, cost-effective, 128K context',
    bestFor: ['long documents', 'research', 'analysis'],
    contextWindow: 128000,
    costPerToken: '$0.01/1K tokens',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and affordable',
    bestFor: ['quick tasks', 'simple edits', 'general use'],
    contextWindow: 4096,
    costPerToken: '$0.002/1K tokens',
  },
  // Anthropic Models
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Most capable, 200K context',
    bestFor: ['analysis', 'creative writing', 'complex tasks'],
    contextWindow: 200000,
    costPerToken: '$0.015/1K tokens',
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    description: 'Balanced performance, 200K context',
    bestFor: ['general tasks', 'coding', 'analysis'],
    contextWindow: 200000,
    costPerToken: '$0.003/1K tokens',
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fast and efficient',
    bestFor: ['quick responses', 'simple tasks'],
    contextWindow: 200000,
    costPerToken: '$0.00025/1K tokens',
  },
  // OpenRouter Models (popular ones with correct IDs)
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo (OR)',
    provider: 'openrouter',
    description: 'Via OpenRouter - fast & affordable',
    bestFor: ['quick tasks', 'general use'],
    contextWindow: 16385,
    costPerToken: '$0.0005/1K',
  },
  {
    id: 'openai/gpt-4-turbo-preview',
    name: 'GPT-4 Turbo (OR)',
    provider: 'openrouter',
    description: 'Via OpenRouter - powerful',
    bestFor: ['complex tasks', 'coding'],
    contextWindow: 128000,
    costPerToken: '$0.01/1K',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku (OR)',
    provider: 'openrouter',
    description: 'Via OpenRouter - fast & cheap',
    bestFor: ['quick responses', 'simple tasks'],
    contextWindow: 200000,
    costPerToken: '$0.00025/1K',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet (OR)',
    provider: 'openrouter',
    description: 'Via OpenRouter - balanced',
    bestFor: ['general tasks', 'coding'],
    contextWindow: 200000,
    costPerToken: '$0.003/1K',
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro (OR)',
    provider: 'openrouter',
    description: 'Via OpenRouter - Google model',
    bestFor: ['reasoning', 'analysis'],
    contextWindow: 32000,
    costPerToken: '$0.000125/1K',
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B (OR)',
    provider: 'openrouter',
    description: 'Via OpenRouter - open source',
    bestFor: ['general tasks', 'creative'],
    contextWindow: 8192,
    costPerToken: '$0.0008/1K',
  },
];

interface ModelPickerProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  autoSwitch?: boolean;
  taskType?: string;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({
  currentModel,
  onModelChange,
}) => {
  // Find current model info, fallback to first configured model or first available
  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === currentModel) || 
    AVAILABLE_MODELS.find((m) => AI_CONFIG.isProviderConfigured(m.provider)) ||
    AVAILABLE_MODELS[0];

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

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
              <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Only show models for configured providers */}
                {(() => {
                  const configuredModels = AVAILABLE_MODELS.filter((model) =>
                    AI_CONFIG.isProviderConfigured(model.provider)
                  );

                  if (configuredModels.length === 0) {
                    return (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        <p className="font-medium">No API keys configured</p>
                        <p className="text-xs mt-1">Add your API keys in the settings to enable models.</p>
                      </div>
                    );
                  }

                  // Group models by provider
                  const groupedModels = configuredModels.reduce((acc, model) => {
                    if (!acc[model.provider]) acc[model.provider] = [];
                    acc[model.provider].push(model);
                    return acc;
                  }, {} as Record<string, typeof configuredModels>);

                  return Object.entries(groupedModels).map(([provider, models]) => (
                    <div key={provider}>
                      <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-normal px-2 py-1">
                        {provider === 'openai' ? 'OpenAI' :
                         provider === 'anthropic' ? 'Anthropic' :
                         provider === 'gemini' ? 'Google Gemini' :
                         provider === 'openrouter' ? 'OpenRouter' : provider}
                      </DropdownMenuLabel>
                      {models.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => handleModelSelect(model.id)}
                          className={`cursor-pointer ${model.id === currentModel ? 'bg-accent' : ''}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{model.name}</span>
                              {model.contextWindow && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {model.contextWindow >= 1000000 ? '1M' :
                                   model.contextWindow >= 100000 ? `${Math.round(model.contextWindow/1000)}K` :
                                   `${Math.round(model.contextWindow/1000)}K`}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  ));
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status indicator */}
        {(() => {
          const configuredCount = AVAILABLE_MODELS.filter((m) => 
            AI_CONFIG.isProviderConfigured(m.provider)
          ).length;
          
          if (configuredCount === 0) {
            return (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Zap className="h-3 w-3" />
                <span>Configure API keys to use AI models</span>
              </div>
            );
          }
          
          return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-green-500" />
              <span>{configuredCount} model{configuredCount !== 1 ? 's' : ''} available</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

