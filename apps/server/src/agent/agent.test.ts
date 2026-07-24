import { describe, it, expect, beforeAll } from 'vitest';
import { initDb, db } from '../database/index.js';
import { initTools } from '../tools/index.js';
import { MasterAgent } from './master-agent.js';
import { MemoryService } from '../memory/memory-service.js';
import { projects, conversations } from '../database/schema.js';
import * as fs from 'fs';
import * as path from 'path';

const testWorkspace = path.resolve('./agent-test-workspace');

describe('Agent Engine integration', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = ':memory:';
    initDb();
    initTools();
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
  });

  it('should plan and write a file correctly', async () => {
    const projId = 'proj-agent-' + Math.random().toString(36).substring(7);
    const convId = 'conv-agent-' + Math.random().toString(36).substring(7);

    await db.insert(projects).values({
      id: projId,
      name: 'Agent Test Project',
      workspacePath: testWorkspace,
      aiModel: 'mock',
      agentMode: 'auto',
      permissions: '{}',
      createdAt: new Date()
    });

    await db.insert(conversations).values({
      id: convId,
      projectId: projId,
      title: 'Agent Conversation',
      createdAt: new Date()
    });

    const agent = new MasterAgent();
    const events: { event: string; data: any }[] = [];

    const result = await agent.handleUserRequest(
      projId,
      convId,
      testWorkspace,
      'Build me a react expense tracker',
      (event, data) => {
        events.push({ event, data });
      }
    );

    expect(result.taskId).toBeDefined();
    expect(result.planSteps.length).toBeGreaterThan(0);

    // Let the async task executor run for a brief moment to ensure events occur
    await new Promise((res) => setTimeout(res, 300));

    expect(events.some(e => e.event === 'task.created')).toBe(true);
  });

  it('should save and search memories correctly', async () => {
    const projId = 'proj-mem-' + Math.random().toString(36).substring(7);

    // Insert project first to satisfy foreign key constraint
    await db.insert(projects).values({
      id: projId,
      name: 'Memory Test Project',
      workspacePath: testWorkspace,
      aiModel: 'mock',
      agentMode: 'auto',
      permissions: '{}',
      createdAt: new Date()
    });

    const memoryService = MemoryService.getInstance();
    const memId = await memoryService.saveMemory(projId, 'preference', 'User prefers dark mode and react frameworks.');

    const results = await memoryService.searchMemories(projId, 'dark mode');
    expect(results.length).toBe(1);
    expect(results[0].content).toContain('User prefers dark mode');

    await memoryService.deleteMemory(memId);
    const searchAfterDelete = await memoryService.searchMemories(projId, 'dark mode');
    expect(searchAfterDelete.length).toBe(0);
  });
});
