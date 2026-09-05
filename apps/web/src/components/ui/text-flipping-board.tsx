"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const TextFlippingBoard = ({ text }: { text: string }) => {
  // Pad and split text into an array of characters
  const lines = text.split("\n").map(line => line.padEnd(20, " ").slice(0, 20));
  
  return (
    <div className="flex flex-col gap-1 bg-[#111] p-4 rounded border border-hairline/50 shadow-2xl">
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex gap-1">
          {line.split("").map((char, charIdx) => (
            <FlipChar key={`${lineIdx}-${charIdx}`} char={char} delay={charIdx * 0.05 + lineIdx * 0.2} />
          ))}
        </div>
      ))}
    </div>
  );
};

const FlipChar = ({ char, delay }: { char: string, delay: number }) => {
  const [displayChar, setDisplayChar] = useState(" ");
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (char === displayChar) return;
    
    setIsFlipping(true);
    const timeout = setTimeout(() => {
      setDisplayChar(char);
      setIsFlipping(false);
    }, delay * 1000 + 150); // Add a small offset to simulate mechanical flipping

    return () => clearTimeout(timeout);
  }, [char, delay, displayChar]);

  return (
    <div className="relative w-6 h-8 bg-surface-elevated rounded-[2px] border border-[#222] overflow-hidden flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
      {/* Split line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/60 z-10" />
      
      <AnimatePresence mode="popLayout">
        <motion.div
          key={displayChar}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center font-mono text-[16px] text-primary"
        >
          {displayChar}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
