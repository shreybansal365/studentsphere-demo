/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — SynapseMesh (Course Neural Network Visualizer)
 * Hex-grid layout algorithm & 3D tilt engine: Shrey Bansal
 * Data-driven node/edge rendering logic: Shrey Bansal
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaProjectDiagram, FaLink, FaCircleNotch, FaCompass } from "react-icons/fa";
import type { AttendanceInsight } from "@/lib/academic";

interface SynapseMeshProps {
  attendanceInsights?: AttendanceInsight[];
}

// Positions for up to 7 nodes arranged in a hex-like pattern
const nodePositions = [
  { x: "50%", y: "18%" },
  { x: "22%", y: "35%" },
  { x: "78%", y: "35%" },
  { x: "15%", y: "65%" },
  { x: "50%", y: "55%" },
  { x: "85%", y: "65%" },
  { x: "50%", y: "82%" },
];

// Connection pairs for the mesh lines
const connections = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 6], [5, 6],
];

const SynapseMesh: React.FC<SynapseMeshProps> = ({ attendanceInsights }) => {
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

    // Derive nodes from real attendance data
    const nodes = (attendanceInsights && attendanceInsights.length > 0)
      ? attendanceInsights.slice(0, 7).map((insight, i) => {
          const pos = nodePositions[i] || nodePositions[0];
          // Truncate long subject names for display
          const label = insight.subject.length > 18
            ? insight.subject.replace(/\s+/g, "_").slice(0, 15).toUpperCase() + "..."
            : insight.subject.replace(/\s+/g, "_").toUpperCase();
          return {
            id: i + 1,
            label,
            x: pos.x,
            y: pos.y,
            active: insight.status === "healthy",
            percentage: insight.percentage,
            status: insight.status,
          };
        })
      : [];

    const hasData = nodes.length > 0;
    const activeCount = nodes.filter(n => n.active).length;
    const validConnections = connections.filter(([a, b]) => a < nodes.length && b < nodes.length);

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="group relative glass-card p-10 rounded-[3.5rem] border-white/5 bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,150,255,0.05)] h-[500px] overflow-hidden cursor-move"
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0096FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div style={{ transform: "translateZ(60px)" }} className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-[#0096FF]/10 rounded-2xl border border-[#0096FF]/30">
                            <FaProjectDiagram className="text-2xl text-[#0096FF]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-[#0096FF] tracking-[0.4em] uppercase">MAPPING_ENGINE</p>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">COURSE_SYNAPSE_MESH</h2>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative border border-white/5 bg-black/40 rounded-[2.5rem] overflow-hidden">
                    {!hasData ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-sm text-gray-500 font-mono text-center px-8">
                          No course data synced yet. Sync your SLCM to populate the synapse mesh with your active courses.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* SVG Connections Overlay */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                            {validConnections.map(([a, b], i) => {
                              const nodeA = nodes[a];
                              const nodeB = nodes[b];
                              const isActive = nodeA.active && nodeB.active;
                              return (
                                <line
                                  key={i}
                                  x1={nodeA.x} y1={nodeA.y}
                                  x2={nodeB.x} y2={nodeB.y}
                                  stroke={isActive ? "#0096FF" : "#333"}
                                  strokeWidth="1"
                                  strokeDasharray={isActive ? "none" : "5,5"}
                                />
                              );
                            })}
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node) => (
                            <motion.div
                                key={node.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: node.id * 0.1, type: "spring" }}
                                className="absolute flex flex-col items-center"
                                style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full mb-2 transition-all ${
                                  node.active
                                    ? "bg-[#0096FF] shadow-[0_0_15px_#0096FF]"
                                    : node.status === "critical"
                                      ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"
                                      : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                }`} />
                                <span className="text-[8px] font-mono text-gray-400 tracking-widest uppercase bg-black/80 px-2 py-1 rounded-md border border-white/5 whitespace-nowrap">
                                  {node.label}
                                </span>
                                <span className={`text-[9px] font-mono font-black mt-1 ${
                                  node.active ? "text-[#0096FF]" : node.status === "critical" ? "text-red-400" : "text-amber-400"
                                }`}>
                                  {node.percentage}%
                                </span>
                            </motion.div>
                        ))}
                      </>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <FaCompass size={200} className="animate-[spin_60s_linear_infinite]" />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <FaLink className="text-[#0096FF] text-xs" />
                            <span className="text-[9px] font-mono text-[#0096FF] uppercase tracking-widest">
                              {hasData ? `ACTIVE_NODES: ${String(activeCount).padStart(2, "0")}` : "NODES: OFFLINE"}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <FaCircleNotch className={`text-xs ${hasData ? "text-green-500 animate-spin" : "text-gray-600"}`} />
                            <span className={`text-[9px] font-mono uppercase tracking-widest ${hasData ? "text-green-500" : "text-gray-600"}`}>
                              {hasData ? "LIVE_CURRICULUM_MAPPED" : "AWAITING_DATA..."}
                            </span>
                        </div>
                    </div>
                    <p className="text-[8px] font-mono text-gray-700 uppercase tracking-tighter italic">Synapse_Mesh_v2.0</p>
                </div>
            </div>
        </motion.div>
    );
};

export default SynapseMesh;
