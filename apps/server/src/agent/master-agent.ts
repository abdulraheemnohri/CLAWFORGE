import { Planner } from './planner.js';
import { TaskExecutor } from './task-executor.js';
import { db } from '../database/index.js';
import { tasks, taskSteps, conversations, messages } from '../database/schema.js';

export class MasterAgent {
  private planner = new Planner();
  private executor = new TaskExecutor();

  async handleUserRequest(
    projectId: string,
    conversationId: string,
    workspacePath: string,
    prompt: string,
    onEvent?: (event: string, data: any) => void
  ): Promise<any> {
    // 1. Analyze intent & generate planning steps
    onEvent?.('agent.thinking', { message: 'Analyzing goals & drafting project execution plan...' });
    const planSteps = await this.planner.plan(prompt);

    // 2. Create the main task record in DB
    const taskId = 'task-' + Math.random().toString(36).substring(7);
    await db.insert(tasks).values({
      id: taskId,
      projectId,
      conversationId,
      title: prompt,
      status: 'idle',
      createdAt: new Date()
    });

    onEvent?.('task.created', { taskId, title: prompt });

    // 3. Insert the steps in DB
    for (let i = 0; i < planSteps.length; i++) {
      const step = planSteps[i];
      // Determine agent mapping based on tools
      let agentType: 'coding' | 'research' | 'browser' = 'research';
      if (step.tool.startsWith('filesystem.') || step.tool.startsWith('terminal.')) {
        agentType = 'coding';
      } else if (step.tool.startsWith('browser.')) {
        agentType = 'browser';
      }

      await db.insert(taskSteps).values({
        id: `step-${taskId}-${i}`,
        taskId,
        title: step.title,
        status: 'pending',
        agentType,
        toolCalls: JSON.stringify({ tool: step.tool, params: step.params }),
        order: i,
        createdAt: new Date()
      });
    }

    // 4. Trigger the Task Executor asynchronously
    // The executor runs and sends WS logs as it progresses.
    this.executor.executeTask(taskId, projectId, workspacePath, {}, onEvent).catch(err => {
      onEvent?.('system.error', { error: err.message });
    });

    return { taskId, planSteps };
  }
}
