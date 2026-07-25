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
