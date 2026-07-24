import { AIProvider } from '@clawforge/ai-sdk';
import { MockProvider } from './mock.js';
import { OllamaProvider } from './ollama.js';
import { OpenAIProvider } from './openai.js';

export class ModelService {
  private static instance: ModelService;
  private currentProvider: AIProvider;

  private constructor() {
    // Initial default mock provider
    this.currentProvider = new MockProvider();
  }

  public static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  public getProvider(): AIProvider {
    return this.currentProvider;
  }

  public configureProvider(type: string, baseUrl?: string, apiKey?: string, model?: string) {
    if (type === 'ollama') {
      this.currentProvider = new OllamaProvider(baseUrl || 'http://127.0.0.1:11434', model || 'llama3');
    } else if (type === 'openai') {
      this.currentProvider = new OpenAIProvider(baseUrl || 'https://api.openai.com/v1', apiKey || '', model || 'gpt-4o');
    } else {
      this.currentProvider = new MockProvider(model || 'mock-model');
    }
  }
}
