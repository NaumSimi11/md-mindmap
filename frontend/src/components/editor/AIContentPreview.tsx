/**
 * AI Content Preview Component
 * 
 * Shows rich preview of AI-generated content BEFORE applying to document.
 * Allows user to accept, modify, or cancel.
 */

import React, { useState } from 'react';
import { Check, X, Edit3, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';
import { StagedContent } from '@/stores/aiStagingStore';

interface AIContentPreviewProps {
  stagedContent: StagedContent;
  onAccept: () => void;
  onModify: (request: string) => void;
  onCancel: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function AIContentPreview({
  stagedContent,
  onAccept,
  onModify,
  onCancel,
  isExpanded,
  onToggleExpand,
}: AIContentPreviewProps) {
  const [modifyInput, setModifyInput] = useState('');
  const [showModifyInput, setShowModifyInput] = useState(false);

  const handleModifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyInput.trim()) return;
    
    onModify(modifyInput.trim());
    setModifyInput('');
    setShowModifyInput(false);
  };

  const isModifying = stagedContent.status === 'modifying';

  return (
    <div className="ai-content-preview border-2 border-purple-500/30 rounded-lg overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="font-semibold text-sm">📝 Preview</span>
          <span className="text-xs opacity-90">({stagedContent.description})</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span>{stagedContent.sectionCount} sections</span>
            <span>•</span>
            <span>{stagedContent.wordCount} words</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Content Preview */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Simple Markdown Preview */}
          <div className="preview-content max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {stagedContent.generatedContent.split('\n').map((line, idx) => {
                // Headings
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-xl font-bold mt-4 mb-2 text-purple-700 dark:text-purple-300">
                      {line.substring(3)}
                    </h2>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-lg font-semibold mt-3 mb-2 text-blue-700 dark:text-blue-300">
                      {line.substring(4)}
                    </h3>
                  );
                }
                
                // Checkboxes
                if (line.match(/^-\s\[\s\]/)) {
                  return (
                    <div key={idx} className="flex items-center gap-2 my-1">
                      <input type="checkbox" readOnly className="cursor-default" />
                      <span>{line.substring(6)}</span>
                    </div>
                  );
                }
                if (line.match(/^-\s\[x\]/i)) {
                  return (
                    <div key={idx} className="flex items-center gap-2 my-1">
                      <input type="checkbox" checked readOnly className="cursor-default" />
                      <span>{line.substring(6)}</span>
                    </div>
                  );
                }
                
                // Bullet lists
                if (line.match(/^-\s/)) {
                  return (
                    <li key={idx} className="ml-5 my-1 list-disc">
                      {line.substring(2)}
                    </li>
                  );
                }
                
                // Numbered lists
                if (line.match(/^\d+\.\s/)) {
                  return (
                    <li key={idx} className="ml-5 my-1 list-decimal">
                      {line.substring(line.indexOf('.') + 2)}
                    </li>
                  );
                }
                
                // Code blocks (simple detection)
                if (line.startsWith('```')) {
                  return <div key={idx} className="my-2 border-t border-gray-300 dark:border-gray-600"></div>;
                }
                
                // Inline code (simple detection)
                if (line.includes('`')) {
                  const parts = line.split('`');
                  return (
                    <p key={idx} className="my-1">
                      {parts.map((part, i) => 
                        i % 2 === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <code key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-purple-600 dark:text-purple-400">
                            {part}
                          </code>
                        )
                      )}
                    </p>
                  );
                }
                
                // Regular paragraph
                if (line.trim()) {
                  return (
                    <p key={idx} className="my-1">
                      {line}
                    </p>
                  );
                }
                
                // Empty line
                return <div key={idx} className="h-2"></div>;
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 px-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(stagedContent.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Type: {stagedContent.type}</span>
            </div>
          </div>

          {/* Modification Input (if user clicks Modify) */}
          {showModifyInput && (
            <form onSubmit={handleModifySubmit} className="space-y-2">
              <input
                type="text"
                value={modifyInput}
                onChange={(e) => setModifyInput(e.target.value)}
                placeholder="What would you like to change? (e.g., 'add Redis to prerequisites')"
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-sm"
                autoFocus
                disabled={isModifying}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!modifyInput.trim() || isModifying}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isModifying ? 'Modifying...' : 'Apply Modification'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModifyInput(false);
                    setModifyInput('');
                  }}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Action Buttons */}
          {!showModifyInput && (
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onAccept}
                disabled={isModifying}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all"
                title="Apply these changes to the document"
              >
                <Check className="w-4 h-4" />
                <span>Accept & Apply</span>
              </button>
              
              <button
                onClick={() => setShowModifyInput(true)}
                disabled={isModifying}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all"
                title="Request modifications to this content"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modify</span>
              </button>
              
              <button
                onClick={onCancel}
                disabled={isModifying}
                className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                title="Discard these changes"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* Status indicator when modifying */}
          {isModifying && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>AI is modifying the content based on your request...</span>
            </div>
          )}
        </div>
      )}

      {/* Collapsed view */}
      {!isExpanded && (
        <div className="p-3 bg-white/50 dark:bg-gray-900/50 text-sm text-gray-600 dark:text-gray-400 text-center">
          Click to expand preview
        </div>
      )}
    </div>
  );
}

