import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import {
  Play,
  Mic,
  Paperclip,
  FolderPlus,
  Terminal,
  FileCode2,
  Search,
  FlaskConical,
  Globe,
  Cpu,
  Bot
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProject,
    tasks,
    submitChat,
    setActiveTab,
    voiceStatus,
    triggerVoice
  } = useClawForgeStore();

  const [prompt, setPrompt] = useState('');
  const activeProj = projects.find(p => p.id === activeProjectId);
  const [newProjName, setNewProjName] = useState('');
  const [showProjModal, setShowProjModal] = useState(false);

  const handleSend = () => {
    if (!prompt.trim()) return;
    submitChat(prompt);
    setPrompt('');
    setActiveTab('chat');
  };

  const handleQuickAction = (actionText: string) => {
    setPrompt(actionText);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    addProject(newProjName, 'Custom initialized workspace.', `./workspace/${newProjName.toLowerCase()}`);
    setNewProjName('');
    setShowProjModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto">
      {/* Hero Welcome */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
          Good morning, AbdulRaheem.
        </h1>
        <p className="text-gray-400 text-lg">
          What would you like ClawForge to do?
        </p>
      </div>

      {/* Main Command Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl focus-within:border-orange-500/50 transition-all">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your task in plain English (e.g., 'Build me a React expense tracker with charts')..."
          className="w-full bg-transparent text-gray-100 placeholder-gray-500 border-0 outline-none resize-none h-24 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="flex items-center justify-between border-t border-gray-800 pt-3 mt-2">
          {/* Options: Project & Model selector */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <span>Project:</span>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 outline-none focus:border-orange-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Model:</span>
              <select
                value={activeProj?.aiModel || 'mock'}
                onChange={(e) => {
                  if (activeProjectId) {
                    updateProject(activeProjectId, { aiModel: e.target.value });
                  }
                }}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 outline-none focus:border-orange-500"
              >
                <option value="ollama/llama3">Ollama (Llama 3)</option>
                <option value="openai/gpt-4o">OpenAI (GPT-4o)</option>
                <option value="mock">Simulated Core Engine</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={triggerVoice}
              title="Voice Input Mode (Wake word: 'Hey Claw')"
              className={`p-2 rounded-lg transition-all ${
                voiceStatus === 'listening'
                  ? 'bg-red-600 text-white animate-pulse'
                  : voiceStatus === 'speaking'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-100 hover:bg-gray-700'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button className="p-2 bg-gray-800 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-lg transition-all">
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Send Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Build App', text: 'Build me a React expense tracker.', icon: FileCode2 },
            { label: 'Fix Code', text: 'Fix the failing test inside index.test.ts', icon: Terminal },
            { label: 'Research', text: 'Analyze documentation for SQLite FTS virtual tables.', icon: Search },
            { label: 'Analyze Files', text: 'Analyze file structures in package.json', icon: FileCode2 },
            { label: 'Run Tests', text: 'terminal.run: npm run test', icon: FlaskConical },
            { label: 'Open Browser', text: 'browser.open: https://news.ycombinator.com', icon: Globe }
          ].map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={() => handleQuickAction(act.text)}
                className="p-4 bg-gray-900 hover:bg-gray-800/80 border border-gray-800/60 rounded-xl text-left flex items-start gap-3 transition-all group"
              >
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-200">{act.label}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{act.text}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Status & Active Runs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Tasks list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="font-semibold text-sm text-gray-200 flex items-center gap-2">
              <Bot className="w-4 h-4 text-orange-400" />
              Active System Runs
            </h2>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-orange-500 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 2).map((t) => (
              <div key={t.id} className="p-3 bg-gray-800/40 rounded-lg flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="font-medium text-xs text-gray-200 truncate">{t.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{t.id}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  t.status === 'running'
                    ? 'bg-orange-500/10 text-orange-400 animate-pulse'
                    : 'bg-green-500/10 text-green-400'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects system */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="font-semibold text-sm text-gray-200 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              My Workspaces
            </h2>
            <button
              onClick={() => setShowProjModal(true)}
              className="text-xs bg-orange-600/10 text-orange-400 hover:bg-orange-600/20 px-2 py-1 rounded"
            >
              Add New
            </button>
          </div>
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`p-3 rounded-lg flex flex-col cursor-pointer transition-all ${
                  activeProjectId === p.id
                    ? 'bg-orange-600/10 border border-orange-500/20'
                    : 'bg-gray-800/40 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <h4 className="font-medium text-xs text-gray-200">{p.name}</h4>
                <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project addition modal */}
      {showProjModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateProject}
            className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
          >
            <h3 className="font-semibold text-base text-gray-100">Create Workspace Project</h3>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Project Name</label>
              <input
                type="text"
                required
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="e.g. My Nextjs Dashboard"
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProjModal(false)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded font-medium"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
