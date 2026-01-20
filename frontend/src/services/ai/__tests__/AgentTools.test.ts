/**
 * Tests for AgentTools - Agent function implementations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentTools, AGENT_FUNCTION_SCHEMAS, Plan } from '../AgentTools';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AgentTools', () => {
  let agentTools: AgentTools;

  beforeEach(() => {
    localStorageMock.clear();
    agentTools = new AgentTools(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getFunctionSchemas', () => {
    it('should return all function schemas', () => {
      const schemas = AgentTools.getFunctionSchemas();
      
      expect(schemas).toHaveLength(5);
      expect(schemas.map(s => s.name)).toContain('create_plan');
      expect(schemas.map(s => s.name)).toContain('create_folder');
      expect(schemas.map(s => s.name)).toContain('create_document');
      expect(schemas.map(s => s.name)).toContain('batch_create');
      expect(schemas.map(s => s.name)).toContain('execute_plan');
    });
  });

  describe('createPlan', () => {
    it('should create a plan successfully', async () => {
      const result = await agentTools.createPlan({
        title: 'Test Project',
        description: 'A test project plan',
        structure: [
          { type: 'folder', path: 'docs', name: 'Documentation' },
          { type: 'document', path: 'docs/README.md', name: 'README' },
        ],
        tasks: [
          { task: 'Create folder structure' },
          { task: 'Write documentation' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.plan).toBeDefined();
      expect(result.data.plan.title).toBe('Test Project');
      expect(result.data.plan.items).toHaveLength(2);
      expect(result.data.plan.tasks).toHaveLength(2);
      expect(result.data.content).toContain('# Test Project');
    });

    it('should store the plan in localStorage', async () => {
      await agentTools.createPlan({
        title: 'Stored Plan',
        structure: [{ type: 'folder', path: 'test', name: 'Test' }],
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const storedPlans = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(Object.values(storedPlans)).toHaveLength(1);
    });

    it('should generate markdown with tree structure', async () => {
      const result = await agentTools.createPlan({
        title: 'Nested Structure',
        structure: [
          { type: 'folder', path: 'docs', name: 'Documentation', icon: '📚' },
          { type: 'folder', path: 'docs/api', name: 'API Reference', icon: '🔌' },
          { type: 'document', path: 'docs/api/auth.md', name: 'Authentication' },
        ],
      });

      expect(result.data.content).toContain('📚');
      expect(result.data.content).toContain('Documentation');
      expect(result.data.content).toContain('API Reference');
    });
  });

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      const result = await agentTools.createFolder({
        name: 'New Folder',
        icon: '📁',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('New Folder');
      expect(result.data.name).toBe('New Folder');
      expect(result.data.icon).toBe('📁');
    });

    it('should handle parent path', async () => {
      const result = await agentTools.createFolder({
        name: 'Subfolder',
        parentPath: 'docs',
      });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('docs/Subfolder');
    });
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      const result = await agentTools.createDocument({
        title: 'Test Document',
        content: 'Hello this is a test',
      });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Document');
      expect(result.data.wordCount).toBe(5);
    });

    it('should handle folder path', async () => {
      const result = await agentTools.createDocument({
        title: 'README',
        content: '# README',
        folderPath: 'docs',
      });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('docs/README');
    });
  });

  describe('batchCreate', () => {
    it('should create multiple items', async () => {
      const result = await agentTools.batchCreate({
        operations: [
          { type: 'folder', path: 'docs', name: 'Documentation' },
          { type: 'document', path: 'docs/README.md', name: 'README', content: '# README' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.successCount).toBe(2);
      expect(result.data.failCount).toBe(0);
    });

    it('should sort folders before documents', async () => {
      const result = await agentTools.batchCreate({
        operations: [
          { type: 'document', path: 'docs/README.md', name: 'README' },
          { type: 'folder', path: 'docs', name: 'Documentation' },
        ],
      });

      expect(result.success).toBe(true);
      // Folders should be created first
      expect(result.data.results[0].operation.type).toBe('folder');
    });
  });

  describe('executePlan', () => {
    it('should execute a stored plan', async () => {
      // First create a plan
      await agentTools.createPlan({
        title: 'Execute Test',
        structure: [
          { type: 'folder', path: 'test', name: 'Test Folder' },
        ],
      });

      // Get the plan ID
      const plans = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      const planId = Object.keys(plans)[0];

      // Execute the plan
      const result = await agentTools.executePlan({ planId });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Execute Test');
    });

    it('should support dry run mode', async () => {
      // Create a plan
      await agentTools.createPlan({
        title: 'Dry Run Test',
        structure: [
          { type: 'folder', path: 'test', name: 'Test' },
        ],
      });

      const plans = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      const planId = Object.keys(plans)[0];

      const result = await agentTools.executePlan({ planId, dryRun: true });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Dry run');
      expect(result.data.wouldCreate).toHaveLength(1);
    });

    it('should return error for non-existent plan', async () => {
      const result = await agentTools.executePlan({ planId: 'non-existent' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('executeFunction', () => {
    it('should route to correct function', async () => {
      const createPlanSpy = vi.spyOn(agentTools, 'createPlan');
      const createFolderSpy = vi.spyOn(agentTools, 'createFolder');

      await agentTools.executeFunction('create_plan', { title: 'Test', structure: [] });
      expect(createPlanSpy).toHaveBeenCalled();

      await agentTools.executeFunction('create_folder', { name: 'Test' });
      expect(createFolderSpy).toHaveBeenCalled();
    });

    it('should return error for unknown function', async () => {
      const result = await agentTools.executeFunction('unknown_function', {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown function');
    });
  });
});

describe('AGENT_FUNCTION_SCHEMAS', () => {
  it('should have valid schema structure', () => {
    Object.values(AGENT_FUNCTION_SCHEMAS).forEach(schema => {
      expect(schema.name).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.parameters).toBeDefined();
      expect(schema.parameters.type).toBe('object');
      expect(schema.parameters.properties).toBeDefined();
    });
  });

  it('should have required fields defined', () => {
    expect(AGENT_FUNCTION_SCHEMAS.create_plan.parameters.required).toContain('title');
    expect(AGENT_FUNCTION_SCHEMAS.create_folder.parameters.required).toContain('name');
    expect(AGENT_FUNCTION_SCHEMAS.create_document.parameters.required).toContain('title');
    expect(AGENT_FUNCTION_SCHEMAS.batch_create.parameters.required).toContain('operations');
    expect(AGENT_FUNCTION_SCHEMAS.execute_plan.parameters.required).toContain('planId');
  });
});
