import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { ToyBrick, Plus, Code, Trash2, Power, Eye, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export const Plugins: React.FC = () => {
  const { plugins, fetchPlugins, addPlugin, togglePlugin, deletePlugin } = useClawForgeStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addPlugin(name, desc, permissions);
    setName('');
    setDesc('');
    setPermissions([]);
  };

  const handleTogglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const selectedPlugin = plugins.find(p => p.id === selectedPluginId) || plugins[0];

  const availablePermissions = ['filesystem-read', 'filesystem-write', 'external-network', 'microphone', 'desktop-notifications'];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ToyBrick className="w-6 h-6 text-orange-500" />
            Plugin Framework Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Install custom extensions providing supplemental tools, interface panels, background systems, or platform connectors.
          </p>
        </div>
        <div className="px-3 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-semibold">
          Sandboxed Mode: Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Installed Plugins list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-semibold text-gray-200 mb-4 flex items-center justify-between">
              <span>Active Platform Plugins ({plugins.length})</span>
              <span className="text-xs text-gray-500 font-mono">SQLite Configuration Sync</span>
            </h2>

            <div className="space-y-3">
              {plugins.map((plugin) => {
                const perms = plugin.permissionsJson ? JSON.parse(plugin.permissionsJson) : [];
                const isSelected = selectedPlugin && selectedPlugin.id === plugin.id;

                return (
                  <div
                    key={plugin.id}
                    onClick={() => setSelectedPluginId(plugin.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gray-800/60 border-orange-500/50 shadow-md'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-100 text-sm">{plugin.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">v{plugin.version}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{plugin.description}</p>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Power Switch */}
                        <button
                          onClick={() => togglePlugin(plugin.id, !plugin.enabled)}
                          className={`p-1.5 rounded border transition-all ${
                            plugin.enabled
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
                              : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700'
                          }`}
                          title={plugin.enabled ? 'Disable Plugin' : 'Enable Plugin'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deletePlugin(plugin.id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded transition-all"
                          title="Remove Plugin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-3 pt-2 border-t border-gray-900">
                      {perms.map((perm: string, idx: number) => (
                        <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plugin Details Panel / Manifest view */}
          {selectedPlugin && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-gray-800 flex items-center gap-1.5">
                <Code className="w-4.5 h-4.5 text-orange-400" />
                Manifest metadata (manifest.json)
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <span className="text-xs text-gray-500 font-sans block mb-1">Declared Entry Script:</span>
                  <span className="text-gray-300 bg-gray-950 px-2 py-1 border border-gray-800 rounded block">
                    {selectedPlugin.manifestJson ? JSON.parse(selectedPlugin.manifestJson).entry : 'index.js'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-sans block mb-1">Platform UI extensions:</span>
                  <span className="text-gray-300 bg-gray-950 px-2 py-1 border border-gray-800 rounded block flex items-center gap-1.5">
                    {selectedPlugin.manifestJson && JSON.parse(selectedPlugin.manifestJson).uiExtensions ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-400 font-sans">Active - Plugin renders custom Dashboard Widgets</span>
                      </>
                    ) : (
                      <>
                        <Info className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-400 font-sans">None - Backend background services only</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-sans block mb-1">Raw JSON Payload:</span>
                  <pre className="p-3 bg-gray-950 border border-gray-800 rounded text-[11px] text-gray-400 overflow-x-auto">
                    {selectedPlugin.manifestJson}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Register Plugin Manifest Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
          <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
            <Plus className="w-5 h-5 text-orange-500" />
            Install Custom Plugin
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Upload custom packages or link locally-built entry files to hook system listeners inside the agent core loop.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Plugin Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Slack Webhook Reporter"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description (Optional)</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Exposes Slack webhook endpoints to post execution metrics."
                rows={2}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Request Platform Sandbox Permissions</label>
              <div className="space-y-1.5 bg-gray-950 p-3 border border-gray-800 rounded-lg">
                {availablePermissions.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm)}
                      onChange={() => handleTogglePermission(perm)}
                      className="accent-orange-500 rounded text-gray-900"
                    />
                    <span className="font-mono">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              Verify & Install Package
            </button>
          </form>

          <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-lg flex items-start gap-2 text-xs text-red-400">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>
              Warning: Installing plugins from unverified sources can lead to execution security risks. Ensure files are audited before activating.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Plugins;