import React, { useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { Network, Plus, Play, Info, Eye, Download, Code, Sparkles, CheckCircle } from 'lucide-react';

interface VisualNode {
  id: string;
  type: 'start' | 'agent' | 'tool' | 'loop' | 'approval' | 'end';
  label: string;
  x: number;
  y: number;
}

export const WorkflowBuilder: React.FC = () => {
  const { workflows, v3WorkflowRuns, fetchWorkflows, fetchV3WorkflowRuns, triggerV3Workflow, addWorkflow } = useClawForgeStore();

  const [activeWorkflowId, setActiveWorkflowId] = useState('wf-daily-git');
  const [nodes, setNodes] = useState<VisualNode[]>([
    { id: 'n1', type: 'start', label: 'Trigger Event: Schedule (09:00 AM)', x: 50, y: 150 },
    { id: 'n2', type: 'agent', label: 'Strategic Planner Agent', x: 250, y: 150 },
    { id: 'n3', type: 'tool', label: 'Execute Tool: github.list_prs', x: 450, y: 150 },
    { id: 'n4', type: 'approval', label: 'Human Approval Check', x: 650, y: 150 },
    { id: 'n5', type: 'end', label: 'Complete Task Dispatch', x: 850, y: 150 }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const handleAddNode = (type: any, label: string) => {
    const id = 'n-' + Math.random().toString(36).substring(7);
    const lastNode = nodes[nodes.length - 1];
    setNodes([
      ...nodes,
      { id, type, label, x: lastNode ? lastNode.x + 180 : 100, y: 150 }
    ]);
  };

  const executeSimulation = async () => {
    setIsRunning(true);
    setCompletedSteps({});

    // Animate stepping through each node
    for (let i = 0; i < nodes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setCompletedSteps(prev => ({ ...prev, [nodes[i].id]: true }));
    }

    // Trigger backend run log entry
    if (activeWorkflowId) {
      await triggerV3Workflow(activeWorkflowId);
    }

    setIsRunning(false);
  };

  const activeWf = workflows.find(w => w.id === activeWorkflowId) || workflows[0];
  const activeRuns = v3WorkflowRuns.filter(r => r.workflowId === activeWorkflowId);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Visual Canvas SubHeader */}
      <div className="p-4 bg-gray-900/60 border-b border-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="text-orange-500 w-6 h-6 animate-pulse" />
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Visual Workflow Canvas
              <span className="text-[10px] bg-orange-600/15 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">
                V3 Active
              </span>
            </h1>
            <p className="text-xs text-gray-400">Drag, design, and replay autonomous node execution pipelines.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeWorkflowId}
            onChange={(e) => {
              setActiveWorkflowId(e.target.value);
              setCompletedSteps({});
            }}
            className="bg-gray-950 border border-gray-800 text-xs text-white rounded-lg p-2 focus:border-orange-500"
          >
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <button
            onClick={executeSimulation}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-orange-950/20"
          >
            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Executing Nodes...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Trigger Live Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Visual Board Canvas */}
        <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] overflow-x-auto overflow-y-hidden p-8 flex items-center">

          <div className="flex items-center gap-16 relative">
            {nodes.map((node, idx) => {
              const completed = completedSteps[node.id];
              return (
                <div key={node.id} className="relative flex items-center">
                  {/* Connection line helper */}
                  {idx > 0 && (
                    <div className="absolute -left-16 w-16 h-0.5 bg-gray-800 flex justify-center items-center">
                      <div className={`w-2.5 h-2.5 rounded-full border border-gray-900 transition-all ${completed ? 'bg-orange-500 animate-ping' : 'bg-gray-800'}`} />
                    </div>
                  )}

                  {/* Flow Card Node */}
                  <div className={`w-44 bg-gray-900/95 border rounded-xl p-3.5 shadow-xl transition-all select-none ${
                    completed ? 'border-orange-500 ring-2 ring-orange-600/25 scale-105' : 'border-gray-800'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        node.type === 'start' ? 'bg-green-500/10 text-green-400 border border-green-500/15' :
                        node.type === 'agent' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15' :
                        node.type === 'tool' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' :
                        node.type === 'approval' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/15' :
                        'bg-red-500/10 text-red-400 border border-red-500/15'
                      }`}>
                        {node.type}
                      </span>
                      {completed && <CheckCircle className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-xs text-white font-semibold leading-snug">{node.label}</p>
                    <div className="mt-2 text-[9px] text-gray-400 flex justify-between items-center font-mono">
                      <span>ID: {node.id}</span>
                      <span>PIN: OK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Node Catalog & Logs Drawer */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden">
          {/* Top Panel: Add Nodes */}
          <div className="p-4 border-b border-gray-800 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-orange-500" />
              Node Tool Catalog
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddNode('agent', 'Coding Agent')}
                className="text-left text-[11px] bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 p-2 rounded-lg flex flex-col"
              >
                <span className="font-semibold text-white">+ AI Agent</span>
                <span className="text-[9px] text-gray-500">Run code, writer, planner.</span>
              </button>
              <button
                onClick={() => handleAddNode('tool', 'terminal.execute')}
                className="text-left text-[11px] bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 p-2 rounded-lg flex flex-col"
              >
                <span className="font-semibold text-white">+ Execute Tool</span>
                <span className="text-[9px] text-gray-500">Read, write, shell, browser.</span>
              </button>
              <button
                onClick={() => handleAddNode('loop', 'For each loop')}
                className="text-left text-[11px] bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 p-2 rounded-lg flex flex-col"
              >
                <span className="font-semibold text-white">+ Loop Control</span>
                <span className="text-[9px] text-gray-500">Iterate workspace items.</span>
              </button>
              <button
                onClick={() => handleAddNode('approval', 'Human-in-the-loop')}
                className="text-left text-[11px] bg-gray-950 hover:bg-gray-800 text-gray-300 border border-gray-800 p-2 rounded-lg flex flex-col"
              >
                <span className="font-semibold text-white">+ Ask Approval</span>
                <span className="text-[9px] text-gray-500">Wait confirmation level.</span>
              </button>
            </div>
          </div>

          {/* Bottom Panel: Runs Execution history */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Execution Replays
              </h3>
              <span className="text-[10px] bg-gray-950 text-gray-400 px-2 py-0.5 rounded-full font-mono">
                {activeRuns.length} runs
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeRuns.map((run) => (
                <div key={run.id} className="bg-gray-950/60 border border-gray-850 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white font-mono">{run.id}</span>
                    <span className="text-[10px] font-mono text-gray-500">Duration: {run.durationMs}ms</span>
                  </div>

                  <div className="space-y-1">
                    {JSON.parse(run.logsJson || '[]').map((log: string, idx: number) => (
                      <div key={idx} className="text-[10px] text-gray-400 font-mono leading-relaxed truncate">
                        • {log}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] text-green-400 font-bold bg-green-500/10 border border-green-500/15 py-1 px-2 rounded w-fit">
                    <Sparkles className="w-3 h-3 text-green-400" />
                    <span>Success Exit</span>
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
export default WorkflowBuilder;