# Altocumulus Compute Platform

> **TL;DR:** Altocumulus is a decentralized compute infrastructure platform. We match user workloads against a global network of GPUs, acquire the optimal hardware via atomic scheduling, and instantly provision an isolated, interactive development environment directly in the browser. You don't just rent a GPU; you get a fully functional remote IDE with an integrated terminal, code editor, and live telemetry.

---

## 🌍 Overview (For Non-Technical Readers)

Historically, renting a remote GPU has been a fragmented, manual process: find a provider, SSH into an IP address, configure your environment, and hope it doesn't crash. 

**Altocumulus solves this.** 

We have built a professional-grade compute infrastructure platform that abstracts away the hardware completely. When you need compute power to train an AI model or run a heavy simulation, you simply state your requirements (e.g., "I need at least 24GB of VRAM for under $1/hr"). 

Our deterministic scheduler scans a global registry of GPUs and instantly locks in the best option. But we don't just hand you an IP address—we automatically spawn an **Interactive Workspace** directly in your browser. This workspace feels exactly like a local IDE (like VS Code), complete with a live terminal, file manager, and real-time GPU statistics (Utilization, VRAM, Temperature, and Power). 

You can write code, run commands, and train models entirely from the web, while the heavy lifting happens on a highly secure, isolated remote GPU.

---

## ⚙️ Architecture Deep Dive (For Technical Readers)

The Altocumulus platform operates on a robust, service-oriented architecture designed for scale, low latency, and strict security isolation. The core loop consists of: **Workload Submission → Deterministic Scheduling → Atomic Allocation → Workspace Provisioning → Remote Execution.**

### The 4 Core Pillars

1. **Frontend (Next.js & React):** 
   A high-performance, developer-focused dashboard. It integrates `@monaco-editor/react` for the code editing experience and `xterm.js` for true PTY terminal simulation. The UI relies heavily on WebSockets for sub-millisecond telemetry and stdout streaming.

2. **Backend Control Plane (FastAPI):** 
   The central nervous system. It exposes RESTful endpoints for state management (workspaces, jobs, file metadata) and WebSocket endpoints for multiplexing live I/O. Our routing logic strictly enforces ownership checks (`current_user.id == workspace.user_id`) to ensure absolute data isolation.

3. **Deterministic Scheduler (PostgreSQL):** 
   We map user constraints against a seeded database of `BenchmarkProfiles`. When a match is found, the system utilizes atomic row-level locks (`SELECT ... FOR UPDATE`) to guarantee that a GPU is successfully acquired (`AVAILABLE -> RESERVED`) without race conditions in a highly concurrent environment.

4. **Remote Host Agent (Python):** 
   A lightweight daemon running on the physical GPU nodes. It communicates exclusively outbound via WebSockets. We have dismantled the monolithic executor into clean, specialized services:
   - **`WorkspaceManager`**: Orchestrates the container lifecycle.
   - **`TerminalService`**: Manages real-time PTY I/O routing down to the container.
   - **`FileService`**: Enforces strict host-side filesystem isolation.
   - **`TelemetryProvider`**: Streams NVML hardware stats (or simulated stats in demo mode) back to the control plane.

### Security & Isolation Boundary
The platform treats the physical host machine as untrusted territory. The user's interaction is restricted entirely to the bounded `Workspace` container. The Host Agent actively strips host-level filesystem access, restricts arbitrary Docker image spawning, and limits network topography.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React, Tailwind CSS v4, Monaco Editor, xterm.js
- **Backend:** Python 3.11, FastAPI, Uvicorn, WebSockets
- **Database:** PostgreSQL (via SQLAlchemy ORM & Pydantic)
- **Agent:** Python `asyncio`, HTTPX

---

## 🚀 Local Development Guide

The infrastructure relies on Docker Compose to easily spin up the database and API.

### 1. Start the Core Infrastructure
```bash
docker compose -f infrastructure/docker-compose.yml up --build -d
```
*This starts PostgreSQL on port `5432` and FastAPI on `http://localhost:8000`.*

### 2. Run the Frontend App
```bash
cd apps/web
npm install
npm run dev
```
*The dashboard will be available at `http://localhost:3000`.*

### 3. Run the Host Agent (Demo Mode)
To simulate a connected GPU host without needing physical NVIDIA hardware:
```bash
cd agents/host-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
DEMO_MODE=true python3 agent.py
```

---

## 📂 Directory Structure

```text
cloud-platform/
├── apps/
│   └── web/                 # Next.js App Router (TypeScript, Tailwind, Monaco, xterm)
├── services/
│   └── api/                 # FastAPI Control Plane (Python, SQLAlchemy, WebSockets)
├── agents/
│   └── host-agent/          # Python-based remote daemon (WorkspaceManager, PTY, NVML)
├── packages/
│   └── shared-types/        # Shared domain models and configuration
└── infrastructure/
    └── docker-compose.yml   # Local development infrastructure setup
```
