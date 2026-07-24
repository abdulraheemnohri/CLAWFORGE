export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AgentRunState {
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed';
  currentAgent: string;
  currentTool?: string;
  progress: number;
}
