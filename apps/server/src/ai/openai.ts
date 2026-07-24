import { AIProvider, Message, CompletionOptions } from '@clawforge/ai-sdk';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  constructor(private baseUrl: string, private apiKey: string, private model: string) {}

  async complete(messages: Message[], options?: CompletionOptions): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          stream: false
        })
      });
      if (!response.ok) {
        throw new Error(`OpenAI response error: ${response.statusText}`);
      }
      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
      throw new Error(`OpenAI connection error: ${err.message}`);
    }
  }

  async streamComplete(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: CompletionOptions
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          stream: true
        })
      });
      if (!response.ok) {
        throw new Error(`OpenAI response error: ${response.statusText}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported by OpenAI response');
      }
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine === 'data: [DONE]') continue;
          if (cleanLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6));
              const content = parsed.choices?.[0]?.delta?.content ?? '';
              if (content) {
                accumulated += content;
                onChunk(content);
              }
            } catch {
              // Ignore partial parsing errors
            }
          }
        }
      }
      return accumulated;
    } catch (err: any) {
      throw new Error(`OpenAI stream error: ${err.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
