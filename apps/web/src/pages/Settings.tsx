import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Save, Shield, Sliders, HardDrive, Cpu, Terminal } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useClawForgeStore();

  const [form, setForm] = useState({
    theme: settings?.theme || 'dark',
    maxIterations: settings?.maxIterations || 20,
    timeout: settings?.timeout || 300,
    defaultWorkspace: settings?.defaultWorkspace || './workspace',
    policy: settings?.policy || 'interactive'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    alert('Settings successfully synced with ClawForge local storage.');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 font-sans">Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Configure workspace rules, default safety policies, and local runtime constraints.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agent Limits */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-500" />
            <span>Agent Parameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Max Iterations</label>
              <input
                type="number"
                value={form.maxIterations}
                onChange={(e) => setForm({ ...form, maxIterations: Number(e.target.value) })}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Max Execution Timeout (seconds)</label>
              <input
                type="number"
                value={form.timeout}
                onChange={(e) => setForm({ ...form, timeout: Number(e.target.value) })}
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Workspace Rules */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-500" />
            <span>Workspace Boundaries</span>
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Default Workspace Storage Directory</label>
            <input
              type="text"
              value={form.defaultWorkspace}
              onChange={(e) => setForm({ ...form, defaultWorkspace: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-orange-500 font-mono"
            />
          </div>
        </div>

        {/* Security Policy */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Default Approval Rules</span>
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Approval policy</label>
            <select
              value={form.policy}
              onChange={(e) => setForm({ ...form, policy: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-gray-200 outline-none focus:border-orange-500"
            >
              <option value="interactive">Interactive: prompt for medium/high risk commands</option>
              <option value="strict">Strict: require manual prompt approval for ALL tools</option>
              <option value="relaxed">Relaxed: allow all local filesystem reads/writes</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-orange-655 bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
