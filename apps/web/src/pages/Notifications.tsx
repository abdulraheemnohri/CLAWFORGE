import React, { useState } from 'react';
import { Bell, ShieldAlert, Sparkles, Volume2, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Settings2 } from 'lucide-react';

export const Notifications: React.FC = () => {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'info'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [consentAlerts, setConsentAlerts] = useState(true);

  // Static populated seed logs
  const [notificationLogs, setNotificationLogs] = useState([
    { id: '1', title: 'Task Completed Successfully', desc: 'React setup and mobile UI audit completed for workspace ExpenseTracker.', time: '10:45 AM', priority: 'info', status: 'success' },
    { id: '2', title: 'High-Risk Consent Halting', desc: 'Agent requires interactive consent approval to execute console script: "pnpm dev".', time: '10:32 AM', priority: 'high', status: 'warning' },
    { id: '3', title: 'New Trust Pair Registered', desc: 'MacBook Pro CLI mutual authentication completed. Device ID: dev-macbook-cli.', time: '09:12 AM', priority: 'high', status: 'info' },
    { id: '4', title: 'Workflow Executed', desc: 'Trigger "Git commit" executed Daily GitHub Sync script.', time: '08:00 AM', priority: 'info', status: 'success' }
  ]);

  const handleClear = () => {
    setNotificationLogs([]);
  };

  const filteredLogs = notificationLogs.filter(log => {
    if (priorityFilter === 'all') return true;
    return log.priority === priorityFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500 animate-bounce" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" />
            Desktop Notifications & Alerts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure sound cues, notification priorities, and toast triggers for system-level background events.
          </p>
        </div>
        <div className="px-3 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-semibold">
          Native OS Hook Ready
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Notifications Audit Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4pb-2 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-100 text-sm">System Alerts Feed</span>
                <span className="text-[10px] bg-orange-600/10 text-orange-400 border border-orange-500/15 px-1.5 py-0.5 rounded font-mono">
                  {filteredLogs.length} Events
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded px-2.5 py-1 focus:outline-none"
                >
                  <option value="all">Show All Priorities</option>
                  <option value="high">High Risks / Alerts Only</option>
                  <option value="info">Info / Success Only</option>
                </select>

                <button
                  onClick={handleClear}
                  className="p-1 bg-gray-950 hover:bg-gray-800 border border-gray-800 text-red-400 hover:text-red-300 rounded transition-colors"
                  title="Clear Log Feed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic text-xs">
                  No active notifications logs. Enjoy the peace!
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start gap-3 hover:border-gray-700 transition-colors">
                    <div className="p-1.5 bg-gray-900 rounded border border-gray-800 mt-0.5 shrink-0">
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-gray-200 text-sm">{log.title}</span>
                        <span className="text-[10px] font-mono text-gray-500 shrink-0">{log.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{log.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Configurations */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-fit">
          <h2 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
            <Settings2 className="w-5 h-5 text-orange-500" />
            Alert Preferences
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Customise priority threshold configurations to prevent visual fatigue.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Sound Alerts Cues</span>
                  <span className="text-[10px] text-gray-500">Play ping sounds for tasks</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={() => setSoundEnabled(!soundEnabled)}
                className="accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Critical System Warnings</span>
                  <span className="text-[10px] text-gray-500">Always toast critical failures</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={systemAlerts}
                onChange={() => setSystemAlerts(!systemAlerts)}
                className="accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Interactive Approvals Prompt</span>
                  <span className="text-[10px] text-gray-500">Alert when action halts</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={consentAlerts}
                onChange={() => setConsentAlerts(!consentAlerts)}
                className="accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Notifications;