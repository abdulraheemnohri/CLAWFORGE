import React, { useState } from 'react';
import { Bot, Wrench, Shield, CircleDot, HelpCircle } from 'lucide-react';

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState([
    {
      id: 'master',
      name: 'Master Agent',
      desc: 'Coordinates overall task breakdown, creates execution plans, and delegates to specific specialists.',
      tools: ['git.status', 'git.log', 'git.branch'],
      permissions: 'SAFE / READ-ONLY ONLY',
      enabled: true
    },
    {
      id: 'coding',
      name: 'Coding Agent',
      desc: 'Writes logic code, performs modifications (regex edits), runs test scripts, and automates builds.',
      tools: ['filesystem.write', 'filesystem.edit', 'terminal.run'],
      permissions: 'MEDIUM / REQUIRES APPROVAL FOR TERMINAL',
      enabled: true
    },
    {
      id: 'research',
      name: 'Research Agent',
      desc: 'Queries workspace paths, index documents, matches file schemas, and provides structured summaries.',
      tools: ['filesystem.list', 'filesystem.search', 'filesystem.read'],
      permissions: 'SAFE / LOCAL WORKSPACE ONLY',
      enabled: true
    },
    {
      id: 'browser',
      name: 'Browser Agent',
      desc: 'Launches automated isolated Chromium browser sessions to scrape assets and verify web app screens.',
      tools: ['browser.open', 'browser.navigate', 'browser.click', 'browser.screenshot'],
      permissions: 'LOW / ISOLATED CONTAINER',
      enabled: true
    }
  ]);

  const toggleAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Agent Hub</h1>
        <p className="text-xs text-gray-500 mt-1">Configure specialist AI models, system permissions, and default tool bounds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agents.map((agent) => (
          <div key={agent.id} className={`bg-gray-900 border rounded-xl p-5 space-y-4 shadow-sm transition-all ${
            agent.enabled ? 'border-gray-800' : 'border-gray-900 opacity-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  agent.enabled ? 'bg-orange-600/10 text-orange-400' : 'bg-gray-800 text-gray-500'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-100">{agent.name}</h3>
                  <p className="text-[10px] text-gray-500">ClawForge Specialist System</p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleAgent(agent.id)}
                className={`w-9 h-5 rounded-full p-0.5 transition-all ${
                  agent.enabled ? 'bg-orange-600' : 'bg-gray-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${
                  agent.enabled ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">{agent.desc}</p>

            {/* Meta tools & permissions */}
            <div className="grid grid-cols-2 gap-3 text-[10px] pt-3 border-t border-gray-850">
              <div className="space-y-1">
                <div className="text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  <span>Assigned Tools</span>
                </div>
                <div className="text-gray-300 font-mono line-clamp-1">{agent.tools.join(', ')}</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Security Risk Policy</span>
                </div>
                <div className="text-gray-300 font-medium truncate">{agent.permissions}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
