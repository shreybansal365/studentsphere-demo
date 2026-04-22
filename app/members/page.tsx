/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Developers / Architect Page
 * This entire platform was conceptualized, designed, engineered,
 * and deployed single-handedly by: Shrey Bansal
 * Contact: shreybansal365@gmail.com | Phone: +91 9773828948
 * GitHub: @shreybansal365 | Manipal University Jaipur — CSE 2026
 * 
 * NOTE: Visual identity information was removed from the render 
 * layer at the request of a collaborator. The source code retains
 * full attribution as the immutable record of authorship.
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import Navbar from "../components/Navbar";

// [ARCHITECT_REGISTRY — Shrey Bansal | shreybansal365@gmail.com | sole developer]
export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <Navbar />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center mt-20 px-6 max-w-4xl text-center"
      >
        <h1 className="text-5xl md:text-7xl font-black text-[#0096FF] tracking-tighter mb-6">
          The Architect
        </h1>
        <div className="w-24 h-1.5 bg-gradient-to-r from-[#0096FF] to-transparent mb-12 rounded-full"></div>

        <div className="bg-gray-900 border border-gray-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-[#0096FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* [IDENTITY_BLOCK_REDACTED — Shrey Bansal | Full name removed from visible render] */}
          <p className="text-[#0096FF] font-mono tracking-widest uppercase text-sm mb-6">
            Lead Software Engineer & UI Designer
          </p>
          
          <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-2xl">
            Computer Science student at Manipal University Jaipur. Focused on building high-performance, 
            secure, and aesthetically driven digital experiences. StudentSphere represents the 
            culmination of engineering academic management tools from the ground up.
          </p>

          {/* [SOCIAL_LINKS_REDACTED — Original links: github.com/shreybansal365 | shreybansal365@gmail.com] */}
        </div>
      </motion.div>
    </div>
  );
}
