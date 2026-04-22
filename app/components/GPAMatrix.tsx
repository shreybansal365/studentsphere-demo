/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — GPA Matrix (Academic Projection Simulator)
 * GPA calculation algorithm & gauge visualization: Shrey Bansal
 * Scenario simulation logic (base/optimistic/pessimistic): Shrey Bansal
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGraduationCap, FaCalculator, FaRocket, FaDice } from "react-icons/fa";

interface GPAMatrixProps {
  marks: any[];
}

const GPAMatrix: React.FC<GPAMatrixProps> = ({ marks }) => {
  const [estimatedGPA, setEstimatedGPA] = useState(0);
  const [scenario, setScenario] = useState<"current" | "optimistic" | "pessimistic">("current");

  const calculateGPA = (mode: string) => {
    if (!marks || marks.length === 0) return 0;
    
    // Simplified GPA logic for simulation
    // Grabbing unique subjects
    const subjects = Array.from(new Set(marks.map(m => m.subject)));
    let totalGradePoints = 0;

    subjects.forEach(sub => {
      const subMarks = marks.filter(m => m.subject === sub);
      const avgScore = subMarks.reduce((acc, m) => acc + (parseFloat(m.score) || 0), 0) / subMarks.length;
      
      let baseGPA = avgScore / 10; // Simple mapping
      if (mode === "optimistic") baseGPA += 0.5;
      if (mode === "pessimistic") baseGPA -= 0.5;
      
      totalGradePoints += Math.min(10, Math.max(0, baseGPA));
    });

    return (totalGradePoints / subjects.length).toFixed(2);
  };

  useEffect(() => {
    setEstimatedGPA(parseFloat(calculateGPA(scenario) as string));
  }, [marks, scenario]);

  return (
    <div className="glass-card p-10 rounded-[3rem] border-[#0096FF]/20 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0096FF]/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
            <div>
                <p className="text-[#0096FF] font-mono text-[10px] tracking-[0.4em] mb-2 uppercase">Core_Academic_Projection</p>
                <h3 className="text-4xl font-black text-white tracking-tighter italic">GPA <span className="text-[#0096FF] not-italic">MATRIX</span></h3>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <FaGraduationCap className="text-[#0096FF] text-3xl" />
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center">
            {/* GPA Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle 
                        cx="96" cy="96" r="80" 
                        stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" 
                    />
                    <motion.circle 
                        cx="96" cy="96" r="80" 
                        stroke="#0096FF" strokeWidth="12" fill="transparent" 
                        strokeDasharray={502.6}
                        initial={{ strokeDashoffset: 502.6 }}
                        animate={{ strokeDashoffset: 502.6 - (502.6 * (estimatedGPA / 10)) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white">{estimatedGPA}</span>
                    <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Estimated SGPA</span>
                </div>
            </div>

            {/* Sim Controls */}
            <div className="flex-1 space-y-6">
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                    This neural simulator uses your current marks to project your semester outcome. 
                    Switch scenarios to see how your future performance affects your rank.
                </p>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: "current", label: "BASE", icon: FaCalculator },
                        { id: "optimistic", label: "MAX", icon: FaRocket },
                        { id: "pessimistic", label: "FALL", icon: FaDice }
                    ].map((btn) => (
                        <button 
                            key={btn.id}
                            onClick={() => setScenario(btn.id as any)}
                            className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${scenario === btn.id ? "bg-[#0096FF] text-black shadow-[0_0_20px_rgba(0,150,255,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                        >
                            <btn.icon className="mb-2" />
                            <span className="text-[9px] font-black tracking-widest">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            <span>Projection Active: v1.1</span>
            <span className="italic">Authored_by_SB</span>
        </div>
      </div>
    </div>
  );
};

export default GPAMatrix;
