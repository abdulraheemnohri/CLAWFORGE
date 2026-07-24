import { ToolExecutor } from '@clawforge/tool-sdk';
import { z } from 'zod';
import { exec } from 'child_process';

const BLOCKED_COMMANDS = [
  'rm -rf /', 'rm -rf *', 'mkfs', 'dd if=', 'shutdown', 'reboot', 'killall', 'pkill', ':(){:|:&};:'
];

export const terminalRunTool: ToolExecutor = {
  definition: {
    name: 'terminal.run',
    description: 'Runs an approved terminal command within the workspace. Block dangerous commands.',
    schema: z.object({
      command: z.string(),
      timeout: z.number().optional()
    }),
    riskLevel: 'MEDIUM'
  },
  execute: async (params: any, context) => {
    const { command, timeout = 30000 } = params;

    // Check blocked patterns
    const isBlocked = BLOCKED_COMMANDS.some(blocked => command.toLowerCase().includes(blocked));
    if (isBlocked) {
      throw new Error(`Security Exception: Command contains blocked dangerous patterns.`);
    }

    return new Promise((resolve, reject) => {
      const child = exec(command, {
        cwd: context.workspacePath,
        timeout: timeout,
        maxBuffer: 1024 * 1024 // 1MB limit
      }, (error, stdout, stderr) => {
        if (error && error.killed) {
          resolve({
            success: false,
            error: `Command execution timed out or killed. Output limit reached.`,
            stdout: stdout,
            stderr: stderr
          });
        } else {
          resolve({
            success: !error,
            stdout: stdout,
            stderr: stderr,
            code: error ? error.code : 0
          });
        }
      });
    });
  }
};
