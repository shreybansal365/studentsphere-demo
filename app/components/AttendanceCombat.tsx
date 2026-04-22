/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — AttendanceCombat Strategist Module
 * Algorithm Design & UI Implementation: Shrey Bansal
 * Mathematical model for attendance prediction: Shrey Bansal
 * Contact: shreybansal365@gmail.com | GitHub: @shreybansal365
 * Unauthorized use or redistribution without attribution is prohibited.
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaSkullCrossbones, FaCrosshairs, FaCheckCircle } from "react-icons/fa";

interface AttendanceCombatProps {
  currentAttendance: number;
  totalClasses: number;
  attendedClasses: number;
}

const AttendanceCombat: React.FC<AttendanceCombatProps> = ({ 
  currentAttendance, 
  totalClasses, 
  attendedClasses 
}) => {
  const [safeMisses, setSafeMisses] = useState(0);
  const [neededToHit80, setNeededToHit80] = useState(0);

  useEffect(() => {
    // Calculate Safe Misses (to stay >= 75%)
    // (attended) / (total + x) >= 0.75
    // attended >= 0.75 * total + 0.75 * x
    // attended - 0.75 * total >= 0.75 * x
    // (attended - 0.75 * total) / 0.75 >= x
    const x = Math.floor((attendedClasses - 0.75 * totalClasses) / 0.75);
    setSafeMisses(Math.max(0, x));

    // Calculate Needed to hit 80%
    // (attended + y) / (total + y) >= 0.80
    // attended + y >= 0.8 * total + 0.8 * y
    // y - 0.8 * y >= 0.8 * total - attended
    // 0.2 * y >= 0.8 * total - attended
    // y >= (0.8 * total - attended) / 0.2
    const y = Math.ceil((0.8 * totalClasses - attendedClasses) / 0.2);
    setNeededToHit80(Math.max(0, y));
  }, [attendedClasses, totalClasses]);

  return (
    <div className="glass-card p-8 rounded-[2.5rem] border-[#0096FF]/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <FaCrosshairs size={100} className="text-[#0096FF]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
            <p className="text-[#0096FF] font-mono text-[10px] tracking-[0.3em]">ATTENDANCE_COMBAT_MODULE_V1.1</p>
            <div className="h-px flex-1 bg-white/10" />
        </div>

        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8">
            SURVIVAL <span className="text-[#0096FF] not-italic">STRATEGIST</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Safe Misses Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group/item hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <FaShieldAlt className="text-green-500 text-xl" />
                <span className="text-[10px] font-mono text-gray-400 italic font-bold">MODE: DEFENSIVE</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{safeMisses}</p>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Classes you can safely miss</p>
            <div className={`mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden`}>
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, (safeMisses / 5) * 100)}%` }}
                   className="h-full bg-green-500"
                />
            </div>
          </div>

          {/* Needed to Hit 80% Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group/item hover:border-[#0096FF]/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <FaCheckCircle className="text-[#0096FF] text-xl" />
                <span className="text-[10px] font-mono text-gray-400 italic font-bold">MODE: AGGRESSIVE</span>
            </div>
            <p className="text-4xl font-black text-white mb-1">{neededToHit80}</p>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Attends needed for 80% rank</p>
            <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(100, (1 - (neededToHit80 / 10)) * 100)}%` }}
                   className="h-full bg-[#0096FF]"
                />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <FaSkullCrossbones className="text-red-500/50" />
              <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest italic">Critical Threshold: 75%</p>
           </div>
           {/* [STRATEGIST_SIGNATURE_STRIPPED — Module by Shrey Bansal] */}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCombat;
