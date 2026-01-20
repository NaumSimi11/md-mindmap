import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Key,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  Zap,
  Bot,
  Globe
} from 'lucide-react';
import { aiService } from '@/services/ai/AIService';

interface APIKeyConfig {
  openai: string;
  anthropic: string;
  gemini: string;
  openrouter: string;
}

interface ProviderInfo {
  name: string;
  icon: React.ReactNode;
  description: string;
  models: string[];
  status: 'configured' | 'missing' | 'invalid';
}

export const APIKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKeyConfig>({
    openai: '',
    anthropic: '',
    gemini: '',
    openrouter: ''
  });

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load existing keys on mount
  useEffect(() => {
    const loadKeys = () => {
      const keys = {
        openai: localStorage.getItem('api_key_openai') || '',
        anthropic: localStorage.getItem('api_key_anthropic') || '',
        gemini: localStorage.getItem('api_key_gemini') || '',
        openrouter: localStorage.getItem('api_key_openrouter') || ''
      };
      setApiKeys(keys);
    };
    loadKeys();
  }, []);

  const providers: Record<string, ProviderInfo> = {
    openai: {
      name: 'OpenAI',
      icon: <Bot className="h-5 w-5 text-green-600" />,
      description: 'GPT-4, GPT-3.5 Turbo - Best for reasoning and code',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      status: apiKeys.openai ? 'configured' : 'missing'
    },
    anthropic: {
      name: 'Anthropic',
      icon: <Sparkles className="h-5 w-5 text-orange-600" />,
      description: 'Claude 3 - Excellent for analysis and writing',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      status: apiKeys.anthropic ? 'configured' : 'missing'
    },
    gemini: {
      name: 'Google Gemini',
      icon: <Zap className="h-5 w-5 text-blue-600" />,
      description: 'Gemini 1.5 - Fast and efficient with long context',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      status: apiKeys.gemini ? 'configured' : 'missing'
    },
    openrouter: {
      name: 'OpenRouter',
      icon: <Globe className="h-5 w-5 text-purple-600" />,
      description: 'Access to 100+ models from various providers',
      models: ['openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku', 'meta-llama/llama-3-70b'],
      status: apiKeys.openrouter ? 'configured' : 'missing'
    }
  };

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setTestResults(prev => ({ ...prev, [provider]: null })); // Reset test result
  };

  const togglePasswordVisibility = (provider: string) => {
    setShowPasswords(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const testAPIKey = async (provider: string) => {
    const key = apiKeys[provider as keyof APIKeyConfig];
    if (!key.trim()) return;

    setIsTesting(prev => ({ ...prev, [provider]: true }));

    try {
      // Create a temporary provider instance to test with provider-specific settings
      let testProvider;
      let testOptions: { maxTokens: number; temperature: number; model?: string } = {
        maxTokens: 10,
        temperature: 0
      };

      switch (provider) {
        case 'openai':
          const { OpenAIProvider } = await import('@/services/ai/AIService');
          testProvider = new OpenAIProvider({ apiKey: key });
          testOptions.model = 'gpt-3.5-turbo';
          break;
        case 'anthropic':
          const { AnthropicProvider } = await import('@/services/ai/AIService');
          testProvider = new AnthropicProvider({ apiKey: key });
          testOptions.model = 'claude-3-haiku-20240307';
          break;
        case 'gemini':
          const { GeminiProvider } = await import('@/services/ai/AIService');
          testProvider = new GeminiProvider({ apiKey: key });
          testOptions.model = 'gemini-1.5-flash';
          break;
        case 'openrouter':
          const { OpenRouterProvider } = await import('@/services/ai/AIService');
          testProvider = new OpenRouterProvider({ apiKey: key });
          // Use a cheap, widely available model for testing
          testOptions.model = 'openai/gpt-3.5-turbo';
          break;
        default:
          throw new Error('Unknown provider');
      }

      // Test with a simple prompt
      await testProvider.generateContent('Say "OK" and nothing else.', testOptions);

      setTestResults(prev => ({ ...prev, [provider]: true }));
    } catch (error) {
      console.error(`API key test failed for ${provider}:`, error);
      setTestResults(prev => ({ ...prev, [provider]: false }));
    } finally {
      setIsTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const saveAPIKeys = async () => {
    setSaveStatus('saving');

    try {
      // Save to localStorage
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key.trim()) {
          localStorage.setItem(`api_key_${provider}`, key);
        } else {
          localStorage.removeItem(`api_key_${provider}`);
        }
      });

      // Reinitialize the AI service to pick up new keys
      const { aiService } = await import('@/services/ai/AIService');
      aiService.reinitialize();

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getStatusBadge = (status: ProviderInfo['status'], testResult?: boolean | null) => {
    if (testResult === true) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    if (testResult === false) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>;
    }

    switch (status) {
      case 'configured':
        return <Badge variant="secondary"><Key className="h-3 w-3 mr-1" />Configured</Badge>;
      case 'missing':
        return <Badge variant="outline">Not Configured</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">AI API Configuration</h2>
      </div>

      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Configure your API keys to unlock AI-powered features. Keys are stored locally and never sent to our servers.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {Object.entries(providers).map(([key, provider]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {provider.icon}
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(provider.status, testResults[key])}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${key}-key`}>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`${key}-key`}
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={apiKeys[key as keyof APIKeyConfig]}
                      onChange={(e) => handleKeyChange(key, e.target.value)}
                      placeholder={`Enter your ${provider.name} API key`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility(key)}
                    >
                      {showPasswords[key] ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testAPIKey(key)}
                    disabled={!apiKeys[key as keyof APIKeyConfig]?.trim() || isTesting[key]}
                    variant="outline"
                    size="sm"
                  >
                    {isTesting[key] ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <strong>Available Models:</strong> {provider.models.join(', ')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          onClick={saveAPIKeys}
          disabled={saveStatus === 'saving'}
          className="min-w-[120px]"
        >
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved!'}
          {saveStatus === 'error' && 'Error'}
          {saveStatus === 'idle' && 'Save Keys'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Note:</strong> After saving API keys, you may need to refresh the page for changes to take effect.</p>
        <p><strong>Security:</strong> API keys are stored locally in your browser and are only used to make direct API calls to the respective providers.</p>
      </div>
    </div>
  );
};