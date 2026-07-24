import { describe, it, expect, beforeAll } from 'vitest';
import { initTools, ToolRegistry } from './index.js';
import * as fs from 'fs';
import * as path from 'path';

const tempWorkspace = path.resolve('./temp-test-workspace');

describe('Tools and Safety checks', () => {
  beforeAll(() => {
    initTools();
    if (!fs.existsSync(tempWorkspace)) {
      fs.mkdirSync(tempWorkspace, { recursive: true });
    }
  });

  it('should list and allow file writes inside the workspace', async () => {
    const registry = ToolRegistry.getInstance();
    const writeTool = registry.getTool('filesystem.write');
    const listTool = registry.getTool('filesystem.list');

    expect(writeTool).toBeDefined();
    expect(listTool).toBeDefined();

    const writeRes = await writeTool!.execute({ filepath: 'test.txt', content: 'hello claw' }, { workspacePath: tempWorkspace, projectId: 'p1' });
    expect(writeRes.success).toBe(true);

    const listRes = await listTool!.execute({}, { workspacePath: tempWorkspace, projectId: 'p1' });
    expect(listRes.files.some((f: any) => f.name === 'test.txt')).toBe(true);
  });

  it('should block file writes outside the workspace', async () => {
    const registry = ToolRegistry.getInstance();
    const writeTool = registry.getTool('filesystem.write');

    await expect(
      writeTool!.execute({ filepath: '../../malicious.txt', content: 'hack' }, { workspacePath: tempWorkspace, projectId: 'p1' })
    ).rejects.toThrow(/Security Violation/);
  });

  it('should prevent execution of blocked commands in terminal.run', async () => {
    const registry = ToolRegistry.getInstance();
    const termTool = registry.getTool('terminal.run');

    expect(termTool).toBeDefined();

    await expect(
      termTool!.execute({ command: 'rm -rf /' }, { workspacePath: tempWorkspace, projectId: 'p1' })
    ).rejects.toThrow(/blocked dangerous patterns/);
  });
});
