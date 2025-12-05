/**
 * Comment Store
 * 
 * Manages all comments and threads for the document.
 */

import { create } from 'zustand';

export interface CommentReply {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  
  // Selection info
  selectedText: string;
  position: { from: number; to: number };
  
  // Thread
  replies: CommentReply[];
  
  // Status
  status: 'open' | 'resolved';
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface CommentStore {
  // State
  comments: Comment[];
  activeCommentId: string | null;
  isCommentSidebarOpen: boolean;
  
  // Actions
  addComment: (comment: Omit<Comment, 'id' | 'timestamp' | 'replies' | 'status'>) => string;
  updateComment: (id: string, updates: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
  
  // Replies
  addReply: (commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>) => void;
  deleteReply: (commentId: string, replyId: string) => void;
  
  // Status
  resolveComment: (id: string, resolvedBy: string) => void;
  reopenComment: (id: string) => void;
  
  // UI
  setActiveComment: (id: string | null) => void;
  toggleCommentSidebar: () => void;
  setCommentSidebarOpen: (open: boolean) => void;
  
  // Query
  getComment: (id: string) => Comment | undefined;
  getCommentsByStatus: (status: 'open' | 'resolved') => Comment[];
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  activeCommentId: null,
  isCommentSidebarOpen: false,

  addComment: (comment) => {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newComment: Comment = {
      ...comment,
      id,
      timestamp: new Date(),
      replies: [],
      status: 'open',
    };

    set((state) => ({
      comments: [...state.comments, newComment],
      activeCommentId: id,
      isCommentSidebarOpen: true,
    }));

    return id;
  },

  updateComment: (id, updates) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteComment: (id) => {
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== id),
      activeCommentId: state.activeCommentId === id ? null : state.activeCommentId,
    }));
  },

  addReply: (commentId, reply) => {
    const replyId = `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newReply: CommentReply = {
      ...reply,
      id: replyId,
      timestamp: new Date(),
    };

    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, newReply] }
          : c
      ),
    }));
  },

  deleteReply: (commentId, replyId) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId
          ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
          : c
      ),
    }));
  },

  resolveComment: (id, resolvedBy) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'resolved',
              resolvedAt: new Date(),
              resolvedBy,
            }
          : c
      ),
    }));
  },

  reopenComment: (id) => {
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'open',
              resolvedAt: undefined,
              resolvedBy: undefined,
            }
          : c
      ),
    }));
  },

  setActiveComment: (id) => {
    set({ activeCommentId: id });
  },

  toggleCommentSidebar: () => {
    set((state) => ({ isCommentSidebarOpen: !state.isCommentSidebarOpen }));
  },

  setCommentSidebarOpen: (open) => {
    set({ isCommentSidebarOpen: open });
  },

  getComment: (id) => {
    return get().comments.find((c) => c.id === id);
  },

  getCommentsByStatus: (status) => {
    return get().comments.filter((c) => c.status === status);
  },
}));

