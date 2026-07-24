import React, { useState } from 'react';
import { ShieldCheck, HardDrive, Terminal, GitBranch, Globe, Check } from 'lucide-react';

export const Tools: React.FC = () => {
  const [tools, setTools] = useState([
    { name: 'Filesystem Tools', desc: 'Allows read, write, edits, moves, and deletions within workspace bounds.', icon: HardDrive, enabled: true, risk: 'LOW-HIGH' },
    { name: 'Terminal Execution', desc: 'Enables sandbox code compiling, packaging, and unit test automation.', icon: Terminal, enabled: true, risk: 'MEDIUM' },
    { name: 'Git Repository Management', desc: 'Queries status, branches, commits edits, and pushes code repositories.', icon: GitBranch, enabled: true, risk: 'SAFE-HIGH' },
    { name: 'Browser Playwright Scrapers', desc: 'Opens isolated headless Chromium browser viewports to interact with links.', icon: Globe, enabled: true, risk: 'LOW' }
  ]);

  const toggleTool = (idx: number) => {
    setTools(prev => prev.map((t, i) => i === idx ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Tool Permissions</h1>
        <p className="text-xs text-gray-500 mt-1">Control active extensions, API limits, and set mandatory approval boundaries.</p>
      </div>

      <div className="space-y-4">
        {tools.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-600/10 text-orange-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-200">{t.name}</h3>
                    <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                      Risk: {t.risk}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-xl">{t.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-green-500 flex items-center gap-1 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  <span>Enabled</span>
                </span>
                <button
                  onClick={() => toggleTool(idx)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${
                    t.enabled
                      ? 'bg-red-600/10 hover:bg-red-650/25 text-red-400'
                      : 'bg-green-600 hover:bg-green-550 text-white'
                  }`}
                >
                  {t.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
