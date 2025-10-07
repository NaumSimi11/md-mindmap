import AI_CONFIG, { AIConfigShape } from '@/config/aiConfig';

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export abstract class AIProvider {
  protected name: string;
  protected config: { apiKey?: string; baseUrl?: string; defaultModel?: string };
  private requestCount: number;
  private lastRequestTime: number;

  constructor(name: string, config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    this.name = name;
    this.config = config;
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  abstract generateContent(prompt: string, options?: GenerationOptions): Promise<string>;
  abstract generateMermaidDiagram(description: string): Promise<string>;
  abstract validateDiagram(content: string, diagramType: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    correctedCode: string | null;
  }>;

  isConfigured(): boolean {
    const key = this.config.apiKey;
    return !!(key && !key.includes('your_') && !key.includes('_here'));
  }

  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeWindow = 60_000; // 1 minute
    if (now - this.lastRequestTime < timeWindow && this.requestCount >= AI_CONFIG.rateLimit) {
      throw new Error(`Rate limit exceeded. Maximum ${AI_CONFIG.rateLimit} requests per minute.`);
    }
    if (now - this.lastRequestTime >= timeWindow) this.requestCount = 0;
    this.requestCount++;
    this.lastRequestTime = now;
  }

  protected sanitizeError(error: unknown): string {
    const message = (error as Error)?.message ?? String(error);
    return message
      .replace(/sk-[a-zA-Z0-9]{48}/g, 'sk-***')
      .replace(/claude-[a-zA-Z0-9-]+/g, 'claude-***');
  }
}

export class OpenAIProvider extends AIProvider {
  private baseUrl: string;
  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super('OpenAI', config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async generateContent(prompt: string, options: GenerationOptions = {}): Promise<string> {
    await this.checkRateLimit();
    const {
      temperature = AI_CONFIG.temperature,
      maxTokens = AI_CONFIG.maxTokens,
      model = this.config.defaultModel || 'gpt-4',
      systemPrompt = 'You are a professional technical writer helping create high-quality documentation.',
    } = options;

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as any;
      return data.choices?.[0]?.message?.content || '';
    } catch (e) {
      if ((e as any).name === 'AbortError') throw new Error('Request timed out. Please try again.');
      throw new Error(`OpenAI generation failed: ${this.sanitizeError(e)}`);
    }
  }

  async generateMermaidDiagram(description: string): Promise<string> {
    const prompt = `Create a Mermaid diagram for: ${description}

Requirements:
- Return ONLY the Mermaid code, no explanations
- Use proper Mermaid syntax
- Choose the most appropriate diagram type (flowchart, sequence, class, etc.)
- Keep it clean and readable

Generate the diagram:`;
    const result = await this.generateContent(prompt, {
      systemPrompt: 'You are an expert at creating Mermaid diagrams. Generate only valid Mermaid syntax.',
      temperature: 0.3,
      maxTokens: 1000,
    });
    return result.trim().replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
  }

  async validateDiagram(content: string, diagramType: string) {
    const prompt = `Validate this ${diagramType} diagram and suggest improvements:

\`\`\`
${content}
\`\`\`

Return a JSON response with:
{
  "isValid": boolean,
  "errors": ["error1", "error2"],
  "warnings": ["warning1", "warning2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "correctedCode": "fixed version if needed"
}`;
    const result = await this.generateContent(prompt, {
      systemPrompt: 'You are a Mermaid diagram expert. Analyze diagrams and provide structured feedback in JSON format.',
      temperature: 0.2,
      maxTokens: 1500,
    });
    try {
      return JSON.parse(result.trim());
    } catch {
      return { isValid: false, errors: ['Failed to parse validation response'], warnings: [], suggestions: ['Please check diagram syntax manually'], correctedCode: null };
    }
  }
}

export class AnthropicProvider extends AIProvider {
  private baseUrl: string;
  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super('Anthropic', config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com';
  }

