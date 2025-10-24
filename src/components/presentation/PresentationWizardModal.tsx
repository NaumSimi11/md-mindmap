/**
 * PresentationWizardModal - Pre-generation settings
 * 
 * Allows users to configure:
 * - Number of slides (3-20)
 * - Theme selection
 * - Background options
 * - Speaker notes toggle
 * - API call estimation
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, AlertCircle, Crown, Zap } from 'lucide-react';
import { getGuestCredits } from '@/lib/guestCredits';

interface PresentationWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: GenerationSettings) => void;
  isGenerating?: boolean;
}

export interface GenerationSettings {
  slideCount: number;
  theme: string;
  background: 'gradient' | 'solid' | 'image';
  generateNotes: boolean;
}

const THEMES = [
  { id: 'modern', name: 'Modern', description: 'Purple gradient, clean' },
  { id: 'professional', name: 'Professional', description: 'Navy blue, corporate' },
  { id: 'minimal', name: 'Minimal', description: 'Black & white, simple' },
  { id: 'dark', name: 'Dark', description: 'Dark with gold accents' },
  { id: 'vibrant', name: 'Vibrant', description: 'Pink/purple, energetic' },
  { id: 'corporate', name: 'Corporate', description: 'Green, business' },
];

export function PresentationWizardModal({
  open,
  onOpenChange,
  onGenerate,
  isGenerating = false,
}: PresentationWizardModalProps) {
  const [slideCount, setSlideCount] = useState(6);
  const [theme, setTheme] = useState('modern');
  const [background, setBackground] = useState<'gradient' | 'solid' | 'image'>('gradient');
  const [generateNotes, setGenerateNotes] = useState(true);

  const { remaining, total } = getGuestCredits();

  // Calculate API calls
  const estimatedCalls = 1 + slideCount + (generateNotes ? slideCount : 0);
  const percentOfLimit = Math.round((estimatedCalls / 20) * 100);
  const isOverLimit = estimatedCalls > 20;
  const isNearLimit = estimatedCalls > 15;

  const handleGenerate = () => {
    if (isOverLimit) {
      alert('⚠️ Too many API calls! Please reduce slide count or disable speaker notes.');
      return;
    }

    onGenerate({
      slideCount,
      theme,
      background,
      generateNotes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Presentation
          </DialogTitle>
          <DialogDescription>
            Configure your presentation settings before generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Slide Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Number of Slides</Label>
              <span className="text-2xl font-bold text-primary">{slideCount}</span>
            </div>
            <Slider
              value={[slideCount]}
              onValueChange={(value) => setSlideCount(value[0])}
              min={3}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 slides</span>
              <span>20 slides</span>
            </div>
          </div>

          {/* API Call Estimation */}
          <div className={`rounded-lg p-4 border ${
            isOverLimit ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
            isNearLimit ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
            'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
          }`}>
            <div className="flex items-start gap-3">
              {isOverLimit ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">
                  Estimated: {estimatedCalls} API calls ({percentOfLimit}% of limit)
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOverLimit ? (
                    '❌ Exceeds rate limit! Reduce slides or disable notes.'
                  ) : isNearLimit ? (
                    '⚠️ Near rate limit. Generation may be slower.'
                  ) : (
                    `✅ Safe to generate. ${20 - estimatedCalls} calls remaining.`
                  )}
                </p>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span>Structure:</span>
                    <span className="font-mono">1 call</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Slides:</span>
                    <span className="font-mono">{slideCount} calls</span>
                  </div>
                  {generateNotes && (
                    <div className="flex justify-between">
                      <span>Speaker notes:</span>
                      <span className="font-mono">{slideCount} calls</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Background Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Background</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setBackground('gradient')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  background === 'gradient'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-full h-16 rounded bg-gradient-to-br from-purple-500 to-pink-500 mb-2" />
                <p className="text-sm font-medium">Gradient</p>
              </button>
              <button
                onClick={() => setBackground('solid')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  background === 'solid'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="w-full h-16 rounded bg-blue-600 mb-2" />
                <p className="text-sm font-medium">Solid Color</p>
              </button>
              <button
                onClick={() => setBackground('image')}
                className={`p-4 rounded-lg border-2 transition-all opacity-50 cursor-not-allowed ${
                  background === 'image'
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
                disabled
              >
                <div className="w-full h-16 rounded bg-gray-300 dark:bg-gray-700 mb-2 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-sm font-medium">AI Image</p>
                <p className="text-xs text-muted-foreground">Pro</p>
              </button>
            </div>
          </div>

          {/* Speaker Notes Toggle */}
          <div className="flex items-center space-x-3 p-4 rounded-lg border">
            <Checkbox
              id="speaker-notes"
              checked={generateNotes}
              onCheckedChange={(checked) => setGenerateNotes(!!checked)}
            />
            <div className="flex-1">
              <label
                htmlFor="speaker-notes"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Generate speaker notes
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Adds +{slideCount} API calls (recommended for presentations)
              </p>
            </div>
          </div>

          {/* API Key Status */}
          <div className="rounded-lg p-4 bg-muted">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">
                  🔑 Free Tier (20 calls/minute limit)
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {remaining}/{total} guest credits remaining
                </p>
                <p className="text-xs text-muted-foreground">
                  Want unlimited presentations? Upgrade to Pro for your own API key.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isOverLimit}
            className="gradient-primary text-white"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Presentation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

