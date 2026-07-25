import React from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import {
  LayoutDashboard,
  MessageSquare,
  FolderGit2,
  CheckSquare,
  Bot,
  Wrench,
  Cpu,
  Brain,
  UserCheck,
  Terminal,
  Globe,
  Settings,
  CircleDot,
  Award,
  Server,
  ToyBrick,
  Shield,
  Mic,
  Bell,
  Workflow
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, approvals } = useClawForgeStore();
  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'memory', label: 'Memory', icon: Brain },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: UserCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined
    },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'mcp', label: 'MCP Connectors', icon: Server },
    { id: 'automation', label: 'Automation', icon: Workflow },
    { id: 'plugins', label: 'Plugins', icon: ToyBrick },
    { id: 'devices', label: 'Paired Devices', icon: Shield },
    { id: 'voice', label: 'Voice Assistant', icon: Mic },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'browser', label: 'Browser', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full select-none">
      {/* Header / Logo */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-lg">
            CF
          </div>
          <span className="font-semibold text-lg tracking-wider text-orange-500">
            CLAWFORGE AI
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">
          <CircleDot className="w-3 h-3 animate-pulse" />
          <span>Online</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-orange-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center animate-bounce">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Info */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex flex-col gap-1">
        <div className="flex justify-between">
          <span>Engine version</span>
          <span className="font-mono text-gray-400">v1.0.0</span>
        </div>
        <div className="flex justify-between">
          <span>Local session</span>
          <span className="font-mono text-gray-400">clawforge-cli</span>
        </div>
      </div>
    </aside>
  );
};
