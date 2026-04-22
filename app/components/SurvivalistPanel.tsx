/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Neural Academic Survivalist Panel
 * Attendance prediction algorithm & safety margin calc: Shrey Bansal
 * 3D tilt interaction & real-time data integration: Shrey Bansal
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaBrain, FaShieldAlt, FaChartLine } from "react-icons/fa";
import type { AttendanceInsight } from "@/lib/academic";

interface SurvivalistPanelProps {
  attendanceInsights?: AttendanceInsight[];
}

const SurvivalistPanel: React.FC<SurvivalistPanelProps> = ({ attendanceInsights }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Derive course data from live attendance insights
    const courses = (attendanceInsights && attendanceInsights.length > 0)
      ? attendanceInsights.slice(0, 5).map((insight) => {
          // Safety margin = percentage above 75% threshold, scaled to 0-100 range
          const marginAbove75 = Math.max(0, insight.percentage - 75);
          const margin = Math.min(100, Math.round((marginAbove75 / 25) * 100));
          return {
            code: insight.subject.length > 25 ? insight.subject.slice(0, 22) + "..." : insight.subject,
            margin,
            rawPercentage: insight.percentage,
            status: insight.status === "healthy" ? "OPTIMAL" : insight.status === "warning" ? "WARNING" : "CRITICAL",
            trend: insight.recentTrend === "up" ? "UP" : insight.recentTrend === "down" ? "DOWN" : "STABLE",
            safeMisses: insight.classesSafeToMiss,
          };
        })
      : [];

    const hasData = courses.length > 0;

    // Overall stability metric
    const overallStability = hasData
      ? Math.round(courses.reduce((acc, c) => acc + c.rawPercentage, 0) / courses.length)
      : 0;

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="group relative glass-card p-10 rounded-[3.5rem] border-white/5 bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,150,255,0.05)] overflow-hidden cursor-crosshair"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0096FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-[#0096FF]/10 rounded-2xl border border-[#0096FF]/30">
                            <FaBrain className="text-2xl text-[#0096FF]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-[#0096FF] tracking-[0.4em] uppercase">SYSTEM_INTELLIGENCE</p>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">NEURAL_ACADEMIC_SURVIVALIST</h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Prediction_Engine_v2.0</p>
                        <p className={`text-[10px] font-mono font-black animate-pulse ${hasData ? "text-green-500" : "text-gray-600"}`}>
                          {hasData ? "LIVE_DATA_ACTIVE" : "AWAITING_SYNC"}
                        </p>
                    </div>
                </div>

                {!hasData ? (
                  <div className="p-8 bg-black/40 border border-white/5 rounded-[2rem] text-center">
                    <p className="text-sm text-gray-500 font-mono">No attendance data synced yet. Use SYNC_SLCM_NODES to activate the survivalist engine.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course, idx) => (
                        <div key={idx} className="p-5 bg-black/40 border border-white/5 rounded-[2rem] flex items-center justify-between group-hover:border-[#0096FF]/20 transition-all">
                            <div className="flex items-center space-x-6 flex-1 min-w-0">
                                <div className="text-xs font-mono font-black text-gray-500 tracking-[0.2em] flex-shrink-0 w-[140px] truncate">{course.code}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">SAFETY_MARGIN</p>
                                    <div className="flex items-center space-x-3">
                                        <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${course.margin}%` }}
                                                transition={{ duration: 1.5, delay: idx * 0.15 }}
                                                className={`h-full ${course.margin > 70 ? 'bg-green-500' : course.margin > 30 ? 'bg-[#0096FF]' : 'bg-red-500'}`}
                                            />
                                        </div>
                                        <span className={`text-lg font-black italic tracking-tighter ${course.margin > 70 ? 'text-green-500' : course.margin > 30 ? 'text-[#0096FF]' : 'text-red-500'}`}>
                                          {course.rawPercentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center space-x-4 flex-shrink-0">
                                <div>
                                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">STATUS</p>
                                    <p className={`text-[10px] font-black tracking-widest ${course.status === "CRITICAL" ? "text-red-500 animate-pulse" : course.status === "WARNING" ? "text-amber-400" : "text-gray-400"}`}>
                                      {course.status}
                                    </p>
                                </div>
                                <FaChartLine className={`text-xl ${course.trend === 'UP' ? 'text-green-500 rotate-0' : course.trend === 'DOWN' ? 'text-red-500 rotate-180' : 'text-gray-500'} transition-transform duration-500`} />
                            </div>
                        </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <FaShieldAlt className="text-gray-600 text-lg" />
                        <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest max-w-[280px]">
                          {hasData
                            ? `Survivalist Engine reports ${overallStability}% average stability across ${courses.length} tracked subjects.`
                            : "Survivalist Engine awaiting data sync for stability analysis."}
                        </p>
                    </div>
                    <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black font-mono tracking-widest hover:bg-[#0096FF] hover:text-black transition-all">OPTIMIZE_GRID</button>
                </div>
            </div>
            
            {/* Scanned Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </motion.div>
    );
};

export default SurvivalistPanel;
