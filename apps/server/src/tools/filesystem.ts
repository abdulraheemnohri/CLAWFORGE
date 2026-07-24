import { ToolExecutor } from '@clawforge/tool-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { assertInWorkspace } from './filesystem-helper.js';

export const listTool: ToolExecutor = {
  definition: {
    name: 'filesystem.list',
    description: 'Lists files and directories under a given path inside the workspace.',
    schema: z.object({
      path: z.string().optional()
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params, context) => {
    const relativePath = params.path || '.';
    const targetDir = path.join(context.workspacePath, relativePath);
    assertInWorkspace(targetDir, context.workspacePath);
    if (!fs.existsSync(targetDir)) {
      return { files: [], error: 'Directory does not exist' };
    }
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    return {
      files: entries.map(e => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        size: e.isFile() ? fs.statSync(path.join(targetDir, e.name)).size : 0
      }))
    };
  }
};

export const searchTool: ToolExecutor = {
  definition: {
    name: 'filesystem.search',
    description: 'Recursively searches for files matching a pattern inside the workspace.',
    schema: z.object({
      pattern: z.string()
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params, context) => {
    const { pattern } = params;
    const results: string[] = [];
    function walk(dir: string) {
      assertInWorkspace(dir, context.workspacePath);
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(path.relative(context.workspacePath, fullPath));
        }
      }
    }
    walk(context.workspacePath);
    return { results };
  }
};

export const readTool: ToolExecutor = {
  definition: {
    name: 'filesystem.read',
    description: 'Reads contents of a file inside the workspace.',
    schema: z.object({
      filepath: z.string()
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params, context) => {
    const fullPath = path.join(context.workspacePath, params.filepath);
    assertInWorkspace(fullPath, context.workspacePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${params.filepath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return { content };
  }
};

export const writeTool: ToolExecutor = {
  definition: {
    name: 'filesystem.write',
    description: 'Writes/overwrites content to a file inside the workspace.',
    schema: z.object({
      filepath: z.string(),
      content: z.string()
    }),
    riskLevel: 'LOW'
  },
  execute: async (params, context) => {
    const fullPath = path.join(context.workspacePath, params.filepath);
    assertInWorkspace(fullPath, context.workspacePath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, params.content, 'utf-8');
    return { success: true, filepath: params.filepath };
  }
};

export const editTool: ToolExecutor = {
  definition: {
    name: 'filesystem.edit',
    description: 'Replaces occurrences of text inside a file in the workspace.',
    schema: z.object({
      filepath: z.string(),
      search: z.string(),
      replace: z.string()
    }),
    riskLevel: 'LOW'
  },
  execute: async (params, context) => {
    const fullPath = path.join(context.workspacePath, params.filepath);
    assertInWorkspace(fullPath, context.workspacePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found for editing: ${params.filepath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (!content.includes(params.search)) {
      throw new Error(`Search string not found in ${params.filepath}`);
    }
    const updated = content.replace(params.search, params.replace);
    fs.writeFileSync(fullPath, updated, 'utf-8');
    return { success: true };
  }
};

export const renameTool: ToolExecutor = {
  definition: {
    name: 'filesystem.rename',
    description: 'Renames a file or directory inside the workspace.',
    schema: z.object({
      oldFilepath: z.string(),
      newFilepath: z.string()
    }),
    riskLevel: 'MEDIUM'
  },
  execute: async (params, context) => {
    const oldPath = path.join(context.workspacePath, params.oldFilepath);
    const newPath = path.join(context.workspacePath, params.newFilepath);
    assertInWorkspace(oldPath, context.workspacePath);
    assertInWorkspace(newPath, context.workspacePath);
    fs.renameSync(oldPath, newPath);
    return { success: true };
  }
};

export const copyTool: ToolExecutor = {
  definition: {
    name: 'filesystem.copy',
    description: 'Copies a file inside the workspace.',
    schema: z.object({
      srcFilepath: z.string(),
      destFilepath: z.string()
    }),
    riskLevel: 'LOW'
  },
  execute: async (params, context) => {
    const srcPath = path.join(context.workspacePath, params.srcFilepath);
    const destPath = path.join(context.workspacePath, params.destFilepath);
    assertInWorkspace(srcPath, context.workspacePath);
    assertInWorkspace(destPath, context.workspacePath);
    fs.copyFileSync(srcPath, destPath);
    return { success: true };
  }
};

export const moveTool: ToolExecutor = {
  definition: {
    name: 'filesystem.move',
    description: 'Moves a file or folder inside the workspace.',
    schema: z.object({
      srcFilepath: z.string(),
      destFilepath: z.string()
    }),
    riskLevel: 'MEDIUM'
  },
  execute: async (params, context) => {
    const srcPath = path.join(context.workspacePath, params.srcFilepath);
    const destPath = path.join(context.workspacePath, params.destFilepath);
    assertInWorkspace(srcPath, context.workspacePath);
    assertInWorkspace(destPath, context.workspacePath);
    fs.renameSync(srcPath, destPath);
    return { success: true };
  }
};

export const deleteTool: ToolExecutor = {
  definition: {
    name: 'filesystem.delete',
    description: 'Deletes a file or directory inside the workspace. ALWAYS requires explicit approval.',
    schema: z.object({
      filepath: z.string()
    }),
    riskLevel: 'HIGH'
  },
  execute: async (params, context) => {
    const fullPath = path.join(context.workspacePath, params.filepath);
    assertInWorkspace(fullPath, context.workspacePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found for deletion: ${params.filepath}`);
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    return { success: true };
  }
};
