import { ToolExecutor } from '@clawforge/tool-sdk';
import { z } from 'zod';
import { simpleGit } from 'simple-git';

export const gitStatusTool: ToolExecutor = {
  definition: {
    name: 'git.status',
    description: 'Retrieves current git repository status.',
    schema: z.object({}),
    riskLevel: 'SAFE'
  },
  execute: async (params, context) => {
    const git = simpleGit(context.workspacePath);
    const status = await git.status();
    return status;
  }
};

export const gitDiffTool: ToolExecutor = {
  definition: {
    name: 'git.diff',
    description: 'Displays the git diff of current files.',
    schema: z.object({}),
    riskLevel: 'SAFE'
  },
  execute: async (params, context) => {
    const git = simpleGit(context.workspacePath);
    const diff = await git.diff();
    return { diff };
  }
};

export const gitLogTool: ToolExecutor = {
  definition: {
    name: 'git.log',
    description: 'Retrieves recent git commit log.',
    schema: z.object({
      maxCount: z.number().optional()
    }),
    riskLevel: 'SAFE'
  },
  execute: async (params: any, context) => {
    const git = simpleGit(context.workspacePath);
    const log = await git.log({ maxCount: params.maxCount || 10 });
    return log;
  }
};

export const gitBranchTool: ToolExecutor = {
  definition: {
    name: 'git.branch',
    description: 'Lists all local git branches.',
    schema: z.object({}),
    riskLevel: 'SAFE'
  },
  execute: async (params, context) => {
    const git = simpleGit(context.workspacePath);
    const branch = await git.branchLocal();
    return branch;
  }
};

export const gitCheckoutTool: ToolExecutor = {
  definition: {
    name: 'git.checkout',
    description: 'Switches or creates git branch.',
    schema: z.object({
      branch: z.string(),
      create: z.boolean().optional()
    }),
    riskLevel: 'MEDIUM'
  },
  execute: async (params: any, context) => {
    const git = simpleGit(context.workspacePath);
    if (params.create) {
      await git.checkoutLocalBranch(params.branch);
    } else {
      await git.checkout(params.branch);
    }
    return { success: true };
  }
};

export const gitCommitTool: ToolExecutor = {
  definition: {
    name: 'git.commit',
    description: 'Stages and commits files to Git.',
    schema: z.object({
      message: z.string(),
      files: z.array(z.string()).optional()
    }),
    riskLevel: 'MEDIUM'
  },
  execute: async (params: any, context) => {
    const git = simpleGit(context.workspacePath);
    const files = params.files || ['.'];
    await git.add(files);
    const result = await git.commit(params.message);
    return result;
  }
};

export const gitPushTool: ToolExecutor = {
  definition: {
    name: 'git.push',
    description: 'Pushes committed changes to remote repository. ALWAYS requires explicit approval.',
    schema: z.object({
      remote: z.string().optional(),
      branch: z.string().optional()
    }),
    riskLevel: 'HIGH'
  },
  execute: async (params: any, context) => {
    const git = simpleGit(context.workspacePath);
    const remote = params.remote || 'origin';
    const branch = params.branch || 'main';
    const result = await git.push(remote, branch);
    return result;
  }
};
