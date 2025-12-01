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
  abstract generateContentStream(prompt: string, onChunk: (chunk: string) => void, options?: GenerationOptions): Promise<void>;
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

  async generateContentStream(prompt: string, onChunk: (chunk: string) => void, options: GenerationOptions = {}): Promise<void> {
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
      stream: true,
    };

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line === 'data: [DONE]') return;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) onChunk(content);
            } catch (e) {
              console.warn('Failed to parse SSE message:', line);
            }
          }
        }
      }
    } catch (e) {
      throw new Error(`OpenAI streaming failed: ${this.sanitizeError(e)}`);
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

  async generateContentStream(prompt: string, onChunk: (chunk: string) => void, options: GenerationOptions = {}): Promise<void> {
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
      stream: true,
    };

    try {
      const res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                onChunk(data.delta.text);
              }
            } catch (e) {
              console.warn('Failed to parse SSE message:', line);
            }
          }
        }
      }
    } catch (e) {
      throw new Error(`Anthropic streaming failed: ${this.sanitizeError(e)}`);
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

export class GeminiProvider extends AIProvider {
  private baseUrl: string;
  constructor(config: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super('Gemini', config);
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateContent(prompt: string, options: GenerationOptions = {}): Promise<string> {
    await this.checkRateLimit();
    const {
      temperature = AI_CONFIG.temperature,
      maxTokens = AI_CONFIG.maxTokens,
      model = this.config.defaultModel || 'gemini-1.5-flash',
      systemPrompt = 'You are a professional technical writer helping create high-quality documentation.',
    } = options;

    // Gemini API structure
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\n' + prompt }] // Gemini doesn't have a separate system role in the basic API yet, so we prepend it
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      // Extract text from Gemini response
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      if ((e as any).name === 'AbortError') throw new Error('Request timed out. Please try again.');
      throw new Error(`Gemini generation failed: ${this.sanitizeError(e)}`);
    }
  }

  async generateContentStream(prompt: string, onChunk: (chunk: string) => void, options: GenerationOptions = {}): Promise<void> {
    await this.checkRateLimit();
    const {
      temperature = AI_CONFIG.temperature,
      maxTokens = AI_CONFIG.maxTokens,
      model = this.config.defaultModel || 'gemini-1.5-flash',
      systemPrompt = 'You are a professional technical writer helping create high-quality documentation.',
    } = options;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt + '\n\n' + prompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    try {
      const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.config.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Gemini returns a JSON array, but streamed as individual JSON objects
        // We need to parse valid JSON objects from the buffer
        let bracketCount = 0;
        let startIndex = 0;
        let inString = false;
        let escape = false;

        for (let i = 0; i < buffer.length; i++) {
          const char = buffer[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (char === '\\') {
            escape = true;
            continue;
          }
          if (char === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;

          if (char === '{') {
            if (bracketCount === 0) startIndex = i;
            bracketCount++;
          } else if (char === '}') {
            bracketCount--;
            if (bracketCount === 0) {
              const jsonStr = buffer.substring(startIndex, i + 1);
              try {
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) onChunk(text);

                // Remove processed part from buffer
                buffer = buffer.substring(i + 1);
                i = -1; // Reset loop
              } catch (e) {
                // Incomplete JSON, wait for more data
              }
            }
          }
        }
      }
    } catch (e) {
      throw new Error(`Gemini streaming failed: ${this.sanitizeError(e)}`);
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
      // Gemini sometimes wraps JSON in markdown blocks
      const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanResult);
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
    if (providers.gemini.apiKey) this.providers.gemini = new GeminiProvider(providers.gemini);

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

  setProvider(name: 'openai' | 'anthropic' | 'gemini'): void {
    if (!this.providers[name]) throw new Error(`Provider '${name}' not available`);
    this.currentProvider = this.providers[name];
  }

  async generateContent(prompt: string, options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) throw new Error('AI service not configured. Please add your API key.');
    return this.currentProvider!.generateContent(prompt, options);
  }

  async generateContentStream(prompt: string, onChunk: (chunk: string) => void, options?: GenerationOptions): Promise<void> {
    if (!this.isConfigured()) throw new Error('AI service not configured. Please add your API key.');
    return this.currentProvider!.generateContentStream(prompt, onChunk, options);
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


