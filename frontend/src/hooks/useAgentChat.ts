/**
 * useAgentChat - Hook for AI agent integration
 * 
 * Features:
 * - Context-aware planning (knows existing folders/documents)
 * - Detects agent-related requests
 * - Manages autonomous operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentService, AgentProgress, createAgentService } from '@/services/ai/AgentService';
import { Plan } from '@/services/ai/AgentTools';
import { documentService } from '@/services/api/DocumentService';
import { folderService } from '@/services/api/FolderService';
import { extractUUID } from '@/utils/id-generator';

export interface WorkspaceContext {
  folders: Array<{ id: string; name: string; path?: string }>;
  documents: Array<{ id: string; title: string; folder_id?: string }>;
  lastUpdated: Date;
}

export interface UseAgentChatProps {
  workspaceId: string;
  /** Callback to refresh workspace data */
  onRefresh?: () => void;
}

export interface UseAgentChatReturn {
  /** Current agent progress */
  progress: AgentProgress | null;
  /** Whether an agent is running */
  isRunning: boolean;
  /** Current plan (if any) */
  currentPlan: Plan | null;
  /** Current workspace context (existing folders/documents) */
  workspaceContext: WorkspaceContext | null;
  /** Run planner agent (context-aware) */
  runPlanner: (request: string, model?: string) => Promise<{
    success: boolean;
    plan?: Plan;
    content?: string;
    error?: string;
  }>;
  /** Execute a plan */
  executePlan: (planId: string, generateContent?: boolean, model?: string) => Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }>;
  /** Run full pipeline (plan + execute) */
  runFullPipeline: (request: string, options?: {
    model?: string;
    generateContent?: boolean;
    autoExecute?: boolean;
  }) => Promise<{
    success: boolean;
    plan?: Plan;
    results?: any;
    error?: string;
  }>;
  /** Get all stored plans */
  getPlans: () => Plan[];
  /** Cancel current operation */
  cancel: () => void;
  /** Check if message triggers an agent */
  isAgentRequest: (message: string) => boolean;
  /** Get agent type from message */
  getAgentType: (message: string) => 'planner' | 'writer' | 'organizer' | 'full' | null;
  /** Confirm and execute current plan */
  confirmPlan: (generateContent?: boolean, model?: string) => Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }>;
  /** Reject current plan */
  rejectPlan: () => void;
  /** Refresh workspace context */
  refreshContext: () => Promise<WorkspaceContext | null>;
}

/**
 * Patterns that trigger agent mode
 */
const AGENT_PATTERNS = {
  planner: [
    /create\s+(documentation|docs|project\s+docs)/i,
    /plan\s+(out|documentation|docs|a\s+project)/i,
    /structure\s+(for|my|the)\s+(documentation|docs)/i,
    /generate\s+(a\s+)?project\s+structure/i,
    /set\s*up\s+(documentation|docs)/i,
    /organize\s+(my\s+)?(documentation|project|content)/i,
    /create\s+folder\s+structure/i,
    /build\s+(me\s+)?documentation/i,
    /design\s+(a\s+)?documentation/i,
    /make\s+(me\s+)?(a\s+)?project\s+(management|plan)/i,
  ],
  writer: [
    /write\s+(me\s+)?(a|the|full|complete)\s+(document|article|guide)/i,
    /generate\s+(the\s+)?(content|document)/i,
    /create\s+(the\s+)?(content|article)/i,
    /fill\s+(in|out)\s+(the|this|all)/i,
    /expand\s+(this|the)\s+section/i,
  ],
  organizer: [
    /execute\s+(the\s+)?plan/i,
    /run\s+(the\s+)?plan/i,
    /create\s+(all\s+)?(the\s+)?folders/i,
    /make\s+(the\s+)?structure\s+now/i,
    /do\s+it|yes|proceed|go\s+ahead|execute/i,
  ],
  full: [
    /create\s+and\s+execute/i,
    /build\s+everything/i,
    /do\s+the\s+whole\s+thing/i,
    /create\s+all\s+(the\s+)?(docs|documentation|folders)/i,
  ],
};

