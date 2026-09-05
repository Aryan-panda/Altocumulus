"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Activity, Terminal, Shield, Zap } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [jobId, setJobId] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For the simulation terminal
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const [req, setReq] = useState({
    workload_type: "mnist-cnn-v1",
    min_vram_gb: 8,
    max_price_per_hour: 50.0,
    min_cores: 4,
    min_ram_gb: 16
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStep(2); // Scheduling animation
    
    try {
      const res = await fetch("http://localhost:8000/jobs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "demo_user_id_which_we_would_get_from_auth",
          requirements: req
        })
      });
      
      const data = await res.json();
      
      setTimeout(() => {
        setJobId(data.job_id);
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendation(data.recommendations[0]);
        }
        setIsSubmitting(false); // Fix for the stuck button
        setStep(3);
      }, 2500);
      
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setStep(1);
    }
  };

  const handleRunNow = async () => {
    setIsSubmitting(true);
    setStep(4); // Move to deployment simulation
    
    // Simulate real-life initialization logs
    const logs = [
      "Securing TLS socket to node: ap-south-1...",
      "TLS socket secured. Establishing atomic DB lock...",
      "GPU acquired successfully. Target: " + recommendation.gpu_model,
      "Injecting scheduling payload and allocating VRAM...",
      "Spawning isolated Docker container environment...",
      "Establishing WebSocket telemetry stream...",
      "HANDSHAKE COMPLETE. REDIRECTING TO CONSOLE."
    ];
    
    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logs.length) {
        setSimLogs(prev => [...prev, logs[currentLog]]);
        currentLog++;
      }
      if (currentLog >= logs.length) {
        clearInterval(interval);
      }
    }, 600);

    try {
      const res = await fetch(`http://localhost:8000/jobs/${jobId}/start?gpu_id=${recommendation.gpu_id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Idempotency-Key": `idemp_${Date.now()}`
        }
      });
      
      if (res.ok) {
        // Also provision the Workspace
        const wsRes = await fetch("http://localhost:8000/workspaces/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            runtime_profile: req.workload_type
          })
        });
        
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setTimeout(() => {
            router.push(`/workspaces/${wsData.id}`);
          }, 4500); // Wait for the terminal animation to finish
        } else {
          alert("Failed to provision Workspace environment.");
          setIsSubmitting(false);
          setStep(1);
        }
      } else {
        alert("Failed to allocate GPU. NO_CAPACITY.");
        setIsSubmitting(false);
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-8">
      {/* Grid lines in background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="w-full max-w-[800px] z-10">
        
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light tracking-tight text-primary mb-2">Initialize Deployment</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Altocumulus Deterministic Scheduler V2</p>
        </div>
        
        {step === 1 && (
          <form onSubmit={handleSubmit}>
            <div className="bg-surface/50 border border-hairline p-10 relative overflow-hidden group backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              
              <div className="space-y-8">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-muted mb-4">
                    <Terminal className="w-3 h-3" /> Runtime Image
                  </label>
                  <select 
                    className="w-full h-12 bg-background border border-hairline/50 rounded-none px-4 font-mono text-sm text-primary focus:border-muted focus:outline-none focus:ring-1 focus:ring-muted transition-all appearance-none"
                    value={req.workload_type}
                    onChange={(e) => setReq({...req, workload_type: e.target.value})}
                  >
                    <option value="mnist-cnn-v1">registry.altocumulus.io/pytorch-mnist-demo:latest</option>
                    <option value="stable-diffusion-v1">registry.altocumulus.io/stable-diffusion-inf:latest</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-hairline/30">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-muted mb-4">
                      <Shield className="w-3 h-3" /> Minimum VRAM (GB)
                    </label>
                    <input 
                      type="number" 
                      className="w-full h-12 bg-background border border-hairline/50 rounded-none px-4 font-mono text-sm text-primary focus:border-muted focus:outline-none"
                      value={req.min_vram_gb}
                      onChange={(e) => setReq({...req, min_vram_gb: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-muted mb-4">
                      <Zap className="w-3 h-3" /> Max Rate (₹/HR)
                    </label>
                    <input 
                      type="number" 
                      className="w-full h-12 bg-background border border-hairline/50 rounded-none px-4 font-mono text-sm text-primary focus:border-muted focus:outline-none"
                      value={req.max_price_per_hour}
                      onChange={(e) => setReq({...req, max_price_per_hour: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <Button type="submit" className="w-full" size="lg" variant="primary">
                    Execute Scheduling Sequence
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="bg-surface/50 border border-hairline p-16 text-center backdrop-blur-xl relative overflow-hidden">
             {/* Scanning line animation */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/50 animate-[shimmer_2s_infinite]" />
             
             <Activity className="w-8 h-8 text-primary animate-pulse mx-auto mb-8" />
             <h2 className="text-sm font-mono tracking-widest uppercase text-primary mb-12">Resolving Network Constraints</h2>
             
             <div className="text-left max-w-[300px] mx-auto space-y-4 font-mono text-xs text-muted">
               <div className="flex justify-between items-center">
                 <span>Scanning global registry</span>
                 <span className="text-primary">[OK]</span>
               </div>
               <div className="flex justify-between items-center">
                 <span>Filtering VRAM constraints</span>
                 <span className="text-primary">[OK]</span>
               </div>
               <div className="flex justify-between items-center opacity-70 animate-pulse">
                 <span>Correlating benchmark matrices</span>
                 <span className="text-accent">[...]</span>
               </div>
             </div>
          </div>
        )}

        {step === 3 && recommendation && (
          <div className="bg-surface/50 border border-accent p-1 backdrop-blur-xl shadow-[0_0_30px_rgba(30,41,59,0.15)]">
            <div className="bg-background p-10">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-hairline/50">
                 <div className="text-[10px] font-mono tracking-widest uppercase text-accent flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                   Optimal Node Found
                 </div>
                 <div className="text-[10px] font-mono tracking-widest text-muted">ID: {jobId.split('-')[0]}</div>
               </div>
               
               <div className="flex justify-between items-end mb-12">
                 <div>
                   <h2 className="text-4xl font-light tracking-tight text-primary">{recommendation.gpu_model}</h2>
                   <div className="text-muted text-xs font-mono mt-2">{recommendation.reason}</div>
                 </div>
                 <div className="text-3xl font-light font-mono text-primary tracking-tighter">₹{recommendation.estimated_cost.toFixed(2)}</div>
               </div>
               
               <div className="grid grid-cols-2 gap-8 border-y border-hairline/30 py-8 mb-10 bg-surface/20">
                 <div className="text-center border-r border-hairline/30">
                   <div className="text-muted text-[10px] uppercase tracking-widest font-mono mb-2">Est. Runtime</div>
                   <div className="font-mono text-2xl text-primary">{Math.floor(recommendation.estimated_runtime_sec / 60)}m {recommendation.estimated_runtime_sec % 60}s</div>
                 </div>
                 <div className="text-center">
                   <div className="text-muted text-[10px] uppercase tracking-widest font-mono mb-2">Node Reliability</div>
                   <div className="font-mono text-2xl text-primary">{(recommendation.reliability * 100).toFixed(1)}%</div>
                 </div>
               </div>

               <div className="flex gap-4">
                 <Button variant="accent" size="lg" className="flex-1" onClick={handleRunNow}>
                   Allocate & Execute
                 </Button>
                 <Button variant="ghost" size="lg" onClick={() => { setStep(1); setIsSubmitting(false); }} className="px-8">ABORT</Button>
               </div>
            </div>
          </div>
        )}

        {step === 3 && !recommendation && (
          <div className="bg-surface/50 border border-destructive p-1 backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <div className="bg-background p-10 text-center">
              <Shield className="w-12 h-12 text-destructive mx-auto mb-6 opacity-80" />
              <h2 className="text-2xl font-light tracking-tight text-primary mb-2">Capacity Exhausted</h2>
              <p className="text-sm font-mono text-muted mb-8 max-w-md mx-auto">
                No GPUs matching your VRAM and pricing requirements are currently available on the network.
              </p>
              <Button variant="ghost" size="lg" onClick={() => { setStep(1); setIsSubmitting(false); }} className="px-8">
                Return to Scheduling
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-[#050505] border border-hairline p-8 flex flex-col relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="mb-6 border-b border-hairline/50 pb-4">
              <div className="text-[10px] font-mono tracking-widest uppercase text-accent flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-accent animate-pulse" />
                Initialization Sequence Active
              </div>
            </div>
            <div className="font-mono text-xs space-y-3">
              {simLogs.map((log, i) => (
                <div key={i} className="flex gap-3 text-muted">
                  <span className="text-accent">›</span>
                  <span className={i === simLogs.length - 1 && log?.includes('HANDSHAKE') ? 'text-primary animate-pulse' : ''}>{log}</span>
                </div>
              ))}
              <div className="w-2 h-4 bg-muted animate-pulse mt-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
