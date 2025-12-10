/**
 * WorkspaceIconPicker - Icon selector for workspaces
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const WORKSPACE_ICONS = [
  '🚀', '💼', '📚', '🎨', '🔬', '🎯',
  '💡', '🏢', '🏠', '🎓', '🎮', '🎵',
  '⚡', '🔥', '✨', '🌟', '💎', '🎪',
  '🌈', '🎭', '🎬', '📱', '💻', '⚙️',
  '🛠️', '🔧', '🔨', '📝', '📄', '📊',
  '📈', '📉', '🗂️', '📁', '🗄️', '🏆',
  '🎁', '🎉', '🎊', '🎈', '🌸', '🌺',
  '🌻', '🌹', '🌷', '🌲', '🌳', '🍀',
];

interface WorkspaceIconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export function WorkspaceIconPicker({ selected, onSelect }: WorkspaceIconPickerProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayedIcons = showAll ? WORKSPACE_ICONS : WORKSPACE_ICONS.slice(0, 12);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Icon</label>
      
      <div className="grid grid-cols-6 gap-2">
        {displayedIcons.map((icon) => (
          <Button
            key={icon}
            type="button"
            variant={selected === icon ? 'default' : 'outline'}
            size="lg"
            className="text-2xl h-12 w-12 p-0"
            onClick={() => onSelect(icon)}
          >
            {icon}
          </Button>
        ))}
      </div>
      
      {!showAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          Show More Icons...
        </Button>
      )}
    </div>
  );
}

