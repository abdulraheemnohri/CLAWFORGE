import React, { useEffect, useState } from 'react';
import { useClawForgeStore } from '../stores/clawforge-store.js';
import { BarChart3, TrendingUp, Sparkles, Clock, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const Observability: React.FC = () => {
  const { v3Metrics, v3Traces, fetchV3Observability } = useClawForgeStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchV3Observability();
  }, [fetchV3Observability]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchV3Observability();
    setRefreshing(false);
  };

  const getMetricValue = (key: string, defaultVal: string) => {
    const item = v3Metrics.find(m => m.key === key);
    return item ? item.value : defaultVal;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-orange-500 w-7 h-7" />
            Advanced Observability Platform
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time status metrics, cost trackers, latency histograms, and plan execution trace waterfalls.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-gray-900/40 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-all"
        >
          {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
            <span>LLM Response Latency</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-white">{getMetricValue('response_time', '380.5')}</span>
            <span className="text-xs text-gray-400">ms</span>
          </div>
          <p className="text-[10px] text-green-400 font-semibold">↓ 12% vs last hour</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
            <span>Provider Costs (USD)</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-white">${getMetricValue('provider_cost', '0.14')}</span>
            <span className="text-xs text-gray-400">total</span>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold">Avg: $0.003 / call</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
            <span>Success Ratio</span>
            <Sparkles className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-white">{getMetricValue('success_rate', '98.5')}%</span>
          </div>
          <p className="text-[10px] text-green-400 font-semibold">124 successful executions</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
            <span>Token Aggregator</span>
            <Layers className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-2xl font-bold text-white">{parseInt(getMetricValue('token_usage', '14520')).toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold">In: 8.5K | Out: 6K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trace Waterfall Diagram */}
        <div className="lg:col-span-2 bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers className="text-orange-500 w-5 h-5" />
            Execution Trace Waterfall
          </h2>

          <div className="space-y-4">
            {v3Traces.map((trace) => {
              // Calculate custom graph widths for visual layout representation
              const barWidth = Math.min(100, (trace.durationMs / 300) * 100);
              return (
                <div key={trace.id} className="bg-gray-950/80 border border-gray-850 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold bg-orange-600/15 text-orange-400 border border-orange-500/15">
                        {trace.stepName}
                      </span>
                      <h3 className="font-semibold text-white text-sm mt-1">{trace.entityName}</h3>
                    </div>
                    <span className="text-xs font-mono font-medium text-gray-400">{trace.durationMs} ms</span>
                  </div>

                  {/* Horizontal bar visualization */}
                  <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {/* IO Logs info */}
                  <div className="grid grid-cols-2 gap-4 text-[11px] font-mono bg-gray-900/40 p-2 rounded border border-gray-850">
                    <div className="truncate text-gray-400">
                      <span className="text-orange-500 font-bold">IN:</span> {trace.input || 'No input parameter'}
                    </div>
                    <div className="truncate text-gray-300">
                      <span className="text-green-500 font-bold">OUT:</span> {trace.output || 'No output parameter'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Mini Histograms & Quick diagnostics */}
        <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-1.5">
            <AlertCircle className="text-orange-500 w-5 h-5" />
            Latency Spectrum
          </h2>

          {/* Analytical Mock Chart */}
          <div className="space-y-3 pt-2">
            {[
              { label: 'Planner Router', val: 240, max: 300, color: 'bg-orange-600' },
              { label: 'Filesystem MCP', val: 120, max: 300, color: 'bg-indigo-600' },
              { label: 'Browser Sandbox', val: 280, max: 300, color: 'bg-orange-500' },
              { label: 'Security Static Scanner', val: 40, max: 300, color: 'bg-green-600' },
              { label: 'Statistical CSV Analyst', val: 180, max: 300, color: 'bg-orange-600' }
            ].map((bar, idx) => {
              const pct = (bar.val / bar.max) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-300">{bar.label}</span>
                    <span className="text-gray-500 font-mono">{bar.val}ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-900 pt-4 text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-white">Aggregator Summary:</span> Continuous system monitoring telemetry aggregates data streams over TLS/WebSockets directly to disk.
          </div>
        </div>
      </div>
    </div>
  );
};
export default Observability;