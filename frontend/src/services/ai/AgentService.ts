/**
 * AgentService - Orchestrates autonomous AI agents
 * 
 * Agents:
 * - Planner: Creates structured plans with folder/file structure
 * - Writer: Generates document content
 * - Organizer: Executes plans (creates folders and documents)
 */

import { aiService } from './AIService';
import { AgentTools, Plan, AGENT_FUNCTION_SCHEMAS, AgentToolResult } from './AgentTools';
import { createStreamingParser } from './StreamingParser';

export type AgentType = 'planner' | 'writer' | 'organizer';

export interface AgentStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: any;
  error?: string;
}

export interface AgentProgress {
  agent: AgentType;
  status: 'idle' | 'planning' | 'executing' | 'complete' | 'error';
  message: string;
  steps: AgentStep[];
  progress: number; // 0-100
  plan?: Plan;
  error?: string;
}

export type AgentProgressCallback = (progress: AgentProgress) => void;

/**
 * Agent prompts optimized for function calling
 */
const AGENT_PROMPTS = {
  planner: `You are a context-aware documentation planning API. You respond ONLY with valid JSON.

CRITICAL RULES:
1. Check EXISTING WORKSPACE CONTENT before creating
2. If similar content exists: suggest updates or skip
3. NO natural language - ONLY JSON output
4. Documents go INSIDE folders (path must include folder prefix)

CONTEXT AWARENESS:
- If workspace has folders/docs, AVOID duplicates
- Suggest NEW content that complements existing
- Use "action": "skip" for items that already exist
- Use "action": "update" for items to modify
- Use "action": "create" for new items

PATH RULES:
- Folder path = "folder-name" (e.g., "docs")
- Document path = "folder-name/doc-name" (e.g., "docs/overview")

OUTPUT FORMAT:
\`\`\`json
{
  "function": "create_plan",
  "arguments": {
    "title": "Plan Title",
    "description": "What this plan covers",
    "existingContent": "List of existing items you're aware of",
    "structure": [
      {"type": "folder", "path": "docs", "name": "Documentation", "icon": "📚", "action": "create"},
      {"type": "document", "path": "docs/overview", "name": "Overview", "action": "create"},
      {"type": "document", "path": "docs/existing-doc", "name": "Existing Doc", "action": "skip", "reason": "Already exists"}
    ]
  }
}
\`\`\`

Your ENTIRE response = ONLY the JSON code block.`,

  writer: `You are a markdown content generator API. You respond ONLY with markdown content.

CRITICAL RULES:
1. NO questions or clarifications
2. NO explanations or meta-commentary
3. ONLY output the markdown content directly

FORMAT:
- Start with a # H1 title
- Include an introduction paragraph
- Use ## and ### for sections
- Add code examples in \`\`\` blocks where relevant
- Use bullet points and numbered lists
- End with a summary or next steps

Write professional, comprehensive documentation.`,

  organizer: `You are an organizer that executes plans by creating folders and documents.

When executing:
1. Create folders in order (parents first)
2. Create documents with content
3. Report progress

Use the execute_plan or batch_create functions.`,
};

/**
 * AgentService - Manages agent execution
 */
export class AgentService {
  private agentTools: AgentTools;
  private progress: AgentProgress;
  private onProgress?: AgentProgressCallback;
  private abortController?: AbortController;

  constructor(workspaceId: string) {
    this.agentTools = new AgentTools(workspaceId);
    this.progress = this.createInitialProgress('planner');
    
    // Connect tool progress to service progress
    this.agentTools.setProgressCallback((message, pct) => {
      this.updateProgress({ message, progress: pct });
    });
  }

  /**
   * Update workspace ID
   */
  setWorkspaceId(workspaceId: string): void {
    this.agentTools.setWorkspaceId(workspaceId);
  }

  /**
   * Create initial progress state
   */
  private createInitialProgress(agent: AgentType): AgentProgress {
    return {
      agent,
      status: 'idle',
      message: '',
      steps: [],
      progress: 0,
    };
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: AgentProgressCallback): void {
    this.onProgress = callback;
  }

