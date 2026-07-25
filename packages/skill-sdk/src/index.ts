export interface ISkillManifest {
  packageName: string;
  title: string;
  version: string;
  tools: string[];
}

export class SkillLoader {
  static parseSkillConfig(jsonStr: string): ISkillManifest {
    const raw = JSON.parse(jsonStr);
    return {
      packageName: raw.packageName || '@clawforge/skill-unknown',
      title: raw.title || 'Untitled Skill',
      version: raw.version || '1.0.0',
      tools: raw.tools || []
    };
  }

  static injectSystemPrompts(instructions: string): string {
    return `System supplement: ${instructions}`;
  }
}
