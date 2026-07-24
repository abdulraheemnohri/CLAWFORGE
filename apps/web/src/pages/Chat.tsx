import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Send, Bot, User, Mic, FileText, CheckCircle2 } from 'lucide-react';

export const Chat: React.FC = () => {
  const { messages, submitChat, voiceStatus, triggerVoice } = useClawForgeStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    submitChat(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950">
      {/* Top Conversation Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-600/10 text-orange-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-gray-200">Autonomous Assistant</h2>
            <p className="text-[10px] text-gray-500 font-medium">ClawForge AI v1 System Chat</p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex gap-4 max-w-3xl ${isAssistant ? '' : 'flex-row-reverse ml-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                isAssistant ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300'
              }`}>
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5 flex-1">
                <div className={`text-[10px] text-gray-500 font-medium ${isAssistant ? '' : 'text-right'}`}>
                  {isAssistant ? 'ClawForge Agent System' : 'AbdulRaheem'} • {m.timestamp}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                  isAssistant
                    ? 'bg-gray-900 border-gray-850 text-gray-200'
                    : 'bg-orange-600 text-white border-transparent'
                }`}>
                  {m.content}

                  {isAssistant && m.content.includes('Initialized') && (
                    <div className="mt-4 p-3 bg-gray-950/60 rounded-xl border border-gray-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Execution Live Summary</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-400 font-mono">
                        <div>● Running: filesystem.write &gt; src/App.tsx</div>
                        <div>✓ Complete: Analyzed goals and drafted plans</div>
                        <div>○ Next: terminal.run &gt; npm run test</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat input footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/20">
        <div className="flex items-center gap-2 max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 focus-within:border-orange-500/50">
          <button
            onClick={triggerVoice}
            title="Push to talk (Hey Claw)"
            className={`p-2 rounded-lg transition-all ${
              voiceStatus === 'listening'
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe any action or files to build..."
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 border-0 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
