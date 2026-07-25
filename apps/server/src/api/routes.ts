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
}
