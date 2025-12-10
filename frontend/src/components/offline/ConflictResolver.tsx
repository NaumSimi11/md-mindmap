/**
 * ConflictResolver - Side-by-side conflict resolution UI
 * 
 * Shows when a document has been edited offline and the server has a newer version.
 * User can choose: Keep Local, Use Server, or view detailed diff.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Conflict } from '@/services/offline/SyncManager';
import { format } from 'date-fns';

interface ConflictResolverProps {
  conflict: Conflict;
  onResolve: (resolution: 'local' | 'remote') => void;
  onDismiss: () => void;
}

export function ConflictResolver({ conflict, onResolve, onDismiss }: ConflictResolverProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const localDate = new Date(conflict.localVersion.updatedAt);
  const remoteDate = new Date(conflict.remoteVersion.updatedAt);
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg shadow-lg"
    >
      {/* Compact Header */}
      <div className="flex items-start gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100">
            Conflicting Changes Detected
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
            This document was edited on another device while you were offline.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onResolve('local')}
              className="border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50"
            >
              Keep My Version
            </Button>
            <Button
              size="sm"
              onClick={() => onResolve('remote')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Use Server Version
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1"
            >
              {isExpanded ? 'Hide' : 'Compare'} Versions
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={onDismiss}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Expanded: Side-by-side comparison */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-orange-200 dark:border-orange-800 p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Local Version */}
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 dark:bg-blue-950/50 px-3 py-2 border-b border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
                        Your Version
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        Edited {format(localDate, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                  <ScrollArea className="h-64 p-3">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {conflict.localVersion.content}
                    </pre>
                  </ScrollArea>
                  <div className="border-t border-blue-200 dark:border-blue-800 p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResolve('local')}
                      className="w-full border-blue-300"
                    >
                      Keep This Version
                    </Button>
                  </div>
                </div>
                
                {/* Remote Version */}
                <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                  <div className="bg-green-50 dark:bg-green-950/50 px-3 py-2 border-b border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-green-900 dark:text-green-100">
                        Server Version
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        Edited {format(remoteDate, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                  <ScrollArea className="h-64 p-3">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                      {conflict.remoteVersion.content}
                    </pre>
                  </ScrollArea>
                  <div className="border-t border-green-200 dark:border-green-800 p-2">
                    <Button
                      size="sm"
                      onClick={() => onResolve('remote')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Use This Version
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Info */}
              <div className="mt-3 p-3 bg-orange-100/50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  <strong>Note:</strong> Choosing a version will discard the other. 
                  Both versions are shown above for your reference.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Minimal conflict banner (for editor top)
 */
export function ConflictBanner({ onReview }: { onReview: () => void }) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 animate-pulse" />
        <span className="font-medium text-sm">
          This document has conflicting changes
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={onReview}
        className="bg-white text-orange-600 hover:bg-orange-50"
      >
        Review Conflict
      </Button>
    </motion.div>
  );
}

