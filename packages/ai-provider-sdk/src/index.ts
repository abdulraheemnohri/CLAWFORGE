export interface IV3AIProvider {
  connect(): Promise<boolean>;
  healthCheck(): Promise<boolean>;
  listModels(): Promise<string[]>;
  chat(prompt: string): Promise<string>;
}

export class OllamaLocalProvider implements IV3AIProvider {
  constructor(private baseUrl: string) {}

  async connect() { return true; }
  async healthCheck() { return true; }
  async listModels() { return ['llama3.2', 'deepseek-r1']; }
  async chat(prompt: string) {
    return `[Ollama Response] Fulfilling query: ${prompt}`;
  }
}
