"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const lines = [
  "SYSTEM_INITIALIZING...",
  "ESTABLISHING_ENCRYPTED_TUNNEL...",
  "AUTHENTICATING_BIO_SIGNATURE...",
  "SYNCING_NEURAL_NODES...",
  "PARSING_SLCM_DATABANK...",
  "OPTIMIZING_RENDER_PIPELINE...",
  "CONNECTION_STABLE.",
  "WELCOME_ARCHITECT."
];

const DiagnosticOnboarding: React.FC = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("system_onboarded");
    if (!hasSeen) {
      setIsVisible(true);
      localStorage.setItem("system_onboarded", "true");
    }
  }, []);

  useEffect(() => {
    if (isVisible && currentLine < lines.length) {
      const timer = setTimeout(() => {
        setCurrentLine(prev => prev + 1);
      }, 400 + Math.random() * 400);
      return () => clearTimeout(timer);
    } else if (currentLine === lines.length) {
      setTimeout(() => setIsVisible(false), 1000);
    }
  }, [isVisible, currentLine]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-10 font-mono"
        >
          <div className="max-w-md w-full">
             <div className="space-y-2">
                {lines.slice(0, currentLine + 1).map((line, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-[10px] tracking-widest ${i === lines.length - 1 ? "text-[#0096FF] font-black scale-110 mt-4" : "text-green-500/70"}`}
                  >
                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {line}
                  </motion.div>
                ))}
                {currentLine < lines.length && (
                  <motion.div 
                    animate={{ opacity: [0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-2 h-4 bg-green-500 inline-block"
                  />
                )}
             </div>
             
             {/* Background Matrix-like glow */}
             <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,150,255,0.05)_0%,transparent_100%)]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiagnosticOnboarding;
