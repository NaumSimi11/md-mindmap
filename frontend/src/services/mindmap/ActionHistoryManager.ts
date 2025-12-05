/**
 * ActionHistoryManager - Undo/Redo system for AI actions
 * Captures snapshots of nodes/edges before and after AI operations
 */

import type { Node, Edge } from "@xyflow/react";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: 'add' | 'modify' | 'delete' | 'reorganize' | 'connect';
  description: string;
  beforeState: {
    nodes: Node[];
    edges: Edge[];
  };
  afterState: {
    nodes: Node[];
    edges: Edge[];
  };
  affectedNodeIds: string[];
}

export class ActionHistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxHistorySize = 20; // Keep last 20 actions

  /**
   * Record an action in history
   */
  recordAction(
    action: HistoryEntry['action'],
    description: string,
    beforeState: { nodes: Node[]; edges: Edge[] },
    afterState: { nodes: Node[]; edges: Edge[] },
    affectedNodeIds: string[]
  ): void {
    const entry: HistoryEntry = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      description,
      beforeState: {
        nodes: JSON.parse(JSON.stringify(beforeState.nodes)), // Deep clone
        edges: JSON.parse(JSON.stringify(beforeState.edges)),
      },
      afterState: {
        nodes: JSON.parse(JSON.stringify(afterState.nodes)), // Deep clone
        edges: JSON.parse(JSON.stringify(afterState.edges)),
      },
      affectedNodeIds,
    };

    // Add to undo stack
    this.undoStack.push(entry);

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift(); // Remove oldest
    }

    // Clear redo stack (new action invalidates redo history)
    this.redoStack = [];

    console.log('📝 Action recorded in history:', {
      action,
      description,
      affectedNodes: affectedNodeIds.length,
      undoStackSize: this.undoStack.length,
    });
  }

  /**
   * Undo last action
   */
  undo(): { nodes: Node[]; edges: Edge[]; description: string } | null {
    if (this.undoStack.length === 0) {
      console.warn('⚠️ Nothing to undo');
      return null;
    }

    const entry = this.undoStack.pop()!;
    this.redoStack.push(entry);

    console.log('↩️ Undoing action:', entry.description);

    return {
      nodes: entry.beforeState.nodes,
      edges: entry.beforeState.edges,
      description: entry.description,
    };
  }

  /**
   * Redo last undone action
   */
  redo(): { nodes: Node[]; edges: Edge[]; description: string } | null {
    if (this.redoStack.length === 0) {
      console.warn('⚠️ Nothing to redo');
      return null;
    }

    const entry = this.redoStack.pop()!;
    this.undoStack.push(entry);

    console.log('↪️ Redoing action:', entry.description);

    return {
      nodes: entry.afterState.nodes,
      edges: entry.afterState.edges,
      description: entry.description,
    };
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get undo stack size
   */
  getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * Get redo stack size
   */
  getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Get recent history (for display)
   */
  getRecentHistory(count: number = 5): Array<{
    description: string;
    timestamp: number;
    action: string;
  }> {
    return this.undoStack
      .slice(-count)
      .reverse()
      .map(entry => ({
        description: entry.description,
        timestamp: entry.timestamp,
        action: entry.action,
      }));
  }

  /**
   * Clear all history
   */
  clear(): void {
    console.log('🧹 Clearing history');
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get full history (for debugging)
   */
  getFullHistory(): {
    undo: HistoryEntry[];
    redo: HistoryEntry[];
  } {
    return {
      undo: [...this.undoStack],
      redo: [...this.redoStack],
    };
  }
}

// Export singleton instance
export const actionHistoryManager = new ActionHistoryManager();

