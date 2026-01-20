/**
 * AIErrorHandler - User-friendly error messages for AI operations
 * 
 * Transforms technical API errors into actionable, friendly messages
 */

export interface ParsedError {
  /** User-friendly title */
  title: string;
  /** Detailed message explaining the issue */
  message: string;
  /** Suggested action to fix the issue */
  suggestion?: string;
  /** Technical error code (for debugging) */
  code?: string;
  /** Whether this is recoverable */
  recoverable: boolean;
}

/**
 * Common error patterns and their user-friendly messages
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  handler: (match: RegExpMatchArray | null, raw: string) => ParsedError;
}> = [
  // Model not found / doesn't exist
  {
    pattern: /model.*does not exist|model_not_found|invalid.*model/i,
    handler: (_, raw) => {
      const modelMatch = raw.match(/model\s*[`"']?([^`"'\s]+)[`"']?/i);
      const modelName = modelMatch?.[1] || 'selected model';
      
      return {
        title: '🔧 Model Not Available',
        message: `The model "${modelName}" isn't available with your current API key.`,
        suggestion: 'Try selecting a different model from the model picker, or check that your API key has access to this model.',
        code: 'model_not_found',
        recoverable: true,
      };
    },
  },
  
  // Invalid API key
  {
    pattern: /invalid.*api.*key|incorrect.*api.*key|authentication|unauthorized|401/i,
    handler: () => ({
      title: '🔑 API Key Issue',
      message: 'Your API key appears to be invalid or expired.',
      suggestion: 'Check your API key in the settings (click the key icon). Make sure you\'ve copied the full key correctly.',
      code: 'invalid_api_key',
      recoverable: true,
    }),
  },
  
  // Rate limit
  {
    pattern: /rate.*limit|too.*many.*requests|429/i,
    handler: () => ({
      title: '⏳ Rate Limited',
      message: 'You\'ve made too many requests. The AI service needs a moment.',
      suggestion: 'Wait a few seconds and try again. Consider using a different model if this persists.',
      code: 'rate_limit',
      recoverable: true,
    }),
  },
  
  // Quota exceeded
  {
    pattern: /quota.*exceeded|billing|insufficient.*quota|payment/i,
    handler: () => ({
      title: '💳 Quota Exceeded',
      message: 'Your API usage quota has been exceeded.',
      suggestion: 'Check your API provider\'s billing page to add credits or upgrade your plan.',
      code: 'quota_exceeded',
      recoverable: false,
    }),
  },
  
  // Context length / token limit
  {
    pattern: /context.*length|token.*limit|maximum.*length|too.*long/i,
    handler: () => ({
      title: '📏 Content Too Long',
      message: 'Your document is too long for this model to process at once.',
      suggestion: 'Try selecting a smaller section of your document, or use a model with a larger context window (like GPT-4 Turbo or Claude).',
      code: 'context_length',
      recoverable: true,
    }),
  },
  
  // Network / connection errors
  {
    pattern: /network|connection|timeout|ECONNREFUSED|fetch.*failed/i,
    handler: () => ({
      title: '🌐 Connection Issue',
      message: 'Couldn\'t connect to the AI service.',
      suggestion: 'Check your internet connection and try again. If the problem persists, the service might be temporarily down.',
      code: 'network_error',
      recoverable: true,
    }),
  },
  
  // Service unavailable
  {
    pattern: /service.*unavailable|503|502|500|server.*error/i,
    handler: () => ({
      title: '🔧 Service Temporarily Unavailable',
      message: 'The AI service is experiencing issues right now.',
      suggestion: 'This is usually temporary. Wait a minute and try again, or try a different AI provider.',
      code: 'service_unavailable',
      recoverable: true,
    }),
  },
  
  // Content filter / safety
  {
    pattern: /content.*filter|safety|blocked|flagged|policy/i,
    handler: () => ({
      title: '🛡️ Content Filtered',
      message: 'The AI couldn\'t process this request due to content policies.',
      suggestion: 'Try rephrasing your request or the content you\'re working with.',
      code: 'content_filtered',
      recoverable: true,
    }),
  },
  
  // No endpoints found (OpenRouter specific)
  {
    pattern: /no.*endpoints.*found/i,
    handler: (_, raw) => {
      const modelMatch = raw.match(/for\s+([^\s.]+)/i);
      const modelName = modelMatch?.[1] || 'this model';
      
      return {
        title: '🔄 Model Not Available on OpenRouter',
        message: `The model "${modelName}" isn't available through OpenRouter.`,
        suggestion: 'Select a different model from the picker. OpenRouter models start with provider names like "openai/", "anthropic/", or "google/".',
        code: 'openrouter_no_endpoints',
        recoverable: true,
      };
    },
  },
];

/**
 * Parse an error and return a user-friendly message
 */
export function parseAIError(error: unknown): ParsedError {
  // Extract error message from various formats
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    // Handle API error response format
    const err = error as any;
    errorMessage = err.error?.message || err.message || err.error || JSON.stringify(error);
  }
  
  // Try to match known error patterns
  for (const { pattern, handler } of ERROR_PATTERNS) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    const match = errorMessage.match(regex);
    if (match) {
      return handler(match, errorMessage);
    }
  }
  
  // Default error message
  return {
    title: '❌ Something Went Wrong',
    message: errorMessage || 'An unexpected error occurred while processing your request.',
    suggestion: 'Try again in a moment. If the problem continues, try selecting a different model or checking your API keys.',
    code: 'unknown_error',
    recoverable: true,
  };
}

/**
 * Format error for display in chat
 */
export function formatErrorForChat(error: unknown): string {
  const parsed = parseAIError(error);
  
  let message = `**${parsed.title}**\n\n${parsed.message}`;
  
  if (parsed.suggestion) {
    message += `\n\n💡 **Tip:** ${parsed.suggestion}`;
  }
  
  return message;
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: unknown): { title: string; description: string } {
  const parsed = parseAIError(error);
  
  return {
    title: parsed.title,
    description: parsed.suggestion || parsed.message,
  };
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const parsed = parseAIError(error);
  return parsed.recoverable;
}

/**
 * Get suggested action based on error
 */
export function getSuggestedAction(error: unknown): 'retry' | 'change_model' | 'check_key' | 'wait' | 'none' {
  const parsed = parseAIError(error);
  
  switch (parsed.code) {
    case 'model_not_found':
    case 'openrouter_no_endpoints':
      return 'change_model';
    case 'invalid_api_key':
      return 'check_key';
    case 'rate_limit':
    case 'service_unavailable':
      return 'wait';
    case 'network_error':
    case 'context_length':
    case 'content_filtered':
      return 'retry';
    default:
      return 'none';
  }
}

export default {
  parseAIError,
  formatErrorForChat,
  formatErrorForToast,
  isRecoverableError,
  getSuggestedAction,
};
