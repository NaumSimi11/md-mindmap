/**
 * WorkspaceInitializer - Manages workspace setup for Tauri desktop app
 * 
 * Responsibilities:
 * - Check if workspace is configured
 * - Prompt user for workspace location
 * - Create default folder structure
 * - Save workspace configuration
 * - Load existing workspace
 */

import { invoke } from '@tauri-apps/api/core';
import { isDesktop } from '@/utils/platform';

export interface WorkspaceConfig {
  workspace_path: string;
  recent_files: string[];
  last_opened: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  modified: string;
  is_directory: boolean;
}

export class WorkspaceInitializer {
  private workspacePath: string | null = null;

  /**
   * Initialize workspace on app startup
   * Returns the workspace path or null if not in desktop mode
   */
  async initialize(): Promise<string | null> {
    if (!isDesktop()) {
      return null;
    }


    try {
      // 1. Check if workspace is already configured
      const isConfigured = await invoke<boolean>('is_workspace_configured');
      
      if (isConfigured) {
        const config = await invoke<WorkspaceConfig>('load_workspace_config_v2');
        this.workspacePath = config.workspace_path;
        
        // Verify the path still exists
        const isValid = await invoke<boolean>('verify_workspace_path', { 
          path: this.workspacePath 
        });
        
        if (isValid) {
          return this.workspacePath;
        } else {
          console.warn('⚠️ Configured workspace path no longer exists, reinitializing...');
          // Fall through to setup
        }
      }

      // 2. First-time setup
      await this.setupNewWorkspace();
      return this.workspacePath;

    } catch (error) {
      console.error('❌ Failed to initialize workspace:', error);
      throw error;
    }
  }

  /**
   * Setup a new workspace (first-time user experience)
   */
  private async setupNewWorkspace(): Promise<void> {

    // 1. Get default workspace path
    const defaultPath = await invoke<string>('get_default_workspace_location');

    // 2. Ask user if they want to use default or choose custom location
    const useDefault = await this.promptUserForWorkspaceLocation(defaultPath);
    
    let workspacePath: string;
    
    if (useDefault) {
      workspacePath = defaultPath;
    } else {
      // User wants to choose custom location
      try {
        workspacePath = await invoke<string>('select_workspace_folder');
      } catch (error) {
        // User cancelled, use default
        workspacePath = defaultPath;
      }
    }

    // 3. Create workspace folder structure
    await this.createWorkspaceStructure(workspacePath);

    // 4. Save workspace configuration
    await this.saveWorkspaceConfig(workspacePath);

    this.workspacePath = workspacePath;
  }

  /**
   * Prompt user to choose workspace location
   */
  private async promptUserForWorkspaceLocation(defaultPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      `;

      modal.innerHTML = `
        <div style="
          background: #1a1a2e;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <h2 style="
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
          ">
            <span style="font-size: 32px;">🚀</span>
            Welcome to MDReader!
          </h2>
          
          <p style="
            margin: 0 0 24px 0;
            color: #a0a0b0;
            line-height: 1.6;
            font-size: 15px;
          ">
            MDReader stores your documents as <strong style="color: #fff;">.md files</strong> on your computer.
            Choose where you'd like to create your workspace folder.
          </p>

          <div style="
            background: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
            ">
              <span style="font-size: 24px;">📁</span>
              <strong style="color: #fff; font-size: 16px;">Default Location</strong>
            </div>
            <code style="
              display: block;
              background: rgba(0, 0, 0, 0.3);
              padding: 12px;
              border-radius: 8px;
              color: #a0a0b0;
              font-size: 13px;
              font-family: 'Monaco', 'Menlo', monospace;
              word-break: break-all;
            ">${defaultPath}</code>
          </div>

          <div style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          ">
            <button id="choose-custom-btn" style="
              padding: 12px 24px;
              background: transparent;
              color: #a0a0b0;
              border: 1px solid rgba(160, 160, 176, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(160, 160, 176, 0.5)';" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(160, 160, 176, 0.3)';">
              Choose Folder...
            </button>
            <button id="use-default-btn" style="
              padding: 12px 24px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">
              Use Default Location
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const useDefaultBtn = modal.querySelector('#use-default-btn');
      const chooseCustomBtn = modal.querySelector('#choose-custom-btn');

      useDefaultBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });

      chooseCustomBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
    });
  }

  /**
   * Create default folder structure in workspace
   */
  private async createWorkspaceStructure(workspacePath: string): Promise<void> {

    try {
      // Create default folders
      const folders = await invoke<string[]>('create_default_folders', { 
        workspace_path: workspacePath 
      });

      // Create welcome document
      const welcomePath = await invoke<string>('create_welcome_document', { 
        workspace_path: workspacePath 
      });

    } catch (error) {
      console.error('❌ Failed to create workspace structure:', error);
      throw new Error(`Failed to create workspace structure: ${error}`);
    }
  }

  /**
   * Save workspace configuration
   */
  private async saveWorkspaceConfig(workspacePath: string): Promise<void> {
    const now = new Date().toISOString();
    
    const config: WorkspaceConfig = {
      workspace_path: workspacePath,
      recent_files: [],
      last_opened: null,
      created_at: now,
      updated_at: now,
    };

    try {
      await invoke('save_workspace_config_v2', { config });
    } catch (error) {
      console.error('❌ Failed to save workspace config:', error);
      throw error;
    }
  }

  /**
   * Get current workspace path
   */
  getWorkspacePath(): string | null {
    return this.workspacePath;
  }

  /**
   * List contents of workspace directory
   */
  async listWorkspaceContents(directoryPath?: string): Promise<FileMetadata[]> {
    const path = directoryPath || this.workspacePath;
    
    if (!path) {
      throw new Error('No workspace path available');
    }

    try {
      const contents = await invoke<FileMetadata[]>('list_workspace_contents', { 
        directory_path: path 
      });
      return contents;
    } catch (error) {
      console.error('❌ Failed to list workspace contents:', error);
      return [];
    }
  }

  /**
   * Get all folders in workspace (recursively)
   */
  async getAllFolders(): Promise<FileMetadata[]> {
    if (!this.workspacePath) {
      return [];
    }

    const contents = await this.listWorkspaceContents();
    return contents.filter(item => item.is_directory);
  }

  /**
   * Get all markdown files in workspace
   */
  async getAllDocuments(): Promise<FileMetadata[]> {
    if (!this.workspacePath) {
      return [];
    }

    const contents = await this.listWorkspaceContents();
    return contents.filter(item => !item.is_directory && item.name.endsWith('.md'));
  }

  /**
   * Reset workspace (for testing)
   */
  reset(): void {
    this.workspacePath = null;
  }
}

// Singleton instance
export const workspaceInitializer = new WorkspaceInitializer();

