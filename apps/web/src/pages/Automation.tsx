import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Cpu, Plus, Play, Pause, Power, Trash2, Calendar, GitCommit, Webhook, FileText, CheckCircle2, XCircle, BarChart3, Clock } from 'lucide-react';

export const Automation: React.FC = () => {
  const { workflows, fetchWorkflows, addWorkflow, toggleWorkflow, triggerWorkflow, deleteWorkflow } = useClawForgeStore();
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('schedule');
  const [condition, setCondition] = useState('');
  const [selectedWfId, setSelectedWfId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !condition) return;
    await addWorkflow(name, triggerType, condition);
    setName('');
    setCondition('');
  };

  const selectedWf = workflows.find(w => w.id === selectedWfId) || workflows[0];

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="w-4 h-4 text-orange-400" />;
      case 'git_commit':
        return <GitCommit className="w-4 h-4 text-blue-400" />;
      case 'webhook':
        return <Webhook className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-orange-500" />
            Workflow Automation
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Build event-driven agent tasks triggered by schedules, code commits, webhook alerts, or file modifications.
          </p>
        </div>
        <div className="px-3 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-semibold">
          Active Scheduler Connected
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered Workflows */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-semibold text-gray-200 mb-3 flex items-center justify-between">
              <span>Configured Pipelines ({workflows.length})</span>
              <span className="text-xs text-gray-500 font-mono">SQLite-backed</span>
            </h2>

            <div className="space-y-3">
              {workflows.map((wf) => {
                const metrics = wf.metricsJson ? JSON.parse(wf.metricsJson) : { totalRuns: 0, successes: 0, failures: 0 };
                const isSelected = selectedWf && selectedWf.id === wf.id;

                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWfId(wf.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gray-800/60 border-orange-500/50 shadow-md'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-100 text-sm">{wf.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800 font-mono capitalize">
                            {wf.triggerType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          {getTriggerIcon(wf.triggerType)}
                          <span className="font-mono text-gray-300">{wf.condition}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                          wf.status === 'active'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {wf.status}
                        </span>

                        {/* Power Switch */}
                        <button
                          onClick={() => toggleWorkflow(wf.id, wf.status !== 'active')}
                          className={`p-1.5 rounded-md border transition-all ${
                            wf.status === 'active'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
                              : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                          }`}
                          title={wf.status === 'active' ? 'Pause Workflow' : 'Activate Workflow'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Run/Trigger Manually */}
                        <button
                          onClick={() => triggerWorkflow(wf.id)}
                          className="p-1.5 bg-green-950/20 hover:bg-green-950/40 text-green-400 border border-green-900/30 rounded-md transition-all"
                          title="Execute Manually"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteWorkflow(wf.id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-md transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Simple stats */}
                    <div className="flex gap-4 mt-3 pt-2 border-t border-gray-900 text-[10px] font-mono text-gray-500">
                      <span>Total runs: <strong className="text-gray-300">{metrics.totalRuns}</strong></span>
                      <span>Successes: <strong className="text-green-500">{metrics.successes}</strong></span>
                      <span>Failures: <strong className="text-red-500">{metrics.failures}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution History Panel */}
          {selectedWf && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4.5 h-4.5 text-orange-400" />
                  Metrics & Execution Logs
                </h3>
                <span className="text-xs text-gray-500 font-mono">SQLite Pipeline ID: {selectedWf.id}</span>
              </div>

              <div className="space-y-4">
                {/* Visual metrics cards */}
                {(() => {
                  const metrics = selectedWf.metricsJson ? JSON.parse(selectedWf.metricsJson) : { totalRuns: 0, successes: 0, failures: 0 };
                  const rate = metrics.totalRuns > 0 ? ((metrics.successes / metrics.totalRuns) * 100).toFixed(1) : '100';
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <span className="text-[10px] text-gray-500 font-mono block">Total Runs</span>
                        <span className="text-lg font-bold text-gray-200 block mt-1">{metrics.totalRuns}</span>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <span className="text-[10px] text-gray-500 font-mono block">Successes</span>
                        <span className="text-lg font-bold text-green-400 block mt-1">{metrics.successes}</span>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <span className="text-[10px] text-gray-500 font-mono block">Failures</span>
                        <span className="text-lg font-bold text-red-400 block mt-1">{metrics.failures}</span>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <span className="text-[10px] text-gray-500 font-mono block">Success Rate</span>
                        <span className="text-lg font-bold text-orange-400 block mt-1">{rate}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Execution history list */}
                <div>
                  <span className="text-xs text-gray-500 block mb-2">History Log Feed:</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(() => {
                      const logs = selectedWf.executionLogsJson ? JSON.parse(selectedWf.executionLogsJson) : [];
                      if (logs.length === 0) {
                        return <div className="text-xs text-gray-500 italic p-3 bg-gray-950 border border-gray-800 rounded">No execution logs yet. Click play to trigger manually.</div>;
                      }
                      return logs.map((log: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-gray-950 border border-gray-800 rounded text-xs flex items-start gap-2.5">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-300 font-mono">{log.status === 'success' ? 'SUCCESS' : 'FAILURE'}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-400 mt-1 font-sans">{log.message}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Build Workflow Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
          <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-orange-500" />
            Build Automation Trigger
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Link event listeners to launch background scripts or specialized skills recursively.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Workflow Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Generate Daily Report"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Trigger Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
              >
                <option value="schedule">Time-based Cron Schedule</option>
                <option value="git_commit">Git Commit Push Listener</option>
                <option value="webhook">Incoming REST Webhook</option>
                <option value="manual">Manual Trigger Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Trigger Condition</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder={
                  triggerType === 'schedule'
                    ? 'e.g. Every Sunday at 12:00 AM'
                    : triggerType === 'git_commit'
                    ? 'e.g. On branch dev pull-request'
                    : 'e.g. POST /api/webhooks/rebuild'
                }
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              Assemble Workflow
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Automation;