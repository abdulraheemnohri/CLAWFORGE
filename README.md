# 🦅 ClawForge AI V3 — Personal AI Operating Platform

[![Status](https://img.shields.io/badge/Status-V3--Production--Ready-orange.svg?style=for-the-badge)](https://github.com/clawforge-ai/clawforge)
[![Platform](https://img.shields.io/badge/Platform-Self--Hosted-blue.svg?style=for-the-badge)](https://clawforge-ai.org)
[![Privacy](https://img.shields.io/badge/Privacy-Privacy--First-green.svg?style=for-the-badge)](https://clawforge-ai.org)

> "One Agent Runtime. Unlimited AI Providers. Infinite Possibilities."

ClawForge AI V3 is a production-grade, single-user **AI Agent Operating Platform** designed to act as your ultimate personal desktop or server companion. It is local-first, privacy-focused, provider-independent, and highly modular.

---

## 1. 📐 ARCHITECTURAL PRINCIPLE

```
                  ONE SERVER
                      +
              ONE AGENT RUNTIME
                      +
             UNLIMITED PROVIDERS
                      +
               UNLIMITED TOOLS
                      +
             UNLIMITED WORKFLOWS
                      +
             COMPLETE USER CONTROL
```

---

## 2. ⚡ V3 PLATFORM CAPABILITIES

*   **Specialty Agents Orchestrator**: Supports 60+ specialized AI agent personalities (Architect, Coding expert, QA tester, SEO copywriter, Static vulnerability scanner, CSV data analyst).
*   **Custom AI Providers Connector**: Seamlessly connect Local AI (Ollama, llama.cpp, LM Studio, vLLM) and Cloud AI (OpenAI, Anthropic, Gemini, DeepSeek, Vertex) with connection health checks.
*   **Visual Workflow Canvas**: Direct node-based drag-and-drop workflow designer (Start, AI Agent, Tool, Loop, Approval, End) with execution replay history.
*   **Modular RAG Knowledge System**: Upload PDF, DOCX, TXT, CSV, or Markdown sources. Automatic background parser, semantic chunker, and localized SQLite vector storage.
*   **Fine-Grained Policy Engine**: Enforce permission overrides (`Allow`, `Ask Approval`, `Deny`) per agent, tool, workflow, or project.
*   **Observability Telemetry Dashboard**: Track response latencies, token consumption, provider costs, and visualize plan execution traces waterfalls.
*   **Command Line Interface (CLI)**: Interactive node utility for pairing clients, query status, and run agent prompts.

---

## 3. 🖥️ MULTI-SYSTEM INSTALLATION MANUALS

### A. 🐧 Linux Production Setup (Ubuntu, Debian, Arch)

Linux is the native, high-performance host environment for ClawForge AI.

#### 1. System Requirements & Packages
Ensure Node.js v20+ and pnpm are installed:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y nodejs npm git python3 build-essential sqlite3

# Install pnpm globally
sudo npm install -g pnpm
```

#### 2. Install & Bootstrap
```bash
git clone https://github.com/clawforge-ai/clawforge.git
cd clawforge

# Install workspace dependencies
pnpm install

# Compile workspace typescript artifacts
pnpm build
```

#### 3. Systemd Service Deployment (Background Run)
Create a persistent system service so ClawForge runs continuously in the background:
```bash
sudo nano /etc/systemd/system/clawforge.service
```
Paste the following template (replace `/path/to/clawforge` with your actual checkout path):
```ini
[Unit]
Description=ClawForge AI V3 Server Runtime
After=network.target

[Service]
Type=simple
User=jules
WorkingDirectory=/path/to/clawforge
ExecStart=/usr/bin/pnpm --filter server start
Restart=on-failure
Environment=DATABASE_URL=./data/clawforge.db PORT=3777 HOST=127.0.0.1

[Install]
WantedBy=multi-user.target
```
Start and enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable clawforge.service
sudo systemctl start clawforge.service
```

#### 4. Nginx Reverse Proxy with SSL (Optional)
Configure Nginx to securely expose your ClawForge UI outside the local network:
```nginx
server {
    listen 443 ssl;
    server_name clawforge.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173; # Web Application UI
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3777; # Backend Server REST API
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3777/ws; # WebSocket gateway
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

### B. 🪟 Windows Native Setup (PowerShell)

#### 1. Pre-requisites
1. Install **Node.js (LTS v22)** from [nodejs.org](https://nodejs.org).
2. Install **Git** from [git-scm.com](https://git-scm.com).
3. Open **PowerShell (Administrator)** and install `pnpm`:
```powershell
npm install -g pnpm
```

#### 2. Execution Policy & Setup
Change your execution policy to allow script executions:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Clone and bootstrap:
```powershell
git clone https://github.com/clawforge-ai/clawforge.git
cd clawforge
pnpm install
pnpm build
```

#### 3. Start the Server & Web UI
You can run both concurrently via Turborepo:
```powershell
pnpm dev
```
Your backend will bind to `http://127.0.0.1:3777` and your Web UI will be active on `http://127.0.0.1:5173`.

---

### C. 📱 Termux (Android Mobile Setup)

Host ClawForge V3 on your Android smartphone! Perfect for pocket-sized local automation.

#### 1. Setup Environment
Open Termux and run:
```bash
pkg update && pkg upgrade -y
pkg install -y git nodejs python make clang sqlite termux-api

# Install pnpm globally inside Termux
npm install -g pnpm
```

#### 2. Install & Start
```bash
git clone https://github.com/clawforge-ai/clawforge.git
cd clawforge

pnpm install
pnpm build

# Start the environment
pnpm dev
```
Open your mobile browser and navigate to `http://127.0.0.1:5173` to control your local workflows.

---

### D. 🐳 Docker & Docker-Compose (Universal VPS)

We ship a production-grade multi-stage container build.

#### 1. Docker-Compose Blueprint
Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  clawforge-server:
    image: clawforge/server:latest
    container_name: clawforge-server
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3777:3777"
    volumes:
      - ./data:/app/apps/server/data
    environment:
      - DATABASE_URL=./data/clawforge.db
      - HOST=0.0.0.0
      - PORT=3777
    restart: always

  clawforge-web:
    image: clawforge/web:latest
    container_name: clawforge-web
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://127.0.0.1:3777/api
    restart: always
```
To spin up your production containers:
```bash
docker-compose up -d --build
```

---

## 4. 📟 COMMAND LINE INTERFACE (CLI) MANUAL

ClawForge V3 includes a fast Node-native CLI tool under `apps/cli/`.

### 1. Global Linkage
Inside `apps/cli/`, link the binary locally:
```bash
cd apps/cli
npm link
```

### 2. CLI Command Catalog
*   **Check Telemetry Status**:
    ```bash
    clawforge status
    ```
*   **Establish Client Pairing Secure Link**:
    ```bash
    clawforge pair "My Android Phone"
    ```
*   **List Specialized V3 Agents**:
    ```bash
    clawforge agent development
    clawforge agent research
    ```
*   **Submit Prompt Directly to Master Planning Orchestrator**:
    ```bash
    clawforge run "Scan workspace directory for static security secrets key leaks and report findings"
    ```

---

## 5. 🛠️ TROUBLESHOOTING & FAQ

#### Q. CORS Preflight Error on authorization token?
We solved this by injecting a global onRequest hook that intercepts `OPTIONS` browser preflights and serves `204 No Content` along with correct Access-Control headers. Make sure you set:
```bash
Authorization: Bearer clawforge-default-token-12345
```

#### Q. SQLite missing database tables?
During first initialization, ClawForge runs automatic ORM schema migrations mapping matching tables for skills, mcp, agents, workflows, metrics, etc. Ensure write permissions exist on the directory specified by `DATABASE_URL`.

#### Q. Binding strictly on localhost (127.0.0.1)?
Yes, to prevent unintended local network exposure, the development server binds strictly to `127.0.0.1` by default. To expose the server to your local network, modify the environment to `HOST=0.0.0.0`.
