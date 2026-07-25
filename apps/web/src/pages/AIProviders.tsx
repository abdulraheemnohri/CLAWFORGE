import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Cpu, Server, Plus, Trash2, Key, CheckCircle, AlertTriangle, Play, Settings2 } from 'lucide-react';

export const AIProviders: React.FC = () => {
  const { v3Providers, v3Models, fetchV3Providers, fetchV3Models, addV3Provider, deleteV3Provider, addV3Model, deleteV3Model, testModelConnection } = useClawForgeStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const [modelName, setModelName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [routingMode, setRoutingMode] = useState('quality');

  const [testResults, setTestResults] = useState<Record<string, 'success' | 'failed' | 'testing'>>({});

  useEffect(() => {
    fetchV3Providers();
    fetchV3Models();
  }, [fetchV3Providers, fetchV3Models]);

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await addV3Provider(name, type, baseUrl, apiKey);
    setName('');
    setBaseUrl('');
    setApiKey('');
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName || !providerId) return;
    await addV3Model(modelName, providerId, { mode: routingMode, maxTokens: 4096 });
    setModelName('');
  };

  const runConnectionCheck = async (prov: any) => {
    setTestResults(prev => ({ ...prev, [prov.id]: 'testing' }));
    const success = await testModelConnection(prov.type, prov.baseUrl || '', prov.apiKey || '', 'test-model');
    setTestResults(prev => ({ ...prev, [prov.id]: success ? 'success' : 'failed' }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="text-orange-500 w-7 h-7" />
            AI Provider Platform
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure local hosts (Ollama, LM Studio) and cloud endpoints (OpenAI, Anthropic, DeepSeek).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-gray-300 font-medium">Provider Hub Router Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Provider list & config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Server className="text-orange-500 w-5 h-5" />
              Configured API Providers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {v3Providers.map((prov) => (
                <div key={prov.id} className="bg-gray-950/80 border border-gray-800 rounded-lg p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-white">{prov.name}</h3>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        prov.type === 'ollama' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                      }`}>
                        {prov.type}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs font-mono mt-1 truncate">{prov.baseUrl || 'Native default endpoint'}</p>
                    {prov.apiKey && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-2 font-mono">
                        <Key className="w-3 h-3 text-orange-500/60" />
                        <span>Credentials Secured</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-900 pt-3">
                    <button
                      onClick={() => runConnectionCheck(prov)}
                      className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
                        testResults[prov.id] === 'success' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                        testResults[prov.id] === 'failed' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                        testResults[prov.id] === 'testing' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' :
                        'bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700'
                      }`}
                    >
                      {testResults[prov.id] === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
                      {testResults[prov.id] === 'failed' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {testResults[prov.id] === 'testing' && <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>}
                      <span>
                        {testResults[prov.id] === 'success' ? 'Connection Live' :
                         testResults[prov.id] === 'failed' ? 'Connection Failed' :
                         testResults[prov.id] === 'testing' ? 'Pinging...' : 'Test Connection'}
                      </span>
                    </button>

                    <button
                      onClick={() => deleteV3Provider(prov.id)}
                      className="text-gray-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Routing Matrix */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings2 className="text-orange-500 w-5 h-5" />
              V3 Intelligence Router Models
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-gray-950 text-gray-300 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-900">
                  <tr>
                    <th className="py-3 px-4">Model Name</th>
                    <th className="py-3 px-4">Mapped Provider</th>
                    <th className="py-3 px-4">Routing Engine Rule</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900">
                  {v3Models.map((model) => {
                    const prov = v3Providers.find(p => p.id === model.providerId);
                    const config = JSON.parse(model.config || '{}');
                    return (
                      <tr key={model.id} className="hover:bg-gray-900/20">
                        <td className="py-3 px-4 font-semibold text-white">{model.name}</td>
                        <td className="py-3 px-4 font-medium text-gray-300">{prov ? prov.name : 'Unknown provider'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            config.mode === 'quality' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                            config.mode === 'coding' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                            config.mode === 'cost' ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                            'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {config.mode || 'general'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteV3Model(model.id)}
                            className="text-gray-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Addition Forms */}
        <div className="space-y-6">
          {/* Add Provider */}
          <form onSubmit={handleAddProvider} className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-1.5">
              <Plus className="w-4.5 h-4.5 text-orange-500" />
              Add Custom Provider
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Provider Name</label>
                <input
                  type="text"
                  placeholder="e.g. Runpod llama.cpp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Client SDK Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                >
                  <option value="openai">OpenAI compatible API</option>
                  <option value="ollama">Ollama (Native Local)</option>
                  <option value="mock">Local Mock Engine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Base URL</label>
                <input
                  type="text"
                  placeholder="https://api.yourprovider.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Secure Authorization Token (API Key)</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white animate-pulse"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-lg text-sm transition-all shadow-md shadow-orange-950/20"
            >
              Verify & Save Provider
            </button>
          </form>

          {/* Add Model Route */}
          <form onSubmit={handleAddModel} className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-base flex items-center gap-1.5">
              <Plus className="w-4.5 h-4.5 text-orange-500" />
              Map Router Model
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. deepseek-v3"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Select Active Provider</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                >
                  <option value="">-- Choose Provider --</option>
                  {v3Providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1">Router Mode Tag</label>
                <select
                  value={routingMode}
                  onChange={(e) => setRoutingMode(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-orange-500/40 focus:ring-0 rounded-lg p-2 text-sm text-white"
                >
                  <option value="quality">Quality Mode (High reasoning)</option>
                  <option value="coding">Coding Mode (Programming optimized)</option>
                  <option value="cost">Cost Mode (Efficient/Inexpensive)</option>
                  <option value="privacy">Privacy Mode (Local hosts only)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg text-sm border border-gray-700 transition-all"
            >
              Inject Router Model Map
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AIProviders;