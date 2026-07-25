import React, { useState, useEffect } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Shield, Plus, Key, Laptop, Smartphone, Terminal, Trash2, Clock, CheckCircle, RefreshCw } from 'lucide-react';

export const Devices: React.FC = () => {
  const { pairedDevices, fetchDevices, pairDevice, deleteDevice } = useClawForgeStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('android');
  const [pairingRequest, setPairingRequest] = useState<any | null>(null);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Call store action
    await pairDevice(name, type);

    // Simulate pairing request generation
    const randomCode = 'CF-' + Math.floor(1000 + Math.random() * 9000);
    setPairingRequest({
      name,
      type,
      code: randomCode,
      expiresAt: new Date(Date.now() + 300000).toLocaleTimeString()
    });

    setName('');
  };

  const getDeviceIcon = (devType: string) => {
    switch (devType) {
      case 'desktop':
        return <Laptop className="w-5 h-5 text-blue-400" />;
      case 'cli':
        return <Terminal className="w-5 h-5 text-green-400" />;
      default:
        return <Smartphone className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            Paired Devices & Remote Control
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect companion mobile devices, CLI agents, or tablet portals securely to your agent runtime.
          </p>
        </div>
        <div className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Mutual Authentication Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Paired Devices list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-md font-semibold text-gray-200 mb-4 flex items-center justify-between">
              <span>Trusted Devices ({pairedDevices.length})</span>
              <span className="text-xs text-gray-500 font-mono">SQLite Credentials Sync</span>
            </h2>

            <div className="space-y-3">
              {pairedDevices.map((device) => (
                <div
                  key={device.id}
                  className="p-4 bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-lg flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-100">{device.name}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 font-mono bg-orange-600/5 border border-orange-500/15 px-1.5 py-0.5 rounded">
                          {device.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-mono">
                        <Key className="w-3 h-3 text-gray-600" />
                        <span>Pairing Code: {device.pairingCode}</span>
                        <span className="text-gray-700">•</span>
                        <span>Status: <span className="text-green-400 font-sans capitalize">{device.status}</span></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-gray-500 block">Last Active Connection</span>
                      <span className="text-xs font-mono text-gray-400">
                        {device.lastConnectedAt ? new Date(device.lastConnectedAt).toLocaleString() : 'Never'}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteDevice(device.id)}
                      className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-lg transition-all"
                      title="Revoke Trust & Session Keys"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure details / specs panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-gray-800 flex items-center gap-1.5">
              <Key className="w-4.5 h-4.5 text-orange-400" />
              Cryptographic Token Rotation & Access Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
              <div className="space-y-2.5">
                <div className="flex justify-between p-2.5 bg-gray-950 border border-gray-800 rounded">
                  <span>Transport Encryption</span>
                  <strong className="text-green-400 font-mono font-bold">AES-256-GCM / TLS v1.3</strong>
                </div>
                <div className="flex justify-between p-2.5 bg-gray-950 border border-gray-800 rounded">
                  <span>Key Lifetime Limit</span>
                  <strong className="text-gray-300 font-mono">30 Days (Rolling)</strong>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between p-2.5 bg-gray-950 border border-gray-800 rounded">
                  <span>Interactive Approvals</span>
                  <strong className="text-orange-400 font-semibold">Strictly Enforced</strong>
                </div>
                <div className="flex justify-between p-2.5 bg-gray-950 border border-gray-800 rounded">
                  <span>Sandboxed Executions</span>
                  <strong className="text-gray-300">Enabled</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Register Pair Device */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-orange-500" />
              Pair Companion Device
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Authorize external CLI clients or tablet companion interfaces by generating a unique mutual authentication key.
            </p>

            <form onSubmit={handlePair} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Device Nickname</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abdul's Pixel Tablet"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Device Form Factor</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
                >
                  <option value="android">Mobile / Tablet Portal (Android)</option>
                  <option value="desktop">Windows/Mac Desktop Application</option>
                  <option value="cli">Sub-shell Command CLI Tool</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-md"
              >
                Generate Pairing Code
              </button>
            </form>
          </div>

          {/* Code verification sheet if pairingRequest is active */}
          {pairingRequest && (
            <div className="bg-gray-900 border border-green-500/30 rounded-xl p-5 bg-green-500/5">
              <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Awaiting Connection
              </h3>
              <p className="text-xs text-gray-300">
                Open ClawForge Companion on <strong className="text-white">{pairingRequest.name}</strong> and key in the following pairing PIN:
              </p>

              <div className="my-4 text-center py-4 bg-gray-950 border border-green-500/20 rounded-lg text-2xl font-mono font-bold tracking-widest text-green-400 select-all shadow-inner">
                {pairingRequest.code}
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                  Expires: {pairingRequest.expiresAt}
                </span>
                <span className="text-green-500 font-semibold animate-pulse">Scanning network...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Devices;