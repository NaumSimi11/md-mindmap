/**
 * AgentTools - Real workspace operations for AI agents
 * 
 * This module provides actual folder/document creation capabilities
 * connected to the backend services.
 */

import { documentService, DocumentService } from '@/services/api/DocumentService';
import { folderService, FolderService, Folder, CreateFolderData } from '@/services/api/FolderService';
import type { Document, DocumentCreate } from '@/types/api.types';

export interface AgentToolResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Plan structure definition
 */
export interface PlanItem {
  id: string;
  type: 'folder' | 'document';
  path: string;
  name: string;
  description?: string;
  content?: string;
  icon?: string;
  parentId?: string; // Actual folder ID after creation
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  items: PlanItem[];
  tasks: PlanTask[];
  createdAt: Date;
  status: 'draft' | 'ready' | 'executing' | 'completed' | 'failed';
  workspaceId?: string;
  createdFolders?: Map<string, string>; // path -> folderId mapping
}

export interface PlanTask {
  id: string;
  task: string;
  status: 'pending' | 'in-progress' | 'done' | 'failed';
  itemId?: string;
}

/**
 * Batch operation types
 */
export interface BatchOperation {
  type: 'folder' | 'document';
  path: string;
  name: string;
  content?: string;
  icon?: string;
}

/**
 * Agent function schemas for AI
 */
export const AGENT_FUNCTION_SCHEMAS = {
  create_plan: {
    name: 'create_plan',
    description: 'Create a structured plan for documentation or project structure. Use this when the user wants to create documentation, project structure, or organize content.',
    parameters: {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          description: 'Title of the plan' 
        },
        description: { 
          type: 'string', 
          description: 'Brief description of what the plan will accomplish' 
        },
        structure: {
          type: 'array',
          description: 'Array of folders and documents to create',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['folder', 'document'] },
              path: { type: 'string', description: 'Path like "docs/api" or "guides/getting-started"' },
              name: { type: 'string', description: 'Display name' },
              description: { type: 'string', description: 'What this item contains' },
              icon: { type: 'string', description: 'Emoji icon' }
            },
            required: ['type', 'path', 'name']
          }
        },
        tasks: {
          type: 'array',
          description: 'List of tasks to complete',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string', description: 'Task description' },
              status: { type: 'string', enum: ['pending', 'in-progress', 'done'] }
            },
            required: ['task']
          }
        }
      },
      required: ['title', 'structure']
    }
  },

  create_folder: {
    name: 'create_folder',
    description: 'Create a new folder in the current workspace',
    parameters: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Folder name' 
        },
        parentId: { 
          type: 'string', 
          description: 'Parent folder ID (null for root)' 
        },
        icon: { 
          type: 'string', 
          description: 'Emoji icon for the folder' 
        }
      },
      required: ['name']
    }
  },

  create_document: {
    name: 'create_document',
    description: 'Create a new document with markdown content',
    parameters: {
      type: 'object',
      properties: {
        title: { 
          type: 'string', 
          description: 'Document title' 
        },
        content: { 
          type: 'string', 
          description: 'Markdown content for the document' 
        },
        folderId: { 
          type: 'string', 
          description: 'Target folder ID (null for root)' 
        }
      },
      required: ['title', 'content']
    }
  },

  batch_create: {
    name: 'batch_create',
    description: 'Create multiple folders and documents in one operation',
    parameters: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          description: 'Array of create operations',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['folder', 'document'] },
              path: { type: 'string', description: 'Full path for the item' },
              name: { type: 'string', description: 'Name of the item' },
              content: { type: 'string', description: 'Content (for documents)' },
              icon: { type: 'string', description: 'Icon (for folders)' }
            },
            required: ['type', 'path', 'name']
          }
        }
      },
      required: ['operations']
    }
  },

  execute_plan: {
    name: 'execute_plan',
    description: 'Execute a previously created plan, creating all folders and documents',
    parameters: {
      type: 'object',
      properties: {
        planId: { 
          type: 'string', 
          description: 'ID of the plan to execute' 
        },
        generateContent: { 
          type: 'boolean', 
          description: 'Whether to generate AI content for documents' 
        }
      },
      required: ['planId']
    }
  }
};

/**
 * Progress callback type
 */
export type ProgressCallback = (message: string, progress: number) => void;

/**
 * AgentTools class - Executes real workspace operations
 */
