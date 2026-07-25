import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Brain, Search, Trash2, Calendar, FileCheck, Sparkles } from 'lucide-react';

export const Memory: React.FC = () => {
  const { clearProjectMemory, activeProjectId, fetchMemories, deleteMemory } = useClawForgeStore();
  const [query, setQuery] = useState('');
  const [memories, setMemories] = useState<any[]>([]);

  const loadMemories = () => {
    fetchMemories().then(data => setMemories(data));
  };

  useEffect(() => {
    loadMemories();
  }, [activeProjectId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearProjectMemory();
      setMemories([]);
    } catch (err) {
      console.error('Error clearing memories:', err);
    }
  };

  const filtered = memories.filter(m => (m.content || '').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Project Context Memory</h1>
          <p className="text-xs text-gray-500 mt-1">Audit active preferences, semantic guidelines, and design decisions index.</p>
        </div>
        <button
          onClick={handleClearAll}
          className="px-3 py-1.5 bg-red-600/10 hover:bg-red-650/20 text-red-400 text-xs font-semibold rounded flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 max-w-md focus-within:border-orange-500/50">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories..."
          className="bg-transparent border-0 outline-none text-xs text-gray-200 placeholder-gray-500 flex-1"
        />
      </div>

      {/* Memory Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-900/40 rounded-xl border border-gray-800">
            <Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs">No project context index items found.</p>
          </div>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-600/10 text-orange-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded uppercase font-mono">
                      {m.type}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mt-2">{m.content}</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(m.id)}
                className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-red-950/20 rounded transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
