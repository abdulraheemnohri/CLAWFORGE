import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description: string;
  workspacePath: string;
  aiModel: string;
  agentMode: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface TaskStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentType: string;
  toolCalls?: string;
  result?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed';
  steps: TaskStep[];
}

export interface Approval {
  id: string;
  taskId?: string;
  toolName: string;
  params: string;
  status: 'pending' | 'approved' | 'denied';
}

interface ClawForgeState {
  activeTab: string;
  projects: Project[];
  activeProjectId: string;
  conversations: any[];
  activeConversationId: string;
  messages: Message[];
  tasks: Task[];
  approvals: Approval[];
  logs: string[];
  terminalLogs: string[];
  browserUrl: string;
  browserScreenshot: string;
  browserText: string;
  voiceStatus: 'idle' | 'listening' | 'speaking';
  settings: any;
  wsConnected: boolean;

  // Actions
  setActiveTab: (tab: string) => void;
  setActiveProjectId: (id: string) => void;
  setActiveConversationId: (id: string) => void;
  addProject: (name: string, desc: string, path: string) => void;
  addMessage: (role: 'user' | 'assistant' | 'system', content: string) => void;
  submitChat: (message: string) => Promise<void>;
  approveAction: (id: string) => Promise<void>;
  denyAction: (id: string) => Promise<void>;
  runTerminalCommand: (cmd: string) => Promise<void>;
  browserNavigate: (url: string) => Promise<void>;
  triggerVoice: () => void;
  updateSettings: (newSettings: any) => void;
  clearProjectMemory: () => void;
}

