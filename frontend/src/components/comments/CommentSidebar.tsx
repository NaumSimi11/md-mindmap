/**
 * Comment Sidebar
 * 
 * Displays all comments for the document in a sidebar panel.
 */

import React, { useState } from 'react';
import { useCommentStore } from '@/stores/commentStore';
import { CommentThread } from './CommentThread';
import { X, MessageSquare, Check, Filter } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface CommentSidebarProps {
  editor: Editor | null;
}

export function CommentSidebar({ editor }: CommentSidebarProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  
  const {
    comments,
    isCommentSidebarOpen,
    setCommentSidebarOpen,
    setActiveComment,
  } = useCommentStore();

  const filteredComments = comments.filter((comment) => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

  const openCount = comments.filter((c) => c.status === 'open').length;
  const resolvedCount = comments.filter((c) => c.status === 'resolved').length;

  const handleJumpToComment = (commentId: string) => {
    if (!editor) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Jump to the commented text in the editor
    editor
      .chain()
      .focus()
      .setTextSelection({ from: comment.position.from, to: comment.position.to })
      .run();

    // Scroll into view
    const { node } = editor.view.domAtPos(comment.position.from);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!isCommentSidebarOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Comments</h2>
          <span className="text-sm text-gray-500">({comments.length})</span>
        </div>
        <button
          onClick={() => setCommentSidebarOpen(false)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            filter === 'open'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          Open ({openCount})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            filter === 'resolved'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          All ({comments.length})
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {filter === 'open' && 'No open comments'}
              {filter === 'resolved' && 'No resolved comments'}
              {filter === 'all' && 'No comments yet'}
            </p>
            <p className="text-xs mt-2">
              Select text in the editor to add a comment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onJumpTo={() => handleJumpToComment(comment.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{openCount} open</span>
          <span>•</span>
          <span>{resolvedCount} resolved</span>
          <span>•</span>
          <span>{comments.length} total</span>
        </div>
      </div>
    </div>
  );
}