export class AgentTools {
  private workspaceId: string;
  private docService: DocumentService;
  private fldService: FolderService;
  private onProgress?: ProgressCallback;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.docService = documentService;
    this.fldService = folderService;
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: ProgressCallback): void {
    this.onProgress = callback;
  }

  /**
   * Update workspace ID
   */
  setWorkspaceId(workspaceId: string): void {
    this.workspaceId = workspaceId;
  }

  /**
   * Get all agent function schemas
   */
  static getFunctionSchemas() {
    return Object.values(AGENT_FUNCTION_SCHEMAS);
  }

  /**
   * Report progress
   */
  private reportProgress(message: string, progress: number): void {
    this.onProgress?.(message, progress);
  }

  /**
   * Create a plan document (stores in localStorage for later execution)
   */
  async createPlan(args: {
    title?: string;
    name?: string; // Alternative key some models use
    description?: string;
    structure?: Array<{
      type: 'folder' | 'document';
      path: string;
      name: string;
      description?: string;
      icon?: string;
    }>;
    items?: Array<{
      type: 'folder' | 'document';
      path: string;
      name: string;
      description?: string;
      icon?: string;
    }>; // Alternative key
    tasks?: Array<{
      task: string;
      status?: 'pending' | 'in-progress' | 'done';
    }>;
  }): Promise<AgentToolResult> {
    try {
      const planId = `plan-${Date.now()}`;
      
      this.reportProgress('Creating plan...', 10);

      // Handle alternative key names from AI responses
      const planTitle = args.title || args.name || 'Documentation Plan';
      const planStructure = args.structure || args.items || [];

      // Validate we have something to create
      if (planStructure.length === 0) {
        return {
          success: false,
          message: 'No items in plan structure. Please try again with a more specific request.',
        };
      }

      // Generate plan markdown for preview
      const planContent = this.generatePlanMarkdown({
        title: planTitle,
        description: args.description,
        structure: planStructure,
        tasks: args.tasks,
      });

      const plan: Plan = {
        id: planId,
        title: planTitle,
        description: args.description || '',
        items: planStructure.map((item, idx) => ({
          id: `item-${idx}`,
          type: item.type,
          path: item.path,
          name: item.name,
          description: item.description,
          icon: item.icon,
        })),
        tasks: (args.tasks || []).map((task, idx) => ({
          id: `task-${idx}`,
          task: task.task,
          status: task.status || 'pending',
        })),
        createdAt: new Date(),
        status: 'ready',
        workspaceId: this.workspaceId,
        createdFolders: new Map(),
      };

      // Store plan
      this.storePlan(plan);

      this.reportProgress('Plan created!', 100);

      return {
        success: true,
        message: `Created plan "${args.title}" with ${args.structure.length} items`,
        data: {
          plan,
          content: planContent,
          planId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create plan: ${error.message}`,
      };
    }
  }

  /**
   * Generate markdown preview for a plan
   */
  private generatePlanMarkdown(args: {
    title: string;
    description?: string;
    structure: Array<{
      type: 'folder' | 'document';
      path: string;
      name: string;
      description?: string;
      icon?: string;
    }>;
    tasks?: Array<{
      task: string;
      status?: 'pending' | 'in-progress' | 'done';
    }>;
  }): string {
    let md = `# 📋 ${args.title}\n\n`;
    
    if (args.description) {
      md += `${args.description}\n\n`;
    }

    md += `## 📁 Structure\n\n`;
    
    // Group by folder hierarchy
    const folders = args.structure.filter(s => s.type === 'folder');
    const docs = args.structure.filter(s => s.type === 'document');

    for (const folder of folders) {
      const icon = folder.icon || '📁';
      const depth = (folder.path.match(/\//g) || []).length;
      const indent = '  '.repeat(depth);
      md += `${indent}- ${icon} **${folder.name}**`;
      if (folder.description) {
        md += ` - ${folder.description}`;
      }
      md += '\n';
    }

    for (const doc of docs) {
      const icon = doc.icon || '📄';
      const depth = (doc.path.match(/\//g) || []).length;
      const indent = '  '.repeat(depth);
      md += `${indent}- ${icon} ${doc.name}`;
      if (doc.description) {
        md += ` - ${doc.description}`;
      }
      md += '\n';
    }
    
    md += `\n## ✅ Tasks\n\n`;
    
    if (args.tasks && args.tasks.length > 0) {
      for (const task of args.tasks) {
        const checkbox = task.status === 'done' ? '[x]' : '[ ]';
        md += `- ${checkbox} ${task.task}\n`;
      }
    } else {
      md += `- [ ] Create ${folders.length} folders\n`;
      md += `- [ ] Create ${docs.length} documents\n`;
    }

    return md;
  }

  /**
   * Store plan in localStorage
   */
  private storePlan(plan: Plan): void {
    const plans = this.getStoredPlans();
    // Convert Map to object for storage
    const planToStore = {
      ...plan,
      createdFolders: plan.createdFolders ? Object.fromEntries(plan.createdFolders) : {},
    };
    plans[plan.id] = planToStore;
    localStorage.setItem('ai-agent-plans', JSON.stringify(plans));
  }

  /**
   * Get stored plans
   */
  private getStoredPlans(): Record<string, any> {
    try {
      return JSON.parse(localStorage.getItem('ai-agent-plans') || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Get a specific plan by ID
   */
  getPlan(planId: string): Plan | null {
    const plans = this.getStoredPlans();
    const storedPlan = plans[planId];
    if (!storedPlan) return null;
    
    // Convert stored object back to Map
    return {
      ...storedPlan,
      createdAt: new Date(storedPlan.createdAt),
      createdFolders: new Map(Object.entries(storedPlan.createdFolders || {})),
    };
  }

  /**
   * Get all stored plans
   */
  getAllPlans(): Plan[] {
    const plans = this.getStoredPlans();
    return Object.values(plans).map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      createdFolders: new Map(Object.entries(p.createdFolders || {})),
    }));
  }

  /**
   * Create a folder - REAL IMPLEMENTATION
   */
  async createFolder(args: {
    name: string;
    parentId?: string | null;
    icon?: string;
  }): Promise<AgentToolResult> {
    try {
      // Validate workspace ID
      if (!this.workspaceId || this.workspaceId === 'default') {
        return {
          success: false,
          message: `Invalid workspace ID. Please ensure you're logged in and have a workspace selected.`,
        };
      }

      this.reportProgress(`Creating folder "${args.name}"...`, 0);

      const folderData: CreateFolderData = {
        name: args.name,
        icon: args.icon || '📁',
        parent_id: args.parentId || null,
      };

      const folder = await this.fldService.createFolder(this.workspaceId, folderData);

      // Validate response
      if (!folder || !folder.id) {
        return {
          success: false,
          message: `Failed to create folder "${args.name}": Invalid response from server`,
        };
      }

      this.reportProgress(`Created folder "${args.name}"`, 100);

      return {
        success: true,
        message: `Created folder "${args.name}"`,
        data: {
          id: folder.id,
          name: folder.name,
          icon: folder.icon,
        },
      };
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      return {
        success: false,
        message: `Failed to create folder "${args.name}": ${error.message}`,
      };
    }
  }

  /**
   * Create a document - REAL IMPLEMENTATION
   */
  async createDocument(args: {
    title: string;
    content: string;
    folderId?: string | null;
  }): Promise<AgentToolResult> {
    try {
      // Validate workspace ID
      if (!this.workspaceId || this.workspaceId === 'default') {
        return {
          success: false,
          message: `Invalid workspace ID. Please ensure you're logged in and have a workspace selected.`,
        };
      }

      this.reportProgress(`Creating document "${args.title}"...`, 0);

      const docData: DocumentCreate & { folder_id?: string } = {
        title: args.title,
        content: args.content,
        content_type: 'markdown',
        workspace_id: this.workspaceId,
      };

      if (args.folderId) {
        docData.folder_id = args.folderId;
        console.log(`📄 Creating "${args.title}" with folder_id: ${args.folderId}`);
      } else {
        console.log(`📄 Creating "${args.title}" at root (no folder_id)`);
      }

      const document = await this.docService.createDocument(docData);

      // Validate response
      if (!document || !document.id) {
        return {
          success: false,
          message: `Failed to create document "${args.title}": Invalid response from server`,
        };
      }

      this.reportProgress(`Created document "${args.title}"`, 100);

      return {
        success: true,
        message: `Created document "${args.title}"`,
        data: {
          id: document.id,
          title: document.title,
          wordCount: args.content.split(/\s+/).length,
        },
      };
    } catch (error: any) {
      console.error('Failed to create document:', error);
      return {
        success: false,
        message: `Failed to create document "${args.title}": ${error.message}`,
      };
    }
  }

  /**
   * Batch create folders and documents
   */
  async batchCreate(args: {
    operations: BatchOperation[];
  }): Promise<AgentToolResult> {
    const results: Array<{ operation: BatchOperation; result: AgentToolResult }> = [];
    let successCount = 0;
    let failCount = 0;

    // Sort: folders first (by path depth), then documents
    const sortedOps = [...args.operations].sort((a, b) => {
      if (a.type === 'folder' && b.type === 'document') return -1;
      if (a.type === 'document' && b.type === 'folder') return 1;
      // Sort folders by depth (parents first)
      const depthA = (a.path.match(/\//g) || []).length;
      const depthB = (b.path.match(/\//g) || []).length;
      return depthA - depthB;
    });

    // Track created folders by path for document placement
    const folderIdByPath = new Map<string, string>();
    const total = sortedOps.length;

    for (let i = 0; i < sortedOps.length; i++) {
      const op = sortedOps[i];
      const progress = Math.round(((i + 1) / total) * 100);
      
      let result: AgentToolResult;

      if (op.type === 'folder') {
        // Find parent folder ID by path
        const parentPath = this.getParentPath(op.path);
        const parentId = parentPath ? folderIdByPath.get(parentPath) : null;

        result = await this.createFolder({
          name: op.name,
          parentId: parentId || undefined,
          icon: op.icon,
        });

        // Store folder ID for child items
        if (result.success && result.data?.id) {
          folderIdByPath.set(op.path, result.data.id);
        }
      } else {
        // Find parent folder ID
        const parentPath = this.getParentPath(op.path);
        const folderId = parentPath ? folderIdByPath.get(parentPath) : null;

        result = await this.createDocument({
          title: op.name,
          content: op.content || `# ${op.name}\n\nContent coming soon...`,
          folderId: folderId || undefined,
        });
      }

      results.push({ operation: op, result });
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      this.reportProgress(
        `Created ${successCount} of ${total} items`,
        progress
      );
    }

    return {
      success: failCount === 0,
      message: `Created ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}`,
      data: { results, successCount, failCount, folderIdByPath: Object.fromEntries(folderIdByPath) },
    };
  }

  /**
   * Execute a plan - creates all folders and documents
   */
  async executePlan(args: {
    planId: string;
    generateContent?: boolean;
  }): Promise<AgentToolResult> {
    const plan = this.getPlan(args.planId);
    
    if (!plan) {
      return {
        success: false,
        message: `Plan not found: ${args.planId}`,
      };
    }

    this.reportProgress(`Executing plan "${plan.title}"...`, 5);

    // Update plan status
    plan.status = 'executing';
    this.storePlan(plan);

    // Convert plan items to batch operations
    const operations: BatchOperation[] = plan.items.map(item => ({
      type: item.type,
      path: item.path,
      name: item.name,
      content: item.content || (item.type === 'document' ? `# ${item.name}\n\n${item.description || 'Content coming soon...'}` : undefined),
      icon: item.icon,
    }));

    const result = await this.batchCreate({ operations });

    // Update plan status
    plan.status = result.success ? 'completed' : 'failed';
    if (result.data?.folderIdByPath) {
      plan.createdFolders = new Map(Object.entries(result.data.folderIdByPath));
    }
    this.storePlan(plan);

    return {
      success: result.success,
      message: `Executed plan "${plan.title}": ${result.message}`,
      data: {
        plan,
        ...result.data,
      },
    };
  }

  /**
   * Get parent path from full path
   */
  private getParentPath(path: string): string | undefined {
    const parts = path.split('/').filter(p => p);
    if (parts.length <= 1) return undefined;
    return parts.slice(0, -1).join('/');
  }

  /**
   * Execute a function by name
   */
  async executeFunction(name: string, args: any): Promise<AgentToolResult> {
    switch (name) {
      case 'create_plan':
        return this.createPlan(args);
      case 'create_folder':
        return this.createFolder(args);
      case 'create_document':
        return this.createDocument(args);
      case 'batch_create':
        return this.batchCreate(args);
      case 'execute_plan':
        return this.executePlan(args);
      default:
        return {
          success: false,
          message: `Unknown function: ${name}`,
        };
    }
  }
}

export default AgentTools;
