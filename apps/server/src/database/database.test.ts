import { describe, it, expect, beforeAll } from 'vitest';
import { db, initDb } from './index.js';
import { projects } from './schema.js';

describe('Database Setup', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = ':memory:';
    initDb();
  });

  it('should initialize tables and allow insertion', async () => {
    const projId = 'proj-' + Math.random().toString(36).substring(7);
    await db.insert(projects).values({
      id: projId,
      name: 'Test Project',
      description: 'Test Desc',
      workspacePath: '/tmp/test',
      aiModel: 'mock',
      agentMode: 'auto',
      permissions: '{}',
      createdAt: new Date()
    });

    const results = await db.select().from(projects);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
