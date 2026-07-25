import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Cpu, RefreshCw, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const Models: React.FC = () => {
  const { testModelConnection } = useClawForgeStore();
  const [providers, setProviders] = useState([
    { id: '1', name: 'Ollama local', type: 'Ollama', url: 'http://127.0.0.1:11434', model: 'llama3:latest', connected: true },
    { id: '2', name: 'OpenAI Cloud', type: 'OpenAI-compatible', url: 'https://api.openai.com/v1', model: 'gpt-4o', connected: false }
  ]);

  const [checking, setChecking] = useState<string | null>(null);

  const checkConnection = (id: string) => {
    setChecking(id);
    const p = providers.find(item => item.id === id);
    if (!p) {
      setChecking(null);
      return;
    }

    testModelConnection(p.type === 'Ollama' ? 'ollama' : 'openai', p.url, '', p.model)
      .then(connected => {
        setProviders(prev => prev.map(item => item.id === id ? { ...item, connected } : item));
      })
      .catch(err => {
        console.error('Error testing model connection:', err);
        setProviders(prev => prev.map(item => item.id === id ? { ...item, connected: false } : item));
      })
      .finally(() => {
        setChecking(null);
      });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Model Management</h1>
          <p className="text-xs text-gray-500 mt-1">Configure Ollama connections, self-hosted LLM endpoints, and custom model definitions.</p>
        </div>
        <button className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Provider</span>
        </button>
      </div>

      <div className="space-y-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-orange-600/10 text-orange-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-200">{p.name}</h3>
                  <p className="text-[10px] text-gray-500">{p.type} API Wrapper</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  p.connected
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {p.connected ? '● Connected' : '● Offline / Untested'}
                </span>
                <button
                  onClick={() => checkConnection(p.id)}
                  disabled={checking === p.id}
                  className="p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-gray-100 rounded transition-all"
                  title="Test Connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking === p.id ? 'animate-spin text-orange-400' : ''}`} />
                </button>
                <button className="p-1.5 bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inputs configuration view */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-3 border-t border-gray-850">
              <div className="space-y-1">
                <span className="text-gray-500 font-medium uppercase tracking-wider block">Base URL</span>
                <span className="text-gray-300 font-mono break-all">{p.url}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-medium uppercase tracking-wider block">Active Model</span>
                <span className="text-gray-300 font-mono">{p.model}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-medium uppercase tracking-wider block">Loaded Parameters</span>
                <span className="text-gray-300">Context: 4096 / Temp: 0.7</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