  /**
   * Update and emit progress
   */
  private updateProgress(updates: Partial<AgentProgress>): void {
    this.progress = { ...this.progress, ...updates };
    this.onProgress?.(this.progress);
  }

  /**
   * Add a step
   */
  private addStep(description: string): string {
    const id = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const step: AgentStep = { id, description, status: 'pending' };
    this.progress.steps = [...this.progress.steps, step];
    this.onProgress?.(this.progress);
    return id;
  }

  /**
   * Update a step
   */
  private updateStep(id: string, updates: Partial<AgentStep>): void {
    this.progress.steps = this.progress.steps.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    
    // Recalculate progress
    const done = this.progress.steps.filter(s => s.status === 'done').length;
    const total = this.progress.steps.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    
    this.progress.progress = progress;
    this.onProgress?.(this.progress);
  }

  /**
   * Abort current operation
   */
  abort(): void {
    this.abortController?.abort();
    this.updateProgress({
      status: 'error',
      error: 'Cancelled by user',
      message: 'Operation cancelled',
    });
  }

  /**
   * Generate a fallback plan when AI doesn't return proper JSON
   */
  private generateFallbackPlan(request: string): {
    title: string;
    description: string;
    structure: Array<{
      type: 'folder' | 'document';
      path: string;
      name: string;
      description?: string;
      icon?: string;
    }>;
  } {
    // Extract keywords from the request
    const keywords = request.toLowerCase();
    
    // Clean up the request for title
    const title = request.length > 50 
      ? request.substring(0, 50) + '...' 
      : request;
    
    // Common documentation patterns based on keywords
    if (keywords.includes('auth') || keywords.includes('login') || keywords.includes('security')) {
      return {
        title: `Authentication Documentation`,
        description: `Documentation for: ${request}`,
        structure: [
          { type: 'folder', path: 'auth', name: 'Authentication', icon: '🔐', description: 'Authentication documentation' },
          { type: 'document', path: 'auth/overview', name: 'Overview', description: 'Authentication system overview' },
          { type: 'document', path: 'auth/login-flow', name: 'Login Flow', description: 'How users log in' },
          { type: 'document', path: 'auth/security', name: 'Security Best Practices', description: 'Security guidelines' },
        ],
      };
    }
    
    if (keywords.includes('api') || keywords.includes('endpoint') || keywords.includes('rest')) {
      return {
        title: `API Documentation`,
        description: `Documentation for: ${request}`,
        structure: [
          { type: 'folder', path: 'api', name: 'API Reference', icon: '🔌', description: 'API documentation' },
          { type: 'document', path: 'api/overview', name: 'API Overview', description: 'Introduction to the API' },
          { type: 'document', path: 'api/endpoints', name: 'Endpoints', description: 'Available API endpoints' },
          { type: 'document', path: 'api/authentication', name: 'API Auth', description: 'API authentication' },
        ],
      };
    }
    
    if (keywords.includes('react') || keywords.includes('component') || keywords.includes('frontend')) {
      return {
        title: `React Project Documentation`,
        description: `Documentation for: ${request}`,
        structure: [
          { type: 'folder', path: 'docs', name: 'Documentation', icon: '📚', description: 'Project documentation' },
          { type: 'document', path: 'docs/getting-started', name: 'Getting Started', description: 'Quick start guide' },
          { type: 'document', path: 'docs/components', name: 'Components', description: 'UI component reference' },
          { type: 'document', path: 'docs/architecture', name: 'Architecture', description: 'Project architecture' },
        ],
      };
    }
    
    // Generic fallback
    return {
      title: `Documentation: ${title}`,
      description: `Documentation for: ${request}`,
      structure: [
        { type: 'folder', path: 'docs', name: 'Documentation', icon: '📚', description: 'Documentation folder' },
        { type: 'document', path: 'docs/overview', name: 'Overview', description: 'Project overview' },
        { type: 'document', path: 'docs/getting-started', name: 'Getting Started', description: 'How to get started' },
        { type: 'document', path: 'docs/reference', name: 'Reference', description: 'Reference documentation' },
      ],
    };
  }

