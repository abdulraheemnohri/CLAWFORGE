import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { ShieldAlert, Plus, Trash2, CheckCircle, HelpCircle, AlertOctagon, RefreshCw } from 'lucide-react';

export const Policies: React.FC = () => {
  const { v3Policies, fetchV3Policies, addV3Policy, updateV3PolicyLevel, deleteV3Policy } = useClawForgeStore();

  const [entityType, setEntityType] = useState('tool');
  const [entityId, setEntityId] = useState('');
  const [operation, setOperation] = useState('execute');
  const [policyLevel, setPolicyLevel] = useState('ask');

  useEffect(() => {
    fetchV3Policies();
  }, [fetchV3Policies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) return;
    await addV3Policy(entityType, entityId, operation, policyLevel);
    setEntityId('');
  };

  const setLevelColor = (level: string) => {
    switch (level) {
      case 'allow': return 'bg-green-500/10 text-green-400 border-green-500/15';
      case 'ask': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/15';
      case 'deny': return 'bg-red-500/10 text-red-400 border-red-500/15';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="text-orange-500 w-7 h-7" />
            Fine-Grained Policy Engine
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Enforce precise action constraints across AI agents, file terminals, external integrations, and web navigations.
          </p>
        </div>
        <button
          onClick={() => fetchV3Policies()}
          className="p-2 bg-gray-900/40 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Policies Rule Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Active Security Guard Policies ({v3Policies.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-gray-950 text-gray-300 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-900">
                  <tr>
                    <th className="py-3 px-4">Entity Target</th>
                    <th className="py-3 px-4">Scoped Operation</th>
                    <th className="py-3 px-4">Enforcement Level</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {v3Policies.map((pol) => (
                    <tr key={pol.id} className="hover:bg-gray-900/10">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <span className="text-gray-500 text-[10px] uppercase font-bold block">{pol.entityType}</span>
                        {pol.entityId}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-300">{pol.operation}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {['allow', 'ask', 'deny'].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => updateV3PolicyLevel(pol.id, lvl)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all border ${
                                pol.policyLevel === lvl
                                  ? setLevelColor(lvl)
                                  : 'bg-transparent border-transparent text-gray-600 hover:text-gray-300'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteV3Policy(pol.id)}
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Form */}
        <div>
          <form onSubmit={handleSubmit} className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-orange-500" />
              Build Policy Guideline
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Define the default sandbox action layer. High-risk executions trigger either direct approval cards or automated rejects.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Entity Type</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                >
                  <option value="tool">Specific Action Tool</option>
                  <option value="agent">Specialist Agent Name</option>
                  <option value="workflow">Visual Workflow Node</option>
                  <option value="project">Entire Workspace Project</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Target Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. terminal.execute or @coding-agent"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Operation Constraint</label>
                <input
                  type="text"
                  placeholder="e.g. read, write, execute, edit"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Default Enforcement Level</label>
                <div className="flex gap-2">
                  {[
                    { lvl: 'allow', label: 'Allow' },
                    { lvl: 'ask', label: 'Ask Permission' },
                    { lvl: 'deny', label: 'Block Direct' }
                  ].map((btn) => (
                    <button
                      key={btn.lvl}
                      type="button"
                      onClick={() => setPolicyLevel(btn.lvl)}
                      className={`flex-1 text-xs py-2 rounded-lg font-bold uppercase border transition-all ${
                        policyLevel === btn.lvl
                          ? setLevelColor(btn.lvl)
                          : 'bg-gray-950 text-gray-400 border-gray-850 hover:bg-gray-900'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-lg text-sm transition-all"
            >
              Append Engine Guard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Policies;