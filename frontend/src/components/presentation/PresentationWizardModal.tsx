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

import { useState, useEffect } from 'react';
import { unsplashService } from '@/services/media/UnsplashService';
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
import { Sparkles, AlertCircle, Crown, Zap, Palette } from 'lucide-react';
import { getGuestCredits } from '@/lib/guestCredits';
import { getAllBeautifulThemes, getBeautifulTheme } from '@/services/presentation/BeautifulThemes';
import type { BeautifulTheme } from '@/services/presentation/BeautifulThemeSystem';

interface PresentationWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: GenerationSettings) => void;
  isGenerating?: boolean;
}

export interface GenerationSettings {
  slideCount: number;
  theme: string; // Beautiful theme ID
  background: 'gradient' | 'solid' | 'image';
  generateNotes: boolean;
}

// Get beautiful themes
const BEAUTIFUL_THEMES = getAllBeautifulThemes();

export function PresentationWizardModal({
  open,
  onOpenChange,
  onGenerate,
  isGenerating = false,
}: PresentationWizardModalProps) {
  const [slideCount, setSlideCount] = useState(6);
  const [theme, setTheme] = useState(BEAUTIFUL_THEMES[0]?.id || 'night-sky');
  const [background, setBackground] = useState<'gradient' | 'solid' | 'image'>('gradient');
  const [generateNotes, setGenerateNotes] = useState(true);
  const [themePreviewImages, setThemePreviewImages] = useState<Record<string, string>>({});
  
  const selectedTheme = getBeautifulTheme(theme);
  
  // Load theme preview images
  useEffect(() => {
    if (open) {
      loadThemePreviewImages();
    }
  }, [open]);
  
  const loadThemePreviewImages = async () => {
    const previews: Record<string, string> = {};
    
    // Load one image per theme for preview
    for (const themeObj of BEAUTIFUL_THEMES.slice(0, 6)) { // Limit to avoid too many requests
      try {
        const images = await unsplashService.getThemedImages(themeObj.id);
        if (images.length > 0) {
          previews[themeObj.id] = images[0].thumbnail;
        }
      } catch (error) {
        console.error(`Error loading preview for ${themeObj.id}:`, error);
      }
    }
    
    setThemePreviewImages(previews);
  };

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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Presentation
          </DialogTitle>
          <DialogDescription>
            Configure your presentation settings before generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
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

          {/* Beautiful Theme Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Choose a Template
            </Label>
            
            {/* Theme Preview Cards - Gamma-style grid */}
            <div className="grid grid-cols-3 gap-4">
              {BEAUTIFUL_THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`group relative rounded-xl border-2 transition-all text-left overflow-hidden ${
                      isSelected
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : undefined,
                    }}
                  >
                    {/* Template Preview Card */}
                    <div
                      className="w-full aspect-[16/10] rounded-t-lg relative overflow-hidden"
                      style={{
                        background: t.colors.background.default,
                        boxShadow: isSelected ? t.visual.shadows.lg : t.visual.shadows.sm,
                      }}
                    >
                      {/* Background image if loaded */}
                      {themePreviewImages[t.id] && (
                        <img
                          src={themePreviewImages[t.id]}
                          alt={t.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                      )}
                      
                      {/* Decorative gradient overlay */}
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: t.colors.gradients.primary,
                        }}
                      />
                      
                      {/* Sample content preview */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                        {/* Title preview */}
                        <div
                          className="text-sm font-bold drop-shadow-lg"
                          style={{
                            color: t.colors.text.primary,
                            fontSize: '0.875rem',
                            lineHeight: '1.2',
                          }}
                        >
                          Title
                        </div>
                        
                        {/* Body preview */}
                        <div
                          className="text-xs opacity-80 drop-shadow-lg"
                          style={{
                            color: t.colors.text.secondary,
                            fontSize: '0.75rem',
                            lineHeight: '1.4',
                          }}
                        >
                          Body & <span style={{ color: t.colors.primary.main, textDecoration: 'underline' }}>link</span>
                        </div>
                      </div>
                      
                      {/* Glow effect for dark themes */}
                      {(t.id === 'alien' || t.id === 'velvet-tides' || t.id === 'aurora' || t.id === 'night-sky') && (
                        <div
                          className="absolute right-0 top-0 w-1/3 h-full opacity-40"
                          style={{
                            background: `radial-gradient(circle, ${t.colors.primary.main} 0%, transparent 70%)`,
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Template Name */}
                    <div className="p-3 bg-background">
                      <p className="text-sm font-semibold text-center">{t.name}</p>
                    </div>
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Selected Theme Details */}
            {selectedTheme && (
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded flex-shrink-0"
                    style={{
                      background: selectedTheme.colors.background.default,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selectedTheme.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTheme.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: selectedTheme.colors.primary.main }}
                        />
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: selectedTheme.colors.secondary.main }}
                        />
                        <span className="text-xs text-muted-foreground">Secondary</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
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

