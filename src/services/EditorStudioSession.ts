/**
 * EditorStudioSession Service
 * Manages seamless integration between Editor and Studio2
 * Handles context passing, updates, and round-trip flow
 */

import { Node, Edge } from '@xyflow/react';

export interface EditorSession {
  sessionId: string;
  documentTitle: string;
  documentContent: string;
  diagramCode: string;
  diagramFormat: string; // 'mindmap', 'flowchart', etc.
  cursorPosition: number;
  cursorLine: number;
  returnUrl: string;
  timestamp: number;
  generationMode?: 'document' | 'ai'; // Track how diagram was created
}

export interface StudioUpdate {
  sessionId: string;
  updatedDiagram: string;
  nodes: Node[];
  edges: Edge[];
  pmData: Record<string, any>;
  layout: string;
  timestamp: number;
}

export interface DiagramContext {
  existingDiagramStart?: number; // Character position of existing diagram
  existingDiagramEnd?: number;
  isReplacement: boolean;
}

class EditorStudioSessionService {
  private SESSION_KEY = 'editorStudioSession';
  private BACKUP_KEY = 'editorStudioBackup';
  
  /**
   * Editor creates session before opening Studio2
   */
  createSession(data: Omit<EditorSession, 'sessionId' | 'timestamp'>): string {
    const sessionId = `es-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: EditorSession = {
      ...data,
      sessionId,
      timestamp: Date.now(),
    };
    
    // Save session
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    
    // Create backup
    this.createBackup(session);
    
    console.log('📝 Session created:', sessionId);
    return sessionId;
  }
  
  /**
   * Create backup of session (for recovery)
   */
  private createBackup(session: EditorSession): void {
    try {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to create session backup:', e);
    }
  }
  
  /**
   * Studio2 reads session
   */
  getSession(): EditorSession | null {
    try {
      const data = localStorage.getItem(this.SESSION_KEY);
      if (!data) return null;
      
      const session = JSON.parse(data) as EditorSession;
      console.log('📖 Session loaded:', session.sessionId);
      return session;
    } catch (e) {
      console.error('Failed to load session:', e);
      return null;
    }
  }
  
  /**
   * Studio2 saves updates back to session
   */
  saveStudioUpdate(update: StudioUpdate): void {
    try {
      const session = this.getSession();
      if (!session) {
        console.error('No session found to update');
        return;
      }
      
      const updatedSession = {
        ...session,
        ...update,
        updatedAt: Date.now(),
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
      console.log('💾 Studio updates saved:', update.sessionId);
    } catch (e) {
      console.error('Failed to save studio update:', e);
    }
  }
  
  /**
   * Editor checks if there are pending updates
   */
  hasUpdates(): boolean {
    const session = this.getSession();
    return !!(session && 'updatedDiagram' in session);
  }
  
  /**
   * Editor retrieves updates from Studio2
   */
  getUpdates(): StudioUpdate | null {
    try {
      const session = this.getSession();
      if (!session || !('updatedDiagram' in session)) {
        return null;
      }
      
      const updates: StudioUpdate = {
        sessionId: session.sessionId,
        updatedDiagram: (session as any).updatedDiagram,
        nodes: (session as any).nodes || [],
        edges: (session as any).edges || [],
        pmData: (session as any).pmData || {},
        layout: (session as any).layout || 'manual',
        timestamp: (session as any).updatedAt || session.timestamp,
      };
      
      console.log('✅ Updates retrieved:', updates.sessionId);
      return updates;
    } catch (e) {
      console.error('Failed to get updates:', e);
      return null;
    }
  }
  
  /**
   * Get diagram context (for smart insertion)
   */
  getDiagramContext(): DiagramContext {
    const session = this.getSession();
    if (!session) {
      return { isReplacement: false };
    }
    
    // Check if diagram already exists in document
    const content = session.documentContent;
    const diagram = session.diagramCode;
    
    const diagramIndex = content.indexOf(diagram);
    if (diagramIndex !== -1) {
      return {
        existingDiagramStart: diagramIndex,
        existingDiagramEnd: diagramIndex + diagram.length,
        isReplacement: true,
      };
    }
    
    return { isReplacement: false };
  }
  
  /**
   * Clear session after successful update
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log('🗑️ Session cleared');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }
  
  /**
   * Clear backup
   */
  clearBackup(): void {
    try {
      localStorage.removeItem(this.BACKUP_KEY);
    } catch (e) {
      console.error('Failed to clear backup:', e);
    }
  }
  
  /**
   * Restore from backup (in case of failure)
   */
  restoreFromBackup(): EditorSession | null {
    try {
      const data = localStorage.getItem(this.BACKUP_KEY);
      if (!data) return null;
      
      const backup = JSON.parse(data) as EditorSession;
      console.log('🔄 Restored from backup:', backup.sessionId);
      return backup;
    } catch (e) {
      console.error('Failed to restore from backup:', e);
      return null;
    }
  }
  
  /**
   * Cleanup old sessions (call on app init)
   */
  cleanupOldSessions(): void {
    try {
      const session = this.getSession();
      if (session) {
        const AGE_LIMIT = 24 * 60 * 60 * 1000; // 24 hours
        const age = Date.now() - session.timestamp;
        
        if (age > AGE_LIMIT) {
          console.log('🧹 Cleaning up old session (age:', Math.round(age / 1000 / 60), 'minutes)');
          this.clearSession();
          this.clearBackup();
        }
      }
    } catch (e) {
      console.error('Failed to cleanup sessions:', e);
    }
  }
  
  /**
   * Get session age in milliseconds
   */
  getSessionAge(): number {
    const session = this.getSession();
    if (!session) return 0;
    return Date.now() - session.timestamp;
  }
  
  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;
    
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    return this.getSessionAge() < MAX_AGE;
  }
  
  /**
   * Auto-save draft (call from Studio2 periodically)
   */
  autosaveDraft(nodes: Node[], edges: Edge[]): void {
    try {
      const session = this.getSession();
      if (!session) return;
      
      const draft = {
        sessionId: session.sessionId,
        nodes,
        edges,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(`${this.SESSION_KEY}_draft`, JSON.stringify(draft));
      console.log('💾 Auto-saved draft');
    } catch (e) {
      console.error('Failed to auto-save draft:', e);
    }
  }
  
  /**
   * Load draft (for recovery)
   */
  loadDraft(): { nodes: Node[]; edges: Edge[] } | null {
    try {
      const data = localStorage.getItem(`${this.SESSION_KEY}_draft`);
      if (!data) return null;
      
      const draft = JSON.parse(data);
      console.log('📖 Loaded draft');
      return { nodes: draft.nodes, edges: draft.edges };
    } catch (e) {
      console.error('Failed to load draft:', e);
      return null;
    }
  }
  
  /**
   * Clear draft
   */
  clearDraft(): void {
    try {
      localStorage.removeItem(`${this.SESSION_KEY}_draft`);
    } catch (e) {
      console.error('Failed to clear draft:', e);
    }
  }
  
  /**
   * Store generated mindmap data for auto-import
   */
  setMindmapData(data: any): void {
    try {
      localStorage.setItem('generatedMindmapData', JSON.stringify(data));
      console.log('💾 Mindmap data stored for auto-import');
    } catch (e) {
      console.error('Failed to store mindmap data:', e);
    }
  }
  
  /**
   * Get generated mindmap data
   */
  getMindmapData(): any | null {
    try {
      const data = localStorage.getItem('generatedMindmapData');
      if (!data) return null;
      
      const mindmapData = JSON.parse(data);
      console.log('📖 Mindmap data loaded');
      return mindmapData;
    } catch (e) {
      console.error('Failed to load mindmap data:', e);
      return null;
    }
  }
  
  /**
   * Clear generated mindmap data after import
   */
  clearMindmapData(): void {
    try {
      localStorage.removeItem('generatedMindmapData');
      console.log('🗑️ Mindmap data cleared');
    } catch (e) {
      console.error('Failed to clear mindmap data:', e);
    }
  }
}

// Singleton instance
export const sessionService = new EditorStudioSessionService();

// Cleanup on app init
if (typeof window !== 'undefined') {
  sessionService.cleanupOldSessions();
}

