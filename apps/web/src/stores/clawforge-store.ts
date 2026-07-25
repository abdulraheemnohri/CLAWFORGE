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

  // V2 Collections
  skills: any[];
  mcpServers: any[];
  plugins: any[];
  pairedDevices: any[];
  workflows: any[];
  voiceConfig: any;
  wakewordConfig: any;

  // V3 Collections
  v3Agents: any[];
  v3Providers: any[];
  v3Models: any[];
  v3Documents: any[];
  v3WorkflowRuns: any[];
  v3Metrics: any[];
  v3Traces: any[];
  v3Policies: any[];

  // Actions
  initialize: () => Promise<void>;
  loadProjectData: (projectId: string) => Promise<void>;
  connectWebSocket: () => void;
  setActiveTab: (tab: string) => void;
  setActiveProjectId: (id: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;
  addProject: (name: string, desc: string, path: string) => Promise<void>;
  addMessage: (role: 'user' | 'assistant' | 'system', content: string) => void;
  submitChat: (message: string) => Promise<void>;
  approveAction: (id: string) => Promise<void>;
  denyAction: (id: string) => Promise<void>;
  runTerminalCommand: (cmd: string) => Promise<void>;
  browserNavigate: (url: string) => Promise<void>;
  triggerVoice: () => void;
  updateSettings: (newSettings: any) => Promise<void>;
  clearProjectMemory: () => Promise<void>;
  fetchMemories: () => Promise<any[]>;
  deleteMemory: (id: string) => Promise<void>;
  testModelConnection: (providerType: string, baseUrl: string, apiKey: string, model: string) => Promise<boolean>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // V2 Actions
  fetchSkills: () => Promise<void>;
  toggleSkill: (id: string, enabled: boolean) => Promise<void>;
  addSkill: (title: string, packageName: string, desc: string, version: string) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  fetchMcpServers: () => Promise<void>;
  addMcpServer: (name: string, url: string, desc: string) => Promise<void>;
  toggleMcpServer: (id: string, enabled: boolean) => Promise<void>;
  testMcpServer: (id: string) => Promise<boolean>;
  deleteMcpServer: (id: string) => Promise<void>;
  fetchPlugins: () => Promise<void>;
  togglePlugin: (id: string, enabled: boolean) => Promise<void>;
  addPlugin: (name: string, desc: string, permissions: string[]) => Promise<void>;
  deletePlugin: (id: string) => Promise<void>;
  fetchDevices: () => Promise<void>;
  pairDevice: (name: string, type: string) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  fetchWorkflows: () => Promise<void>;
  addWorkflow: (name: string, triggerType: string, condition: string) => Promise<void>;
  toggleWorkflow: (id: string, active: boolean) => Promise<void>;
  triggerWorkflow: (id: string) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  fetchVoiceAndWakeword: () => Promise<void>;
  saveVoiceConfig: (config: any) => Promise<void>;
  saveWakewordConfig: (config: any) => Promise<void>;

  // V3 Actions
  fetchV3Agents: () => Promise<void>;
  addV3Agent: (name: string, type: string, role: string, desc: string, systemPrompt: string) => Promise<void>;
  toggleV3Agent: (id: string, enabled: boolean) => Promise<void>;
  deleteV3Agent: (id: string) => Promise<void>;
  fetchV3Providers: () => Promise<void>;
  addV3Provider: (name: string, type: string, baseUrl: string, apiKey: string) => Promise<void>;
  deleteV3Provider: (id: string) => Promise<void>;
  fetchV3Models: () => Promise<void>;
  addV3Model: (name: string, providerId: string, config: any) => Promise<void>;
  deleteV3Model: (id: string) => Promise<void>;
  fetchV3Documents: () => Promise<void>;
  uploadV3Document: (name: string, type: string, collectionId: string) => Promise<void>;
  deleteV3Document: (id: string) => Promise<void>;
  queryV3Rag: (query: string) => Promise<any>;
  fetchV3WorkflowRuns: () => Promise<void>;
  triggerV3Workflow: (id: string) => Promise<void>;
  fetchV3Observability: () => Promise<void>;
  fetchV3Policies: () => Promise<void>;
  addV3Policy: (entityType: string, entityId: string, operation: string, level: string) => Promise<void>;
  updateV3PolicyLevel: (id: string, level: string) => Promise<void>;
  deleteV3Policy: (id: string) => Promise<void>;
}

