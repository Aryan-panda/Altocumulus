import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Server, Activity, ArrowRight, Zap, Shield, Cpu } from "lucide-react";
import { CloudShader } from "@/components/ui/cloud-shader";
import { Keyboard } from "@/components/ui/keyboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      
      {/* Navigation */}
      <header className="px-8 h-20 flex items-center justify-between border-b border-hairline/50 relative z-20 bg-background/50 backdrop-blur-md">
        <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary flex items-center gap-3">
          <div className="w-3 h-3 bg-primary" />
          Altocumulus
        </div>
        <nav className="hidden md:flex gap-12 text-[11px] font-mono tracking-widest uppercase text-muted">
          <Link href="#" className="hover:text-primary transition-colors">Compute</Link>
          <Link href="#" className="hover:text-primary transition-colors">Network</Link>
          <Link href="#" className="hover:text-primary transition-colors">Documentation</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary">Launch Console</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Cinematic Hero */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 px-8 text-center border-b border-hairline/50 overflow-hidden">
          
          {/* Aceternity WebGL Cloud Shader Background (Dark Void Theme) */}
          <CloudShader 
            className="absolute inset-0 z-0 h-full w-full opacity-60" 
            cloudColor="#1e293b" // slate-800
            skyTopColor="#020617" // slate-950
            skyBottomColor="#0f172a" // slate-900
            speed={0.4}
            count={5}
          />
          
          <div className="relative z-10 max-w-[1000px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-hairline/50 bg-surface/30 backdrop-blur-sm text-[10px] font-mono text-muted tracking-widest uppercase mb-12">
              <span className="w-1.5 h-1.5 bg-accent animate-pulse rounded-full" />
              Network Active: 24 Nodes
            </div>
            
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-primary mb-8 leading-[0.9]">
              Decentralized<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-muted">Execution Engine.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted max-w-[600px] mx-auto mb-12 leading-relaxed font-light">
              Submit your AI and rendering workloads. We dynamically allocate them across a trustless GPU network based on deterministic benchmarks.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/jobs/new">
                <Button variant="accent" size="lg" className="w-full sm:w-auto px-12 group">
                  Deploy Workload 
                  <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 duration-300" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto px-12">
                  View Registry
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Architectural Bento Box Section */}
        <section className="max-w-[1400px] mx-auto px-8 py-32">
          
          <div className="mb-16">
            <h2 className="font-mono text-xs tracking-widest uppercase text-muted mb-4">Architecture</h2>
            <div className="text-3xl font-medium tracking-tight">Deterministic routing, isolated execution.</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            
            <div className="md:col-span-2 min-h-[450px] bg-surface/60 backdrop-blur-sm border border-hairline p-10 flex flex-col justify-between relative group hover:bg-surface transition-colors">
              <div className="absolute top-0 right-0 p-4 text-[10px] font-mono text-muted/30">01 / ALLOCATION</div>
              <Activity className="w-8 h-8 text-muted mb-8" />
              <div>
                <h3 className="text-xl font-medium mb-2">Deterministic Scheduler</h3>
                <p className="text-muted text-sm max-w-[400px]">Altocumulus matches your workload against real-time benchmark profiles, locking in the absolute optimal GPU for your constraints via atomic database transactions.</p>
              </div>
            </div>
            
            <div className="min-h-[450px] bg-surface/60 backdrop-blur-sm border border-hairline flex flex-col justify-between relative group hover:bg-surface transition-colors overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-[10px] font-mono text-muted/30 z-10">02 / COMPUTE</div>
              <div className="flex-1 w-full p-4 flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                 <Keyboard />
              </div>
              <div className="p-10 pt-0 relative z-10">
                <h3 className="text-xl font-medium mb-2">Heterogeneous Nodes</h3>
                <p className="text-muted text-sm">From RTX 4090s to massive H100 clusters, our host agent unifies hardware into a single pool.</p>
              </div>
            </div>
            
            <div className="min-h-[450px] bg-surface/60 backdrop-blur-sm border border-hairline p-10 flex flex-col justify-between relative group hover:bg-surface transition-colors">
              <div className="absolute top-0 right-0 p-4 text-[10px] font-mono text-muted/30">03 / TELEMETRY</div>
              <Zap className="w-8 h-8 text-muted mb-8" />
              <div>
                <h3 className="text-xl font-medium mb-2">Live NVML Streams</h3>
                <p className="text-muted text-sm">Monitor VRAM, power, and logs over high-frequency WebSockets.</p>
              </div>
            </div>

            <div className="md:col-span-2 min-h-[450px] bg-surface/60 backdrop-blur-sm border border-hairline p-10 flex flex-col justify-between relative group hover:bg-surface transition-colors">
              <div className="absolute top-0 right-0 p-4 text-[10px] font-mono text-muted/30">04 / EXECUTION</div>
              <Shield className="w-8 h-8 text-muted mb-8" />
              <div>
                <h3 className="text-xl font-medium mb-2">Isolated Workloads</h3>
                <p className="text-muted text-sm max-w-[400px]">Every job is bundled securely into an isolated Docker container on the host machine. No shared state, no cross-contamination. Absolute zero-trust.</p>
              </div>
            </div>
            
          </div>
        </section>
      </main>
      
      <footer className="border-t border-hairline/50 py-12 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted">
            Altocumulus © {new Date().getFullYear()}
          </div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted">
            Sys_Status: [ONLINE]
          </div>
        </div>
      </footer>
    </div>
  );
}
