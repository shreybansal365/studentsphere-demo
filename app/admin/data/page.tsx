"use client";
import React from "react";
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaArrowLeft, FaDatabase, FaServer, FaCodeBranch, FaShieldAlt } from 'react-icons/fa';
import NeuralBackground from "../../components/NeuralBackground";

const MetricCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: any, colorClass: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
        }}
        className="group relative glass-card p-8 rounded-[3rem] flex items-center justify-between border-white/5 overflow-hidden cursor-pointer"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0096FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
            <h2 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.4em] mb-4">{title}</h2>
            <p className={`text-6xl font-black text-white ${colorClass} transition-colors tracking-tighter`}>{value}</p>
        </div>
        <div style={{ transform: "translateZ(80px)" }} className="opacity-10 group-hover:opacity-30 transition-opacity group-hover:scale-110 duration-700">
            <Icon size={100} className="text-gray-500 group-hover:text-white transition-colors" />
        </div>
    </motion.div>
  );
};

export default function DataDash() {
  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12 relative overflow-hidden">
      <NeuralBackground />
      
      <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
        <div className="w-full flex justify-start mb-10">
           <Link href="/admin" className="px-6 py-2 glass-card rounded-full text-xs font-mono text-gray-400 hover:text-[#0096FF] flex items-center transition group">
             <FaArrowLeft className="mr-3 group-hover:-translate-x-1 transition-transform"/> EXIT_TO_DASHBOARD
           </Link>
        </div>

        <div className="text-center mb-16 space-y-4">
            <p className="text-[#0096FF] font-mono tracking-[0.4em] text-xs">DATA_MANAGEMENT_CORE_V1.1</p>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(0,150,255,0.3)]">
                ORCHESTRATION <span className="text-[#0096FF] italic">HUB</span>
            </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            <MetricCard title="System_Logs" value="12,408" icon={FaServer} colorClass="group-hover:text-purple-500" />
            <MetricCard title="AI_Intelligence_Tokens" value="215K" icon={FaDatabase} colorClass="group-hover:text-green-500" />
            <MetricCard title="Database_Commits" value="4,031" icon={FaCodeBranch} colorClass="group-hover:text-[#0096FF]" />
            <MetricCard title="Security_Incidents" value="00" icon={FaShieldAlt} colorClass="group-hover:text-red-500" />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full glass-card p-10 rounded-[3rem] border-[#0096FF]/30 flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-[#0096FF]/5 to-transparent backdrop-blur-3xl"
        >
           <div className="mb-6 md:mb-0">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight italic">SYSTEM_STATUS: <span className="text-green-500">OPTIMAL</span></h2>
              <p className="text-gray-400 font-mono text-xs uppercase tracking-widest px-1">Global Database Nodes and AI Edge endpoints fully synchronized.</p>
           </div>
           <div className="flex items-center space-x-6">
               <div className="text-right hidden sm:block">
                   <p className="text-[10px] text-gray-500 font-mono">LATENCY: 12MS</p>
                   <p className="text-[10px] text-gray-500 font-mono">UPTIME: 99.98%</p>
               </div>
                <div className="bg-green-500/10 px-8 py-3 border border-green-500/50 rounded-full text-green-500 font-black tracking-[0.2em] shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                    ONLINE
                </div>
           </div>
        </motion.div>
      </div>
    </div>
  );
}