  async generateContent(prompt: string, options: GenerationOptions = {}): Promise<string> {
    await this.checkRateLimit();
    const {
      temperature = AI_CONFIG.temperature,
      maxTokens = AI_CONFIG.maxTokens,
      model = this.config.defaultModel || 'claude-3-sonnet-20240229',
      systemPrompt = 'You are a professional technical writer helping create high-quality documentation.',
    } = options;

    const body = {
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);
      const res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as any;
      return data.content?.[0]?.text || '';
    } catch (e) {
      if ((e as any).name === 'AbortError') throw new Error('Request timed out. Please try again.');
      throw new Error(`Anthropic generation failed: ${this.sanitizeError(e)}`);
    }
  }

  async generateMermaidDiagram(description: string): Promise<string> {
    const prompt = `Create a Mermaid diagram for: ${description}

Requirements:
- Return ONLY the Mermaid code, no explanations
- Use proper Mermaid syntax
- Choose the most appropriate diagram type
- Keep it clean and readable

Generate the diagram:`;
    const result = await this.generateContent(prompt, {
      systemPrompt: 'You are an expert at creating Mermaid diagrams. Generate only valid Mermaid syntax.',
      temperature: 0.3,
      maxTokens: 1000,
    });
    return result.trim().replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
  }

  async validateDiagram(content: string, diagramType: string) {
    const prompt = `Validate this ${diagramType} diagram:

\`\`\`
${content}
\`\`\`

Return JSON with validation results including isValid, errors, warnings, suggestions, and correctedCode if needed.`;
    const result = await this.generateContent(prompt, {
      systemPrompt: 'You are a Mermaid diagram expert. Return structured JSON validation feedback.',
      temperature: 0.2,
      maxTokens: 1500,
    });
    try {
      return JSON.parse(result.trim());
    } catch {
      return { isValid: false, errors: ['Failed to parse validation response'], warnings: [], suggestions: ['Please check diagram syntax manually'], correctedCode: null };
    }
  }
}

export class AIService {
  private providers: Record<string, AIProvider> = {};
  private currentProvider: AIProvider | null = null;
  private initialized = false;
  private readonly config: AIConfigShape;

  constructor(config: AIConfigShape) {
    this.config = config;
  }

  initialize(): void {
    if (this.initialized) return;
    const { providers } = this.config;
    if (providers.openai.apiKey) this.providers.openai = new OpenAIProvider(providers.openai);
    if (providers.anthropic.apiKey) this.providers.anthropic = new AnthropicProvider(providers.anthropic);

    this.currentProvider =
      (this.providers as any)[this.config.defaultProvider] || Object.values(this.providers)[0] || null;
    this.initialized = true;
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('🤖 AI Service initialized:', {
        providers: Object.keys(this.providers),
        currentProvider: this.currentProvider ? (this.currentProvider as any).name : 'none',
        configured: this.isConfigured(),
      });
    }
  }

  isConfigured(): boolean {
    return !!this.currentProvider && this.currentProvider.isConfigured();
  }

  setProvider(name: 'openai' | 'anthropic'): void {
    if (!this.providers[name]) throw new Error(`Provider '${name}' not available`);
    this.currentProvider = this.providers[name];
  }

  async generateContent(prompt: string, options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) throw new Error('AI service not configured. Please add your API key.');
    return this.currentProvider!.generateContent(prompt, options);
  }

  async generateMermaidDiagram(description: string): Promise<string> {
    if (!this.isConfigured()) throw new Error('AI service not configured. Please add your API key.');
    return this.currentProvider!.generateMermaidDiagram(description);
  }

  async validateDiagram(content: string, diagramType: string) {
    if (!this.isConfigured()) throw new Error('AI service not configured. Please add your API key.');
    return this.currentProvider!.validateDiagram(content, diagramType);
  }

  getStatus() {
    return {
      initialized: this.initialized,
      configured: this.isConfigured(),
      currentProvider: this.config.defaultProvider,
      availableProviders: Object.keys(this.providers),
      aiEnabled: this.config.enabled,
    };
  }
}

export const aiService = new AIService(AI_CONFIG);
if (AI_CONFIG.enabled) {
  aiService.initialize();
}

export default aiService;


