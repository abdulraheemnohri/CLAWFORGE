import React, { useEffect } from 'react';
import { useClawForgeStore } from './stores/clawforge-store.js';
import { Sidebar } from './components/Sidebar.js';
import { ActivityCenter } from './components/ActivityCenter.js';

// Pages
import { Dashboard } from './pages/Dashboard.js';
import { Chat } from './pages/Chat.js';
import { Tasks } from './pages/Tasks.js';
import { Agents } from './pages/Agents.js';
import { Tools } from './pages/Tools.js';
import { Models } from './pages/Models.js';
import { Memory } from './pages/Memory.js';
import { Approvals } from './pages/Approvals.js';
import { Terminal } from './pages/Terminal.js';
import { Browser } from './pages/Browser.js';
import { Settings } from './pages/Settings.js';
import { Projects } from './pages/Projects.js';
import { Skills } from './pages/Skills.js';
import { MCP } from './pages/MCP.js';
import { Automation } from './pages/Automation.js';
import { Plugins } from './pages/Plugins.js';
import { Devices } from './pages/Devices.js';
import { Voice } from './pages/Voice.js';
import { Notifications } from './pages/Notifications.js';

export const App: React.FC = () => {
  const { activeTab, initialize } = useClawForgeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'projects':
        return <Projects />;
      case 'tasks':
        return <Tasks />;
      case 'agents':
        return <Agents />;
      case 'tools':
        return <Tools />;
      case 'models':
        return <Models />;
      case 'memory':
        return <Memory />;
      case 'approvals':
        return <Approvals />;
      case 'skills':
        return <Skills />;
      case 'mcp':
        return <MCP />;
      case 'automation':
        return <Automation />;
      case 'plugins':
        return <Plugins />;
      case 'devices':
        return <Devices />;
      case 'voice':
        return <Voice />;
      case 'notifications':
        return <Notifications />;
      case 'terminal':
        return <Terminal />;
      case 'browser':
        return <Browser />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col h-full bg-gray-950 overflow-hidden border-r border-gray-900">
        {renderActiveView()}
      </main>

      {/* 3. Right Activity Center Feed */}
      <ActivityCenter />
    </div>
  );
};
export default App;
