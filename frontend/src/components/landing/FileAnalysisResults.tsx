import { useState } from 'react';
import { ArrowRight, Sparkles, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisInsights } from '@/services/landing/MDFileAnalyzerService';
import type { FileAnalysisResult } from './MDFileDropZone';

interface FileAnalysisResultsProps {
  fileAnalysis: FileAnalysisResult;
  insights: AnalysisInsights;
  onActionSelect: (actionId: string) => void;
  guestCredits?: number;
}

export function FileAnalysisResults({
  fileAnalysis,
  insights,
  onActionSelect,
  guestCredits = 3,
}: FileAnalysisResultsProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const { fileName } = fileAnalysis;
  const { summary, suggestions, complexity, bestSuggestion } = insights;

  const complexityColors = {
    simple: 'text-green-400',
    medium: 'text-yellow-400',
    complex: 'text-orange-400',
  };

  const complexityLabels = {
    simple: 'Simple structure',
    medium: 'Moderate complexity',
    complex: 'Rich content',
  };

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);
    onActionSelect(actionId);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* File Info Header */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">
                  {fileName}
                </h3>
                <p className="text-sm text-slate-300">
                  {summary}
                </p>
              </div>
            </div>
          </div>
          
          {/* Complexity Badge */}
          <div className="flex-shrink-0">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              'bg-slate-700/50 border',
              complexity === 'simple' && 'border-green-500/30',
              complexity === 'medium' && 'border-yellow-500/30',
              complexity === 'complex' && 'border-orange-500/30'
            )}>
              <span className={complexityColors[complexity]}>●</span>
              <span className="text-slate-200">{complexityLabels[complexity]}</span>
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Free credits remaining
            </span>
            <span className="text-sm font-medium text-cyan-400">
              {guestCredits} / 3
            </span>
          </div>
        </div>
      </div>

      {/* Main Section Title */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          What would you like to do?
        </h3>
        <p className="text-sm text-slate-400">
          Choose an action below to transform your markdown
        </p>
      </div>

      {/* Best Suggestion (Featured) */}
      <div className="relative">
        <div className="absolute -top-3 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg">
            <Crown className="h-3 w-3" />
            Recommended
          </span>
        </div>
        
        <button
          onClick={() => handleActionClick(bestSuggestion.id)}
          disabled={selectedAction !== null}
          className={cn(
            'w-full text-left',
            'bg-gradient-to-br from-cyan-500/10 to-indigo-600/10',
            'border-2 rounded-xl p-6',
            'transition-all duration-300 ease-out',
            'group',
            selectedAction === bestSuggestion.id
              ? 'border-cyan-500 scale-[1.02] shadow-xl shadow-cyan-500/20'
              : 'border-cyan-500/30 hover:border-cyan-500/50 hover:scale-[1.01] hover:shadow-lg',
            selectedAction !== null && selectedAction !== bestSuggestion.id && 'opacity-50'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="text-4xl flex-shrink-0">
                {bestSuggestion.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-1">
                  {bestSuggestion.title}
                </h4>
                <p className="text-sm text-slate-300 mb-3">
                  {bestSuggestion.description}
                </p>
                
                {/* Stats */}
                {(bestSuggestion.estimatedSlides || bestSuggestion.estimatedNodes) && (
                  <div className="flex items-center gap-4 text-xs text-cyan-400">
                    {bestSuggestion.estimatedSlides && (
                      <span>~{bestSuggestion.estimatedSlides} slides</span>
                    )}
                    {bestSuggestion.estimatedNodes && (
                      <span>~{bestSuggestion.estimatedNodes} nodes</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {selectedAction === bestSuggestion.id ? (
                <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                  <ArrowRight className="h-5 w-5 text-cyan-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Other Suggestions */}
      {suggestions.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400 px-1">
            Other options
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.slice(1).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleActionClick(suggestion.id)}
                disabled={selectedAction !== null}
                className={cn(
                  'text-left',
                  'bg-slate-800/40 backdrop-blur-xl',
                  'border rounded-lg p-4',
                  'transition-all duration-200',
                  'group',
                  selectedAction === suggestion.id
                    ? 'border-cyan-500 bg-slate-800/60 scale-[1.02]'
                    : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60',
                  selectedAction !== null && selectedAction !== suggestion.id && 'opacity-50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {suggestion.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold text-white mb-1">
                      {suggestion.title}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {suggestion.description}
                    </p>
                  </div>

                  {/* Check Icon */}
                  {selectedAction === suggestion.id && (
                    <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA Hint */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-400">
          ✨ All transformations use <span className="text-cyan-400">AI</span> • Takes ~5 seconds
        </p>
      </div>
    </div>
  );
}

