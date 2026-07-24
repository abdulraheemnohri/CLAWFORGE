import { ToolExecutor } from '@clawforge/tool-sdk';
import { z } from 'zod';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolExecutor<any>> = new Map();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public registerTool<P extends z.ZodTypeAny>(tool: ToolExecutor<P>) {
    this.tools.set(tool.definition.name, tool);
  }

  public getTool(name: string): ToolExecutor<any> | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolExecutor<any>[] {
    return Array.from(this.tools.values());
  }
}
