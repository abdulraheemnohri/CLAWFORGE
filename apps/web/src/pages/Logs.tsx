import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { ClipboardList, Search, Download, AlertOctagon, Terminal, Info, Play, CheckCircle } from 'lucide-react';

export const Logs: React.FC = () => {
  const { v3Traces, fetchV3Observability, logs } = useClawForgeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    fetchV3Observability();
  }, [fetchV3Observability]);

  // Combine standard logs stream and traces database entries for unified trace search list
  const unifiedLogs = [
    ...logs.map((l, index) => ({
      id: `sys-${index}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'System Runtime',
      level: 'INFO',
      message: l
    })),
    ...v3Traces.map((t, index) => ({
      id: `trace-${index}`,
      timestamp: new Date(t.createdAt || Date.now()).toLocaleTimeString(),
      source: t.entityName,
      level: t.entityType === 'tool' ? 'DEBUG' : 'INFO',
      message: `Executed tracing step: [${t.stepName}] - Input: "${t.input}" -> Output: "${t.output}"`
    }))
  ];

  const filteredLogs = unifiedLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", "clawforge_audit_logs.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-500/10 border-red-500/15';
      case 'DEBUG': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15';
      default: return 'text-gray-400 bg-gray-950 border-gray-850';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ClipboardList className="text-orange-500 w-7 h-7" />
            Audit Logging & Traces
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Audit logging streams, raw execution parameters, LLM telemetry tokens, and sandbox trace filters.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export logs.json</span>
        </button>
      </div>

      {/* Filter and search parameters */}
      <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 flex flex-col md:flex-row gap-3.5">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search log streams, message content, or sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-850 focus:border-orange-500/40 focus:ring-0 rounded-lg pl-9 pr-4 py-2 text-sm text-white"
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'INFO', 'DEBUG', 'ERROR'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`text-xs px-3 py-2 rounded-lg font-bold uppercase transition-all border ${
                filterLevel === lvl
                  ? 'bg-orange-600/15 text-orange-400 border-orange-500/35'
                  : 'bg-gray-950 text-gray-400 border-gray-850 hover:bg-gray-900'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View list container */}
      <div className="bg-gray-950 border border-gray-900 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[550px]">
        <div className="p-3 bg-gray-900 border-b border-gray-950 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-400 font-mono ml-2">Console Trace Stream</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">Matched: {filteredLogs.length} rows</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-2.5 select-text">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-4 border-b border-gray-900/40 pb-2">
              <span className="text-gray-600 shrink-0 select-none">{log.timestamp}</span>
              <span className={`shrink-0 text-[10px] tracking-wide font-bold px-1.5 py-0.5 rounded border ${getLevelStyle(log.level)}`}>
                {log.level}
              </span>
              <span className="text-orange-500 shrink-0 select-none">[{log.source}]</span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              No stream matches current search parameter filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Logs;