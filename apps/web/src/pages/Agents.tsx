import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Bot, Wrench, Shield, Plus, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

export const Agents: React.FC = () => {
  const { v3Agents, fetchV3Agents, addV3Agent, toggleV3Agent, deleteV3Agent } = useClawForgeStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('development');
  const [role, setRole] = useState('Coding Agent');
  const [desc, setDesc] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    fetchV3Agents();
  }, [fetchV3Agents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addV3Agent(name, type, role, desc, prompt);
    setName('');
    setDesc('');
    setPrompt('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="text-orange-500 w-7 h-7" />
            V3 Specialty Agents Orchestrator
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Build and deploy 60+ specialized agents (Architects, Writers, Researchers, Threat Analysts, etc.).
          </p>
        </div>
        <button
          onClick={() => fetchV3Agents()}
          className="p-2 bg-gray-900/40 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Dynamic Agent list */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {v3Agents.map((agent) => (
            <div key={agent.id} className={`bg-gray-900/40 border rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
              agent.enabled ? 'border-gray-800' : 'border-gray-950 opacity-50'
            }`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      agent.enabled ? 'bg-orange-600/10 text-orange-400 border border-orange-500/15' : 'bg-gray-950 text-gray-500'
                    }`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{agent.name}</h3>
                      <span className="text-[10px] text-orange-400 font-medium tracking-wide uppercase">{agent.type} Agent</span>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleV3Agent(agent.id, !agent.enabled)}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-all ${
                      agent.enabled ? 'bg-orange-600' : 'bg-gray-950 border border-gray-800'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${
                      agent.enabled ? 'translate-x-3.5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Role:</span>
                  <span className="text-xs text-gray-300 font-semibold">{agent.role}</span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{agent.description || 'No system details provided.'}</p>
              </div>

              <div className="flex justify-between items-center border-t border-gray-950 pt-3">
                <span className="text-[10px] font-mono text-gray-500">ID: {agent.id}</span>
                <button
                  onClick={() => deleteV3Agent(agent.id)}
                  className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right column: Create specialist Form */}
        <div>
          <form onSubmit={handleSubmit} className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-orange-500" />
              Build V3 Specialist
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Inject targeted system prompts and guidelines to specialize this runtime execution.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. Statistical Chart Analyst"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Orchestrator Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                >
                  <option value="management">Management Agent</option>
                  <option value="development">Development Agent</option>
                  <option value="research">Research Agent</option>
                  <option value="creative">Creative Agent</option>
                  <option value="security">Security Agent</option>
                  <option value="personal">Personal Assistant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Assigned Target Role</label>
                <input
                  type="text"
                  placeholder="e.g. Database Agent or SEO Writer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Description</label>
                <textarea
                  placeholder="Analyzes raw statistical data files to extract metrics trends."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">System Instruction Prompt</label>
                <textarea
                  placeholder="Always prioritize secure parameterized variables and clean arrays."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white h-20 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-lg text-sm transition-all"
            >
              Compile & Save Specialist
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Agents;