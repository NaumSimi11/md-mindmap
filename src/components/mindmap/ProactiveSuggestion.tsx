/**
 * ProactiveSuggestion - Contextual AI suggestions that appear near nodes
 * Offers smart actions based on node state and structure
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, AlertCircle, GitBranch, Lightbulb } from "lucide-react";

export type SuggestionType = 
  | 'add-children'      // Node has no/few children
  | 'enhance'           // Node could use more detail
  | 'connect'           // Suggest connections
  | 'group'             // Too many siblings
  | 'fill-branch';      // Empty branch detected

export interface Suggestion {
  id: string;
  type: SuggestionType;
  nodeId: string;
  message: string;
  icon: 'sparkles' | 'plus' | 'alert' | 'branch' | 'lightbulb';
  action: () => void;
  priority: 'low' | 'medium' | 'high';
}

interface ProactiveSuggestionProps {
  suggestion: Suggestion;
  position: { x: number; y: number };
  onDismiss: (suggestionId: string) => void;
  onAccept: () => void;
}

export default function ProactiveSuggestion({
  suggestion,
  position,
  onDismiss,
  onAccept,
}: ProactiveSuggestionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Icon mapping
  const iconMap = {
    sparkles: <Sparkles className="h-4 w-4" />,
    plus: <Plus className="h-4 w-4" />,
    alert: <AlertCircle className="h-4 w-4" />,
    branch: <GitBranch className="h-4 w-4" />,
    lightbulb: <Lightbulb className="h-4 w-4" />,
  };

  // Color mapping based on priority
  const colorMap = {
    low: 'from-blue-500 to-cyan-600',
    medium: 'from-purple-500 to-indigo-600',
    high: 'from-orange-500 to-red-600',
  };

  return (
    <div
      className={`fixed z-[100] transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className={`bg-gradient-to-r ${colorMap[suggestion.priority]} p-3 rounded-lg shadow-2xl border-2 border-white max-w-xs`}>
        <div className="flex items-start gap-2 text-white">
          <div className="flex-shrink-0 mt-0.5">
            {iconMap[suggestion.icon]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">
              {suggestion.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1 bg-white text-gray-900 hover:bg-gray-100 text-xs font-semibold"
            onClick={() => {
              onAccept();
              suggestion.action();
            }}
          >
            Yes, do it! ✨
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 text-xs"
            onClick={() => onDismiss(suggestion.id)}
          >
            Dismiss
          </Button>
        </div>

        {/* Arrow pointing to node */}
        <div 
          className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid white',
          }}
        />
      </div>
    </div>
  );
}

