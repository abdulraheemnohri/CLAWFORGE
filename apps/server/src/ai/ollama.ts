import { AIProvider, Message, CompletionOptions } from '@clawforge/ai-sdk';

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  constructor(private baseUrl: string, private model: string) {}

  async complete(messages: Message[], options?: CompletionOptions): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7
          }
        })
      });
      if (!response.ok) {
        throw new Error(`Ollama response error: ${response.statusText}`);
      }
      const data = await response.json() as any;
      return data.message?.content ?? '';
    } catch (err: any) {
      throw new Error(`Ollama connection error: ${err.message}`);
    }
  }

  async streamComplete(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: CompletionOptions
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7
          }
        })
      });
      if (!response.ok) {
        throw new Error(`Ollama response error: ${response.statusText}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported by Ollama response');
      }
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed.message?.content ?? '';
            accumulated += content;
            onChunk(content);
          } catch {
            // ignore partial line parsing errors
          }
        }
      }
      return accumulated;
    } catch (err: any) {
      throw new Error(`Ollama stream error: ${err.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
