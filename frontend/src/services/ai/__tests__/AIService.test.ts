/**
 * Tests for AIService - Model normalization and provider selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeModel, NormalizedModel } from '../AIService';

describe('AIService - Model Normalization', () => {
  describe('normalizeModel', () => {
    it('should normalize OpenAI models correctly', () => {
      const testCases: Array<{ input: string; expected: NormalizedModel }> = [
        { input: 'gpt-4', expected: { provider: 'openai', modelId: 'gpt-4' } },
        { input: 'gpt-4-turbo', expected: { provider: 'openai', modelId: 'gpt-4-turbo' } },
        { input: 'gpt-3.5-turbo', expected: { provider: 'openai', modelId: 'gpt-3.5-turbo' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeModel(input);
        expect(result).toEqual(expected);
      });
    });

    it('should normalize Anthropic models correctly', () => {
      const testCases: Array<{ input: string; expected: NormalizedModel }> = [
        { input: 'claude-3-opus', expected: { provider: 'anthropic', modelId: 'claude-3-opus-20240229' } },
        { input: 'claude-3-sonnet', expected: { provider: 'anthropic', modelId: 'claude-3-sonnet-20240229' } },
        { input: 'claude-3-haiku', expected: { provider: 'anthropic', modelId: 'claude-3-haiku-20240307' } },
        { input: 'claude-3-opus-20240229', expected: { provider: 'anthropic', modelId: 'claude-3-opus-20240229' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeModel(input);
        expect(result).toEqual(expected);
      });
    });

    it('should normalize Gemini models correctly', () => {
      const testCases: Array<{ input: string; expected: NormalizedModel }> = [
        { input: 'gemini-1.5-flash', expected: { provider: 'gemini', modelId: 'gemini-1.5-flash' } },
        { input: 'gemini-1.5-pro', expected: { provider: 'gemini', modelId: 'gemini-1.5-pro' } },
        { input: 'gemini-flash', expected: { provider: 'gemini', modelId: 'gemini-1.5-flash' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeModel(input);
        expect(result).toEqual(expected);
      });
    });

    it('should normalize OpenRouter models correctly', () => {
      const testCases: Array<{ input: string; expected: NormalizedModel }> = [
        { input: 'openai/gpt-3.5-turbo', expected: { provider: 'openrouter', modelId: 'openai/gpt-3.5-turbo' } },
        { input: 'anthropic/claude-3-haiku', expected: { provider: 'openrouter', modelId: 'anthropic/claude-3-haiku' } },
        { input: 'google/gemini-pro', expected: { provider: 'openrouter', modelId: 'google/gemini-pro' } },
        { input: 'meta-llama/llama-3-70b-instruct', expected: { provider: 'openrouter', modelId: 'meta-llama/llama-3-70b-instruct' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeModel(input);
        expect(result).toEqual(expected);
      });
    });

    it('should detect provider by prefix for unknown models', () => {
      expect(normalizeModel('gpt-5-future')).toEqual({ provider: 'openai', modelId: 'gpt-5-future' });
      expect(normalizeModel('claude-4-mega')).toEqual({ provider: 'anthropic', modelId: 'claude-4-mega' });
      expect(normalizeModel('gemini-2.0-ultra')).toEqual({ provider: 'gemini', modelId: 'gemini-2.0-ultra' });
      expect(normalizeModel('some-org/some-model')).toEqual({ provider: 'openrouter', modelId: 'some-org/some-model' });
    });

    it('should default to OpenAI for completely unknown models', () => {
      expect(normalizeModel('unknown-model')).toEqual({ provider: 'openai', modelId: 'unknown-model' });
    });
  });
});