  /**
   * Run the Planner agent
   */
  async runPlanner(
    request: string,
    model: string = 'gemini-1.5-flash'
  ): Promise<{
    success: boolean;
    plan?: Plan;
    content?: string;
    error?: string;
  }> {
    this.abortController = new AbortController();
    this.progress = this.createInitialProgress('planner');
    this.updateProgress({ status: 'planning', message: 'Analyzing your request...' });

    const analyzeStepId = this.addStep('Analyzing request');
    this.updateStep(analyzeStepId, { status: 'running' });

    try {
      // Simple prompt - the base AGENT_PROMPTS.planner has all the instructions
      const prompt = `${AGENT_PROMPTS.planner}

USER REQUEST: "${request}"

Output ONLY the JSON code block. No other text.`;

      const parser = createStreamingParser();

      await aiService.generateContentStream(
        prompt,
        (chunk) => {
          parser.processChunk(chunk);
        },
        { model, temperature: 0.7, maxTokens: 4000 }
      );

      this.updateStep(analyzeStepId, { status: 'done' });

      const createStepId = this.addStep('Creating plan');
      this.updateStep(createStepId, { status: 'running' });

      const parsed = parser.finalize();
      
      // Debug logging
      console.log('🤖 Agent parsed response:', {
        hasFunctionCall: !!parsed.functionCall,
        functionName: parsed.functionCall?.name,
        arguments: parsed.functionCall?.arguments,
        displayContent: parsed.displayContent?.substring(0, 200),
      });

      if (parsed.functionCall && parsed.functionCall.name === 'create_plan') {
        const planResult = await this.agentTools.createPlan(parsed.functionCall.arguments);
        
        if (planResult.success) {
          this.updateStep(createStepId, { status: 'done', result: planResult });
          this.updateProgress({
            status: 'complete',
            message: `Plan created with ${planResult.data.plan.items.length} items`,
            plan: planResult.data.plan,
            progress: 100,
          });

          return {
            success: true,
            plan: planResult.data.plan,
            content: planResult.data.content,
          };
        } else {
          throw new Error(planResult.message);
        }
      } else {
        // No function call detected - try to create a fallback plan
        console.log('⚠️ No function call from AI, creating fallback plan from request:', request);
        
        // Generate a basic plan based on the user's request
        const fallbackPlan = this.generateFallbackPlan(request);
        const planResult = await this.agentTools.createPlan(fallbackPlan);
        
        if (planResult.success) {
          this.updateStep(createStepId, { status: 'done', result: planResult });
          this.updateProgress({
            status: 'complete',
            message: `Plan created with ${planResult.data.plan.items.length} items`,
            plan: planResult.data.plan,
            progress: 100,
          });

          return {
            success: true,
            plan: planResult.data.plan,
            content: planResult.data.content,
          };
        }
        
        // If fallback also fails, return text response
        this.updateStep(createStepId, { status: 'done' });
        this.updateProgress({ status: 'complete', progress: 100, message: 'Response generated' });
        
        return {
          success: true,
          content: parsed.displayContent || 'I can help you create a documentation plan. Could you be more specific about what you need?',
        };
      }
    } catch (error: any) {
      this.updateProgress({
        status: 'error',
        error: error.message,
        message: 'Planning failed',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the Writer agent to generate content for a document
   */
  async runWriter(
    title: string,
    description: string,
    context: string = '',
    model: string = 'gemini-1.5-flash'
  ): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    this.abortController = new AbortController();
    this.progress = this.createInitialProgress('writer');
    this.updateProgress({ status: 'executing', message: `Writing "${title}"...` });

    const writeStepId = this.addStep(`Writing "${title}"`);
    this.updateStep(writeStepId, { status: 'running' });

    try {
      const prompt = `${AGENT_PROMPTS.writer}

DOCUMENT TO WRITE:
Title: ${title}
Description: ${description}
${context ? `Context: ${context}` : ''}

Write the complete markdown content now. Start with # ${title}`;

      const parser = createStreamingParser();
      
      await aiService.generateContentStream(
        prompt,
        (chunk) => parser.processChunk(chunk),
        { model, temperature: 0.7, maxTokens: 4000 }
      );

      const parsed = parser.finalize();

      if (parsed.functionCall?.arguments?.content) {
        this.updateStep(writeStepId, { status: 'done' });
        this.updateProgress({ status: 'complete', progress: 100, message: 'Document written' });

        return {
          success: true,
          content: parsed.functionCall.arguments.content,
        };
      } else {
        // Use display content as fallback
        this.updateStep(writeStepId, { status: 'done' });
        this.updateProgress({ status: 'complete', progress: 100, message: 'Content generated' });
        
        return {
          success: true,
          content: parsed.displayContent || `# ${title}\n\n${description}`,
        };
      }
    } catch (error: any) {
      this.updateStep(writeStepId, { status: 'failed', error: error.message });
      this.updateProgress({ status: 'error', error: error.message, message: 'Writing failed' });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a plan - create all folders and documents
   */
  async executePlan(
    planId: string,
    options: {
      generateContent?: boolean;
      model?: string;
    } = {}
  ): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    const { generateContent = false, model = 'gemini-1.5-flash' } = options;
    
    this.abortController = new AbortController();
    this.progress = this.createInitialProgress('organizer');
    
    const plan = this.agentTools.getPlan(planId);
    if (!plan) {
      return { success: false, error: `Plan not found: ${planId}` };
    }

    this.updateProgress({
      status: 'executing',
      message: `Executing "${plan.title || 'Plan'}"...`,
      plan,
    });

    // Create steps for tracking
    const folders = plan.items?.filter(i => i.type === 'folder') || [];
    const docs = plan.items?.filter(i => i.type === 'document') || [];

    console.log('🚀 Executing plan:', { 
      title: plan.title, 
      folders: folders.length, 
      docs: docs.length 
    });

    // Map to track created folder IDs by path
    const folderIdMap = new Map<string, string>();

    // Step 1: Create folder structure (if any)
    let folderStepId: string | null = null;
    if (folders.length > 0) {
      folderStepId = this.addStep(`Creating ${folders.length} folders`);
      this.updateStep(folderStepId, { status: 'running' });
    }

    // Step 2-N: Create documents
    const docStepIds: string[] = [];
    for (const doc of docs) {
      const stepId = this.addStep(`Create: ${doc.name}`);
      docStepIds.push(stepId);
    }

    try {
      // If generating content, we need to write each document with AI
      if (generateContent) {
        // First create folders and track their IDs
        for (const folder of folders) {
          const result = await this.agentTools.createFolder({
            name: folder.name,
            icon: folder.icon,
          });
          console.log('📁 Folder created:', result);
          
          // Store folder ID by path for linking documents
          if (result.success && result.data?.id) {
            folderIdMap.set(folder.path, result.data.id);
            console.log(`📁 Mapped folder path "${folder.path}" to ID "${result.data.id}"`);
          }
        }
        
        // Mark folder step done
        if (folderStepId) {
          this.updateStep(folderStepId, { status: 'done' });
        }

        // Create documents with generated content - placed in proper folders
        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          const stepId = docStepIds[i];
          
          if (stepId) {
            this.updateStep(stepId, { status: 'running' });
          }
          
          // Determine parent folder from document path
          // e.g., "docs/getting-started" -> parent folder is "docs"
          const pathParts = doc.path.split('/');
          let parentFolderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : null;
          let folderId = parentFolderPath ? folderIdMap.get(parentFolderPath) : undefined;
          
          // Smart fallback: if no folder found but we have folders, use the first one
          // This handles cases where AI generates flat paths without folder prefixes
          if (!folderId && folders.length > 0 && folderIdMap.size > 0) {
            const firstFolderPath = folders[0].path;
            folderId = folderIdMap.get(firstFolderPath);
            console.log(`📄 Smart fallback: placing "${doc.name}" in first folder "${firstFolderPath}"`);
          }
          
          console.log(`📄 Creating "${doc.name}" in folder: ${parentFolderPath || 'auto'} (ID: ${folderId || 'none'})`);
          
          // Generate content with AI
          const writerResult = await this.runWriter(
            doc.name,
            doc.description || '',
            `Part of: ${plan.title || 'Documentation'}`,
            model
          );

          // Create the document in the proper folder
          const content = writerResult.success && writerResult.content
            ? writerResult.content
            : `# ${doc.name}\n\n${doc.description || 'Content coming soon...'}`;

          const docResult = await this.agentTools.createDocument({
            title: doc.name,
            content,
            folderId: folderId || undefined,
          });
          console.log('📄 Document created:', docResult);

          if (stepId) {
            this.updateStep(stepId, { status: 'done' });
          }
        }
      } else {
        // Execute without AI content generation (use batch)
        const result = await this.agentTools.executePlan({ planId });
        
        if (!result.success) {
          throw new Error(result.message);
        }

        // Mark all steps as done
        for (const step of this.progress.steps) {
          this.updateStep(step.id, { status: 'done' });
        }
      }
      
      // Dispatch events to trigger document/folder list refresh
      // Multiple dispatches to ensure UI catches the update
      console.log('📣 [AgentService] Dispatching documents:created event...', {
        folders: folders.length,
        documents: docs.length
      });
      
      const refreshEvent = new CustomEvent('documents:created', { 
        detail: { folders: folders.length, documents: docs.length } 
      });
      
      window.dispatchEvent(refreshEvent);
      console.log('📣 [AgentService] Event dispatched #1 (immediate)');
      
      setTimeout(() => {
        console.log('📣 [AgentService] Dispatching event #2 (800ms)');
        window.dispatchEvent(refreshEvent);
      }, 800);
      
      setTimeout(() => {
        console.log('📣 [AgentService] Dispatching event #3 (1500ms)');
        window.dispatchEvent(refreshEvent);
      }, 1500);

      this.updateProgress({
        status: 'complete',
        message: `Created ${folders.length} folders and ${docs.length} documents`,
        progress: 100,
      });

      return {
        success: true,
        results: this.progress.steps,
      };
    } catch (error: any) {
      this.updateProgress({
        status: 'error',
        error: error.message,
        message: 'Execution failed',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the full pipeline: Plan → Review → Execute
   */
  async runFullPipeline(
    request: string,
    options: {
      model?: string;
      generateContent?: boolean;
      autoExecute?: boolean;
      onPlanReady?: (plan: Plan) => Promise<boolean>;
    } = {}
  ): Promise<{
    success: boolean;
    plan?: Plan;
    results?: any;
    error?: string;
  }> {
    const {
      model = 'gemini-1.5-flash',
      generateContent = true,
      autoExecute = false,
      onPlanReady,
    } = options;

    // Phase 1: Planning
    const planResult = await this.runPlanner(request, model);
    
    if (!planResult.success || !planResult.plan) {
      return { success: false, error: planResult.error || 'Planning failed' };
    }

    // If not auto-executing, wait for confirmation
    if (!autoExecute && onPlanReady) {
      const proceed = await onPlanReady(planResult.plan);
      if (!proceed) {
        return { success: true, plan: planResult.plan, error: 'User cancelled execution' };
      }
    }

    // Phase 2: Execution
    if (autoExecute || (onPlanReady && await onPlanReady(planResult.plan))) {
      const executeResult = await this.executePlan(planResult.plan.id, {
        generateContent,
        model,
      });

      return {
        success: executeResult.success,
        plan: planResult.plan,
        results: executeResult.results,
        error: executeResult.error,
      };
    }

    return {
      success: true,
      plan: planResult.plan,
    };
  }

  /**
   * Get current progress
   */
  getProgress(): AgentProgress {
    return this.progress;
  }

  /**
   * Get all stored plans
   */
  getPlans(): Plan[] {
    return this.agentTools.getAllPlans();
  }

  /**
   * Get a specific plan
   */
  getPlan(planId: string): Plan | null {
    return this.agentTools.getPlan(planId);
  }
}

/**
 * Create an agent service instance
 */
export function createAgentService(workspaceId: string): AgentService {
  return new AgentService(workspaceId);
}

export default AgentService;
