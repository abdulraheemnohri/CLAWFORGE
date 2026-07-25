import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Shield, Key, Eye, EyeOff, Lock, Trash2, Award, ClipboardList } from 'lucide-react';

export const Security: React.FC = () => {
  const { pairedDevices, fetchDevices, deleteDevice } = useClawForgeStore();

  const [secrets, setSecrets] = useState([
    { name: 'CLAWFORGE_AUTH_TOKEN', value: 'clawforge-default-token-12345', hidden: true },
    { name: 'OPENAI_API_KEY', value: 'sk-proj-**********************************', hidden: true },
    { name: 'GITHUB_ACCESS_TOKEN', value: 'ghp_**********************************', hidden: true }
  ]);

  const toggleSecretVisibility = (idx: number) => {
    setSecrets(
      secrets.map((sec, i) => i === idx ? { ...sec, hidden: !sec.hidden } : sec)
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="text-orange-500 w-7 h-7" />
            Security Vault
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Sandbox access controls, secure credential keys storage, and client authentication logs.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 font-semibold">
          <Lock className="w-3.5 h-3.5 text-orange-500" />
          <span>AES-256 Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: secure keystore & sandboxes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Secrets manager */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="text-orange-500 w-5 h-5" />
              Secure Credential Store
            </h2>
            <p className="text-xs text-gray-400">
              API keys and workspace passwords are fully encrypted on disk. These are securely injected during tool calls.
            </p>

            <div className="space-y-3 pt-2">
              {secrets.map((sec, idx) => (
                <div key={idx} className="bg-gray-950/80 border border-gray-850 rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-white block">{sec.name}</span>
                    <span className="text-xs font-mono text-gray-500 mt-1 block select-none">
                      {sec.hidden ? '••••••••••••••••••••••••••••••••••••' : sec.value}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleSecretVisibility(idx)}
                    className="text-gray-500 hover:text-white p-1.5 rounded hover:bg-gray-900 transition-all"
                  >
                    {sec.hidden ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Runtime Sandboxing parameters */}
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="text-orange-500 w-5 h-5" />
              Sandbox Container Safeguards
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Isolated Tool Execution', desc: 'Shell terminal scripts are run in sub-processes limited to the workspace path.', status: 'Active' },
                { title: 'Local File Boundaries', desc: 'Any read/write/delete query checks strict parent directory rules.', status: 'Active' },
                { title: 'Network Scoping', desc: 'Only specified provider domains can receive outgoing telemetry or HTTP fetch headers.', status: 'Active' },
                { title: 'Human Confirmation Prompt', desc: 'High-risk operations (terminal scripts) prompt for user authorization prior to run.', status: 'Active' }
              ].map((guard, idx) => (
                <div key={idx} className="bg-gray-950/60 border border-gray-850 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <h3 className="font-semibold text-white">{guard.title}</h3>
                    <span className="bg-green-500/10 text-green-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {guard.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{guard.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Devices & Tokens Audit list */}
        <div className="space-y-6">
          <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ClipboardList className="text-orange-500 w-5 h-5" />
              Secure Clients & Devices
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              These client computers are authorized with unique session authorization keys. Revoking immediately terminates WebSocket topics subscriptions.
            </p>

            <div className="space-y-3 pt-2">
              {pairedDevices.map((dev) => (
                <div key={dev.id} className="bg-gray-950/80 border border-gray-850 rounded-lg p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-white truncate max-w-[140px] block">{dev.name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        dev.status === 'paired' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        {dev.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 mt-1 block">Pairing Key: {dev.pairingCode}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-900 pt-2 text-[10px] text-gray-400 font-mono">
                    <span>Type: {dev.type}</span>
                    <button
                      onClick={() => deleteDevice(dev.id)}
                      className="text-red-500 hover:text-red-400 font-bold uppercase text-[9px]"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Security;