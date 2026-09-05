"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const Keyboard = () => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setActiveKey(e.key.toLowerCase());
    const handleKeyUp = () => setActiveKey(null);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  return (
    <div className="w-full max-w-[500px] p-6 bg-surface/30 border border-hairline rounded-[4px] backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="text-[10px] font-mono tracking-widest uppercase text-muted mb-6 text-center">
        Interactive Terminal Input
      </div>

      <div className="w-full flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5 w-full">
            {row.map(key => {
              const isActive = activeKey === key;
              return (
                <motion.div 
                  key={key} 
                  animate={{ 
                    scale: isActive ? 0.9 : 1,
                    backgroundColor: isActive ? "#ffffff" : "#0a0a0a",
                    color: isActive ? "#000000" : "#888888",
                    borderColor: isActive ? "#ffffff" : "#1f1f1f"
                  }}
                  transition={{ duration: 0.1 }}
                  className="aspect-square flex-1 max-w-[40px] rounded-[2px] border flex items-center justify-center font-mono text-xs shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                >
                  {key.toUpperCase()}
                </motion.div>
              );
            })}
          </div>
        ))}
        <div className="flex justify-center mt-1 w-full">
          <motion.div 
            animate={{ 
              scale: activeKey === ' ' ? 0.95 : 1,
              backgroundColor: activeKey === ' ' ? "#ffffff" : "#0a0a0a",
              color: activeKey === ' ' ? "#000000" : "#888888",
              borderColor: activeKey === ' ' ? "#ffffff" : "#1f1f1f"
            }}
            transition={{ duration: 0.1 }}
            className="w-[60%] h-10 rounded-[2px] border flex items-center justify-center font-mono text-[10px] tracking-widest shadow-[0_2px_8px_rgba(0,0,0,0.5)] uppercase"
          >
            Space
          </motion.div>
        </div>
      </div>
    </div>
  );
};
