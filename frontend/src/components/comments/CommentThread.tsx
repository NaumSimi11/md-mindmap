/**
 * Comment Thread Component
 * 
 * Displays a comment with its replies, author info, and actions.
 */

import React, { useState } from 'react';
import { Comment, CommentReply, useCommentStore } from '@/stores/commentStore';
import { MessageSquare, Check, MoreVertical, Trash2, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
  comment: Comment;
  onJumpTo?: () => void;
}

export function CommentThread({ comment, onJumpTo }: CommentThreadProps) {
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  
  const {
    addReply,
    deleteComment,
    deleteReply,
    resolveComment,
    reopenComment,
    activeCommentId,
    setActiveComment,
  } = useCommentStore();

  const isActive = activeCommentId === comment.id;
  const isResolved = comment.status === 'resolved';

  const handleAddReply = () => {
    if (!replyText.trim()) return;

    addReply(comment.id, {
      author: 'You', // TODO: Get from auth context
      content: replyText.trim(),
    });

    setReplyText('');
    setShowReplyInput(false);
  };

  const handleResolve = () => {
    if (isResolved) {
      reopenComment(comment.id);
    } else {
      resolveComment(comment.id, 'You'); // TODO: Get from auth context
    }
  };

  return (
    <div
      className={`comment-thread border rounded-lg p-3 mb-3 transition-all cursor-pointer ${
        isActive
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
      } ${isResolved ? 'opacity-60' : ''}`}
      onClick={() => {
        setActiveComment(comment.id);
        onJumpTo?.();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {comment.author[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{comment.author}</div>
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResolve();
            }}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              isResolved ? 'text-green-600' : 'text-gray-400'
            }`}
            title={isResolved ? 'Reopen' : 'Resolve'}
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteComment(comment.id);
            }}
            className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="Delete comment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quoted text */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-2 text-sm italic border-l-2 border-purple-500">
        "{comment.selectedText}"
      </div>

      {/* Comment content */}
      <div className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-2 mb-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                    {reply.author[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-xs">{reply.author}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReply(comment.id, reply.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                  title="Delete reply"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs whitespace-pre-wrap ml-8">{reply.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReplyInput ? (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddReply}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowReplyInput(true);
          }}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors mt-2"
        >
          <CornerDownRight className="w-3 h-3" />
          Reply
        </button>
      )}

      {/* Resolved indicator */}
      {isResolved && (
        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Resolved by {comment.resolvedBy} {formatDistanceToNow(new Date(comment.resolvedAt!), { addSuffix: true })}
        </div>
      )}
    </div>
  );
}

