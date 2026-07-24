import React from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { ShieldAlert, Check, X, CheckSquare } from 'lucide-react';

export const Approvals: React.FC = () => {
  const { approvals, approveAction, denyAction } = useClawForgeStore();

  const pending = approvals.filter(a => a.status === 'pending');
  const history = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Approval Center</h1>
        <p className="text-xs text-gray-500 mt-1">Review, approve, or deny sensitive or high-risk actions before they run.</p>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Actions</h2>

        {pending.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-900/40 rounded-xl border border-gray-800">
            <CheckSquare className="w-8 h-8 text-green-500/20 mx-auto mb-2" />
            <p className="text-xs">All caught up! No actions require manual intervention.</p>
          </div>
        ) : (
          pending.map((a) => (
            <div key={a.id} className="bg-gray-900 border border-orange-500/20 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-600/10 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-gray-200">
                      ClawForge wants to run: <span className="font-mono text-orange-400">{a.toolName}</span>
                    </h3>
                    <p className="text-[10px] text-gray-500">Task: {a.taskId || 'General request'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => denyAction(a.id)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-red-950/20 text-gray-400 hover:text-red-400 text-xs font-semibold rounded flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Deny</span>
                  </button>
                  <button
                    onClick={() => approveAction(a.id)}
                    className="px-4 py-1.5 bg-orange-655 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded flex items-center gap-1 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>

              {/* Arguments JSON visual block */}
              <div className="p-3 bg-gray-950 rounded-lg border border-gray-850">
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {a.params}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>

      {/* History log list */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approval Logs</h2>

        {history.length === 0 ? (
          <p className="text-xs text-gray-500">No historically completed approvals logs.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="p-3 bg-gray-900/50 border border-gray-850 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono text-gray-300">{h.toolName}</span>
                  <span className="text-gray-500 text-[10px] ml-2">({h.id})</span>
                </div>
                <span className={`font-semibold capitalize text-[10px] ${
                  h.status === 'approved' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
