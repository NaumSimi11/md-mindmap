/**
 * Inline Suggestion Component
 * Shows diff-style suggestions in the document
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, MessageSquare } from 'lucide-react';

export interface InlineSuggestion {
  id: string;
  section: string;
  oldText: string;
  newText: string;
  position: { from: number; to: number };
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'accepted' | 'declined';
}

interface InlineSuggestionProps {
  suggestion: InlineSuggestion;
  onAccept: (suggestion: InlineSuggestion) => void;
  onDecline: (suggestion: InlineSuggestion) => void;
  compact?: boolean;
}

export const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
  suggestion,
  onAccept,
  onDecline,
  compact = false,
}) => {
  const getConfidenceColor = () => {
    switch (suggestion.confidence) {
      case 'high':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'low':
        return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-background border border-border rounded text-xs">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{suggestion.section}</div>
          <div className="text-muted-foreground truncate">
            {suggestion.oldText.substring(0, 30)}...
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onAccept(suggestion)}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onDecline(suggestion)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${getConfidenceColor()}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {suggestion.section}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {suggestion.confidence} confidence
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-1">OLD:</div>
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 line-through text-muted-foreground">
            {suggestion.oldText}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-1">NEW:</div>
          <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
            {suggestion.newText}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={() => onAccept(suggestion)}
          className="flex-1"
        >
          <Check className="h-3 w-3 mr-1" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDecline(suggestion)}
          className="flex-1"
        >
          <X className="h-3 w-3 mr-1" />
          Decline
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            // TODO: Open chat to refine
          }}
        >
          <MessageSquare className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

