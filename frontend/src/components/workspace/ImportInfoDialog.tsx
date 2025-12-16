/**
 * ImportInfoDialog - Explains how file import works in Web Mode
 * Shows on first import or when user clicks info icon
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Info, Copy, Database, FileText, ArrowRight } from 'lucide-react';

interface ImportInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportInfoDialog({ open, onClose }: ImportInfoDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-blue-500" />
            How File Import Works
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        {/* Content outside AlertDialogDescription to avoid <p> nesting issues */}
        <div className="text-left space-y-4 px-6 pb-4">
            {/* Visual Diagram */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">Your File on Disk</div>
                  <div className="text-sm text-muted-foreground">/Documents/my-notes.md</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground ml-2">Import (copies content)</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Database className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">Browser Storage</div>
                  <div className="text-sm text-muted-foreground">Independent copy in IndexedDB</div>
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Copy className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-foreground">Files are Copied</div>
                  <div className="text-sm text-muted-foreground">
                    MDReader creates a copy in browser storage. Your original file stays unchanged.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-foreground">Changes Don't Sync Back</div>
                  <div className="text-sm text-muted-foreground">
                    Edits in MDReader don't update the original file. Use <strong>Export</strong> to save changes back to disk.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-foreground">Stored Locally</div>
                  <div className="text-sm text-muted-foreground">
                    Documents are stored in your browser (IndexedDB). Works offline, but tied to this browser.
                  </div>
                </div>
              </div>
            </div>

            {/* What This Means */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="font-medium text-sm text-foreground mb-2">⚠️ Important</div>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your original file and MDReader copy can become different</li>
                <li>To sync changes back to disk, use the <strong>Export</strong> button</li>
                <li>Clearing browser data will delete your documents</li>
              </ul>
            </div>

            {/* Desktop Mode Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="font-medium text-sm text-foreground mb-2">💡 Want Automatic Sync?</div>
              <div className="text-sm text-muted-foreground">
                Use <strong>Desktop Mode</strong> (Tauri) for automatic two-way sync between MDReader and your files.
              </div>
            </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
