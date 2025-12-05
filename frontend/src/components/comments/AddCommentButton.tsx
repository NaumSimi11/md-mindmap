/**
 * Add Comment Button
 * 
 * Floating button that appears when text is selected.
 */

import React, { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { useCommentStore } from '@/stores/commentStore';
import { Editor } from '@tiptap/react';

interface AddCommentButtonProps {
  editor: Editor;
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
}

export function AddCommentButton({
  editor,
  position,
  selectedText,
  onClose,
}: AddCommentButtonProps) {
  const [showInput, setShowInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { addComment } = useCommentStore();

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    const { from, to } = editor.state.selection;
    
    // Add comment to store
    const commentId = addComment({
      author: 'You', // TODO: Get from auth context
      content: commentText.trim(),
      selectedText,
      position: { from, to },
    });

    // Apply comment mark to selection
    editor.chain().focus().setComment(commentId).run();

    // Reset and close
    setCommentText('');
    setShowInput(false);
    onClose();
  };

  if (showInput) {
    return (
      <div
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '300px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-600">
            <MessageSquarePlus className="w-4 h-4" />
            Add Comment
          </div>
          <button
            onClick={() => {
              setShowInput(false);
              setCommentText('');
              onClose();
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quoted text */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 mb-2 text-xs italic border-l-2 border-purple-500">
          "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
        </div>

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment..."
          className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:border-gray-600 mb-2"
          rows={3}
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim()}
            className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Comment
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setCommentText('');
              onClose();
            }}
            className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="fixed bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 hover:scale-110 transition-all z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={() => setShowInput(true)}
      title="Add comment"
    >
      <MessageSquarePlus className="w-5 h-5" />
    </button>
  );
}