export const useClawForgeStore = create<ClawForgeState>((set, get) => ({
  activeTab: 'dashboard',
  projects: [
    {
      id: 'proj-1',
      name: 'Expense Tracker App',
      description: 'React + TypeScript mobile-friendly financial dashboard.',
      workspacePath: './workspace/expense-tracker',
      aiModel: 'ollama/llama3',
      agentMode: 'auto'
    },
    {
      id: 'proj-2',
      name: 'Automated Playwright Scraper',
      description: 'Collects market data and updates visual spreadsheets.',
      workspacePath: './workspace/scraper',
      aiModel: 'openai/gpt-4o',
      agentMode: 'assisted'
    }
  ],
  activeProjectId: 'proj-1',
  conversations: [
    { id: 'conv-1', title: 'Initial setup chat' }
  ],
  activeConversationId: 'conv-1',
  messages: [
    { id: 'm1', role: 'assistant', content: 'Good morning, AbdulRaheem. What would you like ClawForge to do today? I can assist in setting up React code, writing scripts, performing web scraping, or auditing files in your workspace.', timestamp: '10:30 AM' }
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Build React Expense Tracker',
      status: 'running',
      steps: [
        { id: 's1', title: 'Analyze requirements and outline steps', status: 'completed', agentType: 'research' },
        { id: 's2', title: 'Initialize clean react-vite scaffolding', status: 'completed', agentType: 'coding' },
        { id: 's3', title: 'Create layout dashboard with mock data', status: 'running', agentType: 'coding', toolCalls: JSON.stringify({ tool: 'filesystem.write', params: { filepath: 'src/App.tsx' } }) },
        { id: 's4', title: 'Write tests and verify with browser', status: 'pending', agentType: 'browser' }
      ]
    }
  ],
  approvals: [
    {
      id: 'appr-1',
      taskId: 'task-1',
      toolName: 'terminal.run',
      params: JSON.stringify({ command: 'npm install package-name' }),
      status: 'pending'
    }
  ],
  logs: [
    '10:31 AM - Master Agent spawned.',
    '10:32 AM - Created 4 task execution plans.',
    '10:33 AM - Running step 1 (Analyze requirements).'
  ],
  terminalLogs: [
    'clawforge@ai-runtime:~$ node --version',
    'v22.22.1',
    'clawforge@ai-runtime:~$ pnpm install'
  ],
  browserUrl: 'https://clawforge-ai.org',
  browserScreenshot: '',
  browserText: 'ClawForge AI v1. One Request. One Agent System. Real Work.',
  voiceStatus: 'idle',
  settings: {
    theme: 'dark',
    maxIterations: 20,
    timeout: 300,
    defaultWorkspace: './workspace',
    policy: 'interactive'
  },
  wsConnected: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  addProject: (name, desc, path) => set((state) => ({
    projects: [...state.projects, {
      id: 'proj-' + Math.random().toString(36).substring(7),
      name,
      description: desc,
      workspacePath: path,
      aiModel: 'ollama/llama3',
      agentMode: 'auto'
    }]
  })),

  addMessage: (role, content) => set((state) => ({
    messages: [...state.messages, {
      id: 'm-' + Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]
  })),

  submitChat: async (message) => {
    const { addMessage, activeProjectId, activeConversationId } = get();
    addMessage('user', message);

    // Simulated streaming response flow
    set((state) => ({
      logs: [...state.logs, `${new Date().toLocaleTimeString()} - User sent: "${message}"`]
    }));

    await new Promise((res) => setTimeout(res, 800));
    set((state) => ({
      logs: [...state.logs, `${new Date().toLocaleTimeString()} - Planning and intent analysis completed.`]
    }));

    await new Promise((res) => setTimeout(res, 800));
    // Spawn task in ui
    const newTaskId = 'task-' + Math.random().toString(36).substring(7);
    const newTask: Task = {
      id: newTaskId,
      title: message,
      status: 'running',
      steps: [
        { id: 'st-1', title: 'Draft schema architecture', status: 'completed', agentType: 'research' },
        { id: 'st-2', title: 'Write codebase modules', status: 'running', agentType: 'coding', toolCalls: '{"tool":"filesystem.write"}' }
      ]
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
      logs: [...state.logs, `${new Date().toLocaleTimeString()} - Spawned execution agent.`]
    }));

    await new Promise((res) => setTimeout(res, 1200));
    addMessage('assistant', `I have analyzed your request ("${message}") and initialized an active Agent System run. The Coding Agent is currently implementing the required logic inside your project workspace. Please monitor steps inside the Task Workspace.`);
  },

  approveAction: async (id) => {
    set((state) => ({
      approvals: state.approvals.map((a) => a.id === id ? { ...a, status: 'approved' } : a),
      logs: [...state.logs, `${new Date().toLocaleTimeString()} - Approved action: ${id}`]
    }));
  },

  denyAction: async (id) => {
    set((state) => ({
      approvals: state.approvals.map((a) => a.id === id ? { ...a, status: 'denied' } : a),
      logs: [...state.logs, `${new Date().toLocaleTimeString()} - Denied action: ${id}`]
    }));
  },

  runTerminalCommand: async (cmd) => {
    set((state) => ({
      terminalLogs: [...state.terminalLogs, `clawforge@ai-runtime:~$ ${cmd}`, `Running: ${cmd}...`, `Command executed successfully.`]
    }));
  },

  browserNavigate: async (url) => {
    set({ browserUrl: url, browserText: `Successfully browsed to ${url}. Loaded layout and assets.` });
  },

  triggerVoice: () => {
    const current = get().voiceStatus;
    if (current === 'idle') {
      set({ voiceStatus: 'listening' });
      // Simulate speech-to-text
      setTimeout(() => {
        set({ voiceStatus: 'speaking' });
        setTimeout(() => {
          set({ voiceStatus: 'idle' });
          get().addMessage('assistant', 'I heard you say "Hey Claw"! Voice assistant mode is fully ready for v1 execution.');
        }, 2000);
      }, 2500);
    } else {
      set({ voiceStatus: 'idle' });
    }
  },

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  clearProjectMemory: () => {
    set((state) => ({
      logs: [...state.logs, `${new Date().toLocaleTimeString()} - Cleared project memories.`]
    }));
  }
}));
