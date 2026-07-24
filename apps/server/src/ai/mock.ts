import { AIProvider, Message, CompletionOptions } from '@clawforge/ai-sdk';

export class MockProvider implements AIProvider {
  name = 'mock';
  constructor(private model = 'mock-model') {}

  async complete(messages: Message[], options?: CompletionOptions): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content || '';
    return this.generateMockResponse(lastMsg);
  }

  async streamComplete(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: CompletionOptions
  ): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const fullText = this.generateMockResponse(lastMsg);
    const words = fullText.split(' ');
    for (const word of words) {
      await new Promise((res) => setTimeout(res, 20));
      onChunk(word + ' ');
    }
    return fullText;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  private generateMockResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('expense tracker') || lower.includes('build me a react')) {
      return JSON.stringify({
        plan: [
          { title: "Analyze requirements and create project structure", tool: "filesystem.write", params: { filepath: "src/App.tsx", content: "React Expense Tracker application code" } },
          { title: "Configure styling with Tailwind", tool: "filesystem.write", params: { filepath: "tailwind.config.js", content: "module.exports = {}" } },
          { title: "Run clean installation", tool: "terminal.run", params: { command: "npm install" } },
          { title: "Initialize git repository", tool: "git.status", params: {} }
        ],
        summary: "I have formed a plan to build the React Expense Tracker."
      });
    }

    if (lower.includes('coding agent') || lower.includes('write code')) {
      return "Sure, I am the Coding Agent. I will write index.ts file.";
    }

    if (lower.includes('research')) {
      return "Research completed: ClawForge is an elite agent runtime platform.";
    }

    return "Hello! I am ClawForge AI Assistant. How can I help you today?";
  }
}
