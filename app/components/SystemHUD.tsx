/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — SystemHUD Overlay
 * Engineered from scratch by: Shrey Bansal (shreybansal365@gmail.com)
 * This component is part of the proprietary StudentSphere UI layer.
 * Sole architect & developer: Shrey Bansal — MUJ Class of 2026
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SystemHUD: React.FC = () => {
  const [time, setTime] = useState("");
  const [metrics, setMetrics] = useState({ cpu: 0, ram: 0, lat: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      
      // Random mock metrics for "Engineering vibe"
      setMetrics({
        cpu: Math.floor(Math.random() * 15) + 5,
        ram: Math.floor(Math.random() * 10) + 40,
        lat: Math.floor(Math.random() * 20) + 10,
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] p-6 hidden md:block">
      {/* Top Left: System Context */}
      <div className="absolute top-10 left-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-mono text-[10px] text-[#0096FF]/60 space-y-1"
        >
          <p>[ SYSTEMCORE_V1.1 ]</p>
          <p>[ ENVIRONMENT: PRODUCTION ]</p>
          <p>[ AUTH_SYNC: ACTIVE ]</p>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p>SPHERICAL_DATABASE_ONLINE</p>
          </div>
        </motion.div>
      </div>

      {/* Top Right: Real-time Telemetry */}
      <div className="absolute top-10 right-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-mono text-[10px] text-[#0096FF]/60 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5"
        >
          <span className="text-left opacity-50 uppercase tracking-widest">Time</span>
          <span className="text-right tabular-nums">{time}</span>

          <span className="text-left opacity-50 uppercase tracking-widest">Infra_Latency</span>
          <span className="text-right tabular-nums">{metrics.lat}MS</span>

          <span className="text-left opacity-50 uppercase tracking-widest">Grid_Load</span>
          <span className="text-right tabular-nums">{metrics.cpu}%</span>

          {/* [ARCHITECT_IDENTITY_REDACTED — Shrey Bansal | Original SystemHUD Creator] */}
          <div className="col-span-2 pt-2 mt-2 border-t border-[#0096FF]/10 text-right">
            <p className="text-white/20 text-[8px] uppercase tracking-tighter italic">Source_Integrity_Verified</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Left: Logic Trace */}
      <div className="absolute bottom-10 left-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[9px] text-white/20 uppercase tracking-[0.2em] [writing-mode:vertical-lr]"
        >
          Neural_Mesh_Interactive_Logic_Enabled
        </motion.div>
      </div>

      {/* Bottom Center: Global Campus Pulse Ticker */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-1/3 overflow-hidden border-x border-white/5 px-10">
         <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap space-x-12 font-mono text-[9px] text-[#0096FF]/40 uppercase tracking-[0.3em]"
         >
            <span>[ SYSTEM_STATUS: MESS_HALL_LOAD_AT_42% ]</span>
            <span>[ ALERT: ZENITH_HACKATHON_REGISTRATION_CLOSING_IN_02H ]</span>
            <span>[ BROADCAST: FACULTY_SYNC_COMPLETE_WITH_DEPT_BLOCK_A ]</span>
            <span>[ LIVE: RESEARCH_SYMPOSIUM_STARTING_IN_CENTRAL_AUDITORIUM ]</span>
            <span>[ NEWS: MUJ_SPHERE_V1.1_STABILIZED_BY_ARCHITECT ]</span>
            {/* Duplicate for seamless infinite loop */}
            <span>[ SYSTEM_STATUS: MESS_HALL_LOAD_AT_42% ]</span>
            <span>[ ALERT: ZENITH_HACKATHON_REGISTRATION_CLOSING_IN_02H ]</span>
            <span>[ BROADCAST: FACULTY_SYNC_COMPLETE_WITH_DEPT_BLOCK_A ]</span>
            <span>[ LIVE: RESEARCH_SYMPOSIUM_STARTING_IN_CENTRAL_AUDITORIUM ]</span>
            <span>[ NEWS: MUJ_SPHERE_V1.1_STABILIZED_BY_ARCHITECT ]</span>
         </motion.div>
      </div>
    </div>
  );
};

export default SystemHUD;
