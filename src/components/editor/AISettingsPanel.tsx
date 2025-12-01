/**
 * AI Settings Panel
 * Configuration for AI behavior and preferences
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';

interface AISettingsPanelProps {
  smartMode: boolean;
  onSmartModeChange: (enabled: boolean) => void;
  autoSwitch: boolean;
  onAutoSwitchChange: (enabled: boolean) => void;
  onClose: () => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({
  smartMode,
  onSmartModeChange,
  autoSwitch,
  onAutoSwitchChange,
  onClose,
}) => {
  return (
    <div className="border-b border-border p-4 bg-muted/50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">AI Settings</h4>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Smart Mode */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="smart-mode" className="text-sm font-semibold">
              Smart Mode
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-accept high-confidence changes (90%+). You can still undo.
            </p>
          </div>
          <Switch
            id="smart-mode"
            checked={smartMode}
            onCheckedChange={onSmartModeChange}
          />
        </div>

        <Separator />

        {/* Auto-switch Models */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="auto-switch" className="text-sm font-semibold">
              Auto-switch Models
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically switch model based on task type (writing, code, etc.)
            </p>
          </div>
          <Switch
            id="auto-switch"
            checked={autoSwitch}
            onCheckedChange={onAutoSwitchChange}
          />
        </div>
      </div>
    </div>
  );
};

