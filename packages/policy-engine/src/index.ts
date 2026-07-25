export type PolicyLevel = 'allow' | 'ask' | 'deny';

export class PolicyEngineCheck {
  private static rules: Map<string, PolicyLevel> = new Map([
    ['filesystem.read', 'allow'],
    ['filesystem.write', 'ask'],
    ['filesystem.delete', 'deny'],
    ['terminal.execute', 'ask']
  ]);

  static verifyOperation(toolName: string): { allowed: boolean; level: PolicyLevel } {
    const level = this.rules.get(toolName) || 'ask';
    return {
      allowed: level !== 'deny',
      level
    };
  }
}
