export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIProvider {
  name: string;
  complete: (messages: Message[], options?: CompletionOptions) => Promise<string>;
  streamComplete: (messages: Message[], onChunk: (chunk: string) => void, options?: CompletionOptions) => Promise<string>;
  testConnection: () => Promise<boolean>;
}
