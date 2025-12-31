/**
 * ToolbarSettings - Component for configuring toolbar preferences
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  RotateCcw,
  Monitor,
  Sidebar,
  MousePointer,
  Minimize,
} from 'lucide-react';
import type { ToolbarStyle, ToolbarConfig } from './UnifiedToolbar';

interface ToolbarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: ToolbarConfig;
  onConfigChange: (config: ToolbarConfig) => void;
  onResetToDefaults: () => void;
}

const styleOptions: { value: ToolbarStyle; label: string; description: string; icon: React.ComponentType }[] = [
  {
    value: 'fixed-top',
    label: 'Fixed Top',
    description: 'Always visible toolbar at the top of the editor',
    icon: Monitor,
  },
  {
    value: 'floating-side',
    label: 'Floating Side',
    description: 'Compact toolbar on the right side of the screen',
    icon: Sidebar,
  },
  {
    value: 'floating-selection',
    label: 'Selection Only',
    description: 'Toolbar appears only when text is selected',
    icon: MousePointer,
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'Minimal toolbar at the bottom of the screen',
    icon: Minimize,
  },
];

const featureOptions: { key: keyof Omit<ToolbarConfig, 'style'>; label: string; description: string }[] = [
  { key: 'showFormat', label: 'Text Formatting', description: 'Bold, italic, underline, etc.' },
  { key: 'showHeadings', label: 'Headings', description: 'H1, H2, H3 formatting' },
  { key: 'showLists', label: 'Lists', description: 'Bullet lists, numbered lists, tasks' },
  { key: 'showInsert', label: 'Insert Tools', description: 'Links, images, tables, etc.' },
  { key: 'showAI', label: 'AI Features', description: 'AI assistant and smart formatting' },
  { key: 'showComments', label: 'Comments', description: 'Comment system integration' },
  { key: 'showSave', label: 'Save Options', description: 'Save and export buttons' },
  { key: 'showShare', label: 'Share Tools', description: 'Sharing and collaboration features' },
  { key: 'showTools', label: 'Additional Tools', description: 'Keyboard shortcuts, settings, etc.' },
];

export const ToolbarSettings: React.FC<ToolbarSettingsProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  onResetToDefaults,
}) => {
  const handleStyleChange = (style: ToolbarStyle) => {
    onConfigChange({ ...config, style });
  };

  const handleFeatureToggle = (feature: keyof Omit<ToolbarConfig, 'style'>) => {
    onConfigChange({
      ...config,
      [feature]: !config[feature],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Toolbar Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Toolbar Style Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Toolbar Style</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how your toolbar appears in the editor
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {styleOptions.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleStyleChange(value)}
                  className={`
                    p-4 rounded-lg border text-left transition-all
                    ${config.style === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      config.style === value ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Feature Visibility */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Visible Features</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which features appear in your toolbar
            </p>

            <div className="space-y-4">
              {featureOptions.map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor={key} className="font-medium">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={config[key]}
                    onCheckedChange={() => handleFeatureToggle(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onResetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>

          <Button onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
