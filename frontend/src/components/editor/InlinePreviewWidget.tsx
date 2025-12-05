/**
 * Inline Preview Widget - Shows AI-generated content directly in the document
 * 
 * This component renders INSIDE the document at the target insertion point,
 * giving users a WYSIWYG preview of where content will be placed.
 */

import React, { useState } from 'react';
import { Check, X, MapPin, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { StagedContent } from '@/stores/aiStagingStore';

interface InlinePreviewWidgetProps {
  stagedContent: StagedContent;
  currentPosition: string;
  availablePositions: string[];
  onAccept: () => void;
  onReject: () => void;
  onChangePosition: (position: string) => void;
}

export function InlinePreviewWidget({
  stagedContent,
  currentPosition,
  availablePositions,
  onAccept,
  onReject,
  onChangePosition,
}: InlinePreviewWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Use metadata from staged content (calculated by the store)
  const sectionCount = stagedContent.sectionCount;
  const wordCount = stagedContent.wordCount;
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);

  return (
    <div className="inline-preview-widget my-6 animate-fadeIn">
      {/* Header */}
      <div className="preview-header bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">AI Suggestion</span>
          <span className="text-xs opacity-90">
            ({sectionCount} sections • {wordCount} words)
          </span>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title={isExpanded ? 'Collapse preview' : 'Expand preview'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content Preview */}
      {isExpanded && (
        <div className="preview-content bg-white dark:bg-gray-900 border-l-4 border-r-4 border-purple-500 px-6 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none opacity-90">
            {/* Simple markdown rendering */}
            {stagedContent.generatedContent.split('\n').map((line, idx) => {
              // Headings
              if (line.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-lg font-bold mt-3 mb-2 text-purple-700 dark:text-purple-300">
                    {line.substring(3)}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base font-semibold mt-2 mb-1 text-blue-700 dark:text-blue-300">
                    {line.substring(4)}
                  </h3>
                );
              }
              
              // Checkboxes
              if (line.match(/^-\s\[\s\]/)) {
                return (
                  <div key={idx} className="flex items-center gap-2 my-1">
                    <input type="checkbox" readOnly className="cursor-default" />
                    <span className="text-sm">{line.substring(6)}</span>
                  </div>
                );
              }
              if (line.match(/^-\s\[x\]/i)) {
                return (
                  <div key={idx} className="flex items-center gap-2 my-1">
                    <input type="checkbox" checked readOnly className="cursor-default" />
                    <span className="text-sm">{line.substring(6)}</span>
                  </div>
                );
              }
              
              // Bullet lists
              if (line.match(/^-\s/)) {
                return (
                  <li key={idx} className="ml-4 my-1 list-disc text-sm">
                    {line.substring(2)}
                  </li>
                );
              }
              
              // Numbered lists
              if (line.match(/^\d+\.\s/)) {
                return (
                  <li key={idx} className="ml-4 my-1 list-decimal text-sm">
                    {line.substring(line.indexOf('.') + 2)}
                  </li>
                );
              }
              
              // Code blocks separator
              if (line.startsWith('```')) {
                return <div key={idx} className="my-2 border-t border-gray-300 dark:border-gray-600"></div>;
              }
              
              // Inline code
              if (line.includes('`')) {
                const parts = line.split('`');
                return (
                  <p key={idx} className="my-1 text-sm">
                    {parts.map((part, i) => 
                      i % 2 === 0 ? (
                        <span key={i}>{part}</span>
                      ) : (
                        <code key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-purple-600 dark:text-purple-400">
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
                  <p key={idx} className="my-1 text-sm">
                    {line}
                  </p>
                );
              }
              
              // Empty line
              return <div key={idx} className="h-1"></div>;
            })}
          </div>
        </div>
      )}

      {/* Position & Actions Bar */}
      <div className="preview-actions bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-l-4 border-r-4 border-b-4 border-purple-500 rounded-b-xl px-4 py-3">
        {/* Position Indicator */}
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Will be inserted:
          </span>
          
          {/* Position Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPositionDropdown(!showPositionDropdown)}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-2"
            >
              {currentPosition}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {/* Dropdown Menu */}
            {showPositionDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg shadow-lg z-50 min-w-[200px]">
                {availablePositions.map((position) => (
                  <button
                    key={position}
                    onClick={() => {
                      onChangePosition(position);
                      setShowPositionDropdown(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors
                      ${position === currentPosition ? 'bg-purple-100 dark:bg-purple-900/50 font-semibold text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    {position}
                    {position === currentPosition && <span className="ml-2">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Accept & Insert</span>
          </button>
          
          <button
            onClick={onReject}
            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Visual Insertion Indicators */}
      <div className="insertion-indicators flex items-center justify-center mt-2 text-xs text-purple-600 dark:text-purple-400">
        <span>⬆️ Content will be inserted above this point ⬆️</span>
      </div>
    </div>
  );
}

// CSS for animations (add to global styles or styled-components)
export const inlinePreviewStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.inline-preview-widget {
  animation: fadeIn 0.3s ease-out;
}

.preview-content {
  max-height: 500px;
  overflow-y: auto;
}

.preview-content::-webkit-scrollbar {
  width: 8px;
}

.preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb {
  background: #8b5cf6;
  border-radius: 4px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: #7c3aed;
}
`;

