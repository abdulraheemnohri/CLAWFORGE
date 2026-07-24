import { z } from 'zod';
import { RiskLevel } from '@clawforge/shared';

export interface ToolDefinition<P extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: P;
  riskLevel: RiskLevel;
}

export interface ToolContext {
  workspacePath: string;
  projectId: string;
  taskId?: string;
  permissionCheck?: (toolName: string, params: any) => Promise<boolean>;
}

export interface ToolExecutor<P extends z.ZodTypeAny = z.ZodTypeAny> {
  definition: ToolDefinition<P>;
  execute: (params: z.infer<P>, context: ToolContext) => Promise<any>;
}
