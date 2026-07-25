export interface V3AgentConfig {
  id: string;
  name: string;
  type: 'management' | 'development' | 'research' | 'creative' | 'security' | 'personal';
  role: string;
  description: string;
  enabled: boolean;
  systemPrompt?: string;
}

export type V3TriggerType = 'schedule' | 'file_created' | 'webhook' | 'git_commit' | 'manual' | 'voice';

export interface V3WorkflowNode {
  id: string;
  type: string;
  label: string;
}

export interface V3TraceEntry {
  id: string;
  stepName: string;
  entityType: 'agent' | 'tool' | 'model';
  entityName: string;
  durationMs: number;
}