/**
 * Check if message matches patterns
 */
function matchesPatterns(message: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(message));
}

export function useAgentChat({ workspaceId, onRefresh }: UseAgentChatProps): UseAgentChatReturn {
  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  
  // Use ref to maintain service across re-renders
  const serviceRef = useRef<AgentService | null>(null);
  
  // Fetch workspace context (existing folders and documents)
  const fetchWorkspaceContext = useCallback(async () => {
    if (!workspaceId || workspaceId === 'default') {
      setWorkspaceContext(null);
      return null;
    }
    
    try {
      const wsId = extractUUID(workspaceId);
      
      // Fetch folders and documents in parallel
      const [foldersResponse, documentsResponse] = await Promise.all([
        folderService.listFolders(wsId).catch(() => []),
        documentService.listDocuments(wsId).catch(() => []),
      ]);
      
      // Handle both array and paginated response formats
      const folders = Array.isArray(foldersResponse) 
        ? foldersResponse 
        : (foldersResponse as any)?.items || [];
      
      const documents = Array.isArray(documentsResponse) 
        ? documentsResponse 
        : (documentsResponse as any)?.items || [];
      
      const context: WorkspaceContext = {
        folders: folders.map((f: any) => ({ 
          id: f.id, 
          name: f.name, 
          path: f.name?.toLowerCase().replace(/\s+/g, '-') || f.id
        })),
        documents: documents.map((d: any) => ({ 
          id: d.id, 
          title: d.title, 
          folder_id: d.folder_id 
        })),
        lastUpdated: new Date(),
      };
      
      setWorkspaceContext(context);
      console.log('📋 Workspace context loaded:', { 
        folders: context.folders.length, 
        documents: context.documents.length 
      });
      
      return context;
    } catch (err) {
      console.error('Failed to fetch workspace context:', err);
      return null;
    }
  }, [workspaceId]);
  
  // Load context on mount and workspace change
  useEffect(() => {
    fetchWorkspaceContext();
  }, [fetchWorkspaceContext]);
  
  // Get or create service
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = createAgentService(workspaceId);
      serviceRef.current.setProgressCallback(setProgress);
    } else {
      serviceRef.current.setWorkspaceId(workspaceId);
    }
    return serviceRef.current;
  }, [workspaceId]);
  
  /**
   * Format workspace context for AI prompt
   */
  const formatContextForPrompt = useCallback((context: WorkspaceContext | null): string => {
    if (!context || (context.folders.length === 0 && context.documents.length === 0)) {
      return 'WORKSPACE STATUS: Empty (no existing folders or documents)';
    }
    
    let prompt = 'EXISTING WORKSPACE CONTENT:\n';
    
    if (context.folders.length > 0) {
      prompt += '\nFolders:\n';
      context.folders.forEach(f => {
        prompt += `- 📁 "${f.name}" (id: ${f.id})\n`;
      });
    }
    
    if (context.documents.length > 0) {
      prompt += '\nDocuments:\n';
      context.documents.forEach(d => {
        const folderInfo = d.folder_id ? ` (in folder: ${d.folder_id})` : ' (at root)';
        prompt += `- 📄 "${d.title}"${folderInfo}\n`;
      });
    }
    
    prompt += '\nIMPORTANT: Consider this existing content. Suggest:\n';
    prompt += '- UPDATE existing documents if similar content exists\n';
    prompt += '- CREATE new items only if they don\'t exist\n';
    prompt += '- SKIP items that already exist (mention them in response)\n';
    
    return prompt;
  }, []);

  /**
   * Check if message should trigger agent mode
   */
  const isAgentRequest = useCallback((message: string): boolean => {
    return (
      matchesPatterns(message, AGENT_PATTERNS.planner) ||
      matchesPatterns(message, AGENT_PATTERNS.writer) ||
      matchesPatterns(message, AGENT_PATTERNS.organizer) ||
      matchesPatterns(message, AGENT_PATTERNS.full)
    );
  }, []);

  /**
   * Get agent type from message
   */
  const getAgentType = useCallback((message: string): 'planner' | 'writer' | 'organizer' | 'full' | null => {
    if (matchesPatterns(message, AGENT_PATTERNS.full)) return 'full';
    if (matchesPatterns(message, AGENT_PATTERNS.organizer)) return 'organizer';
    if (matchesPatterns(message, AGENT_PATTERNS.planner)) return 'planner';
    if (matchesPatterns(message, AGENT_PATTERNS.writer)) return 'writer';
    return null;
  }, []);

  /**
   * Run planner agent with context awareness
   */
  const runPlanner = useCallback(async (
    request: string,
    model: string = 'gemini-1.5-flash'
  ) => {
    if (isRunning) {
      return { success: false, error: 'Agent already running' };
    }

    setIsRunning(true);
    setCurrentPlan(null);

    try {
      // Refresh context before planning
      const context = await fetchWorkspaceContext();
      const contextPrompt = formatContextForPrompt(context);
      
      // Enhance request with context
      const contextAwareRequest = `${contextPrompt}\n\nUSER REQUEST: ${request}`;
      
      const service = getService();
      const result = await service.runPlanner(contextAwareRequest, model);
      
      if (result.success && result.plan) {
        setCurrentPlan(result.plan);
      }
      
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [getService, isRunning, fetchWorkspaceContext, formatContextForPrompt]);

  /**
   * Execute a plan
   */
  const executePlan = useCallback(async (
    planId: string,
    generateContent: boolean = true,
    model: string = 'gemini-1.5-flash'
  ) => {
    if (isRunning) {
      return { success: false, error: 'Agent already running' };
    }

    setIsRunning(true);

    try {
      const service = getService();
      const result = await service.executePlan(planId, { generateContent, model });
      
      if (result.success) {
        setCurrentPlan(null); // Clear plan after successful execution
        
        // Trigger refresh callback
        onRefresh?.();
        
        // Also refresh context
        await fetchWorkspaceContext();
      }
      
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [getService, isRunning, onRefresh, fetchWorkspaceContext]);

  /**
   * Run full pipeline
   */
  const runFullPipeline = useCallback(async (
    request: string,
    options?: {
      model?: string;
      generateContent?: boolean;
      autoExecute?: boolean;
    }
  ) => {
    if (isRunning) {
      return { success: false, error: 'Agent already running' };
    }

    setIsRunning(true);
    setCurrentPlan(null);

    try {
      const service = getService();
      const result = await service.runFullPipeline(request, {
        model: options?.model || 'gemini-1.5-flash',
        generateContent: options?.generateContent ?? true,
        autoExecute: options?.autoExecute ?? false,
      });
      
      if (result.plan) {
        setCurrentPlan(result.plan);
      }
      
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [getService, isRunning]);

  /**
   * Confirm and execute current plan
   */
  const confirmPlan = useCallback(async (
    generateContent: boolean = true,
    model: string = 'gemini-1.5-flash'
  ) => {
    if (!currentPlan) {
      return { success: false, error: 'No plan to execute' };
    }
    
    return executePlan(currentPlan.id, generateContent, model);
  }, [currentPlan, executePlan]);

  /**
   * Reject current plan
   */
  const rejectPlan = useCallback(() => {
    setCurrentPlan(null);
    setProgress(null);
  }, []);

  /**
   * Get all stored plans
   */
  const getPlans = useCallback((): Plan[] => {
    const service = getService();
    return service.getPlans();
  }, [getService]);

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.abort();
    }
    setIsRunning(false);
    setProgress(prev => prev ? {
      ...prev,
      status: 'error',
      error: 'Cancelled by user',
      message: 'Operation cancelled',
    } : null);
  }, []);

  return {
    progress,
    isRunning,
    currentPlan,
    workspaceContext,
    runPlanner,
    executePlan,
    runFullPipeline,
    getPlans,
    cancel,
    isAgentRequest,
    getAgentType,
    confirmPlan,
    rejectPlan,
    refreshContext: fetchWorkspaceContext,
  };
}

export default useAgentChat;
