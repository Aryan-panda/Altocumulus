"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Activity, Thermometer, Zap, Database, TerminalSquare } from "lucide-react";

export default function JobPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  const [status, setStatus] = useState("SCHEDULING");
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    gpu_utilization: 0,
    vram_used_mb: 0,
    temperature_c: 0,
    power_w: 0
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!jobId) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/jobs/${jobId}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "log") {
          setLogs(prev => [...prev, data.message]);
        } else if (data.type === "status") {
          setStatus(data.status);
        } else if (data.type === "telemetry") {
          setStats(data.stats);
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => ws.close();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-8">
      {/* Structural grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="w-full max-w-[1400px] z-10 space-y-1">
        
        {/* Header Block */}
        <div className="bg-surface/30 backdrop-blur-md border border-hairline p-8 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-accent mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-accent animate-pulse" />
              Instance Active
            </div>
            <h1 className="text-3xl font-light tracking-tight text-primary mb-2">MNIST Training Sequence</h1>
            <div className="flex gap-8 text-xs font-mono text-muted">
              <span>TRX: {jobId}</span>
              <span>NODE: RTX 4090 / ap-south-1</span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-mono tracking-widest uppercase text-muted mb-2">System Status</div>
             <Badge variant={status === "COMPLETED" ? "success" : "default"} className="px-4 py-1.5 text-xs">
               {status}
             </Badge>
          </div>
        </div>

        {/* Telemetry Block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
          <div className="bg-surface/30 border border-hairline p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Core Load</div>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light font-mono text-primary">{stats.gpu_utilization}</span>
              <span className="text-muted font-mono text-xs">%</span>
            </div>
          </div>
          
          <div className="bg-surface/30 border border-hairline p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Memory Allocation</div>
              <Database className="w-4 h-4 text-muted" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light font-mono text-primary">{(stats.vram_used_mb / 1024).toFixed(1)}</span>
              <span className="text-muted font-mono text-xs">GB</span>
            </div>
          </div>

          <div className="bg-surface/30 border border-hairline p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Thermal State</div>
              <Thermometer className="w-4 h-4 text-muted" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light font-mono text-primary">{stats.temperature_c}</span>
              <span className="text-muted font-mono text-xs">°C</span>
            </div>
          </div>

          <div className="bg-surface/30 border border-hairline p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Power Draw</div>
              <Zap className="w-4 h-4 text-muted" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light font-mono text-primary">{stats.power_w}</span>
              <span className="text-muted font-mono text-xs">W</span>
            </div>
          </div>
        </div>

        {/* Live Terminal Output */}
        <div className="bg-[#050505] border border-hairline h-[500px] flex flex-col relative overflow-hidden">
          {/* Subtle glare line at top */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          
          <div className="p-4 border-b border-hairline flex justify-between items-center bg-surface/20">
            <div className="flex items-center gap-3 text-[10px] font-mono tracking-widest uppercase text-muted">
              <TerminalSquare className="w-4 h-4" />
              Standard Output
            </div>
            <div className="text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
              {status === 'RUNNING' ? (
                <><span className="w-1.5 h-1.5 bg-accent animate-pulse rounded-full" /> <span className="text-accent">Receiving Data</span></>
              ) : (
                <span className="text-muted">Connection Terminated</span>
              )}
            </div>
          </div>
          
          <div className="p-8 font-mono text-xs overflow-y-auto flex-1 space-y-3 leading-relaxed">
            {logs.length === 0 && (
              <div className="text-muted/50 animate-pulse">Awaiting standard output from container...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 group hover:bg-surface/30 p-1 -mx-1 rounded transition-colors">
                <span className="text-muted/30 select-none">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                <span className="text-accent select-none">›</span>
                <span className="text-primary/90">{log}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
