import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { ShieldCheck, ServerCrash, RefreshCw, Calendar, Clock, Terminal } from 'lucide-react';

export const ActivityCenter: React.FC = () => {
  const { logs } = useClawForgeStore();
  const [filter, setFilter] = useState<'all' | 'tasks' | 'security' | 'errors'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'tasks') return log.toLowerCase().includes('task') || log.toLowerCase().includes('agent');
    if (filter === 'security') return log.toLowerCase().includes('approve') || log.toLowerCase().includes('denied') || log.toLowerCase().includes('security');
    if (filter === 'errors') return log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
    return true;
  });

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm tracking-wider text-gray-200 uppercase flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Real-time Activity
        </h3>
        <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-mono font-medium uppercase animate-pulse">
          Live
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-gray-800 flex gap-1.5 flex-wrap">
        {(['all', 'tasks', 'security', 'errors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all capitalize ${
              filter === tab
                ? 'bg-gray-800 text-orange-400 border border-orange-500/30'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-4">
            <ShieldCheck className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-xs">No matching actions logged in this workspace session.</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isError = log.toLowerCase().includes('fail') || log.toLowerCase().includes('error') || log.toLowerCase().includes('deny');
            const isSecurity = log.toLowerCase().includes('approve') || log.toLowerCase().includes('permission');

            return (
              <div key={idx} className="flex gap-3 text-xs leading-relaxed relative">
                {idx !== filteredLogs.length - 1 && (
                  <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-gray-800" />
                )}

                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 shadow-md ${
                  isError
                    ? 'bg-red-500/10 text-red-400'
                    : isSecurity
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-orange-500/10 text-orange-400'
                }`}>
                  <CircleIcon isError={isError} isSecurity={isSecurity} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 break-words">{log}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const CircleIcon: React.FC<{ isError: boolean; isSecurity: boolean }> = ({ isError, isSecurity }) => {
  if (isError) return <span className="text-[10px] font-bold">!</span>;
  if (isSecurity) return <ShieldCheck className="w-3 h-3" />;
  return <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />;
};
