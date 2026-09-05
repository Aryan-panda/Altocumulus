import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Server, Activity, Clock, IndianRupee } from "lucide-react";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";

async function getGpus() {
  try {
    const res = await fetch("http://localhost:8000/gpus", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function Dashboard() {
  const gpus = await getGpus();

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="bg-background/80 backdrop-blur-md border-b border-hairline h-16 flex items-center px-8 justify-between sticky top-0 z-50">
        <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary flex items-center gap-3">
          <div className="w-2 h-2 bg-primary animate-pulse" />
          Altocumulus
        </div>
        <nav className="flex gap-8 text-[11px] font-mono uppercase tracking-widest text-muted">
          <Link href="/dashboard" className="text-primary">Registry</Link>
          <Link href="/jobs" className="hover:text-primary transition-colors">Workloads</Link>
        </nav>
        <div className="text-[11px] font-mono tracking-widest uppercase text-muted">ID: CL-942X</div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 space-y-12 pt-12">
        
        {/* Top metrics and Flipping Board */}
        <div className="border-b border-hairline/50 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h1 className="text-4xl font-medium tracking-tight mb-2">Network Registry</h1>
            <p className="text-muted font-mono text-xs uppercase tracking-widest">Global Compute Availability & Telemetry</p>
          </div>
          <div className="hidden lg:block">
            <TextFlippingBoard text="SYS_STATUS: ONLINE\nGLOBAL NODES: 24\nROUTING: OPTIMAL" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
          <Card className="rounded-none border-none ring-1 ring-hairline">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Active Nodes</div>
                <Server className="w-4 h-4 text-muted" />
              </div>
              <div className="text-4xl font-light font-mono geist-mono text-primary">{gpus.length || 24}</div>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none ring-1 ring-hairline">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Running Jobs</div>
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <div className="text-4xl font-light font-mono geist-mono text-primary">7</div>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none ring-1 ring-hairline">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Total Compute (Hrs)</div>
                <Clock className="w-4 h-4 text-muted" />
              </div>
              <div className="text-4xl font-light font-mono geist-mono text-primary">128.4</div>
            </CardContent>
          </Card>
          <Card className="rounded-none border-none ring-1 ring-hairline bg-surface-elevated/30">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-mono tracking-widest uppercase text-muted">Current Spend</div>
                <IndianRupee className="w-4 h-4 text-muted" />
              </div>
              <div className="text-4xl font-light font-mono geist-mono text-primary">₹342</div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
          
          <div className="lg:col-span-2 ring-1 ring-hairline bg-surface/30 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-hairline/50">
              <h2 className="text-lg font-medium">Available Hardware</h2>
              <Link href="/jobs/new">
                <Button variant="primary" size="sm">Deploy Workload</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gpus.map((gpu: any) => (
                <div key={gpu.id} className="border border-hairline p-6 hover:border-muted transition-colors bg-background relative group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-mono geist-mono text-lg text-primary">{gpu.model}</h3>
                      <div className="text-muted text-[10px] uppercase tracking-widest font-mono mt-2">{gpu.vram_gb} GB VRAM</div>
                    </div>
                    <Badge variant="success">AVAILABLE</Badge>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted">Rate</span>
                      <span className="text-primary">₹{gpu.price_per_hour} / hr</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted">Location</span>
                      <span className="text-primary">ap-south-1</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted">Uptime</span>
                      <span className="text-primary">{(gpu.reliability * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <Link href={`/jobs/new?gpu=${gpu.id}`} className="block">
                    <Button variant="secondary" className="w-full text-[10px]">Initialize</Button>
                  </Link>
                </div>
              ))}
              {gpus.length === 0 && (
                <div className="col-span-2 p-12 text-center border border-hairline/50 border-dashed text-muted font-mono text-xs uppercase tracking-widest">
                  No compute nodes detected in network.
                </div>
              )}
            </div>
          </div>

          <div className="ring-1 ring-hairline bg-surface/30 p-8">
            <h2 className="text-lg font-medium mb-8 pb-4 border-b border-hairline/50">Active Processes</h2>
            <div className="flex flex-col items-center justify-center h-[300px] text-center border border-hairline/50 border-dashed">
              <Activity className="w-8 h-8 text-muted/30 mb-4" />
              <div className="text-muted text-[10px] font-mono tracking-widest uppercase mb-6">No workloads active</div>
              <Link href="/jobs/new">
                <Button variant="ghost" size="sm">Deploy Instance →</Button>
              </Link>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
