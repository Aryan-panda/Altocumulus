"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Play, Square, Activity, Thermometer, Zap, Database, Download, Upload, TerminalSquare, FileText, Code2, FolderTree } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { cn } from "@/lib/utils";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("train.py");
  const [fileContent, setFileContent] = useState<string>("");
  const [stats, setStats] = useState({
    gpu_utilization: 0,
    vram_used_mb: 0,
    vram_total_mb: 24576,
    temperature_c: 0,
    power_w: 0
  });
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/workspaces/${workspaceId}`);
      if (res.ok) {
        setWorkspace(await res.json());
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
    }
  }, [workspaceId, router]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/workspaces/${workspaceId}/files`);
      if (res.ok) {
        setFiles(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
    fetchFiles();
  }, [fetchWorkspace, fetchFiles]);

  // Terminal and WebSocket init
  useEffect(() => {
    if (!terminalRef.current) return;
    
    // Initialize xterm
    const term = new Terminal({
      theme: {
        background: '#050505',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        selectionBackground: '#1e293b',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 12,
      cursorBlink: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    // Connect WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/workspaces/${workspaceId}?token=demo`);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('\x1b[38;2;59;130;246m[System] Connected to remote workspace terminal.\x1b[0m');
      // Request initial prompt setup if mock
      ws.send(JSON.stringify({ type: "terminal_input", workspace_id: workspaceId, data: "" }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "terminal_output") {
          term.write(data.data);
        } else if (data.type === "telemetry") {
          setStats(data.stats);
        } else if (data.type === "status") {
          setWorkspace((prev: any) => ({ ...prev, status: data.status }));
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.onclose = () => {
      term.writeln('\x1b[38;2;239;68;68m\r\n[System] Connection terminated.\x1b[0m');
      setWorkspace((prev: any) => ({ ...prev, status: "FAILED" }));
    };

    // Handle user typing
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "terminal_input",
          workspace_id: workspaceId,
          data: data
        }));
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [workspaceId]);

  if (!workspace) return <div className="min-h-screen bg-background text-primary flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col h-screen overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-14 border-b border-hairline bg-surface/30 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", workspace.status === 'RUNNING' ? 'bg-accent' : workspace.status === 'FAILED' ? 'bg-destructive' : 'bg-muted')} />
            <h1 className="font-mono text-sm tracking-widest uppercase">{workspace.runtime_profile}</h1>
          </div>
          <Badge variant={workspace.status === 'FAILED' ? 'destructive' : 'default'} className="text-[10px] uppercase font-mono px-2 py-0.5">
            {workspace.status}
          </Badge>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs text-muted">
          <span>RTX 4090</span>
          <span>₹42/hr</span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 hover:text-primary transition-colors text-accent">
              <Play className="w-3 h-3" /> Run
            </button>
            <button className="flex items-center gap-1 hover:text-primary transition-colors text-destructive">
              <Square className="w-3 h-3" /> Stop
            </button>
          </div>
        </div>
      </header>

      {/* Main Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Files */}
        <aside className="w-64 border-r border-hairline bg-surface/10 flex flex-col">
          <div className="p-3 border-b border-hairline flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted flex items-center gap-2">
              <FolderTree className="w-3 h-3" /> Files
            </span>
            <div className="flex gap-2">
              <button className="hover:text-primary text-muted transition-colors"><Upload className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-xs font-mono px-2 py-1.5 text-muted hover:bg-surface/30 cursor-pointer rounded flex items-center gap-2">
              📁 datasets/
            </div>
            <div className="text-xs font-mono px-2 py-1.5 text-muted hover:bg-surface/30 cursor-pointer rounded flex items-center gap-2">
              📁 outputs/
            </div>
            <div 
              className={cn("text-xs font-mono px-2 py-1.5 cursor-pointer rounded flex items-center gap-2", selectedFile === 'train.py' ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface/30')}
              onClick={() => setSelectedFile('train.py')}
            >
              📄 train.py
            </div>
            {files.map(f => (
              <div key={f.path} className="text-xs font-mono px-2 py-1.5 text-muted hover:bg-surface/30 cursor-pointer rounded flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span>📄</span> {f.path}
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity"><Download className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel: Editor */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="h-10 border-b border-hairline flex items-center px-4 bg-surface/5">
            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <Code2 className="w-3 h-3" />
              {selectedFile}
            </div>
          </div>
          <div className="flex-1 relative">
            {selectedFile === 'train.py' ? (
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={`import torch
import torch.nn as nn
import time

print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

print("\\nStarting training loop...")
for epoch in range(1, 11):
    print(f"Epoch {epoch}/10 [====================]")
    time.sleep(0.5)

print("\\nTraining complete. Model saved to outputs/model.pt")
`}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted font-mono text-sm">Select a file to edit</div>
            )}
          </div>
        </main>
      </div>

      {/* Telemetry Strip */}
      <div className="h-12 border-t border-b border-hairline bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-12 font-mono text-xs">
          <div className="flex items-center gap-3">
            <Activity className={cn("w-4 h-4", stats.gpu_utilization > 0 ? "text-accent" : "text-muted")} />
            <span className="text-muted uppercase tracking-wider">GPU</span>
            <span className={cn("font-medium", stats.gpu_utilization > 0 ? "text-primary" : "text-muted")}>{stats.gpu_utilization}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-muted" />
            <span className="text-muted uppercase tracking-wider">VRAM</span>
            <span className="font-medium text-primary">{(stats.vram_used_mb / 1024).toFixed(1)} / {(stats.vram_total_mb / 1024).toFixed(1)} GB</span>
          </div>
          <div className="flex items-center gap-3">
            <Thermometer className="w-4 h-4 text-muted" />
            <span className="text-muted uppercase tracking-wider">TEMP</span>
            <span className="font-medium text-primary">{stats.temperature_c}°C</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-muted" />
            <span className="text-muted uppercase tracking-wider">PWR</span>
            <span className="font-medium text-primary">{stats.power_w}W</span>
          </div>
        </div>
      </div>

      {/* Terminal Panel */}
      <div className="h-[300px] shrink-0 bg-[#050505] flex flex-col">
        <div ref={terminalRef} className="flex-1 w-full h-full p-2 overflow-hidden" />
      </div>

    </div>
  );
}
