import { V3TraceEntry } from '@clawforge/shared-types';

export class ObservabilityCollector {
  private static traces: V3TraceEntry[] = [];

  static recordTrace(stepName: string, type: 'agent' | 'tool' | 'model', name: string, durationMs: number) {
    const entry: V3TraceEntry = {
      id: `tr-${Math.random().toString(36).substring(7)}`,
      stepName,
      entityType: type,
      entityName: name,
      durationMs
    };
    this.traces.push(entry);
    console.log(`[Observability] Trace registered: ${stepName} (${durationMs}ms)`);
  }

  static getTracesSummary(): V3TraceEntry[] {
    return this.traces;
  }
}
