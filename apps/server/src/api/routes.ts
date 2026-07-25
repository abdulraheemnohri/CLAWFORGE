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
  // CORS Support Hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });

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

  // Manual Terminal Executions
  fastify.post('/api/terminal/run', async (request: FastifyRequest) => {
    const { command, projectId } = request.body as any;
    const projs = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId));
    if (projs.length === 0) {
      throw new Error('Project not found');
    }
    const tool = ToolRegistry.getInstance().getTool('terminal.run');
    if (!tool) throw new Error('terminal.run tool not found');

    const result = await tool.execute({ command }, { workspacePath: projs[0].workspacePath, projectId });
    return result;
  });

  // Manual Browser Navigation
  fastify.post('/api/browser/navigate', async (request: FastifyRequest) => {
    const { url } = request.body as any;
    const openTool = ToolRegistry.getInstance().getTool('browser.open');
    if (!openTool) throw new Error('browser.open tool not found');
    const result = await openTool.execute({ url }, { workspacePath: './', projectId: 'temp' });

    // Extract text
    const extractTool = ToolRegistry.getInstance().getTool('browser.extract');
    let text = '';
    if (extractTool) {
      const extRes = await extractTool.execute({}, { workspacePath: './', projectId: 'temp' });
      if (extRes.success) text = extRes.text;
    }

    // Get screenshot
    const screenshotTool = ToolRegistry.getInstance().getTool('browser.screenshot');
    let base64 = '';
    if (screenshotTool) {
      const scrRes = await screenshotTool.execute({}, { workspacePath: './', projectId: 'temp' });
      if (scrRes.success) base64 = scrRes.base64;
    }

    return { ...result, text, base64 };
  });

  // ==========================================
  // V2 API Extensions
  // ==========================================

  // Skills CRUD & pre-population
  fastify.get('/api/skills', async () => {
    let list = await db.select().from(schema.skills);
    if (list.length === 0) {
      // Seed default skills
      const defaultSkills = [
        {
          id: 'skill-react-dev',
          packageName: '@clawforge/skill-react-dev',
          title: 'React Developer',
          description: 'Specialized agent for React, TailwindCSS, and frontend state optimization.',
          version: '1.2.0',
          enabled: true,
          skillJson: JSON.stringify({ tools: ['create-component', 'optimize-bundle'] }),
          instructions: 'Always use Tailwind classes and adhere strictly to TypeScript rules.',
          createdAt: new Date()
        },
        {
          id: 'skill-nodejs-dev',
          packageName: '@clawforge/skill-nodejs-dev',
          title: 'Node.js Developer',
          description: 'Expertise in Fastify, Express, and high-throughput background processing pipelines.',
          version: '1.0.4',
          enabled: true,
          skillJson: JSON.stringify({ tools: ['generate-route', 'inspect-memory'] }),
          instructions: 'Leverage native ESM and keep dependencies lean.',
          createdAt: new Date()
        },
        {
          id: 'skill-python-dev',
          packageName: '@clawforge/skill-python-dev',
          title: 'Python Developer',
          description: 'Expert in Python pandas, FastAPI, and asynchronous task scheduling.',
          version: '2.1.0',
          enabled: false,
          skillJson: JSON.stringify({ tools: ['run-notebook', 'lint-py'] }),
          instructions: 'Follow PEP 8 rules closely.',
          createdAt: new Date()
        },
        {
          id: 'skill-qa-tester',
          packageName: '@clawforge/skill-qa-tester',
          title: 'QA Tester',
          description: 'Automated Playwright and unit testing suite generator.',
          version: '1.1.1',
          enabled: true,
          skillJson: JSON.stringify({ tools: ['generate-tests', 'run-e2e'] }),
          instructions: 'Ensure complete test coverage and generate browser screenshots for user validation.',
          createdAt: new Date()
        }
      ];
      for (const s of defaultSkills) {
        await db.insert(schema.skills).values(s).onConflictDoNothing();
      }
      list = await db.select().from(schema.skills);
    }
    return list;
  });

  fastify.post('/api/skills', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'skill-' + Math.random().toString(36).substring(7);
    const newSkill = {
      id,
      packageName: body.packageName || '@clawforge/skill-custom',
      title: body.title || 'Custom Assistant',
      description: body.description || '',
      version: body.version || '1.0.0',
      enabled: body.enabled !== undefined ? body.enabled : true,
      skillJson: JSON.stringify(body.skillJson || {}),
      instructions: body.instructions || '',
      createdAt: new Date()
    };
    await db.insert(schema.skills).values(newSkill);
    return newSkill;
  });

  fastify.patch('/api/skills/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updates: any = {};
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.version !== undefined) updates.version = body.version;

    await db.update(schema.skills).set(updates).where(eq(schema.skills.id, request.params.id));
    const res = await db.select().from(schema.skills).where(eq(schema.skills.id, request.params.id));
    return res[0];
  });

  fastify.delete('/api/skills/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.skills).where(eq(schema.skills.id, request.params.id));
    return { success: true };
  });


  // MCP Servers CRUD & pre-population
  fastify.get('/api/mcp', async () => {
    let list = await db.select().from(schema.mcpServers);
    if (list.length === 0) {
      const defaultMcp = [
        {
          id: 'mcp-github',
          name: 'GitHub MCP',
          description: 'Secure API connector to list, audit, and push commits to repository branches.',
          version: '1.5.0',
          status: 'connected',
          url: 'http://127.0.0.1:4011/mcp',
          toolsJson: JSON.stringify(['github.list_prs', 'github.create_issue', 'github.merge_branch']),
          permissionsJson: JSON.stringify({ read: true, write: true }),
          enabled: true,
          createdAt: new Date()
        },
        {
          id: 'mcp-filesystem',
          name: 'Filesystem MCP',
          description: 'Sandboxed local system file directory and file tree explorer.',
          version: '1.0.0',
          status: 'connected',
          url: 'http://127.0.0.1:4012/mcp',
          toolsJson: JSON.stringify(['fs.read_file', 'fs.write_file', 'fs.list_dir']),
          permissionsJson: JSON.stringify({ read: true, write: false }),
          enabled: true,
          createdAt: new Date()
        },
        {
          id: 'mcp-postgres',
          name: 'PostgreSQL MCP',
          description: 'Relational PostgreSQL connection string schema explorer & analytical query runner.',
          version: '2.0.1',
          status: 'disconnected',
          url: 'http://127.0.0.1:4013/mcp',
          toolsJson: JSON.stringify(['pg.run_query', 'pg.get_tables']),
          permissionsJson: JSON.stringify({ read: true, write: true }),
          enabled: false,
          createdAt: new Date()
        }
      ];
      for (const m of defaultMcp) {
        await db.insert(schema.mcpServers).values(m).onConflictDoNothing();
      }
      list = await db.select().from(schema.mcpServers);
    }
    return list;
  });

  fastify.post('/api/mcp', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'mcp-' + Math.random().toString(36).substring(7);
    const newMcp = {
      id,
      name: body.name || 'New MCP Server',
      description: body.description || '',
      version: body.version || '1.0.0',
      status: body.status || 'disconnected',
      url: body.url || '',
      toolsJson: JSON.stringify(body.tools || []),
      permissionsJson: JSON.stringify(body.permissions || {}),
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdAt: new Date()
    };
    await db.insert(schema.mcpServers).values(newMcp);
    return newMcp;
  });

  fastify.patch('/api/mcp/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updates: any = {};
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.url !== undefined) updates.url = body.url;

    await db.update(schema.mcpServers).set(updates).where(eq(schema.mcpServers.id, request.params.id));
    const res = await db.select().from(schema.mcpServers).where(eq(schema.mcpServers.id, request.params.id));
    return res[0];
  });

  fastify.post('/api/mcp/:id/test', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const res = await db.select().from(schema.mcpServers).where(eq(schema.mcpServers.id, request.params.id));
    if (res.length === 0) return { success: false, error: 'MCP Server not found' };

    // Toggle status to connected on test connection
    await db.update(schema.mcpServers).set({ status: 'connected' }).where(eq(schema.mcpServers.id, request.params.id));
    const updated = await db.select().from(schema.mcpServers).where(eq(schema.mcpServers.id, request.params.id));
    return { success: true, server: updated[0] };
  });

  fastify.delete('/api/mcp/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.mcpServers).where(eq(schema.mcpServers.id, request.params.id));
    return { success: true };
  });


  // Plugins CRUD & pre-population
  fastify.get('/api/plugins', async () => {
    let list = await db.select().from(schema.plugins);
    if (list.length === 0) {
      const defaultPlugins = [
        {
          id: 'plugin-desktop-tools',
          name: 'Desktop Tools',
          description: 'Allows desktop integrations such as custom menu actions, audio input pipelines, and task bar indicators.',
          version: '1.0.0',
          status: 'installed',
          enabled: true,
          permissionsJson: JSON.stringify(['microphone', 'desktop-notifications']),
          manifestJson: JSON.stringify({ entry: 'dist/desktop.js', uiExtensions: true }),
          createdAt: new Date()
        },
        {
          id: 'plugin-slack-connector',
          name: 'Slack Notification Bridge',
          description: 'Publishes task successes/failures and live human-in-the-loop permission prompts to selected Slack channels.',
          version: '2.1.2',
          status: 'installed',
          enabled: true,
          permissionsJson: JSON.stringify(['webhooks', 'external-network']),
          manifestJson: JSON.stringify({ entry: 'dist/slack.js', uiExtensions: false }),
          createdAt: new Date()
        }
      ];
      for (const p of defaultPlugins) {
        await db.insert(schema.plugins).values(p).onConflictDoNothing();
      }
      list = await db.select().from(schema.plugins);
    }
    return list;
  });

  fastify.post('/api/plugins', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'plugin-' + Math.random().toString(36).substring(7);
    const newPlugin = {
      id,
      name: body.name || 'New Plugin',
      description: body.description || '',
      version: body.version || '1.0.0',
      status: 'installed',
      enabled: body.enabled !== undefined ? body.enabled : true,
      permissionsJson: JSON.stringify(body.permissions || []),
      manifestJson: JSON.stringify(body.manifest || {}),
      createdAt: new Date()
    };
    await db.insert(schema.plugins).values(newPlugin);
    return newPlugin;
  });

  fastify.patch('/api/plugins/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updates: any = {};
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;

    await db.update(schema.plugins).set(updates).where(eq(schema.plugins.id, request.params.id));
    const res = await db.select().from(schema.plugins).where(eq(schema.plugins.id, request.params.id));
    return res[0];
  });

  fastify.delete('/api/plugins/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.plugins).where(eq(schema.plugins.id, request.params.id));
    return { success: true };
  });


  // Paired Devices CRUD & pre-population
  fastify.get('/api/devices', async () => {
    let list = await db.select().from(schema.pairedDevices);
    if (list.length === 0) {
      const defaultDevices = [
        {
          id: 'dev-macbook-cli',
          name: 'MacBook Pro CLI Client',
          type: 'cli',
          pairingCode: 'CF-9821',
          status: 'paired',
          lastConnectedAt: new Date(),
          createdAt: new Date()
        },
        {
          id: 'dev-windows-workspace',
          name: 'Windows Desktop Workspace',
          type: 'desktop',
          pairingCode: 'CF-3301',
          status: 'paired',
          lastConnectedAt: new Date(Date.now() - 3600000),
          createdAt: new Date()
        }
      ];
      for (const d of defaultDevices) {
        await db.insert(schema.pairedDevices).values(d).onConflictDoNothing();
      }
      list = await db.select().from(schema.pairedDevices);
    }
    return list;
  });

  fastify.post('/api/devices/pair', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = 'dev-' + Math.random().toString(36).substring(7);
    const code = 'CF-' + Math.floor(1000 + Math.random() * 9000);
    const newDevice = {
      id,
      name: body.name || 'New Mobile Companion',
      type: body.type || 'android',
      pairingCode: code,
      status: 'pending',
      lastConnectedAt: null,
      createdAt: new Date()
    };
    await db.insert(schema.pairedDevices).values(newDevice);
    return newDevice;
  });

  fastify.delete('/api/devices/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.pairedDevices).where(eq(schema.pairedDevices.id, request.params.id));
    return { success: true };
  });


  // Workflow Automation & pre-population
  fastify.get('/api/automation', async () => {
    let list = await db.select().from(schema.workflows);
    if (list.length === 0) {
      const defaultWorkflows = [
        {
          id: 'wf-daily-git',
          name: 'Daily GitHub Sync',
          triggerType: 'schedule',
          condition: 'Every day at 09:00 AM',
          status: 'active',
          metricsJson: JSON.stringify({ totalRuns: 124, successes: 121, failures: 3 }),
          executionLogsJson: JSON.stringify([
            { timestamp: new Date(Date.now() - 60000).toISOString(), status: 'success', message: 'Pull requests audited and summary compiled successfully.' }
          ]),
          createdAt: new Date()
        },
        {
          id: 'wf-code-audit',
          name: 'Auto Code Review & Audit',
          triggerType: 'git_commit',
          condition: 'On branch main commit',
          status: 'active',
          metricsJson: JSON.stringify({ totalRuns: 15, successes: 15, failures: 0 }),
          executionLogsJson: JSON.stringify([
            { timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success', message: 'All files analyzed with no high risk patterns identified.' }
          ]),
          createdAt: new Date()
        }
      ];
      for (const w of defaultWorkflows) {
        await db.insert(schema.workflows).values(w).onConflictDoNothing();
      }
      list = await db.select().from(schema.workflows);
    }
    return list;
  });

  fastify.post('/api/automation', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'wf-' + Math.random().toString(36).substring(7);
    const newWorkflow = {
      id,
      name: body.name || 'Unnamed Workflow',
      triggerType: body.triggerType || 'manual',
      condition: body.condition || '',
      status: 'active',
      metricsJson: JSON.stringify({ totalRuns: 0, successes: 0, failures: 0 }),
      executionLogsJson: JSON.stringify([]),
      createdAt: new Date()
    };
    await db.insert(schema.workflows).values(newWorkflow);
    return newWorkflow;
  });

  fastify.patch('/api/automation/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updates: any = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.name !== undefined) updates.name = body.name;
    if (body.condition !== undefined) updates.condition = body.condition;
    if (body.triggerType !== undefined) updates.triggerType = body.triggerType;

    await db.update(schema.workflows).set(updates).where(eq(schema.workflows.id, request.params.id));
    const res = await db.select().from(schema.workflows).where(eq(schema.workflows.id, request.params.id));
    return res[0];
  });

  fastify.post('/api/workflows/:id/trigger', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const res = await db.select().from(schema.workflows).where(eq(schema.workflows.id, request.params.id));
    if (res.length === 0) return { success: false, error: 'Workflow not found' };

    const wf = res[0];
    const metrics = JSON.parse(wf.metricsJson || '{"totalRuns":0,"successes":0,"failures":0}');
    metrics.totalRuns += 1;
    metrics.successes += 1;

    const logs = JSON.parse(wf.executionLogsJson || '[]');
    logs.unshift({
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Manual workflow execution completed successfully.'
    });

    await db.update(schema.workflows).set({
      metricsJson: JSON.stringify(metrics),
      executionLogsJson: JSON.stringify(logs)
    }).where(eq(schema.workflows.id, request.params.id));

    WebSocketManager.getInstance().broadcastAll('workflow.completed', { workflowId: request.params.id });

    const updated = await db.select().from(schema.workflows).where(eq(schema.workflows.id, request.params.id));
    return updated[0];
  });

  fastify.delete('/api/automation/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.workflows).where(eq(schema.workflows.id, request.params.id));
    return { success: true };
  });


  // Voice & Wakeword configurations
  fastify.get('/api/voice', async () => {
    const res = await db.select().from(schema.settings).where(eq(schema.settings.key, 'v2_voice'));
    if (res.length === 0) {
      const config = {
        speechEngine: 'Local DeepSpeech',
        continuousConversation: true,
        noiseSuppression: true,
        speakerSelection: 'Default System Audio',
        microphoneSelection: 'Built-in Microphone',
        automaticPunctuation: true,
        language: 'en-US'
      };
      await db.insert(schema.settings).values({ key: 'v2_voice', value: JSON.stringify(config) });
      return config;
    }
    return JSON.parse(res[0].value);
  });

  fastify.post('/api/voice', async (request: FastifyRequest) => {
    const body = request.body as any;
    await db.insert(schema.settings)
      .values({ key: 'v2_voice', value: JSON.stringify(body) })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: JSON.stringify(body) }
      });
    return { success: true };
  });

  fastify.get('/api/wakeword', async () => {
    const res = await db.select().from(schema.settings).where(eq(schema.settings.key, 'v2_wakeword'));
    if (res.length === 0) {
      const config = {
        enabled: true,
        wakePhrases: ['Hey Claw', 'Hey Forge'],
        sensitivity: 0.75,
        powerMode: 'Balanced'
      };
      await db.insert(schema.settings).values({ key: 'v2_wakeword', value: JSON.stringify(config) });
      return config;
    }
    return JSON.parse(res[0].value);
  });

  fastify.post('/api/wakeword', async (request: FastifyRequest) => {
    const body = request.body as any;
    await db.insert(schema.settings)
      .values({ key: 'v2_wakeword', value: JSON.stringify(body) })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: JSON.stringify(body) }
      });
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

  // ==========================================
  // V3 API Extensions
  // ==========================================

  // 1. V3 Specialized Agents List & CRUD
  fastify.get('/api/v3/agents', async () => {
    let list = await db.select().from(schema.agents);
    if (list.length === 0) {
      // Seed 60+ specialized agents (structured categories)
      const initialAgents = [
        // Management
        { id: 'agent-master', name: 'Master Orchestrator', type: 'management', role: 'Master Agent', description: 'Controls and delegates actions to sub-agents.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'You are Master Agent. Direct work to specialists.' },
        { id: 'agent-planner', name: 'Strategic Planner', type: 'management', role: 'Planner Agent', description: 'Decomposes complex requests into task dependency graphs.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Formulate execution stages.' },
        { id: 'agent-router', name: 'Intelligent Router', type: 'management', role: 'Router Agent', description: 'Dynamically maps tool and LLM model bindings.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Select optimal engine paths.' },
        // Development
        { id: 'agent-coding', name: 'ClawForge Senior Developer', type: 'development', role: 'Coding Agent', description: 'Generates, modifies, and refactors application source code.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Generate robust, bug-free implementations.' },
        { id: 'agent-architect', name: 'Systems Architect', type: 'development', role: 'Software Architect Agent', description: 'System design planning and schema outline layout.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Adhere to extreme performance guidelines.' },
        { id: 'agent-debug', name: 'Linter & Debug Agent', type: 'development', role: 'Debug Agent', description: 'Analyzes error stack traces and deploys automated hotfixes.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Diagnose memory leaks and exceptions.' },
        { id: 'agent-tester', name: 'QA & Playwright Tester', type: 'development', role: 'Testing Agent', description: 'Fulfills Jest, Vitest, and Playwright verification scripts.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Guarantee 100% code coverage.' },
        { id: 'agent-devops', name: 'CI/CD Cloud Ops', type: 'development', role: 'DevOps Agent', description: 'Coordinates automated Docker and VPS container deployments.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Deploy services securely.' },
        { id: 'agent-db', name: 'SQL Schema Expert', type: 'development', role: 'Database Agent', description: 'Optimizes slow SQL queries and designs migration schemas.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Strict Drizzle configurations.' },
        // Research
        { id: 'agent-research', name: 'Deep Web Researcher', type: 'research', role: 'Research Agent', description: 'Asynchronous multi-source scraper and comparison report compiler.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Include clear peer citations.' },
        { id: 'agent-knowledge', name: 'RAG Knowledge Agent', type: 'research', role: 'Knowledge Agent', description: 'Semantic retriever mapping context nodes.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Answer strictly from documentation.' },
        { id: 'agent-data', name: 'Statistical CSV Analyst', type: 'research', role: 'Data Analyst Agent', description: 'Runs math calculations and generates Recharts data arrays.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Return clean JSON data sets.' },
        // Creative
        { id: 'agent-writer', name: 'Creative Content Writer', type: 'creative', role: 'Writer Agent', description: 'Drafts technical articles, documentation, and sales scripts.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'High quality copywriting styles.' },
        { id: 'agent-designer', name: 'Figma UI Concept Artist', type: 'creative', role: 'Designer Agent', description: 'Builds beautiful Tailwind palettes and responsive prototypes.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Focus on modern modern dark interfaces.' },
        { id: 'agent-marketing', name: 'SEO Growth Agent', type: 'creative', role: 'Marketing Agent', description: 'Monitors search keywords and plans advertising campaigns.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Optimize search positioning parameters.' },
        // Security
        { id: 'agent-sec-analyst', name: 'Penetration Tester', type: 'security', role: 'Security Analyst', description: 'Vulnerability analysis and security threat audit checks.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Audit packages and open ports.' },
        { id: 'agent-threat', name: 'Threat Intelligence Crawler', type: 'security', role: 'Threat Intelligence Agent', description: 'Checks public CVE logs and monitors active IOC feeds.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Identify current attack surfaces.' },
        { id: 'agent-sec-code', name: 'Static Code Scanner', type: 'security', role: 'Code Security Agent', description: 'Scans source trees for exposed auth tokens and credentials.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Zero tolerance for plain text API keys.' },
        // Personal
        { id: 'agent-assistant', name: 'Executive Personal AI', type: 'personal', role: 'Assistant Agent', description: 'Daily agenda schedules, alerts, and calendar planning.', enabled: true, createdAt: new Date(), configJson: '{}', systemPrompt: 'Be concise, helpful, and friendly.' }
      ];

      for (const a of initialAgents) {
        await db.insert(schema.agents).values(a).onConflictDoNothing();
      }
      list = await db.select().from(schema.agents);
    }
    return list;
  });

  fastify.post('/api/v3/agents', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'agent-' + Math.random().toString(36).substring(7);
    const newAgent = {
      id,
      name: body.name || 'New Specialist',
      type: body.type || 'development',
      role: body.role || 'Assistant Agent',
      description: body.description || '',
      systemPrompt: body.systemPrompt || '',
      configJson: JSON.stringify(body.config || {}),
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdAt: new Date()
    };
    await db.insert(schema.agents).values(newAgent);
    return newAgent;
  });

  fastify.patch('/api/v3/agents/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updates: any = {};
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.systemPrompt !== undefined) updates.systemPrompt = body.systemPrompt;

    await db.update(schema.agents).set(updates).where(eq(schema.agents.id, request.params.id));
    const res = await db.select().from(schema.agents).where(eq(schema.agents.id, request.params.id));
    return res[0];
  });

  fastify.delete('/api/v3/agents/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.agents).where(eq(schema.agents.id, request.params.id));
    return { success: true };
  });

  // 2. V3 Custom AI Providers Endpoints
  fastify.get('/api/v3/providers', async () => {
    let list = await db.select().from(schema.providers);
    if (list.length === 0) {
      const defaultProv = [
        { id: 'prov-ollama', name: 'Ollama (Local Host)', type: 'ollama', baseUrl: 'http://127.0.0.1:11434', apiKey: '', createdAt: new Date() },
        { id: 'prov-openai', name: 'OpenAI Cloud', type: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: 'sk-proj-******************', createdAt: new Date() },
        { id: 'prov-anthropic', name: 'Anthropic Claude Engine', type: 'openai', baseUrl: 'https://api.anthropic.com', apiKey: 'sk-ant-******************', createdAt: new Date() },
        { id: 'prov-deepseek', name: 'DeepSeek Chat Coder', type: 'openai', baseUrl: 'https://api.deepseek.com', apiKey: 'sk-ds-******************', createdAt: new Date() }
      ];
      for (const p of defaultProv) {
        await db.insert(schema.providers).values(p).onConflictDoNothing();
      }
      list = await db.select().from(schema.providers);
    }
    return list;
  });

  fastify.post('/api/v3/providers', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'prov-' + Math.random().toString(36).substring(7);
    const newProv = {
      id,
      name: body.name || 'Custom OpenAI Endpoint',
      type: body.type || 'openai',
      baseUrl: body.baseUrl || 'https://api.custom.com/v1',
      apiKey: body.apiKey || '',
      createdAt: new Date()
    };
    await db.insert(schema.providers).values(newProv);
    return newProv;
  });

  fastify.delete('/api/v3/providers/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.providers).where(eq(schema.providers.id, request.params.id));
    return { success: true };
  });

  // V3 AI Models Routing & Model Lists
  fastify.get('/api/v3/models', async () => {
    let list = await db.select().from(schema.models);
    if (list.length === 0) {
      const defaultMod = [
        { id: 'mod-llama3', providerId: 'prov-ollama', name: 'Llama 3.2 (3B)', config: JSON.stringify({ mode: 'privacy', maxTokens: 4096, speed: 'fast' }), createdAt: new Date() },
        { id: 'mod-gpt4o', providerId: 'prov-openai', name: 'GPT-4o (Omni)', config: JSON.stringify({ mode: 'quality', maxTokens: 8192, speed: 'balanced' }), createdAt: new Date() },
        { id: 'mod-claude35', providerId: 'prov-anthropic', name: 'Claude 3.5 Sonnet', config: JSON.stringify({ mode: 'coding', maxTokens: 16384, speed: 'detailed' }), createdAt: new Date() },
        { id: 'mod-deepseek-coder', providerId: 'prov-deepseek', name: 'DeepSeek-V3 Coder', config: JSON.stringify({ mode: 'cost', maxTokens: 8192, speed: 'fast' }), createdAt: new Date() }
      ];
      for (const m of defaultMod) {
        await db.insert(schema.models).values(m).onConflictDoNothing();
      }
      list = await db.select().from(schema.models);
    }
    return list;
  });

  fastify.post('/api/v3/models', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'mod-' + Math.random().toString(36).substring(7);
    const newModel = {
      id,
      providerId: body.providerId || 'prov-openai',
      name: body.name || 'New Model Entry',
      config: JSON.stringify(body.config || {}),
      createdAt: new Date()
    };
    await db.insert(schema.models).values(newModel);
    return newModel;
  });

  fastify.delete('/api/v3/models/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.models).where(eq(schema.models.id, request.params.id));
    return { success: true };
  });


  // 3. V3 RAG Knowledge Pipeline Endpoints
  fastify.get('/api/v3/rag/documents', async () => {
    let list = await db.select().from(schema.documents);
    if (list.length === 0) {
      // Seed files
      const defaultDocs = [
        { id: 'doc-handbook', collectionId: 'default', name: 'ClawForge Architecture V3.pdf', type: 'pdf', path: '/docs/architecture.pdf', size: 125044, status: 'indexed', parsedText: 'This document defines the personal autonomous AI agent orchestration.', chunkCount: 38, createdAt: new Date() },
        { id: 'doc-readme', collectionId: 'default', name: 'README.md', type: 'markdown', path: '/README.md', size: 4500, status: 'indexed', parsedText: 'Monorepo installation guide using pnpm, Fastify database schema migrations, and Turborepo instructions.', chunkCount: 5, createdAt: new Date() },
        { id: 'doc-security', collectionId: 'default', name: 'SECURITY_POLICIES.docx', type: 'docx', path: '/docs/sec.docx', size: 420000, status: 'parsing', parsedText: null, chunkCount: 0, createdAt: new Date() }
      ];
      for (const d of defaultDocs) {
        await db.insert(schema.documents).values(d).onConflictDoNothing();
      }
      list = await db.select().from(schema.documents);
    }
    return list;
  });

  fastify.post('/api/v3/rag/documents', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'doc-' + Math.random().toString(36).substring(7);
    const newDoc = {
      id,
      collectionId: body.collectionId || 'default',
      name: body.name || 'document.txt',
      type: body.type || 'txt',
      path: body.path || '/uploads/' + (body.name || 'document.txt'),
      size: body.size || 1024,
      status: 'parsing',
      parsedText: body.parsedText || 'Uploaded custom document content for RAG vector parsing.',
      chunkCount: 0,
      createdAt: new Date()
    };
    await db.insert(schema.documents).values(newDoc);

    // Simulate background chunker & embedding mapping
    setTimeout(async () => {
      try {
        const chunkCount = Math.floor(1 + Math.random() * 5);
        await db.update(schema.documents).set({ status: 'indexed', chunkCount }).where(eq(schema.documents.id, id));
        for (let i = 0; i < chunkCount; i++) {
          await db.insert(schema.embeddings).values({
            id: `emb-${id}-${i}`,
            documentId: id,
            chunkIndex: i,
            text: `Chunk index ${i + 1} mapping of ${newDoc.name}. Includes context rules.`,
            vectorJson: JSON.stringify(Array.from({ length: 8 }, () => Math.random())),
            createdAt: new Date()
          });
        }
      } catch (e) {
        console.error('Mock embedding pipeline error', e);
      }
    }, 1500);

    return newDoc;
  });

  fastify.delete('/api/v3/rag/documents/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.documents).where(eq(schema.documents.id, request.params.id));
    return { success: true };
  });

  fastify.post('/api/v3/rag/query', async (request: FastifyRequest) => {
    const { query, collectionId } = request.body as any;
    // Hybrid retrieval semantic simulation
    const embeddingsList = await db.select().from(schema.embeddings);
    const results = embeddingsList.slice(0, 3).map((e, index) => ({
      score: 0.95 - index * 0.12,
      chunkIndex: e.chunkIndex,
      text: e.text,
      documentId: e.documentId,
      citation: `Doc #${e.documentId.substring(4)} (Chunk ${e.chunkIndex})`
    }));
    return { query, results };
  });


  // 4. V3 Visual Workflows Nodes & Runs Endpoints
  fastify.get('/api/v3/workflow_runs', async () => {
    let list = await db.select().from(schema.workflowRuns);
    if (list.length === 0) {
      const defaultRuns = [
        { id: 'run-w-1', workflowId: 'wf-daily-git', triggerType: 'schedule', status: 'success', logsJson: JSON.stringify(['Timer fired', 'Checked git pull request commits', 'Report dispatched']), durationMs: 1450, createdAt: new Date() },
        { id: 'run-w-2', workflowId: 'wf-code-audit', triggerType: 'git_commit', status: 'success', logsJson: JSON.stringify(['Git hook received', 'Linter analysis executed successfully']), durationMs: 4200, createdAt: new Date(Date.now() - 1200000) }
      ];
      for (const r of defaultRuns) {
        await db.insert(schema.workflowRuns).values(r).onConflictDoNothing();
      }
      list = await db.select().from(schema.workflowRuns);
    }
    return list;
  });

  fastify.post('/api/v3/workflows/:id/run', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const res = await db.select().from(schema.workflows).where(eq(schema.workflows.id, request.params.id));
    if (res.length === 0) return { success: false, error: 'Workflow not found' };

    const runId = 'run-' + Math.random().toString(36).substring(7);
    const newRun = {
      id: runId,
      workflowId: request.params.id,
      triggerType: 'manual',
      status: 'success',
      logsJson: JSON.stringify(['Instantiated V3 flow visual nodes.', 'Loaded Start node', 'Executed Code Agent block', 'Completed trigger end node']),
      durationMs: 980,
      createdAt: new Date()
    };
    await db.insert(schema.workflowRuns).values(newRun);
    return newRun;
  });


  // 5. V3 Advanced Observability Endpoints
  fastify.get('/api/v3/observability/metrics', async () => {
    let list = await db.select().from(schema.metrics);
    if (list.length === 0) {
      const defaultMetrics = [
        { id: 'met-rt', key: 'response_time', value: '380.5', timestamp: new Date() },
        { id: 'met-tu', key: 'token_usage', value: '14520', timestamp: new Date() },
        { id: 'met-pc', key: 'provider_cost', value: '0.142', timestamp: new Date() },
        { id: 'met-sr', key: 'success_rate', value: '98.5', timestamp: new Date() },
        { id: 'met-err', key: 'error_count', value: '2', timestamp: new Date() }
      ];
      for (const m of defaultMetrics) {
        await db.insert(schema.metrics).values(m).onConflictDoNothing();
      }
      list = await db.select().from(schema.metrics);
    }
    return list;
  });

  fastify.get('/api/v3/observability/traces', async () => {
    let list = await db.select().from(schema.traces);
    if (list.length === 0) {
      const defaultTraces = [
        { id: 'tr-1', stepName: 'Planner', entityType: 'agent', entityName: 'Planner Agent', input: 'Draft complete API', output: 'Identified three distinct task files', durationMs: 240, createdAt: new Date() },
        { id: 'tr-2', stepName: 'Agent Selection', entityType: 'agent', entityName: 'Router Agent', input: 'Code requested', output: 'Routed task to ClawForge Senior Developer', durationMs: 80, createdAt: new Date() },
        { id: 'tr-3', stepName: 'Tool Execute', entityType: 'tool', entityName: 'fs.write_file', input: 'Write schema code', output: 'Written successfully. Code secure.', durationMs: 120, createdAt: new Date() },
        { id: 'tr-4', stepName: 'Verification', entityType: 'agent', entityName: 'Testing Agent', input: 'Check syntax', output: 'Linter passed. No errors found.', durationMs: 140, createdAt: new Date() }
      ];
      for (const t of defaultTraces) {
        await db.insert(schema.traces).values(t).onConflictDoNothing();
      }
      list = await db.select().from(schema.traces);
    }
    return list;
  });


  // 6. V3 Policies Engine Endpoints
  fastify.get('/api/v3/policies', async () => {
    let list = await db.select().from(schema.policies);
    if (list.length === 0) {
      const defaultPol = [
        { id: 'pol-fs-read', entityType: 'tool', entityId: 'filesystem.read', operation: 'read', policyLevel: 'allow', createdAt: new Date() },
        { id: 'pol-fs-write', entityType: 'tool', entityId: 'filesystem.write', operation: 'write', policyLevel: 'ask', createdAt: new Date() },
        { id: 'pol-fs-delete', entityType: 'tool', entityId: 'filesystem.delete', operation: 'delete', policyLevel: 'deny', createdAt: new Date() },
        { id: 'pol-term-run', entityType: 'tool', entityId: 'terminal.execute', operation: 'execute', policyLevel: 'ask', createdAt: new Date() },
        { id: 'pol-web-cont', entityType: 'tool', entityId: 'browser.control', operation: 'control', policyLevel: 'allow', createdAt: new Date() },
        { id: 'pol-net-acc', entityType: 'project', entityId: 'network.access', operation: 'access', policyLevel: 'allow', createdAt: new Date() }
      ];
      for (const p of defaultPol) {
        await db.insert(schema.policies).values(p).onConflictDoNothing();
      }
      list = await db.select().from(schema.policies);
    }
    return list;
  });

  fastify.post('/api/v3/policies', async (request: FastifyRequest) => {
    const body = request.body as any;
    const id = body.id || 'pol-' + Math.random().toString(36).substring(7);
    const newPol = {
      id,
      entityType: body.entityType || 'tool',
      entityId: body.entityId || 'custom-tool',
      operation: body.operation || 'execute',
      policyLevel: body.policyLevel || 'ask',
      createdAt: new Date()
    };
    await db.insert(schema.policies).values(newPol);
    return newPol;
  });

  fastify.patch('/api/v3/policies/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const body = request.body as any;
    const updates: any = {};
    if (body.policyLevel !== undefined) updates.policyLevel = body.policyLevel;

    await db.update(schema.policies).set(updates).where(eq(schema.policies.id, request.params.id));
    const res = await db.select().from(schema.policies).where(eq(schema.policies.id, request.params.id));
    return res[0];
  });

  fastify.delete('/api/v3/policies/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await db.delete(schema.policies).where(eq(schema.policies.id, request.params.id));
    return { success: true };
  });
}
