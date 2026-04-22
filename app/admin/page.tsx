/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Faculty Admin Dashboard (System Command)
 * Full-stack architecture & implementation: Shrey Bansal
 * Every module, card, animation, and API route: Shrey Bansal
 * Contact: shreybansal365@gmail.com | GitHub: @shreybansal365
 * Manipal University Jaipur — B.Tech CSE 2026
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";
import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaComments,
  FaDatabase,
  FaGraduationCap,
  FaTasks,
  FaUpload,
  FaCogs,
} from "react-icons/fa";
import NeuralBackground from "../components/NeuralBackground";
import SystemHUD from "../components/SystemHUD";

interface FacultyProfile {
  name?: string;
}

interface DashboardModule {
  name: string;
  path: string;
  description: string;
  status: "Ready" | "In Progress";
  accent: string;
  badgeClass: string;
  icon: React.ReactNode;
}

const dashboardModules: DashboardModule[] = [
  {
    name: "Mark Attendance",
    path: "/admin/attendance",
    description: "Magic Filter roster, subject intelligence, and one-click actions.",
    status: "Ready",
    accent: "text-cyan-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <FaChalkboardTeacher />,
  },
  {
    name: "Manage Timetable",
    path: "/admin/timetable",
    description: "Upload and maintain faculty-side class schedules.",
    status: "In Progress",
    accent: "text-sky-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: <FaCalendarAlt />,
  },
  {
    name: "Assignments",
    path: "/admin/assignments",
    description: "Create, edit, filter, and retire academic assignments.",
    status: "Ready",
    accent: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <FaTasks />,
  },
  {
    name: "Upload Marks",
    path: "/admin/marks",
    description: "Validate full grading sheets and review summaries.",
    status: "Ready",
    accent: "text-amber-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <FaUpload />,
  },
  {
    name: "Data Management",
    path: "/admin/data",
    description: "Manage academic orchestration and chatbot workflows.",
    status: "Ready",
    accent: "text-rose-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <FaDatabase />,
  },
  {
    name: "Discussion Forum",
    path: "/admin/forum",
    description: "Coordinate academic communication and forum support.",
    status: "In Progress",
    accent: "text-violet-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: <FaComments />,
  },
];

const ModuleCard = ({ module }: { module: DashboardModule }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set( (e.clientX - rect.left) / rect.width - 0.5);
    y.set( (e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link href={module.path}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full rounded-[2.5rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl transition-all hover:border-[#0096FF]/40 overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0096FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-start justify-between gap-4">
          <div style={{ transform: "translateZ(60px)" }} className={`text-4xl p-5 rounded-[1.5rem] bg-black/40 border border-white/10 group-hover:border-[#0096FF]/30 transition-all ${module.accent}`}>
            {module.icon}
          </div>
          <motion.span style={{ transform: "translateZ(40px)" }} className={`rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${module.badgeClass}`}>
            {module.status}
          </motion.span>
        </div>

        <div style={{ transform: "translateZ(80px)" }}>
            <h3 className="mt-8 text-2xl font-black text-white italic tracking-tighter group-hover:text-[#0096FF] transition-colors">{module.name}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-500 font-medium">{module.description}</p>
        </div>

        <div className="mt-8 inline-flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-widest text-[#0096FF]/60 group-hover:text-white transition-colors">
          Initialize_Protocol
          <FaCogs className="group-hover:rotate-180 transition-transform duration-1000" />
        </div>
      </motion.div>
    </Link>
  );
};

const Page: React.FC = () => {
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setFacultyProfile(userDoc.data() as FacultyProfile);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  if (loading) return <div className="min-h-screen bg-black flex justify-center items-center font-mono text-xs tracking-widest text-[#0096FF] animate-pulse">SYNCHRONIZING_DASHBOARD...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12 relative overflow-hidden">
      <NeuralBackground />
      <SystemHUD />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="mb-12 rounded-[3.5rem] border border-white/5 bg-white/5 p-12 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,150,255,0.05)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-4 inline-flex items-center rounded-full border border-[#0096FF]/30 bg-[#0096FF]/10 px-6 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-[#0096FF]">
                FACULTY_ORCHESTRATION_LEVEL
              </p>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic">
                SYSTEM <span className="text-[#0096FF]">COMMAND</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base text-gray-500 font-medium leading-relaxed">
                Welcome, {facultyProfile?.name || "Architect"}. Core faculty protocols are online. 
                Execute attendance filters, assignment orchestration, and mark validation through the neural grid below.
              </p>
            </div>

            <div className="flex space-x-6">
                <div className="text-right">
                    <p className="text-[10px] font-mono text-gray-600 mb-1 uppercase tracking-widest">Global_Status</p>
                    <div className="flex items-center text-green-500 font-mono text-xs font-black tracking-widest bg-green-500/10 px-6 py-2 border border-green-500/30 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3 animate-pulse" />
                        OPERATIONAL
                    </div>
                </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {dashboardModules.map((module) => (
            <ModuleCard key={module.name} module={module} />
          ))}
        </motion.div>

        <div className="mt-20 flex justify-center opacity-30">
            {/* [ARCHITECT_TAG_REMOVED_FROM_RENDER — Shrey Bansal | SystemCORE sole builder] */}
        </div>
      </div>
    </div>
  );
};

export default Page;
