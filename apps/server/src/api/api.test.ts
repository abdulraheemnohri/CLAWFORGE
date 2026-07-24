import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '../index.js';
import { initDb, db } from '../database/index.js';
import { initTools } from '../tools/index.js';
import { projects } from '../database/schema.js';

const authToken = 'clawforge-default-token-12345';

describe('Server REST API Endpoints', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = ':memory:';
    initDb();
    initTools();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return health status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/health'
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe('healthy');
  });

  it('should block unauthorized API requests', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/projects'
    });
    expect(response.statusCode).toBe(401);
  });

  it('should allow authorized API requests and do CRUD operations', async () => {
    // 1. Create a project
    const createRes = await server.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { authorization: `Bearer ${authToken}` },
      body: {
        name: 'My Special Project',
        workspacePath: './test-workspace',
        aiModel: 'mock',
        agentMode: 'auto'
      }
    });
    expect(createRes.statusCode).toBe(200);
    const proj = JSON.parse(createRes.body);
    expect(proj.name).toBe('My Special Project');

    // 2. Read the project
    const readRes = await server.inject({
      method: 'GET',
      url: '/api/projects',
      headers: { authorization: `Bearer ${authToken}` }
    });
    expect(readRes.statusCode).toBe(200);
    const list = JSON.parse(readRes.body);
    expect(list.some((p: any) => p.id === proj.id)).toBe(true);

    // 3. Delete the project
    const delRes = await server.inject({
      method: 'DELETE',
      url: `/api/projects/${proj.id}`,
      headers: { authorization: `Bearer ${authToken}` }
    });
    expect(delRes.statusCode).toBe(200);
  });
});
