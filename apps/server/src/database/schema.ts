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
