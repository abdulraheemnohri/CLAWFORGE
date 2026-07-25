import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  workspacePath: text('workspace_path').notNull(),
  aiModel: text('ai_model').notNull(),
  agentMode: text('agent_mode').notNull(),
  permissions: text('permissions').notNull(), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  idxConversationsProjectId: index('idx_conversations_project_id').on(table.projectId)
}));

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  idxMessagesConversationId: index('idx_messages_conversation_id').on(table.conversationId)
}));

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  conversationId: text('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').notNull(), // 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  idxTasksProjectId: index('idx_tasks_project_id').on(table.projectId),
  idxTasksStatus: index('idx_tasks_status').on(table.status)
}));

export const taskSteps = sqliteTable('task_steps', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  agentType: text('agent_type').notNull(),
  toolCalls: text('tool_calls'), // JSON string
  result: text('result'),
  order: integer('order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const taskDependencies = sqliteTable('task_dependencies', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  dependsOnTaskId: text('depends_on_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' })
});

export const agentRuns = sqliteTable('agent_runs', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  agentType: text('agent_type').notNull(),
  status: text('status').notNull(),
  logs: text('logs').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'conversation' | 'project' | 'preference' | 'decision'
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// FTS virtual table representation or a mock for SQLite virtual table
export const memoriesFts = sqliteTable('memories_fts', {
  id: text('id').primaryKey(),
  content: text('content').notNull()
});

export const models = sqliteTable('models', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull(),
  name: text('name').notNull(),
  config: text('config').notNull(), // JSON config
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'ollama' | 'openai' | 'mock'
  baseUrl: text('base_url'),
  apiKey: text('api_key'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  riskLevel: text('risk_level').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull()
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  toolName: text('tool_name').notNull(),
  riskLevel: text('risk_level').notNull(),
  policy: text('policy').notNull() // 'allow' | 'require_approval' | 'deny'
});

export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  toolName: text('tool_name').notNull(),
  params: text('params').notNull(), // JSON
  status: text('status').notNull(), // 'pending' | 'approved' | 'denied'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  agentType: text('agent_type'),
  toolName: text('tool_name'),
  action: text('action').notNull(),
  target: text('target'),
  result: text('result'),
  approvalId: text('approval_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const browserSessions = sqliteTable('browser_sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull() // JSON string
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  packageName: text('package_name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull(),
  skillJson: text('skill_json').notNull(), // config
  instructions: text('instructions'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version'),
  status: text('status').notNull(), // 'connected' | 'disconnected' | 'error'
  url: text('url'),
  toolsJson: text('tools_json'), // JSON string list of tools
  permissionsJson: text('permissions_json'), // JSON string required permissions
  enabled: integer('enabled', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const plugins = sqliteTable('plugins', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  status: text('status').notNull(), // 'installed' | 'uninstalled'
  enabled: integer('enabled', { mode: 'boolean' }).notNull(),
  permissionsJson: text('permissions_json'), // JSON string list of permissions
  manifestJson: text('manifest_json').notNull(), // manifest metadata JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const pairedDevices = sqliteTable('paired_devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'desktop' | 'cli' | 'android' | 'web'
  pairingCode: text('pairing_code').notNull(),
  status: text('status').notNull(), // 'paired' | 'revoked' | 'pending'
  lastConnectedAt: integer('last_connected_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  triggerType: text('trigger_type').notNull(), // 'schedule' | 'file_created' | 'webhook' | 'git_commit' | 'manual' | 'voice'
  condition: text('condition'),
  status: text('status').notNull(), // 'active' | 'paused'
  metricsJson: text('metrics_json'), // metrics log summary (totalRuns, failures, success)
  executionLogsJson: text('execution_logs_json'), // execution history logs JSON list
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const usersettings = sqliteTable('usersettings', {
  key: text('key').primaryKey(),
  value: text('value').notNull() // JSON string
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'management' | 'development' | 'research' | 'creative' | 'security' | 'personal'
  role: text('role').notNull(), // e.g., 'Coding Agent', 'Architect', 'Web Researcher'
  description: text('description'),
  systemPrompt: text('system_prompt'),
  configJson: text('config_json'), // JSON string parameters
  enabled: integer('enabled', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const workflowRuns = sqliteTable('workflow_runs', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  triggerType: text('trigger_type').notNull(),
  status: text('status').notNull(), // 'success' | 'failed' | 'running'
  logsJson: text('logs_json'), // JSON list of logs
  durationMs: integer('duration_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull(), // e.g., 'default', 'project-x'
  name: text('name').notNull(),
  type: text('type').notNull(), // 'pdf' | 'docx' | 'txt' | 'csv' | 'markdown' | 'git'
  path: text('path'),
  size: integer('size'),
  status: text('status').notNull(), // 'parsing' | 'indexed' | 'failed'
  parsedText: text('parsed_text'),
  chunkCount: integer('chunk_count').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  text: text('text').notNull(),
  vectorJson: text('vector_json').notNull(), // JSON float list
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const policies = sqliteTable('policies', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'agent' | 'tool' | 'workflow' | 'project'
  entityId: text('entity_id').notNull(), // e.g. 'coding-agent', 'terminal.execute'
  operation: text('operation').notNull(), // e.g. 'read', 'write', 'execute'
  policyLevel: text('policy_level').notNull(), // 'allow' | 'ask' | 'deny'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const metrics = sqliteTable('metrics', {
  id: text('id').primaryKey(),
  key: text('key').notNull(), // 'response_time' | 'token_usage' | 'provider_cost' | 'success_rate'
  value: text('value').notNull(), // float value or configuration JSON
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull()
});

export const traces = sqliteTable('traces', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  stepName: text('step_name').notNull(), // e.g. 'Planner', 'Agent Selection', 'Tool Execute'
  entityType: text('entity_type').notNull(), // 'agent' | 'tool' | 'model'
  entityName: text('entity_name').notNull(), // 'Coding Agent' | 'terminal.run'
  input: text('input'),
  output: text('output'),
  durationMs: integer('duration_ms'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
