import { ToolRegistry } from '../tools/index.js';
import { PermissionService } from '../permissions/permission-service.js';
import { db } from '../database/index.js';
import { tasks, taskSteps } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export interface ExecutionOptions {
  maxIterations?: number;
  maxRuntimeMs?: number;
  maxToolCalls?: number;
  retryLimit?: number;
}

export class TaskExecutor {
  private static activeRuns: Map<string, { status: string; signal?: AbortController }> = new Map();

  static getRunStatus(taskId: string): string {
    return this.activeRuns.get(taskId)?.status ?? 'idle';
  }

  static stopRun(taskId: string) {
    const run = this.activeRuns.get(taskId);
    if (run) {
      run.status = 'stopped';
      run.signal?.abort();
    }
  }

  static pauseRun(taskId: string) {
    const run = this.activeRuns.get(taskId);
    if (run) {
      run.status = 'paused';
    }
  }

  static resumeRun(taskId: string) {
    const run = this.activeRuns.get(taskId);
    if (run) {
      run.status = 'running';
    }
  }

  async executeTask(
    taskId: string,
    projectId: string,
    workspacePath: string,
    options: ExecutionOptions = {},
    onEvent?: (event: string, data: any) => void
  ): Promise<string> {
    const maxIterations = options.maxIterations ?? 20;
    const maxRuntimeMs = options.maxRuntimeMs ?? 300000; // 5 mins
    const maxToolCalls = options.maxToolCalls ?? 50;
    const startTime = Date.now();

    const controller = new AbortController();
    TaskExecutor.activeRuns.set(taskId, { status: 'running', signal: controller });

    await db.update(tasks).set({ status: 'running' }).where(eq(tasks.id, taskId));
    onEvent?.('task.started', { taskId });

    // Retrieve task steps
    const steps = await db.select().from(taskSteps).where(eq(taskSteps.taskId, taskId));
    // Sort steps by order
    steps.sort((a, b) => a.order - b.order);

    let toolCallsCount = 0;
    let iterationCount = 0;

    for (const step of steps) {
      if (step.status === 'completed') continue;

      iterationCount++;
      if (iterationCount > maxIterations) {
        throw new Error('Maximum iteration limit reached.');
      }
      if (Date.now() - startTime > maxRuntimeMs) {
        throw new Error('Maximum execution runtime limit reached.');
      }

      // Check for stop or pause
      const currentRun = TaskExecutor.activeRuns.get(taskId);
      if (!currentRun || currentRun.status === 'stopped' || controller.signal.aborted) {
        await db.update(tasks).set({ status: 'stopped' }).where(eq(tasks.id, taskId));
        onEvent?.('task.stopped', { taskId });
        return 'stopped';
      }

      if (currentRun.status === 'paused') {
        await db.update(tasks).set({ status: 'paused' }).where(eq(tasks.id, taskId));
        onEvent?.('task.paused', { taskId });
        return 'paused';
      }

      // Start executing the step
      await db.update(taskSteps).set({ status: 'running' }).where(eq(taskSteps.id, step.id));
      onEvent?.('agent.thinking', { taskId, stepId: step.id, agentType: step.agentType });

      const parsedCalls = step.toolCalls ? JSON.parse(step.toolCalls) : null;
      if (parsedCalls && parsedCalls.tool) {
        toolCallsCount++;
        if (toolCallsCount > maxToolCalls) {
          throw new Error('Maximum tool calls limit exceeded.');
        }

        const toolName = parsedCalls.tool;
        const params = parsedCalls.params || {};

        onEvent?.('agent.tool_call', { taskId, toolName, params });

        // Security check via PermissionService
        const permission = await PermissionService.getInstance().checkPermission(
          projectId,
          toolName,
          params,
          taskId
        );

        if (!permission.allowed) {
          // Execution needs approval! Pause and return.
          TaskExecutor.activeRuns.set(taskId, { status: 'paused', signal: controller });
          await db.update(tasks).set({ status: 'paused' }).where(eq(tasks.id, taskId));
          await db.update(taskSteps).set({ status: 'pending' }).where(eq(taskSteps.id, step.id));
          onEvent?.('agent.waiting_approval', {
            taskId,
            stepId: step.id,
            approvalId: permission.approvalId,
            toolName,
            params
          });
          return 'waiting_approval';
        }

        // Run the tool!
        const toolExecutor = ToolRegistry.getInstance().getTool(toolName);
        if (!toolExecutor) {
          const errMessage = `Tool '${toolName}' not found in registry.`;
          await db.update(taskSteps).set({ status: 'failed', result: errMessage }).where(eq(taskSteps.id, step.id));
          onEvent?.('system.error', { error: errMessage });
          throw new Error(errMessage);
        }

        try {
          const result = await toolExecutor.execute(params, { workspacePath, projectId, taskId });
          const resultStr = JSON.stringify(result);

          await db.update(taskSteps)
            .set({ status: 'completed', result: resultStr })
            .where(eq(taskSteps.id, step.id));

          onEvent?.('agent.tool_result', { taskId, toolName, result });
        } catch (toolErr: any) {
          await db.update(taskSteps)
            .set({ status: 'failed', result: toolErr.message })
            .where(eq(taskSteps.id, step.id));
          onEvent?.('system.error', { error: toolErr.message });
          throw toolErr;
        }
      } else {
        // Simple step with no tool execution needed, auto-complete
        await db.update(taskSteps).set({ status: 'completed', result: 'Step completed.' }).where(eq(taskSteps.id, step.id));
      }
    }

    // Mark task completed!
    await db.update(tasks).set({ status: 'completed' }).where(eq(tasks.id, taskId));
    onEvent?.('task.completed', { taskId });
    return 'completed';
  }
}
