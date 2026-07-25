import { V3AgentConfig } from '@clawforge/shared-types';

export abstract class BaseSpecializedAgent {
  constructor(public config: V3AgentConfig) {}

  abstract execute(task: string): Promise<{ success: boolean; result: string }>;

  protected logAction(action: string) {
    console.log(`[Agent: ${this.config.name}] Action: ${action}`);
  }
}
