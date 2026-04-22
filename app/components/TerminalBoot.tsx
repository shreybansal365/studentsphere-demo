/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Terminal Boot Animation Sequence
 * Boot sequence concept & implementation: Shrey Bansal
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TerminalBoot: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  
  const bootMessages = [
    "INITIALIZING_CORE_SYSTEMS...",
    "ESTABLISHING_NEURAL_LINK...",
    "MOUNTING_ACADEMIC_DATA_CLUSTERS...",
    "BYPASSING_SLCM_FIREWALLS...",
    "SYNCING_SPHERICAL_DATABASE...",
    "INJECTING_UI_ENGINE...",
    "SYSTEM_READY_V1.1",
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootMessages.length) {
        setLogs((prev) => [...prev, bootMessages[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsVisible(false), 800);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 font-mono overflow-hidden"
        >
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0096FF]/5 to-transparent h-20 w-full animate-scan pointer-events-none" />
          
          <div className="max-w-md w-full">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 border-2 border-[#0096FF] flex items-center justify-center">
                <div className="w-5 h-5 bg-[#0096FF] animate-pulse" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">StudentSphere</h1>
            </div>

            <div className="space-y-2">
              {logs.map((log, i) => (
                <motion.p 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${i === bootMessages.length - 1 ? "text-[#0096FF]" : "text-gray-500"} text-xs lowercase tracking-wider`}
                >
                  <span className="mr-2 opacity-30">&gt;</span> {log}
                </motion.p>
              ))}
            </div>
            
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] text-white/20 uppercase tracking-[0.3em]">
              <p>BOOT_SEQ: {logs.length}/{bootMessages.length}</p>
              <p>LINK_BY_SB</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TerminalBoot;
