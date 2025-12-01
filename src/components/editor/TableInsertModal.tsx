/**
 * Table Insert Modal
 * Allows users to pick table dimensions before inserting
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, Check } from 'lucide-react';

interface TableInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number, withHeaderRow: boolean) => void;
}

export const TableInsertModal: React.FC<TableInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [withHeaderRow, setWithHeaderRow] = useState<boolean>(true);

  // Quick presets
  const presets = [
    { rows: 2, cols: 2, label: '2×2' },
    { rows: 3, cols: 3, label: '3×3' },
    { rows: 4, cols: 4, label: '4×4' },
    { rows: 3, cols: 5, label: '3×5' },
    { rows: 5, cols: 3, label: '5×3' },
  ];

  const handlePresetClick = (presetRows: number, presetCols: number) => {
    setRows(presetRows);
    setCols(presetCols);
  };

  const handleInsert = () => {
    if (rows > 0 && cols > 0) {
      onInsert(rows, cols, withHeaderRow);
      onClose();
      // Reset to defaults
      setRows(3);
      setCols(3);
      setWithHeaderRow(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Insert Table
          </DialogTitle>
          <DialogDescription>
            Choose the dimensions for your table
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
            <div className="grid grid-cols-5 gap-2">
              {presets.map((preset) => {
                const isSelected = rows === preset.rows && cols === preset.cols;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset.rows, preset.cols)}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                    `}
                  >
                    {isSelected && (
                      <Check className="absolute top-1 right-1 w-3 h-3 text-primary" />
                    )}
                    <div className="text-sm font-medium">{preset.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setRows(Math.max(1, Math.min(20, val)));
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="20"
                value={cols}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setCols(Math.max(1, Math.min(20, val)));
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Header Row Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="headerRow"
              checked={withHeaderRow}
              onChange={(e) => setWithHeaderRow(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="headerRow" className="text-sm cursor-pointer">
              Include header row
            </Label>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <div className="text-xs text-muted-foreground mb-2">Preview:</div>
            <div className="inline-block">
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: withHeaderRow ? rows + 1 : rows }).map((_, rowIdx) =>
                  Array.from({ length: cols }).map((_, colIdx) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={`
                        w-6 h-6 border border-border rounded-sm
                        ${rowIdx === 0 && withHeaderRow 
                          ? 'bg-primary/20 border-primary/30' 
                          : 'bg-background'
                        }
                      `}
                    />
                  ))
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {withHeaderRow ? rows + 1 : rows} row{rows !== 1 ? 's' : ''} × {cols} column{cols !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>
              Insert Table
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

