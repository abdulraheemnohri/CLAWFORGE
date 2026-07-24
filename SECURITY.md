# ClawForge AI Security

## Key Security Pillars
- **Safe Execution Environment**: The AI model never directly runs shell or OS commands. Every call must pass through Zod schemas, risk classification, permission checks, and explicit user approvals (e.g. for `terminal.run` or file deletions).
- **Workspace Bounds**: File operations are restricted within the approved workspace path of active projects.
- **Local-first Authentication**: On first boot, the server generates a secure access token.
- **No Expose by Default**: The server only binds to `127.0.0.1` by default. LAN mode requires authentication.
