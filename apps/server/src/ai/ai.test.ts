import { describe, it, expect } from 'vitest';
import { ModelService } from './model-service.js';
import { MockProvider } from './mock.js';

describe('AI Providers and Model Service', () => {
  it('should get default mock provider and complete correctly', async () => {
    const service = ModelService.getInstance();
    const provider = service.getProvider();
    expect(provider).toBeInstanceOf(MockProvider);

    const response = await provider.complete([{ role: 'user', content: 'test' }]);
    expect(response).toContain('Hello! I am ClawForge AI Assistant');
  });

  it('should support switching providers', () => {
    const service = ModelService.getInstance();
    service.configureProvider('ollama', 'http://localhost:11434', '', 'gemma');
    expect(service.getProvider().name).toBe('ollama');

    // Switch back to mock
    service.configureProvider('mock');
    expect(service.getProvider().name).toBe('mock');
  });
});
