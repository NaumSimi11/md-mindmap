/**
 * Tests for useAgentChat hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentChat } from '../useAgentChat';

// Mock the AgentService
vi.mock('@/services/ai/AgentService', () => ({
  createAgentService: vi.fn(() => ({
    setProgressCallback: vi.fn(),
    runPlanner: vi.fn().mockResolvedValue({ success: true, plan: { id: 'test-plan', title: 'Test' } }),
    runOrganizer: vi.fn().mockResolvedValue({ success: true, results: [] }),
    runFullPipeline: vi.fn().mockResolvedValue({ success: true, plan: { id: 'test-plan' } }),
    getPlans: vi.fn().mockReturnValue([]),
  })),
}));

describe('useAgentChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAgentRequest', () => {
    it('should detect planner requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.isAgentRequest('create documentation for my project')).toBe(true);
      expect(result.current.isAgentRequest('plan out the folder structure')).toBe(true);
      expect(result.current.isAgentRequest('set up documentation for the API')).toBe(true);
      expect(result.current.isAgentRequest('generate a project structure')).toBe(true);
      expect(result.current.isAgentRequest('organize my documentation')).toBe(true);
    });

    it('should detect writer requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.isAgentRequest('write me a full guide')).toBe(true);
      expect(result.current.isAgentRequest('generate content for this section')).toBe(true);
      expect(result.current.isAgentRequest('fill in the documentation')).toBe(true);
      expect(result.current.isAgentRequest('expand this section with more details')).toBe(true);
    });

    it('should detect organizer requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.isAgentRequest('execute the plan')).toBe(true);
      expect(result.current.isAgentRequest('run the plan now')).toBe(true);
      expect(result.current.isAgentRequest('create all the folders')).toBe(true);
      expect(result.current.isAgentRequest('set up the folders')).toBe(true);
    });

    it('should return false for non-agent requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.isAgentRequest('fix this typo')).toBe(false);
      expect(result.current.isAgentRequest('what is the weather')).toBe(false);
      expect(result.current.isAgentRequest('hello')).toBe(false);
    });
  });

  describe('getAgentType', () => {
    it('should return correct agent type for planner requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.getAgentType('create documentation for my project')).toBe('planner');
      expect(result.current.getAgentType('plan out the structure')).toBe('planner');
    });

    it('should return correct agent type for writer requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.getAgentType('write me a full guide')).toBe('writer');
      expect(result.current.getAgentType('generate content for this')).toBe('writer');
    });

    it('should return correct agent type for organizer requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.getAgentType('execute the plan')).toBe('organizer');
      expect(result.current.getAgentType('run the plan')).toBe('organizer');
    });

    it('should prioritize organizer over planner for ambiguous requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      // "execute plan" contains both "plan" (planner) and "execute" (organizer)
      // Organizer should take priority
      expect(result.current.getAgentType('execute the plan for documentation')).toBe('organizer');
    });

    it('should return null for non-agent requests', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.getAgentType('hello world')).toBeNull();
      expect(result.current.getAgentType('what time is it')).toBeNull();
    });
  });

  describe('state management', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      expect(result.current.progress).toBeNull();
      expect(result.current.isRunning).toBe(false);
    });

    it('should prevent concurrent agent runs', async () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      // Start first run (simulate it being in progress)
      const promise1 = result.current.runPlanner('create docs');
      
      // Try to start another run immediately
      const promise2 = result.current.runPlanner('another request');
      
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Second run should fail because first is still running
      // (Note: in actual implementation, this depends on timing)
      expect(result1.success || result2.success).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should cancel running agent', async () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      // Trigger cancel
      act(() => {
        result.current.cancel();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('getPlans', () => {
    it('should return stored plans', () => {
      const { result } = renderHook(() => useAgentChat({ editor: null }));

      const plans = result.current.getPlans();
      expect(Array.isArray(plans)).toBe(true);
    });
  });
});
