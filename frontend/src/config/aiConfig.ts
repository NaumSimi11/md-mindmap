/* AI configuration for the React app (mdreader-main).
   Loads values from Vite env and exposes a safe config object. */

type ProviderName = 'openai' | 'anthropic' | 'gemini';

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface AIConfigShape {
  enabled: boolean;
  defaultProvider: ProviderName;
  debug: boolean;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  rateLimit: number;
  providers: Record<ProviderName, AIProviderConfig>;
  isValid(): { valid: boolean; reason: string };
  getCurrentProvider(): AIProviderConfig | undefined;
  isProviderConfigured(name: ProviderName): boolean;
  getConfiguredProviders(): ProviderName[];
  toSafeString(): Record<string, unknown>;
}

const env = import.meta.env as Record<string, string | undefined>;

const getBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

const getNumber = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const OPENAI_API_KEY = env.VITE_OPENAI_API_KEY;
const ANTHROPIC_API_KEY = env.VITE_ANTHROPIC_API_KEY;
const GEMINI_API_KEY = env.VITE_GEMINI_API_KEY;

export const AI_CONFIG: AIConfigShape = {
  enabled: getBoolean(env.VITE_AI_ENABLED, false),
  defaultProvider: (env.VITE_AI_DEFAULT_PROVIDER as ProviderName) || 'openai',
  debug: getBoolean(env.VITE_AI_DEBUG, false),
  maxTokens: getNumber(env.VITE_AI_MAX_TOKENS, 2000),
  temperature: getNumber(env.VITE_AI_TEMPERATURE, 0.7),
  timeout: getNumber(env.VITE_AI_TIMEOUT_MS, 30000),
  retryAttempts: getNumber(env.VITE_AI_RETRY_ATTEMPTS, 3),
  rateLimit: getNumber(env.VITE_AI_RATE_LIMIT_PER_MINUTE, 20),
  providers: {
    openai: {
      apiKey: OPENAI_API_KEY,
      baseUrl: env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      defaultModel: env.VITE_OPENAI_MODEL || 'gpt-4',
    },
    anthropic: {
      apiKey: ANTHROPIC_API_KEY,
      baseUrl: env.VITE_ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      defaultModel: env.VITE_ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    },
    gemini: {
      apiKey: GEMINI_API_KEY,
      baseUrl: env.VITE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: env.VITE_GEMINI_MODEL || 'gemini-1.5-flash',
    },
  },
  isValid() {
    if (!this.enabled) return { valid: true, reason: 'AI disabled' };
    const provider = this.providers[this.defaultProvider];
    if (!provider) return { valid: false, reason: `Unknown provider: ${this.defaultProvider}` };
    if (!provider.apiKey || provider.apiKey.includes('your_') || provider.apiKey.includes('_here')) {
      return { valid: false, reason: `Missing API key for ${this.defaultProvider}` };
    }
    return { valid: true, reason: 'Configuration valid' };
  },
  getCurrentProvider() {
    return this.providers[this.defaultProvider];
  },
  isProviderConfigured(name: ProviderName) {
    const p = this.providers[name];
    return !!(p && p.apiKey && !p.apiKey.includes('your_') && !p.apiKey.includes('_here'));
  },
  getConfiguredProviders() {
    return (['openai', 'anthropic', 'gemini'] as ProviderName[]).filter((n) => this.isProviderConfigured(n));
  },
  toSafeString() {
    return {
      enabled: this.enabled,
      defaultProvider: this.defaultProvider,
      configuredProviders: this.getConfiguredProviders(),
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      debug: this.debug,
    };
  },
};

export default AI_CONFIG;


