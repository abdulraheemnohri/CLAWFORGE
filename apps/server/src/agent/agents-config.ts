export interface AgentDefinition {
  type: 'master' | 'coding' | 'research' | 'browser';
  name: string;
  description: string;
  allowedTools: string[];
  systemPrompt: string;
}

export const V1_AGENTS: AgentDefinition[] = [
  {
    type: 'master',
    name: 'Master Agent',
    description: 'Coordinates tasks, creates plans, and delegates subtasks.',
    allowedTools: ['git.status', 'git.log', 'git.branch'],
    systemPrompt: 'You are the ClawForge Master Agent. Your goal is to coordinate work, direct other agents, and ensure high quality.'
  },
  {
    type: 'coding',
    name: 'Coding Agent',
    description: 'Generates, edits, debugs, and refactors code inside the workspace.',
    allowedTools: [
      'filesystem.list', 'filesystem.search', 'filesystem.read', 'filesystem.write',
      'filesystem.edit', 'filesystem.rename', 'filesystem.copy', 'filesystem.move',
      'filesystem.delete', 'terminal.run'
    ],
    systemPrompt: 'You are the ClawForge Coding Agent. Your specialization is writing highly modular, clean, and tested code.'
  },
  {
    type: 'research',
    name: 'Research Agent',
    description: 'Performs document scanning, searching, and knowledge summarizing.',
    allowedTools: ['filesystem.list', 'filesystem.search', 'filesystem.read'],
    systemPrompt: 'You are the ClawForge Research Agent. Your goal is to inspect files, gather context, and write summaries.'
  },
  {
    type: 'browser',
    name: 'Browser Agent',
    description: 'Automates web browsing using Playwright.',
    allowedTools: [
      'browser.open', 'browser.navigate', 'browser.click', 'browser.type',
      'browser.scroll', 'browser.screenshot', 'browser.extract'
    ],
    systemPrompt: 'You are the ClawForge Browser Agent. Your role is to interact with web pages, capture screenshots, and scrape content.'
  }
];
