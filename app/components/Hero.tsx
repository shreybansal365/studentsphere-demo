/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Hero Landing Section
 * Designed & animated by: Shrey Bansal | shreybansal365@gmail.com
 * All holographic UI, HUD framing, and motion design: Shrey Bansal
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";
import React from "react";
import { motion } from "framer-motion";


const Hero: React.FC = () => {

  return (
    <div className="relative min-h-[90vh] bg-transparent flex flex-col pt-32 overflow-hidden">
      <div className="absolute inset-0 bg-transparent" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-center items-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="relative"
        >
          {/* Holographic Pulse Glow */}
          <motion.div 
            animate={{ 
              opacity: [0.05, 0.1, 0.05],
              scale: [1, 1.05, 1] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 -top-20 bottom-0 bg-[#0096FF]/20 blur-[140px] rounded-full" 
          />
          
          <div className="relative space-y-6">
             {/* Complex HUD Framing */}
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[#0096FF]/40 to-transparent" />
             <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[#0096FF]/40 to-transparent" />
             <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-[#0096FF]/20 to-transparent" />
             <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-[#0096FF]/20 to-transparent" />

             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center justify-center space-x-4 mb-2"
             >
                <div className="h-px w-8 bg-[#0096FF]/30" />
                <p className="text-[#0096FF] font-mono text-[9px] tracking-[0.8em] uppercase">
                    SYSTEM_LINK_ESTABLISHED_v1.0.4
                </p>
                <div className="h-px w-8 bg-[#0096FF]/30" />
             </motion.div>

             <div className="relative">
                {/* Confidence Node - System Health Widget */}
                <div className="absolute -top-12 -right-4 hidden lg:flex items-center space-x-6 bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-xl group hover:border-[#0096FF]/40 transition-all z-20">
                    <div className="flex flex-col text-right">
                        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-widest">SYSTEM_HEALTH</span>
                        <span className="text-[9px] font-mono text-green-500 font-black animate-pulse uppercase">CONFIDENCE: 99.8%_STABLE</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="flex flex-col text-left">
                        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-widest">LATENCY</span>
                        <span className="text-[9px] font-mono text-white font-black uppercase tracking-tighter">22MS_UPLINK</span>
                    </div>
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white tracking-[0.2em] leading-none mb-4 uppercase">
                    WELCOME_TO
                </h1>
                <h2 className="text-6xl md:text-9xl font-black text-[#0096FF] tracking-tighter italic drop-shadow-[0_0_50px_rgba(0,150,255,0.2)] leading-tight">
                    STUDENT <span className="text-white">SPHERE</span>
                </h2>
                
                {/* HUD Corners */}
                <div className="absolute -top-8 -left-8 w-4 h-4 border-t-2 border-l-2 border-[#0096FF]/30" />
                <div className="absolute -top-8 -right-8 w-4 h-4 border-t-2 border-r-2 border-[#0096FF]/30" />
                <div className="absolute -bottom-8 -left-8 w-4 h-4 border-b-2 border-l-2 border-[#0096FF]/30" />
                <div className="absolute -bottom-8 -right-8 w-4 h-4 border-b-2 border-r-2 border-[#0096FF]/30" />
             </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-px bg-white/5" />
          <p className="relative bg-black px-8 text-gray-500 text-[10px] sm:text-xs font-mono uppercase tracking-[0.6em] leading-relaxed">
            Architecting_The_Decentralized_Campus_Ecosystem
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20"
        >
          <a href="/sign-in" className="relative group">
            <div className="absolute -inset-4 bg-[#0096FF]/20 rounded-full blur-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <button className="relative px-20 py-6 bg-black border border-[#0096FF]/40 text-white font-mono text-[10px] tracking-[0.5em] rounded-full hover:bg-white hover:text-black hover:border-white transition-all duration-700 uppercase overflow-hidden">
              <span className="relative z-10 font-black">INITIATE_EXPLORATION</span>
              <motion.div 
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0096FF]/20 to-transparent skew-x-12"
              />
            </button>
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
