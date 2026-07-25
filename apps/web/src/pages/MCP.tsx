import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Server, Plus, Check, RefreshCw, Trash2, Power, AlertTriangle, ShieldCheck } from 'lucide-react';

export const MCP: React.FC = () => {
  const { mcpServers, fetchMcpServers, addMcpServer, toggleMcpServer, testMcpServer, deleteMcpServer } = useClawForgeStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    fetchMcpServers();
  }, [fetchMcpServers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    await addMcpServer(name, url, desc);
    setName('');
    setUrl('');
    setDesc('');
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    await testMcpServer(id);
    setTimeout(() => {
      setTestingId(null);
    }, 800);
  };

  const selectedServer = mcpServers.find(s => s.id === selectedServerId) || mcpServers[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-orange-500" />
            Model Context Protocol (MCP)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect external tools, filesystem directories, databases, and APIs seamlessly to your Agent Runtime.
          </p>
        </div>
        <div className="px-3 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-semibold">
          V2 Native Protocol Ready
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered MCP Servers List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-semibold text-gray-200 mb-3 flex items-center justify-between">
              <span>Active Connectors ({mcpServers.length})</span>
              <span className="text-xs text-gray-500 font-mono">SQLite-backed</span>
            </h2>

            <div className="space-y-3">
              {mcpServers.map((server) => {
                const tools = server.toolsJson ? JSON.parse(server.toolsJson) : [];
                const isSelected = selectedServer && selectedServer.id === server.id;

                return (
                  <div
                    key={server.id}
                    onClick={() => setSelectedServerId(server.id)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gray-800/60 border-orange-500/50 shadow-md'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-100">{server.name}</span>
                          <span className="text-xs text-gray-500 font-mono">v{server.version || '1.0.0'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{server.description}</p>
                        <div className="text-xs text-gray-500 mt-2 font-mono break-all">{server.url}</div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        {/* Status badge */}
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                          server.status === 'connected'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {server.status}
                        </span>

                        {/* Enable switch */}
                        <button
                          onClick={() => toggleMcpServer(server.id, !server.enabled)}
                          className={`p-1.5 rounded-md border transition-all ${
                            server.enabled
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
                              : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                          }`}
                          title={server.enabled ? 'Disable Connector' : 'Enable Connector'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Test connection */}
                        <button
                          onClick={() => handleTest(server.id)}
                          disabled={testingId === server.id}
                          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-md transition-all"
                          title="Test connection"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${testingId === server.id ? 'animate-spin text-orange-500' : ''}`} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteMcpServer(server.id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-md transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-900 text-xs">
                      <span className="text-gray-500">Exposed Tools:</span>
                      <span className="font-semibold text-gray-300 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                        {tools.length} Tools
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Details / Tools list */}
          {selectedServer && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    {selectedServer.name} Inspect
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Exposed tools and workspace security credentials</p>
                </div>
                <span className="text-xs text-gray-500 font-mono">SQLite ID: {selectedServer.id}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-400 block mb-2">Required Permissions:</span>
                  <div className="flex gap-2">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Read Access: Allowed
                    </span>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      Write Access: Requires Consent
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block mb-2">Available System Functions:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(() => {
                      const tools = selectedServer.toolsJson ? JSON.parse(selectedServer.toolsJson) : [];
                      if (tools.length === 0) {
                        return <div className="text-xs text-gray-500 col-span-2">No tools declared by this server.</div>;
                      }
                      return tools.map((tool: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-950 border border-gray-800 rounded font-mono text-xs text-orange-400">
                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span>{tool}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Register MCP Server Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
          <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-orange-500" />
            Connect MCP Server
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Input the local host/network URL or path of an MCP protocol server to make its tools instantly accessible to ClawForge.
          </p>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Server Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Postgres DB Agent"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Connection URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://127.0.0.1:4000/mcp"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Exposes PG databases schema audit tools to agent runtime"
                rows={3}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              Connect Server
            </button>
          </form>

          <div className="mt-5 p-3 bg-orange-600/5 border border-orange-500/10 rounded-lg flex items-start gap-2 text-xs text-orange-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              All connected servers run locally in your environment. Always audit external tool configurations to prevent unauthorized execution.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MCP;