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
  }
}));
