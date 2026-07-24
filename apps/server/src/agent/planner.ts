import { ModelService } from '../ai/model-service.js';

export interface PlanStep {
  title: string;
  tool: string;
  params: any;
}

export class Planner {
  async plan(prompt: string): Promise<PlanStep[]> {
    const provider = ModelService.getInstance().getProvider();
    const systemPrompt = `You are ClawForge Planner. Break the user's request into a concrete list of steps.
Return ONLY a valid JSON object matching this structure:
{
  "plan": [
    { "title": "step description", "tool": "filesystem.write", "params": { "filepath": "file.txt", "content": "text" } }
  ]
}`;

    try {
      const response = await provider.complete([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);

      const parsed = JSON.parse(response);
      if (parsed && Array.isArray(parsed.plan)) {
        return parsed.plan;
      }
    } catch {
      // Return default fallback plan if parsing fails or when using mock responses
    }

    return [
      {
        title: `Analyze prompt: ${prompt}`,
        tool: 'filesystem.write',
        params: { filepath: 'analysis.txt', content: `Analysis of request: ${prompt}` }
      },
      {
        title: 'Run setup and check repository status',
        tool: 'git.status',
        params: {}
      }
    ];
  }
}