const API_BASE = 'http://127.0.0.1:3777/api';
const WS_BASE = 'ws://127.0.0.1:3777/ws';
const AUTH_TOKEN = 'clawforge-default-token-12345';

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

let socket: WebSocket | null = null;
const subscriptions = new Set<string>();

function sendWsMessage(msg: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

function subscribeToTopic(topic: string) {
  if (!topic) return;
  subscriptions.add(topic);
  sendWsMessage({ type: 'subscribe', topic });
}

function unsubscribeFromTopic(topic: string) {
  if (!topic) return;
  subscriptions.delete(topic);
  sendWsMessage({ type: 'unsubscribe', topic });
}

export const useClawForgeStore = create<ClawForgeState>((set, get) => ({
  activeTab: 'dashboard',
  projects: [],
  activeProjectId: '',
  conversations: [],
  activeConversationId: '',
  messages: [
    { id: 'm1', role: 'assistant', content: 'Good morning, AbdulRaheem. What would you like ClawForge to do today? I can assist in setting up React code, writing scripts, performing web scraping, or auditing files in your workspace.', timestamp: '10:30 AM' }
  ],
  tasks: [],
  approvals: [],
  logs: [
    'System initialization...'
  ],
  terminalLogs: [
    'clawforge@ai-runtime:~$ node --version',
    'v22.22.1'
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
  wsConnected: false,

  skills: [],
  mcpServers: [],
  plugins: [],
  pairedDevices: [],
  workflows: [],
  v3Agents: [],
  v3Providers: [],
  v3Models: [],
  v3Documents: [],
  v3WorkflowRuns: [],
  v3Metrics: [],
  v3Traces: [],
  v3Policies: [],
  voiceConfig: {
    speechEngine: 'Local DeepSpeech',
    continuousConversation: true,
    noiseSuppression: true,
    speakerSelection: 'Default System Audio',
    microphoneSelection: 'Built-in Microphone',
    automaticPunctuation: true,
    language: 'en-US'
  },
  wakewordConfig: {
    enabled: true,
    wakePhrases: ['Hey Claw', 'Hey Forge'],
    sensitivity: 0.75,
    powerMode: 'Balanced'
  },

  initialize: async () => {
    try {
      // 1. Fetch settings
      const settings = await apiFetch('/settings').catch(() => ({}));
      if (Object.keys(settings).length > 0) {
        set({ settings: { ...get().settings, ...settings } });
      }

      // 2. Fetch projects
      let projs = await apiFetch('/projects').catch(() => []);
      if (projs.length === 0) {
        const defaultProj = await apiFetch('/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Expense Tracker App',
            description: 'React + TypeScript mobile-friendly financial dashboard.',
            workspacePath: './workspace/expense-tracker',
            aiModel: 'ollama/llama3',
            agentMode: 'auto'
          })
        }).catch(() => null);
        if (defaultProj) projs = [defaultProj];
      }
      set({ projects: projs });

      // 3. Set active project
      const activeProjId = get().activeProjectId || projs[0]?.id;
      if (activeProjId) {
        set({ activeProjectId: activeProjId });
      }

      // 4. Load conversations & messages for project
      if (activeProjId) {
        await get().loadProjectData(activeProjId);
      }

      // 5. Fetch tasks & approvals
      const tasksList = await apiFetch('/tasks').catch(() => []);
      const approvalsList = await apiFetch('/approvals').catch(() => []);
      set({ tasks: tasksList, approvals: approvalsList });

      // V2 Load data
      await get().fetchSkills().catch(() => {});
      await get().fetchMcpServers().catch(() => {});
      await get().fetchPlugins().catch(() => {});
      await get().fetchDevices().catch(() => {});
      await get().fetchWorkflows().catch(() => {});
      await get().fetchVoiceAndWakeword().catch(() => {});

      // V3 Load data
      await get().fetchV3Agents().catch(() => {});
      await get().fetchV3Providers().catch(() => {});
      await get().fetchV3Models().catch(() => {});
      await get().fetchV3Documents().catch(() => {});
      await get().fetchV3WorkflowRuns().catch(() => {});
      await get().fetchV3Observability().catch(() => {});
      await get().fetchV3Policies().catch(() => {});

      // 6. Connect WS
      get().connectWebSocket();
    } catch (err) {
      console.error('Error initializing store:', err);
    }
  },

  loadProjectData: async (projectId: string) => {
    if (!projectId) return;
    try {
      const convs = await apiFetch('/conversations').catch(() => []);
      set({ conversations: convs });

      let activeConv = convs.find((c: any) => c.projectId === projectId);
      if (!activeConv) {
        activeConv = await apiFetch('/conversations', {
          method: 'POST',
          body: JSON.stringify({
            projectId,
            title: 'Workspace Chat'
          })
        }).catch(() => null);
        if (activeConv) {
          set({ conversations: [...convs, activeConv] });
        }
      }

      if (activeConv) {
        set({ activeConversationId: activeConv.id });
        const convDetails = await apiFetch(`/conversations/${activeConv.id}`).catch(() => null);
        if (convDetails && convDetails.messages) {
          set({
            messages: convDetails.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
          });
        } else {
          set({ messages: [] });
        }
      }
    } catch (err) {
      console.error('Error loading project data:', err);
    }
  },

  connectWebSocket: () => {
    if (socket) {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        return; // Already connecting or connected, avoid infinite reconnect loop
      }
      socket.onclose = null;
      socket.close();
    }

    socket = new WebSocket(WS_BASE);

    socket.onopen = () => {
      set({ wsConnected: true });
      const { activeProjectId, activeConversationId } = get();
      if (activeProjectId) {
        subscribeToTopic(`project:${activeProjectId}`);
      }
      if (activeConversationId) {
        subscribeToTopic(`conversation:${activeConversationId}`);
      }
    };

    socket.onclose = () => {
      set({ wsConnected: false });
      setTimeout(() => {
        get().connectWebSocket();
      }, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const currentEvent = parsed.event;
        const eventData = parsed.data;

        if (currentEvent === 'message.created') {
          const existing = get().messages;
          if (!existing.some(m => m.id === eventData.id)) {
            set({
              messages: [...existing, {
                id: eventData.id,
                role: eventData.role,
                content: eventData.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]
            });
          }
        } else if (currentEvent === 'approval.resolved') {
          const updated = get().approvals.map(a => a.id === eventData.approvalId ? { ...a, status: eventData.status } : a);
          set({ approvals: updated });
          set({ logs: [...get().logs, `${new Date().toLocaleTimeString()} - Approval ${eventData.approvalId} resolved: ${eventData.status}`] });
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
        } else if (currentEvent === 'task.created') {
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
          set({ logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task created: "${eventData.title}"`] });
        } else if (currentEvent === 'task.started') {
          set({
            tasks: get().tasks.map(t => t.id === eventData.taskId ? { ...t, status: 'running' } : t),
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task run started: ${eventData.taskId}`]
          });
        } else if (currentEvent === 'task.stopped') {
          set({
            tasks: get().tasks.map(t => t.id === eventData.taskId ? { ...t, status: 'stopped' } : t),
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task run stopped: ${eventData.taskId}`]
          });
        } else if (currentEvent === 'task.paused') {
          set({
            tasks: get().tasks.map(t => t.id === eventData.taskId ? { ...t, status: 'paused' } : t),
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task run paused: ${eventData.taskId}`]
          });
        } else if (currentEvent === 'task.resumed') {
          set({
            tasks: get().tasks.map(t => t.id === eventData.taskId ? { ...t, status: 'running' } : t),
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task run resumed: ${eventData.taskId}`]
          });
        } else if (currentEvent === 'task.completed') {
          set({
            tasks: get().tasks.map(t => t.id === eventData.taskId ? { ...t, status: 'completed' } : t),
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task completed successfully: ${eventData.taskId}`]
          });
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
        } else if (currentEvent === 'task.failed') {
          set({
            tasks: get().tasks.map(t => t.id === eventData.taskId ? { ...t, status: 'failed' } : t),
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Task failed: ${eventData.reason || eventData.taskId}`]
          });
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
        } else if (currentEvent === 'agent.thinking') {
          set({
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - [${eventData.agentType || 'Agent'}] thinking...`]
          });
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
        } else if (currentEvent === 'agent.waiting_approval') {
          set({
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Execution paused, waiting approval for: ${eventData.toolName}`]
          });
          apiFetch('/approvals').then(approvalsList => set({ approvals: approvalsList })).catch(() => {});
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
        } else if (currentEvent === 'agent.tool_call') {
          set({
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Executing tool: ${eventData.toolName}`]
          });
        } else if (currentEvent === 'agent.tool_result') {
          set({
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - Tool execution completed.`]
          });
          apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
        } else if (currentEvent === 'system.error') {
          set({
            logs: [...get().logs, `${new Date().toLocaleTimeString()} - [System Error] ${eventData.error}`]
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveProjectId: async (id) => {
    const previousId = get().activeProjectId;
    if (previousId) {
      unsubscribeFromTopic(`project:${previousId}`);
    }
    set({ activeProjectId: id });
    subscribeToTopic(`project:${id}`);

    await get().loadProjectData(id);
  },

  setActiveConversationId: (id) => {
    const previousId = get().activeConversationId;
    if (previousId) {
      unsubscribeFromTopic(`conversation:${previousId}`);
    }
    set({ activeConversationId: id });
    subscribeToTopic(`conversation:${id}`);
  },

  addProject: async (name, desc, path) => {
    const id = 'proj-' + Math.random().toString(36).substring(7);
    const optimisticProj = {
      id,
      name,
      description: desc,
      workspacePath: path,
      aiModel: 'ollama/llama3',
      agentMode: 'auto'
    };

    // Synchronously update local state (optimistic update)
    set((state) => ({
      projects: [...state.projects, optimisticProj]
    }));
    if (!get().activeProjectId) {
      set({ activeProjectId: id });
    }

    try {
      const serverProj = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(optimisticProj)
      });
      // Replace with actual server-returned project if needed
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? serverProj : p)
      }));
    } catch (err) {
      console.error('Error syncing added project with server:', err);
      // Keep optimistic projection on failure/offline/test
    }
  },

  addMessage: (role, content) => set((state) => ({
    messages: [...state.messages, {
      id: 'm-' + Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]
  })),

  submitChat: async (message) => {
    const { activeProjectId, activeConversationId } = get();
    if (!activeProjectId || !activeConversationId) return;

    try {
      await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          projectId: activeProjectId,
          conversationId: activeConversationId,
          message
        })
      });

      setTimeout(() => {
        apiFetch('/tasks').then(tasksList => set({ tasks: tasksList })).catch(() => {});
      }, 500);
    } catch (err: any) {
      console.error('Error submitting chat:', err);
      set((state) => ({
        logs: [...state.logs, `${new Date().toLocaleTimeString()} - Error: ${err.message}`]
      }));
    }
  },

  approveAction: async (id) => {
    try {
      await apiFetch(`/approvals/${id}/approve`, { method: 'POST' });
      set((state) => ({
        approvals: state.approvals.map((a) => a.id === id ? { ...a, status: 'approved' } : a),
        logs: [...state.logs, `${new Date().toLocaleTimeString()} - Approved action: ${id}`]
      }));
    } catch (err) {
      console.error('Error approving action:', err);
    }
  },

  denyAction: async (id) => {
    try {
      await apiFetch(`/approvals/${id}/deny`, { method: 'POST' });
      set((state) => ({
        approvals: state.approvals.map((a) => a.id === id ? { ...a, status: 'denied' } : a),
        logs: [...state.logs, `${new Date().toLocaleTimeString()} - Denied action: ${id}`]
      }));
    } catch (err) {
      console.error('Error denying action:', err);
    }
  },

  runTerminalCommand: async (cmd) => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;

    set((state) => ({
      terminalLogs: [...state.terminalLogs, `clawforge@ai-runtime:~$ ${cmd}`]
    }));

    try {
      const res = await apiFetch('/terminal/run', {
        method: 'POST',
        body: JSON.stringify({ command: cmd, projectId: activeProjectId })
      });

      const lines: string[] = [];
      if (res.stdout) {
        lines.push(res.stdout);
      }
      if (res.stderr) {
        lines.push(`Error standard stream:\n${res.stderr}`);
      }
      if (!res.success && res.error) {
        lines.push(`System Error: ${res.error}`);
      }
      if (res.success && !res.stdout && !res.stderr) {
        lines.push(`Command executed successfully (exit code ${res.code || 0}).`);
      }

      set((state) => ({
        terminalLogs: [...state.terminalLogs, ...lines]
      }));
    } catch (err: any) {
      set((state) => ({
        terminalLogs: [...state.terminalLogs, `System Error: ${err.message}`]
      }));
    }
  },

  browserNavigate: async (url) => {
    set({ browserUrl: url, browserText: 'Loading viewport and extracting text...' });

    try {
      const res = await apiFetch('/browser/navigate', {
        method: 'POST',
        body: JSON.stringify({ url })
      });

      if (res.success) {
        set({
          browserUrl: res.url || url,
          browserText: res.text || 'Page loaded, but no body text was found.',
          browserScreenshot: res.base64 ? `data:image/png;base64,${res.base64}` : ''
        });
      } else {
        set({
          browserText: `Navigation Failed: ${res.error || 'Unknown Error'}`
        });
      }
    } catch (err: any) {
      set({
        browserText: `System Connection Error: ${err.message}`
      });
    }
  },

  triggerVoice: () => {
    const current = get().voiceStatus;
    if (current === 'idle') {
      set({ voiceStatus: 'listening' });
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

  updateSettings: async (newSettings) => {
    try {
      await apiFetch('/settings', {
        method: 'PATCH',
        body: JSON.stringify(newSettings)
      });
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  },

  clearProjectMemory: async () => {
    const { activeProjectId } = get();
    if (!activeProjectId) return;
    try {
      const memoriesList = await apiFetch(`/memory?projectId=${activeProjectId}`).catch(() => []);
      for (const m of memoriesList) {
        await apiFetch(`/memory/${m.id}`, { method: 'DELETE' }).catch(() => {});
      }
      set((state) => ({
        logs: [...state.logs, `${new Date().toLocaleTimeString()} - Cleared project memories.`]
      }));
    } catch (err) {
      console.error('Error clearing memories:', err);
    }
  },

  fetchMemories: async () => {
    const { activeProjectId } = get();
    if (!activeProjectId) return [];
    try {
      const data = await apiFetch(`/memory?projectId=${activeProjectId}`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching memories:', err);
      return [];
    }
  },

  deleteMemory: async (id) => {
    try {
      await apiFetch(`/memory/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  },

  testModelConnection: async (providerType, baseUrl, apiKey, model) => {
    try {
      const res = await apiFetch('/models/test', {
        method: 'POST',
        body: JSON.stringify({ providerType, baseUrl, apiKey, model })
      });
      return !!res.success;
    } catch (err) {
      console.error('Error testing model connection:', err);
      return false;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const updated = await apiFetch(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updated } : p)
      }));
    } catch (err) {
      console.error('Error updating project:', err);
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
    }
  },

  deleteProject: async (id) => {
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      set((state) => {
        const filtered = state.projects.filter(p => p.id !== id);
        let nextActiveId = state.activeProjectId;
        if (state.activeProjectId === id) {
          nextActiveId = filtered[0]?.id || '';
        }
        return {
          projects: filtered,
          activeProjectId: nextActiveId
        };
      });
      if (get().activeProjectId) {
        await get().setActiveProjectId(get().activeProjectId);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      set((state) => {
        const filtered = state.projects.filter(p => p.id !== id);
        let nextActiveId = state.activeProjectId;
        if (state.activeProjectId === id) {
          nextActiveId = filtered[0]?.id || '';
        }
        return {
          projects: filtered,
          activeProjectId: nextActiveId
        };
      });
    }
  },

  fetchSkills: async () => {
    try {
      const data = await apiFetch('/skills');
      set({ skills: data });
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  },

  toggleSkill: async (id, enabled) => {
    try {
      const updated = await apiFetch(`/skills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      set((state) => ({
        skills: state.skills.map(s => s.id === id ? updated : s)
      }));
    } catch (err) {
      console.error('Error toggling skill:', err);
      set((state) => ({
        skills: state.skills.map(s => s.id === id ? { ...s, enabled } : s)
      }));
    }
  },

  addSkill: async (title, packageName, desc, version) => {
    try {
      const newSkill = await apiFetch('/skills', {
        method: 'POST',
        body: JSON.stringify({ title, packageName, description: desc, version, enabled: true })
      });
      set((state) => ({
        skills: [...state.skills, newSkill]
      }));
    } catch (err) {
      console.error('Error adding skill:', err);
    }
  },

  deleteSkill: async (id) => {
    try {
      await apiFetch(`/skills/${id}`, { method: 'DELETE' });
      set((state) => ({
        skills: state.skills.filter(s => s.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting skill:', err);
    }
  },

  fetchMcpServers: async () => {
    try {
      const data = await apiFetch('/mcp');
      set({ mcpServers: data });
    } catch (err) {
      console.error('Error fetching MCP servers:', err);
    }
  },

  addMcpServer: async (name, url, desc) => {
    try {
      const newMcp = await apiFetch('/mcp', {
        method: 'POST',
        body: JSON.stringify({ name, url, description: desc, status: 'disconnected', enabled: true })
      });
      set((state) => ({
        mcpServers: [...state.mcpServers, newMcp]
      }));
    } catch (err) {
      console.error('Error adding MCP server:', err);
    }
  },

  toggleMcpServer: async (id, enabled) => {
    try {
      const updated = await apiFetch(`/mcp/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      set((state) => ({
        mcpServers: state.mcpServers.map(m => m.id === id ? updated : m)
      }));
    } catch (err) {
      console.error('Error toggling MCP server:', err);
      set((state) => ({
        mcpServers: state.mcpServers.map(m => m.id === id ? { ...m, enabled } : m)
      }));
    }
  },

  testMcpServer: async (id) => {
    try {
      const res = await apiFetch(`/mcp/${id}/test`, { method: 'POST' });
      if (res.success) {
        set((state) => ({
          mcpServers: state.mcpServers.map(m => m.id === id ? { ...m, status: 'connected' } : m)
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error testing MCP server:', err);
      return false;
    }
  },

  deleteMcpServer: async (id) => {
    try {
      await apiFetch(`/mcp/${id}`, { method: 'DELETE' });
      set((state) => ({
        mcpServers: state.mcpServers.filter(m => m.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting MCP server:', err);
    }
  },

  fetchPlugins: async () => {
    try {
      const data = await apiFetch('/plugins');
      set({ plugins: data });
    } catch (err) {
      console.error('Error fetching plugins:', err);
    }
  },

  togglePlugin: async (id, enabled) => {
    try {
      const updated = await apiFetch(`/plugins/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      set((state) => ({
        plugins: state.plugins.map(p => p.id === id ? updated : p)
      }));
    } catch (err) {
      console.error('Error toggling plugin:', err);
      set((state) => ({
        plugins: state.plugins.map(p => p.id === id ? { ...p, enabled } : p)
      }));
    }
  },

  addPlugin: async (name, desc, permissions) => {
    try {
      const newPlugin = await apiFetch('/plugins', {
        method: 'POST',
        body: JSON.stringify({ name, description: desc, permissions, manifest: { entry: 'index.js' } })
      });
      set((state) => ({
        plugins: [...state.plugins, newPlugin]
      }));
    } catch (err) {
      console.error('Error adding plugin:', err);
    }
  },

  deletePlugin: async (id) => {
    try {
      await apiFetch(`/plugins/${id}`, { method: 'DELETE' });
      set((state) => ({
        plugins: state.plugins.filter(p => p.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting plugin:', err);
    }
  },

  fetchDevices: async () => {
    try {
      const data = await apiFetch('/devices');
      set({ pairedDevices: data });
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  },

  pairDevice: async (name, type) => {
    try {
      const newDevice = await apiFetch('/devices/pair', {
        method: 'POST',
        body: JSON.stringify({ name, type })
      });
      set((state) => ({
        pairedDevices: [...state.pairedDevices, newDevice]
      }));
    } catch (err) {
      console.error('Error pairing device:', err);
    }
  },

  deleteDevice: async (id) => {
    try {
      await apiFetch(`/devices/${id}`, { method: 'DELETE' });
      set((state) => ({
        pairedDevices: state.pairedDevices.filter(d => d.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting device:', err);
    }
  },

  fetchWorkflows: async () => {
    try {
      const data = await apiFetch('/automation');
      set({ workflows: data });
    } catch (err) {
      console.error('Error fetching workflows:', err);
    }
  },

  addWorkflow: async (name, triggerType, condition) => {
    try {
      const newWorkflow = await apiFetch('/automation', {
        method: 'POST',
        body: JSON.stringify({ name, triggerType, condition })
      });
      set((state) => ({
        workflows: [...state.workflows, newWorkflow]
      }));
    } catch (err) {
      console.error('Error adding workflow:', err);
    }
  },

  toggleWorkflow: async (id, active) => {
    const status = active ? 'active' : 'paused';
    try {
      const updated = await apiFetch(`/automation/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      set((state) => ({
        workflows: state.workflows.map(w => w.id === id ? updated : w)
      }));
    } catch (err) {
      console.error('Error toggling workflow:', err);
      set((state) => ({
        workflows: state.workflows.map(w => w.id === id ? { ...w, status } : w)
      }));
    }
  },

  triggerWorkflow: async (id) => {
    try {
      const updated = await apiFetch(`/workflows/${id}/trigger`, { method: 'POST' });
      set((state) => ({
        workflows: state.workflows.map(w => w.id === id ? updated : w)
      }));
    } catch (err) {
      console.error('Error triggering workflow:', err);
    }
  },

  deleteWorkflow: async (id) => {
    try {
      await apiFetch(`/automation/${id}`, { method: 'DELETE' });
      set((state) => ({
        workflows: state.workflows.filter(w => w.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting workflow:', err);
    }
  },

  fetchVoiceAndWakeword: async () => {
    try {
      const voice = await apiFetch('/voice');
      const wakeword = await apiFetch('/wakeword');
      set({ voiceConfig: voice, wakewordConfig: wakeword });
    } catch (err) {
      console.error('Error fetching voice/wakeword config:', err);
    }
  },

  saveVoiceConfig: async (config) => {
    try {
      await apiFetch('/voice', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      set({ voiceConfig: config });
    } catch (err) {
      console.error('Error saving voice config:', err);
      set({ voiceConfig: config });
    }
  },

  saveWakewordConfig: async (config) => {
    try {
      await apiFetch('/wakeword', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      set({ wakewordConfig: config });
    } catch (err) {
      console.error('Error saving wakeword config:', err);
      set({ wakewordConfig: config });
    }
  },

  // V3 Actions Implementation
  fetchV3Agents: async () => {
    try {
      const data = await apiFetch('/v3/agents');
      set({ v3Agents: data });
    } catch (err) {
      console.error('Error fetching V3 Agents:', err);
    }
  },

  addV3Agent: async (name, type, role, desc, systemPrompt) => {
    try {
      const newAgent = await apiFetch('/v3/agents', {
        method: 'POST',
        body: JSON.stringify({ name, type, role, description: desc, systemPrompt })
      });
      set((state) => ({ v3Agents: [...state.v3Agents, newAgent] }));
    } catch (err) {
      console.error('Error adding V3 Agent:', err);
    }
  },

  toggleV3Agent: async (id, enabled) => {
    try {
      const updated = await apiFetch(`/v3/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled })
      });
      set((state) => ({
        v3Agents: state.v3Agents.map((a) => a.id === id ? updated : a)
      }));
    } catch (err) {
      console.error('Error toggling V3 Agent:', err);
      set((state) => ({
        v3Agents: state.v3Agents.map((a) => a.id === id ? { ...a, enabled } : a)
      }));
    }
  },

  deleteV3Agent: async (id) => {
    try {
      await apiFetch(`/v3/agents/${id}`, { method: 'DELETE' });
      set((state) => ({ v3Agents: state.v3Agents.filter((a) => a.id !== id) }));
    } catch (err) {
      console.error('Error deleting V3 Agent:', err);
    }
  },

  fetchV3Providers: async () => {
    try {
      const data = await apiFetch('/v3/providers');
      set({ v3Providers: data });
    } catch (err) {
      console.error('Error fetching V3 Providers:', err);
    }
  },

  addV3Provider: async (name, type, baseUrl, apiKey) => {
    try {
      const newProv = await apiFetch('/v3/providers', {
        method: 'POST',
        body: JSON.stringify({ name, type, baseUrl, apiKey })
      });
      set((state) => ({ v3Providers: [...state.v3Providers, newProv] }));
    } catch (err) {
      console.error('Error adding V3 Provider:', err);
    }
  },

  deleteV3Provider: async (id) => {
    try {
      await apiFetch(`/v3/providers/${id}`, { method: 'DELETE' });
      set((state) => ({ v3Providers: state.v3Providers.filter((p) => p.id !== id) }));
    } catch (err) {
      console.error('Error deleting V3 Provider:', err);
    }
  },

  fetchV3Models: async () => {
    try {
      const data = await apiFetch('/v3/models');
      set({ v3Models: data });
    } catch (err) {
      console.error('Error fetching V3 Models:', err);
    }
  },

  addV3Model: async (name, providerId, config) => {
    try {
      const newModel = await apiFetch('/v3/models', {
        method: 'POST',
        body: JSON.stringify({ name, providerId, config })
      });
      set((state) => ({ v3Models: [...state.v3Models, newModel] }));
    } catch (err) {
      console.error('Error adding V3 Model:', err);
    }
  },

  deleteV3Model: async (id) => {
    try {
      await apiFetch(`/v3/models/${id}`, { method: 'DELETE' });
      set((state) => ({ v3Models: state.v3Models.filter((m) => m.id !== id) }));
    } catch (err) {
      console.error('Error deleting V3 Model:', err);
    }
  },

  fetchV3Documents: async () => {
    try {
      const data = await apiFetch('/v3/rag/documents');
      set({ v3Documents: data });
    } catch (err) {
      console.error('Error fetching V3 RAG Documents:', err);
    }
  },

  uploadV3Document: async (name, type, collectionId) => {
    try {
      const newDoc = await apiFetch('/v3/rag/documents', {
        method: 'POST',
        body: JSON.stringify({ name, type, collectionId })
      });
      set((state) => ({ v3Documents: [...state.v3Documents, newDoc] }));

      // Periodically refresh document status to catch when parsing completes
      setTimeout(() => {
        get().fetchV3Documents();
      }, 2000);
    } catch (err) {
      console.error('Error uploading document:', err);
    }
  },

  deleteV3Document: async (id) => {
    try {
      await apiFetch(`/v3/rag/documents/${id}`, { method: 'DELETE' });
      set((state) => ({ v3Documents: state.v3Documents.filter((d) => d.id !== id) }));
    } catch (err) {
      console.error('Error deleting RAG Document:', err);
    }
  },

  queryV3Rag: async (query) => {
    try {
      const res = await apiFetch('/v3/rag/query', {
        method: 'POST',
        body: JSON.stringify({ query, collectionId: 'default' })
      });
      return res;
    } catch (err) {
      console.error('Error querying RAG:', err);
      return { results: [] };
    }
  },

  fetchV3WorkflowRuns: async () => {
    try {
      const data = await apiFetch('/v3/workflow_runs');
      set({ v3WorkflowRuns: data });
    } catch (err) {
      console.error('Error fetching workflow runs:', err);
    }
  },

  triggerV3Workflow: async (id) => {
    try {
      const newRun = await apiFetch(`/v3/workflows/${id}/run`, { method: 'POST' });
      set((state) => ({
        v3WorkflowRuns: [newRun, ...state.v3WorkflowRuns]
      }));
      // Also update standard workflows list metrics count
      await get().fetchWorkflows();
    } catch (err) {
      console.error('Error triggering V3 Workflow run:', err);
    }
  },

  fetchV3Observability: async () => {
    try {
      const metrics = await apiFetch('/v3/observability/metrics');
      const traces = await apiFetch('/v3/observability/traces');
      set({ v3Metrics: metrics, v3Traces: traces });
    } catch (err) {
      console.error('Error fetching observability telemetry:', err);
    }
  },

  fetchV3Policies: async () => {
    try {
      const data = await apiFetch('/v3/policies');
      set({ v3Policies: data });
    } catch (err) {
      console.error('Error fetching policies:', err);
    }
  },

  addV3Policy: async (entityType, entityId, operation, level) => {
    try {
      const newPol = await apiFetch('/v3/policies', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId, operation, policyLevel: level })
      });
      set((state) => ({ v3Policies: [...state.v3Policies, newPol] }));
    } catch (err) {
      console.error('Error adding V3 Policy:', err);
    }
  },

  updateV3PolicyLevel: async (id, level) => {
    try {
      const updated = await apiFetch(`/v3/policies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ policyLevel: level })
      });
      set((state) => ({
        v3Policies: state.v3Policies.map((p) => p.id === id ? updated : p)
      }));
    } catch (err) {
      console.error('Error updating policy level:', err);
      set((state) => ({
        v3Policies: state.v3Policies.map((p) => p.id === id ? { ...p, policyLevel: level } : p)
      }));
    }
  },

  deleteV3Policy: async (id) => {
    try {
      await apiFetch(`/v3/policies/${id}`, { method: 'DELETE' });
      set((state) => ({ v3Policies: state.v3Policies.filter((p) => p.id !== id) }));
    } catch (err) {
      console.error('Error deleting policy:', err);
    }
  }
}));
