#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

const API_BASE = process.env.CLAWFORGE_API_URL || 'http://127.0.0.1:3777/api';
const AUTH_TOKEN = process.env.CLAWFORGE_TOKEN || 'clawforge-default-token-12345';

async function cliFetch(path: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

program
  .name('clawforge')
  .description('ClawForge AI V3 — Complete Command Line Interface Platform')
  .version('3.0.0');

// 1. Pair Device Command
program
  .command('pair')
  .description('Register and authorize a secure remote terminal client pairing token')
  .argument('<device-name>', 'Descriptive name for this cli device instance')
  .action(async (deviceName: string) => {
    try {
      console.log(`Connecting securely to ClawForge Server at ${API_BASE}...`);
      const dev = await cliFetch('/devices/pair', {
        method: 'POST',
        body: JSON.stringify({ name: deviceName, type: 'cli' })
      });
      console.log('\n======================================================');
      console.log('🎉 DEVICE AUTH PAIRING LINK ESTABLISHED');
      console.log('======================================================');
      console.log(`Device ID:    ${dev.id}`);
      console.log(`Device Name:  ${dev.name}`);
      console.log(`Pairing Code: ${dev.pairingCode}`);
      console.log(`Status:       ${dev.status.toUpperCase()}`);
      console.log('======================================================\n');
    } catch (err: any) {
      console.error(`Error establishing pairing link: ${err.message}`);
    }
  });

// 2. Status Telemetry Command
program
  .command('status')
  .description('Query active server telemetry, models usage, and metrics thresholds')
  .action(async () => {
    try {
      console.log('Querying server status...');
      const status = await cliFetch('/status');
      const metrics = await cliFetch('/v3/observability/metrics').catch(() => []);

      console.log('\n======================================================');
      console.log('🦅 CLAWFORGE OPERATING SYSTEM STATUS');
      console.log('======================================================');
      console.log(`Uptime:     ${Math.floor(status.uptime || 0)} seconds`);
      console.log(`Engine:     Online`);
      console.log(`Platform:   ${status.mode || 'Local-first'}`);
      console.log(`Version:    V${status.version || '3.0.0'}`);

      if (metrics.length > 0) {
        console.log('\nTelemetry Metrics:');
        for (const m of metrics) {
          console.log(`  - ${m.key.toUpperCase()}: ${m.value}`);
        }
      }
      console.log('======================================================\n');
    } catch (err: any) {
      console.error(`Error retrieving status: ${err.message}`);
    }
  });

// 3. Run Prompt Command
program
  .command('run')
  .description('Submit an autonomous command request directly to the master orchestrator')
  .argument('<prompt>', 'Natural language task prompt')
  .option('-p, --project <id>', 'Specific project workspace ID')
  .action(async (prompt: string, options: { project?: string }) => {
    try {
      let projectId = options.project;
      if (!projectId) {
        const projs = await cliFetch('/projects');
        if (projs.length === 0) {
          throw new Error('No projects found. Create a project workspace first.');
        }
        projectId = projs[0].id;
      }

      console.log(`Initializing V3 planning runtime for project ${projectId}...`);

      // Load/Create a workspace conversation
      const convs = await cliFetch('/conversations');
      let activeConv = convs.find((c: any) => c.projectId === projectId);
      if (!activeConv) {
        activeConv = await cliFetch('/conversations', {
          method: 'POST',
          body: JSON.stringify({ projectId, title: 'CLI Conversation' })
        });
      }

      console.log('Prompt submitted to Master Agent. Planning tasks...');
      const chatRes = await cliFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          conversationId: activeConv.id,
          message: prompt
        })
      });

      console.log('\n======================================================');
      console.log('🤖 AGENT STREAM INITIATED');
      console.log('======================================================');
      console.log(`Task ID:    ${chatRes.taskId}`);
      console.log(`Details:    ${chatRes.content}`);
      console.log('======================================================\n');
      console.log('Run "clawforge status" or open visual dashboard to observe active tool traces.');
    } catch (err: any) {
      console.error(`Error executing agent prompt: ${err.message}`);
    }
  });

// 4. List Agents Command
program
  .command('agent')
  .description('Display templates, roles, and status of specialized AI agents')
  .argument('[category]', 'Filter specialized agents category (e.g. development, research, creative)')
  .action(async (category: string | undefined) => {
    try {
      console.log('Querying specialized agents list...');
      const agents = await cliFetch('/v3/agents');

      const filtered = category
        ? agents.filter((a: any) => a.type.toLowerCase() === category.toLowerCase())
        : agents;

      console.log('\n======================================================');
      console.log(`🤖 CLAWFORGE SPECIALIZED AGENTS (${filtered.length})`);
      console.log('======================================================');

      for (const a of filtered) {
        console.log(`• ${a.name} [${a.type.toUpperCase()}]`);
        console.log(`  Role:        ${a.role}`);
        console.log(`  Description: ${a.description}`);
        console.log(`  Status:      ${a.enabled ? 'ACTIVE' : 'PAUSED'}`);
        console.log('  --------------------------------------------------');
      }
      console.log('======================================================\n');
    } catch (err: any) {
      console.error(`Error querying specialized agents: ${err.message}`);
    }
  });

program.parse(process.argv);
