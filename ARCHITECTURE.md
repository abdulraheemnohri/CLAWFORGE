# ClawForge AI Architecture

## Overview
ClawForge AI v1 is a modular AI Agent platform consisting of:
1. **ClawForge Web** (React + TypeScript + Vite + Tailwind CSS)
2. **ClawForge Server** (Fastify + TypeScript + Drizzle ORM + SQLite + WebSockets)

## Core Components
- **AI Engine**: Provider abstractions supporting Ollama, OpenAI, and a Mock/Simulated provider.
- **Agent Runtime**: Coordinates planner and execution steps securely.
- **Tool Registry**: Manages safety checks and executions for filesystem, terminal, git, and browser tools.
- **Permission & Approval Engine**: Handles risk classifications and blocking actions requiring manual user intervention.
- **Memory Service**: SQLite-based memory system using SQLite FTS.
