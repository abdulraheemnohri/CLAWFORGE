import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Globe, ArrowRight, Camera, Monitor, Shield, StopCircle } from 'lucide-react';

export const Browser: React.FC = () => {
  const { browserUrl, browserText, browserNavigate } = useClawForgeStore();
  const [url, setUrl] = useState(browserUrl);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    browserNavigate(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Playwright Web Browser</h1>
          <p className="text-xs text-gray-500 mt-1">Control isolated web scraping sessions and monitor agent click actions.</p>
        </div>
        <button className="px-3 py-1.5 bg-red-600/10 hover:bg-red-650/20 text-red-400 text-xs font-semibold rounded flex items-center gap-1">
          <StopCircle className="w-3.5 h-3.5" />
          <span>Stop Automation</span>
        </button>
      </div>

      {/* Browser chrome casing */}
      <div className="flex-1 border border-gray-800 bg-gray-950 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* URL Bar area */}
        <form
          onSubmit={handleGo}
          className="bg-gray-900 border-b border-gray-850 p-3 flex items-center gap-3 shrink-0"
        >
          <div className="flex items-center gap-1.5 select-none shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>

          <div className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://news.ycombinator.com"
              className="bg-transparent border-0 outline-none text-xs text-gray-200 placeholder-gray-600 flex-1 font-mono"
            />
          </div>

          <button
            type="submit"
            className="p-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-lg transition-all shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Viewport Frame */}
        <div className="flex-1 bg-gray-900/40 p-6 flex flex-col items-center justify-center text-center relative overflow-y-auto">
          <div className="max-w-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-600/10 text-orange-400 flex items-center justify-center mx-auto shadow-md">
              <Monitor className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm text-gray-200">Active Viewport Monitor</h3>
              <p className="text-xs text-gray-500 font-mono break-all">{browserUrl}</p>
            </div>
            <div className="p-4 bg-gray-950 border border-gray-850 rounded-xl max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-400 font-sans leading-relaxed text-left">
                {browserText}
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 font-medium flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>Isolated Playwright Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
};
