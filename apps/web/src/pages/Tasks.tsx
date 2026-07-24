import React from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Play, Pause, Square, AlertCircle, RefreshCw, CheckCircle, Bot } from 'lucide-react';

export const Tasks: React.FC = () => {
  const { tasks, approveAction } = useClawForgeStore();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Task Workspace</h1>
          <p className="text-xs text-gray-500 mt-1">Manage, verify, and monitor active agent plans and workflows.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-900/40 rounded-xl border border-gray-800">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm">No active tasks found. Go to Dashboard or Chat to start a task!</p>
        </div>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5 shadow-sm">
            {/* Header / Meta */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-gray-100">{task.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    task.status === 'running'
                      ? 'bg-orange-500/10 text-orange-400 animate-pulse'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">{task.id}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1">
                  <Pause className="w-3 h-3" />
                  <span>Pause</span>
                </button>
                <button className="px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white text-xs rounded flex items-center gap-1">
                  <Square className="w-3 h-3" />
                  <span>Stop</span>
                </button>
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            </div>

            {/* Steps timeline checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Execution Plan</h4>
              <div className="space-y-2">
                {task.steps.map((step) => {
                  const isComp = step.status === 'completed';
                  const isRun = step.status === 'running';

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        isRun
                          ? 'bg-orange-500/5 border-orange-500/20'
                          : isComp
                            ? 'bg-gray-900/60 border-gray-800/80'
                            : 'bg-gray-900/20 border-gray-900/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isComp
                            ? 'bg-green-500/10 text-green-400'
                            : isRun
                              ? 'bg-orange-500/10 text-orange-400 animate-spin'
                              : 'bg-gray-800 text-gray-600'
                        }`}>
                          {isComp ? <CheckCircle className="w-3.5 h-3.5" /> : '●'}
                        </div>
                        <div>
                          <p className="font-medium text-xs text-gray-200">{step.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                            <Bot className="w-3 h-3" />
                            <span>{step.agentType}</span>
                          </div>
                        </div>
                      </div>

                      {isRun && step.toolCalls && (
                        <div className="text-[10px] bg-orange-600/15 text-orange-400 px-2 py-0.5 rounded font-mono">
                          {JSON.parse(step.toolCalls).tool}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
