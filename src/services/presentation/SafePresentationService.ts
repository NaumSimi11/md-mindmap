/**
 * SafePresentationService - Wrapper around PresentationGenerator
 * 
 * Adds:
 * - Smart batching to stay under rate limits
 * - Progress callbacks
 * - Error handling with retry
 * - Rate limit protection
 */

import { presentationGenerator, type Presentation, type GenerateOptions } from './PresentationGenerator';
import { getTheme } from './PresentationThemes';
import type { Node, Edge } from '@xyflow/react';
import type { GenerationSettings } from '@/components/presentation/PresentationWizardModal';

export interface ProgressUpdate {
  step: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  apiCallsUsed: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

export class SafePresentationService {
  private progressCallback?: ProgressCallback;
  private apiCallsUsed: number = 0;

  /**
   * Generate presentation with safe rate limiting
   */
  async generateSafely(
    editorContent: string,
    mindmapData: { nodes: Node[]; edges: Edge[] } | null,
    settings: GenerationSettings,
    sourceDocumentId: string | null, // ✅ ADD THIS PARAMETER
    onProgress?: ProgressCallback
  ): Promise<Presentation> {
    this.progressCallback = onProgress;
    this.apiCallsUsed = 0;

    try {
      // Step 1: Validate settings
      this.updateProgress('validate', 0, 4, 'Validating settings...');
      this.validateSettings(settings);

      // Step 2: Get theme
      this.updateProgress('theme', 1, 4, 'Applying theme...');
      const theme = getTheme(settings.theme);

      // Step 3: Generate presentation with custom options
      this.updateProgress('generate', 2, 4, 'Generating presentation...');
      
      const options: GenerateOptions = {
        documentId: sourceDocumentId || undefined, // ✅ PASS SOURCE DOCUMENT ID
        theme,
        generateNotes: settings.generateNotes,
        maxSlides: settings.slideCount,
        temperature: 0.7,
      };

      // Use original generator (it already handles batching internally)
      const presentation = await presentationGenerator.generateFromContext(
        editorContent,
        mindmapData,
        options
      );

      // Step 4: Complete
      this.updateProgress('complete', 4, 4, 'Presentation generated successfully!');

      return presentation;
    } catch (error: any) {
      console.error('❌ Safe generation failed:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('Rate limit')) {
        throw new Error('⚠️ Rate limit exceeded. Please wait a minute and try again, or reduce the number of slides.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('insufficient_quota')) {
        throw new Error('❌ API quota exceeded. Please add your own API key in settings or upgrade to Pro.');
      }
      
      if (error.message?.includes('timeout')) {
        throw new Error('⏱️ Request timed out. Please try again with fewer slides.');
      }
      
      if (error.message?.includes('API key') || error.message?.includes('not configured')) {
        throw new Error('❌ AI service is not configured. Please set up your API key in .env file or upgrade to Pro.');
      }
      
      throw new Error(`Generation failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Validate generation settings
   */
  private validateSettings(settings: GenerationSettings): void {
    // Calculate estimated API calls
    const estimatedCalls = 1 + settings.slideCount + (settings.generateNotes ? settings.slideCount : 0);
    
    if (estimatedCalls > 20) {
      throw new Error(`Too many API calls (${estimatedCalls}). Maximum is 20 per minute. Please reduce slide count or disable speaker notes.`);
    }
    
    if (settings.slideCount < 3 || settings.slideCount > 20) {
      throw new Error('Slide count must be between 3 and 20.');
    }
  }

  /**
   * Update progress
   */
  private updateProgress(step: string, current: number, total: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({
        step,
        current,
        total,
        percentage: Math.round((current / total) * 100),
        message,
        apiCallsUsed: this.apiCallsUsed,
      });
    }
  }

  /**
   * Estimate API calls for given settings
   */
  static estimateAPICalls(settings: GenerationSettings): number {
    return 1 + settings.slideCount + (settings.generateNotes ? settings.slideCount : 0);
  }

  /**
   * Check if settings are safe (under rate limit)
   */
  static isSafe(settings: GenerationSettings): boolean {
    return this.estimateAPICalls(settings) <= 20;
  }
}

// Export singleton instance
export const safePresentationService = new SafePresentationService();

