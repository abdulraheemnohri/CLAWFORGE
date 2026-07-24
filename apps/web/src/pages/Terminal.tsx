import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Terminal as TermIcon, Play, RefreshCw, Download, Trash2 } from 'lucide-react';

export const Terminal: React.FC = () => {
  const { terminalLogs, runTerminalCommand } = useClawForgeStore();
  const [cmd, setCmd] = useState('');

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;
    runTerminalCommand(cmd);
    setCmd('');
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([terminalLogs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-logs.txt';
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Terminal Sandbox</h1>
          <p className="text-xs text-gray-500 mt-1">Execute terminal commands inside your restricted workspace project folder.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLogs}
            className="p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs rounded flex items-center gap-1.5"
            title="Download logs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Logs</span>
          </button>
        </div>
      </div>

      {/* Terminal window casing */}
      <div className="flex-1 bg-black border border-gray-800 rounded-xl overflow-hidden flex flex-col font-mono text-xs shadow-2xl">
        <div className="bg-gray-900 px-4 py-2 border-b border-gray-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-500 ml-2 text-[10px]">Restricted Project Context Shell</span>
          </div>
          <span className="text-orange-500 font-bold text-[10px]">Active</span>
        </div>

        {/* Output Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 select-text selection:bg-orange-500/35 select-text">
          {terminalLogs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed text-gray-300">
              {log}
            </div>
          ))}
        </div>

        {/* Console Command Input form */}
        <form
          onSubmit={handleRun}
          className="bg-gray-950 p-3 border-t border-gray-850 flex items-center gap-2 shrink-0"
        >
          <span className="text-orange-500 font-bold select-none">&gt;_</span>
          <input
            type="text"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="npm test"
            className="bg-transparent border-0 outline-none text-xs text-gray-200 placeholder-gray-600 flex-1 font-mono"
          />
          <button
            type="submit"
            className="p-1.5 bg-orange-655 bg-orange-600 hover:bg-orange-500 text-white rounded transition-all"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
