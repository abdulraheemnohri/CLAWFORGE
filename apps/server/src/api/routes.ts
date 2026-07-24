import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../database/index.js';
import * as schema from '../database/schema.js';
import { eq, desc } from 'drizzle-orm';
import { ModelService } from '../ai/model-service.js';
import { MemoryService } from '../memory/memory-service.js';
import { ToolRegistry } from '../tools/index.js';
import { MasterAgent } from '../agent/master-agent.js';
import { TaskExecutor } from '../agent/task-executor.js';
import { WebSocketManager } from '../websocket/ws-manager.js';
import { V1_AGENTS } from '../agent/agents-config.js';

export function registerRoutes(fastify: FastifyInstance) {
  // Authentication middleware
  const authToken = 'clawforge-default-token-12345';

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip health, status, and websocket endpoints if preferred, but protect sensitive api routes
    if (request.url.startsWith('/api/')) {
      if (request.url === '/api/health' || request.url === '/api/status') {
        return;
      }
      const authHeader = request.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      if (token !== authToken) {
        reply.status(401).send({ error: 'Unauthorized: Invalid Access Token' });
      }
    }
  });

  // Health and Status
  fastify.get('/api/health', async () => {
    return { status: 'healthy', timestamp: new Date() };
  });

  fastify.get('/api/status', async () => {
    return {
      status: 'online',
      mode: 'local-first',
      uptime: process.uptime(),
      version: '1.0.0'
    };
  });

  // Projects CRUD
  fastify.get('/api/projects', async () => {
    return await db.select().from(schema.projects);
  });

  fastify.post('/api/projects', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'proj-' + Math.random().toString(36).substring(7);
    const newProj = {
      id,
      name: body.name || 'Unnamed Project',
      description: body.description || '',
      workspacePath: body.workspacePath || './data/workspace',
      aiModel: body.aiModel || 'mock',
      agentMode: body.agentMode || 'auto',
      permissions: JSON.stringify(body.permissions || {}),
      createdAt: new Date()
    };
    await db.insert(schema.projects).values(newProj);
    return newProj;
  });

  fastify.get('/api/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const results = await db.select().from(schema.projects).where(eq(schema.projects.id, request.params.id));
    if (results.length === 0) return reply.status(404).send({ error: 'Project not found' });
    return results[0];
  });

  fastify.patch('/api/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.workspacePath !== undefined) updateData.workspacePath = body.workspacePath;
    if (body.aiModel !== undefined) updateData.aiModel = body.aiModel;
    if (body.agentMode !== undefined) updateData.agentMode = body.agentMode;
    if (body.permissions !== undefined) updateData.permissions = JSON.stringify(body.permissions);

    await db.update(schema.projects).set(updateData).where(eq(schema.projects.id, request.params.id));
    const results = await db.select().from(schema.projects).where(eq(schema.projects.id, request.params.id));
    return results[0];
  });

  fastify.delete('/api/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.projects).where(eq(schema.projects.id, request.params.id));
    return { success: true };
  });

  // Conversations CRUD
  fastify.get('/api/conversations', async () => {
    return await db.select().from(schema.conversations);
  });

  fastify.post('/api/conversations', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'conv-' + Math.random().toString(36).substring(7);
    const newConv = {
      id,
      projectId: body.projectId,
      title: body.title || 'New Conversation',
      createdAt: new Date()
    };
    await db.insert(schema.conversations).values(newConv);
    return newConv;
  });

  fastify.get('/api/conversations/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const results = await db.select().from(schema.conversations).where(eq(schema.conversations.id, request.params.id));
    if (results.length === 0) return reply.status(404).send({ error: 'Conversation not found' });
    const messagesList = await db.select().from(schema.messages).where(eq(schema.messages.conversationId, request.params.id));
    return { ...results[0], messages: messagesList };
  });

  // Tasks
  fastify.get('/api/tasks', async () => {
    const allTasks = await db.select().from(schema.tasks);
    const hydrated = [];
    for (const t of allTasks) {
      const steps = await db.select().from(schema.taskSteps).where(eq(schema.taskSteps.taskId, t.id));
      hydrated.push({ ...t, steps });
    }
    return hydrated;
  });

  fastify.get('/api/tasks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const results = await db.select().from(schema.tasks).where(eq(schema.tasks.id, request.params.id));
    if (results.length === 0) return reply.status(404).send({ error: 'Task not found' });
    const steps = await db.select().from(schema.taskSteps).where(eq(schema.taskSteps.taskId, request.params.id));
    return { ...results[0], steps };
  });

  fastify.post('/api/tasks', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'task-' + Math.random().toString(36).substring(7);
    const newTask = {
      id,
      projectId: body.projectId,
      conversationId: body.conversationId || null,
      title: body.title,
      status: 'idle',
      createdAt: new Date()
    };
    await db.insert(schema.tasks).values(newTask);
    return newTask;
  });

  fastify.post('/api/tasks/:id/stop', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    TaskExecutor.stopRun(request.params.id);
    await db.update(schema.tasks).set({ status: 'stopped' }).where(eq(schema.tasks.id, request.params.id));
    WebSocketManager.getInstance().broadcast(`task:${request.params.id}`, 'task.stopped', { taskId: request.params.id });
    return { success: true };
  });

  fastify.post('/api/tasks/:id/pause', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    TaskExecutor.pauseRun(request.params.id);
    await db.update(schema.tasks).set({ status: 'paused' }).where(eq(schema.tasks.id, request.params.id));
    WebSocketManager.getInstance().broadcast(`task:${request.params.id}`, 'task.paused', { taskId: request.params.id });
    return { success: true };
  });

  fastify.post('/api/tasks/:id/resume', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    TaskExecutor.resumeRun(request.params.id);
    const results = await db.select().from(schema.tasks).where(eq(schema.tasks.id, request.params.id));
    if (results.length > 0) {
      const task = results[0];
      const projs = await db.select().from(schema.projects).where(eq(schema.projects.id, task.projectId));
      if (projs.length > 0) {
        const executor = new TaskExecutor();
        // Resume async execution
        executor.executeTask(task.id, task.projectId, projs[0].workspacePath, {}, (event, data) => {
          WebSocketManager.getInstance().broadcast(`task:${task.id}`, event, data);
          WebSocketManager.getInstance().broadcast(`project:${task.projectId}`, event, data);
        }).catch(() => {});
      }
    }
    WebSocketManager.getInstance().broadcast(`task:${request.params.id}`, 'task.resumed', { taskId: request.params.id });
    return { success: true };
  });

  fastify.post('/api/tasks/:id/retry', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.update(schema.tasks).set({ status: 'idle' }).where(eq(schema.tasks.id, request.params.id));
    await db.update(schema.taskSteps).set({ status: 'pending' }).where(eq(schema.taskSteps.taskId, request.params.id));
    // Trigger execution
    const results = await db.select().from(schema.tasks).where(eq(schema.tasks.id, request.params.id));
    if (results.length > 0) {
      const task = results[0];
      const projs = await db.select().from(schema.projects).where(eq(schema.projects.id, task.projectId));
      if (projs.length > 0) {
        const executor = new TaskExecutor();
        executor.executeTask(task.id, task.projectId, projs[0].workspacePath, {}, (event, data) => {
          WebSocketManager.getInstance().broadcast(`task:${task.id}`, event, data);
          WebSocketManager.getInstance().broadcast(`project:${task.projectId}`, event, data);
        }).catch(() => {});
      }
    }
    return { success: true };
  });

  // Agents list
  fastify.get('/api/agents', async () => {
    return V1_AGENTS;
  });

  // Tools list
  fastify.get('/api/tools', async () => {
    return ToolRegistry.getInstance().getAllTools().map(t => ({
      name: t.definition.name,
      description: t.definition.description,
      riskLevel: t.definition.riskLevel,
      enabled: true
    }));
  });

  // Models CRUD & validation
  fastify.get('/api/models', async () => {
    return await db.select().from(schema.models);
  });

  fastify.post('/api/models/test', async (request: FastifyRequest) => {
    const body = request.body as any;
    ModelService.getInstance().configureProvider(body.providerType, body.baseUrl, body.apiKey, body.model);
    const connected = await ModelService.getInstance().getProvider().testConnection();
    return { success: connected };
  });

  // Memory CRUD
  fastify.get('/api/memory', async (request: FastifyRequest) => {
    const q = request.query as any;
    if (q.projectId) {
      return await MemoryService.getInstance().searchMemories(q.projectId, q.query || '');
    }
    return await db.select().from(schema.memories);
  });

  fastify.post('/api/memory', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = await MemoryService.getInstance().saveMemory(body.projectId, body.type, body.content);
    return { id, success: true };
  });

  fastify.delete('/api/memory/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await MemoryService.getInstance().deleteMemory(request.params.id);
    return { success: true };
  });

  // Approvals
  fastify.get('/api/approvals', async () => {
    return await db.select().from(schema.approvals);
  });

  fastify.post('/api/approvals/:id/approve', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const results = await db.select().from(schema.approvals).where(eq(schema.approvals.id, request.params.id));
    if (results.length === 0) return reply.status(404).send({ error: 'Approval not found' });
    const appr = results[0];

    // Mark approved
    await db.update(schema.approvals).set({ status: 'approved' }).where(eq(schema.approvals.id, request.params.id));
    WebSocketManager.getInstance().broadcastAll('approval.resolved', { approvalId: request.params.id, status: 'approved' });

    // If there's an associated task, try resuming it
    if (appr.taskId) {
      const taskRes = await db.select().from(schema.tasks).where(eq(schema.tasks.id, appr.taskId));
      if (taskRes.length > 0) {
        const task = taskRes[0];
        const projs = await db.select().from(schema.projects).where(eq(schema.projects.id, task.projectId));
        if (projs.length > 0) {
          TaskExecutor.resumeRun(task.id);
          const executor = new TaskExecutor();
          executor.executeTask(task.id, task.projectId, projs[0].workspacePath, {}, (event, data) => {
            WebSocketManager.getInstance().broadcast(`task:${task.id}`, event, data);
            WebSocketManager.getInstance().broadcast(`project:${task.projectId}`, event, data);
          }).catch(() => {});
        }
      }
    }

    return { success: true };
  });

  fastify.post('/api/approvals/:id/deny', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const results = await db.select().from(schema.approvals).where(eq(schema.approvals.id, request.params.id));
    if (results.length === 0) return reply.status(404).send({ error: 'Approval not found' });
    const appr = results[0];

    // Mark denied
    await db.update(schema.approvals).set({ status: 'denied' }).where(eq(schema.approvals.id, request.params.id));
    WebSocketManager.getInstance().broadcastAll('approval.resolved', { approvalId: request.params.id, status: 'denied' });

    // Stop execution of task
    if (appr.taskId) {
      TaskExecutor.stopRun(appr.taskId);
      await db.update(schema.tasks).set({ status: 'failed' }).where(eq(schema.tasks.id, appr.taskId));
      WebSocketManager.getInstance().broadcast(`task:${appr.taskId}`, 'task.failed', { taskId: appr.taskId, reason: 'Permission denied by user' });
    }

    return { success: true };
  });

  // Settings
  fastify.get('/api/settings', async () => {
    const rows = await db.select().from(schema.settings);
    const response: any = {};
    for (const r of rows) {
      response[r.key] = JSON.parse(r.value);
    }
    return response;
  });

  fastify.patch('/api/settings', async (request: FastifyRequest) => {
    const body = request.body as any;
    for (const key of Object.keys(body)) {
      await db.insert(schema.settings)
        .values({ key, value: JSON.stringify(body[key]) })
        .onConflictDoUpdate({
          target: schema.settings.key,
          set: { value: JSON.stringify(body[key]) }
        });
    }
    return { success: true };
  });

  // Chat API - Streams and handles task planning and execution
  fastify.post('/api/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { projectId, conversationId, message } = body;

    if (!projectId || !conversationId || !message) {
      return reply.status(400).send({ error: 'Missing projectId, conversationId, or message' });
    }

    const projs = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    if (projs.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }
    const project = projs[0];

    // Save user message to DB
    const userMsgId = 'msg-' + Math.random().toString(36).substring(7);
    await db.insert(schema.messages).values({
      id: userMsgId,
      conversationId,
      role: 'user',
      content: message,
      createdAt: new Date()
    });

    // Send update back to subscribers
    WebSocketManager.getInstance().broadcast(`conversation:${conversationId}`, 'message.created', {
      id: userMsgId,
      conversationId,
      role: 'user',
      content: message
    });

    // Trigger Agent run
    const agent = new MasterAgent();
    const result = await agent.handleUserRequest(
      projectId,
      conversationId,
      project.workspacePath,
      message,
      (event, data) => {
        // Stream progress to websockets
        WebSocketManager.getInstance().broadcast(`conversation:${conversationId}`, event, data);
        WebSocketManager.getInstance().broadcast(`project:${projectId}`, event, data);
        if (data && data.taskId) {
          WebSocketManager.getInstance().broadcast(`task:${data.taskId}`, event, data);
        }
      }
    );

    // Save assistant starter message to DB
    const assistantMsgId = 'msg-' + Math.random().toString(36).substring(7);
    const content = `Started execution plan with ${result.planSteps.length} tasks. Task ID: ${result.taskId}`;
    await db.insert(schema.messages).values({
      id: assistantMsgId,
      conversationId,
      role: 'assistant',
      content,
      createdAt: new Date()
    });

    WebSocketManager.getInstance().broadcast(`conversation:${conversationId}`, 'message.created', {
      id: assistantMsgId,
      conversationId,
      role: 'assistant',
      content
    });

    return {
      taskId: result.taskId,
      messageId: assistantMsgId,
      content
    };
  });
}
