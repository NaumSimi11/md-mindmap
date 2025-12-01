/**
 * AI Preferences Panel
 * Let users set their preferences so AI can be more confident and less questioning
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Save, Sparkles } from 'lucide-react';

export interface AIPreferences {
  writingStyle: 'professional' | 'casual' | 'emotional' | 'technical' | 'creative';
  contextLevel: 'minimal' | 'moderate' | 'detailed';
  confidenceLevel: 'conservative' | 'balanced' | 'confident';
  suggestionFrequency: 'ask-first' | 'suggest-when-confident' | 'always-suggest';
  tone: 'friendly' | 'formal' | 'enthusiastic' | 'neutral';
}

export const DEFAULT_PREFERENCES: AIPreferences = {
  writingStyle: 'professional',
  contextLevel: 'moderate',
  confidenceLevel: 'balanced',
  suggestionFrequency: 'suggest-when-confident',
  tone: 'friendly',
};

interface AIPreferencesPanelProps {
  preferences: AIPreferences;
  onPreferencesChange: (prefs: AIPreferences) => void;
  onClose: () => void;
}

export const AIPreferencesPanel: React.FC<AIPreferencesPanelProps> = ({
  preferences,
  onPreferencesChange,
  onClose,
}) => {
  const [localPrefs, setLocalPrefs] = useState<AIPreferences>(preferences);

  const handleSave = () => {
    onPreferencesChange(localPrefs);
    onClose();
  };

  return (
    <div className="border-b border-border p-4 bg-muted/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">AI Preferences</h4>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Writing Style */}
        <div className="space-y-2">
          <Label htmlFor="writing-style" className="text-sm font-semibold">
            Writing Style
          </Label>
          <Select
            value={localPrefs.writingStyle}
            onValueChange={(value: AIPreferences['writingStyle']) =>
              setLocalPrefs({ ...localPrefs, writingStyle: value })
            }
          >
            <SelectTrigger id="writing-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="emotional">Emotional & Engaging</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How should AI write? Professional, casual, emotional, etc.
          </p>
        </div>

        {/* Context Level */}
        <div className="space-y-2">
          <Label htmlFor="context-level" className="text-sm font-semibold">
            Context Detail
          </Label>
          <Select
            value={localPrefs.contextLevel}
            onValueChange={(value: AIPreferences['contextLevel']) =>
              setLocalPrefs({ ...localPrefs, contextLevel: value })
            }
          >
            <SelectTrigger id="context-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal (just the essentials)</SelectItem>
              <SelectItem value="moderate">Moderate (balanced)</SelectItem>
              <SelectItem value="detailed">Detailed (comprehensive context)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How much context should AI consider?
          </p>
        </div>

        {/* Confidence Level */}
        <div className="space-y-2">
          <Label htmlFor="confidence-level" className="text-sm font-semibold">
            AI Confidence
          </Label>
          <Select
            value={localPrefs.confidenceLevel}
            onValueChange={(value: AIPreferences['confidenceLevel']) =>
              setLocalPrefs({ ...localPrefs, confidenceLevel: value })
            }
          >
            <SelectTrigger id="confidence-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative (ask more questions)</SelectItem>
              <SelectItem value="balanced">Balanced (ask when unsure)</SelectItem>
              <SelectItem value="confident">Confident (make decisions, act fast)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How confident should AI be before making changes?
          </p>
        </div>

        {/* Suggestion Frequency */}
        <div className="space-y-2">
          <Label htmlFor="suggestion-frequency" className="text-sm font-semibold">
            Suggestion Behavior
          </Label>
          <Select
            value={localPrefs.suggestionFrequency}
            onValueChange={(value: AIPreferences['suggestionFrequency']) =>
              setLocalPrefs({ ...localPrefs, suggestionFrequency: value })
            }
          >
            <SelectTrigger id="suggestion-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ask-first">Ask First (more questions)</SelectItem>
              <SelectItem value="suggest-when-confident">Suggest When Confident</SelectItem>
              <SelectItem value="always-suggest">Always Suggest (act fast)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            When should AI make suggestions vs. ask questions?
          </p>
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-semibold">
            Communication Tone
          </Label>
          <Select
            value={localPrefs.tone}
            onValueChange={(value: AIPreferences['tone']) =>
              setLocalPrefs({ ...localPrefs, tone: value })
            }
          >
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly & Warm</SelectItem>
              <SelectItem value="formal">Formal & Professional</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
              <SelectItem value="neutral">Neutral & Direct</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How should AI communicate with you?
          </p>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1" size="sm">
            <Save className="h-3 w-3 mr-1" />
            Save Preferences
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocalPrefs(DEFAULT_PREFERENCES)}
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

