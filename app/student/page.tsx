"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from '@/lib/firebase';
import { motion } from "framer-motion";
import { FaCalendarAlt, FaRobot, FaTasks, FaGraduationCap, FaChartLine, FaBell, FaComments, FaSyncAlt, FaClock, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import AttendanceCombat from "../components/AttendanceCombat";
import GPAMatrix from "../components/GPAMatrix";
import SurvivalistPanel from "../components/SurvivalistPanel";
import SynapseMesh from "../components/SynapseMesh";
import DiagnosticOnboarding from "../components/DiagnosticOnboarding";
import { fetchStudentAcademicBundle } from "@/lib/student-data";
import { buildAttendanceInsights, buildLiveReminders, type AttendanceInsight, type ReminderItem, type TimetableSlot } from "@/lib/academic";

const Page: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({ attended: 0, total: 0 });
  const [marks, setMarks] = useState<any[]>([]);
  const [attendanceInsights, setAttendanceInsights] = useState<AttendanceInsight[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // SLCM Vault States
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [slcmPassword, setSlcmPassword] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser(userData);
        
        // Process intelligence for the Dashboard
        const bundle = await fetchStudentAcademicBundle(uid);
        if (bundle) {
          const insights = buildAttendanceInsights(bundle.slcmAttendance, bundle.attendanceRecords);
          const total = insights.reduce((acc, ins) => acc + ins.totalClasses, 0);
          const attended = insights.reduce((acc, ins) => acc + ins.attendedClasses, 0);
          setAttendanceStats({ attended, total });
          setMarks(bundle.marks);
          setAttendanceInsights(insights);
          setTimetableSlots(bundle.timetableSlots);
          setAssignments(bundle.assignments);

          // Build live reminders
          const liveReminders = buildLiveReminders({
            attendanceInsights: insights,
            assignments: bundle.assignments,
            marks: bundle.marks,
            timetableSlots: bundle.timetableSlots,
          });
          setReminders(liveReminders);
        }
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchUserData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleSyncSLCM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.username || !slcmPassword) return;
    setIsSyncing(true);
    setSyncStatus("Waking up invisible browser...");

    try {
      const res = await fetch("/api/slcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slcmId: user.username, password: slcmPassword }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setSyncStatus("Error: " + (data.error || "Invalid Credentials or MUJ SLCM is down."));
        setIsSyncing(false);
        return;
      }
      
      setSyncStatus("Data extracted! Securely saving to your profile...");
      
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const { setDoc } = await import("firebase/firestore");
      await setDoc(userRef, {
            slcmScrapeTime: new Date().toISOString(),
            slcmTimetableHTML: data.timetableData,
            slcmAttendanceHTML: data.attendanceData
      }, { merge: true });
      
      setSyncStatus("Successfully Synced! Refreshing intelligence...");
      setTimeout(() => window.location.reload(), 1500);
      setIsSyncing(false);
    } catch (err) {
      setSyncStatus("Critical Failure: API Pipeline broke.");
      setIsSyncing(false);
    }
  };

  // Compute today's classes
  const now = new Date();
  const todayDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todaysClasses = timetableSlots
    .filter(s => s.day === todayDayIndex)
    .sort((a, b) => a.start.localeCompare(b.start));

  // Find next class today
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nextClass = todaysClasses.find(c => c.start > currentTime);

  // Find next upcoming assignment deadline
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAssignments = assignments
    .filter(a => {
      if (!a.deadline) return false;
      const d = new Date(`${a.deadline}T00:00:00`);
      return d >= today;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // Overall attendance
  const overallAttendance = attendanceStats.total > 0
    ? ((attendanceStats.attended / attendanceStats.total) * 100).toFixed(1)
    : "0.0";

  const dashboardModules = [
    { name: "Attendance", path: "/student/attendance", icon: <FaChartLine />, color: "text-purple-500", desc: "Live Analytics" },
    { name: "Timetable", path: "/student/timetable", icon: <FaCalendarAlt />, color: "text-blue-500", desc: "Logic Schedules" },
    { name: "Assignments", path: "/student/assignments", icon: <FaTasks />, color: "text-green-500", desc: "Task Management" },
    { name: "Academic Hub", path: "/student/marks", icon: <FaGraduationCap />, color: "text-yellow-500", desc: "Performance Meta" },
    { name: "Neural Hub", path: "/student/forum", icon: <FaComments />, color: "text-[#0096FF]", desc: "Collaborative Feed" },
    { name: "SphereAI", path: "/student/chatbot", icon: <FaRobot />, color: "text-cyan-500", desc: "Intelligence Core" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white space-y-4">
        <div className="w-12 h-12 border-t-2 border-[#0096FF] rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-widest text-[#0096FF] animate-pulse">INITIATING_DASHBOARD_PROTOCOL...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-6 sm:px-12 relative overflow-hidden">
      <DiagnosticOnboarding />
      
      <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
        
        {/* User Session Identity Node */}
        <motion.div 
          className="w-full text-left mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-10"
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[#0096FF] font-mono text-[9px] tracking-[0.6em] uppercase">SYSTEM_LINK: ACTIVE_SESSION</p>
            </div>
            <div className="relative group">
                <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#0096FF] to-transparent opacity-40" />
                <div className="flex items-baseline space-x-6">
                    <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">[ SESSION_ID: 0x{user?.rollNo?.slice(-3) || "848"} ]</p>
                    <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none flex items-center">
                        <span className="text-gray-500 opacity-20 mr-4 font-mono text-2xl group-hover:opacity-100 transition-opacity">&gt;</span>
                        ACCESS_GRANTED: <span className="text-[#0096FF] italic ml-4">{user?.name?.toUpperCase() || "STUDENT_CADET"}</span>
                    </h1>
                </div>
            </div>
          </div>
          <div className="mt-10 md:mt-0 flex flex-col items-end space-y-4">
             <div className="flex space-x-6 mb-2">
                 <div className="text-right">
                    <p className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">ENCRYPTION</p>
                    <p className="text-[10px] font-mono text-green-500 font-black">RSA_4096_ON</p>
                 </div>
                 <div className="text-right border-l border-white/10 pl-6">
                    <p className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">NETWORK</p>
                    <p className="text-[10px] font-mono text-white font-black italic underline decoration-[#0096FF]">MUJ_GRID</p>
                 </div>
             </div>
             <button onClick={() => setShowSyncModal(true)} className="px-10 py-4 glass-card rounded-full font-black text-[10px] tracking-[0.4em] hover:bg-[#0096FF] hover:text-black transition-all flex items-center group uppercase overflow-hidden relative">
                <span className="relative z-10 flex items-center">
                    <FaSyncAlt className="mr-3 group-hover:rotate-180 transition-transform duration-700" /> SYNC_SLCM_NODES
                </span>
                <motion.div 
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                />
             </button>
          </div>
        </motion.div>

        {/* Quick Stats Bar */}
        <motion.div
          className="w-full mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Next Class */}
          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4 hover:border-[#0096FF]/30 transition-all">
            <div className="p-3 bg-[#0096FF]/10 rounded-xl">
              <FaClock className="text-[#0096FF] text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">NEXT_CLASS</p>
              {nextClass ? (
                <>
                  <p className="text-sm font-black text-white truncate">{nextClass.title}</p>
                  <p className="text-xs text-gray-400">{nextClass.start} • {nextClass.room}</p>
                </>
              ) : (
                <p className="text-sm font-bold text-gray-500">{todaysClasses.length > 0 ? "All done for today" : "No classes today"}</p>
              )}
            </div>
          </div>

          {/* Upcoming Deadline */}
          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4 hover:border-amber-500/30 transition-all">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <FaTasks className="text-amber-400 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">NEXT_DEADLINE</p>
              {upcomingAssignments[0] ? (
                <>
                  <p className="text-sm font-black text-white truncate">{upcomingAssignments[0].title}</p>
                  <p className="text-xs text-gray-400">{upcomingAssignments[0].deadline} • {upcomingAssignments[0].subject}</p>
                </>
              ) : (
                <p className="text-sm font-bold text-gray-500">No upcoming deadlines</p>
              )}
            </div>
          </div>

          {/* Overall Attendance */}
          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4 hover:border-green-500/30 transition-all">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <FaChartLine className="text-green-400 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">OVERALL_ATTENDANCE</p>
              <p className={`text-2xl font-black ${parseFloat(overallAttendance) >= 75 ? "text-green-400" : parseFloat(overallAttendance) >= 70 ? "text-amber-400" : "text-red-400"}`}>
                {overallAttendance}%
              </p>
              <p className="text-xs text-gray-400">{attendanceStats.attended}/{attendanceStats.total} classes</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Schedule */}
        {todaysClasses.length > 0 && (
          <motion.div
            className="w-full mb-8 glass-card p-6 rounded-[2rem] hover:border-[#0096FF]/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaCalendarAlt className="text-[#0096FF]" />
                <p className="text-[10px] font-mono text-[#0096FF] tracking-[0.3em] uppercase">TODAY&apos;S_SCHEDULE</p>
              </div>
              <Link href="/student/timetable" className="text-[10px] font-mono text-gray-500 hover:text-[#0096FF] flex items-center transition">
                VIEW_FULL <FaArrowRight className="ml-1 text-[8px]" />
              </Link>
            </div>
            <div className="flex overflow-x-auto space-x-3 pb-2">
              {todaysClasses.map((cls, i) => {
                const isPast = cls.end < currentTime;
                const isCurrent = cls.start <= currentTime && cls.end >= currentTime;
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 px-5 py-3 rounded-xl border text-sm transition-all ${
                      isCurrent
                        ? "bg-[#0096FF]/15 border-[#0096FF]/40 text-white shadow-[0_0_15px_rgba(0,150,255,0.2)]"
                        : isPast
                          ? "bg-white/3 border-white/5 text-gray-500"
                          : "bg-white/5 border-white/10 text-gray-300"
                    }`}
                  >
                    <p className="font-black text-xs">{cls.start} - {cls.end}</p>
                    <p className={`font-bold mt-1 ${isCurrent ? "text-[#0096FF]" : ""}`}>{cls.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{cls.room}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Live Reminders Strip */}
        {reminders.length > 0 && (
          <motion.div
            className="w-full mb-8 glass-card p-5 rounded-[2rem] border-l-4 border-l-amber-500/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <FaExclamationTriangle className="text-amber-400" />
                <p className="text-[10px] font-mono text-amber-400 tracking-[0.3em] uppercase">LIVE_REMINDERS ({reminders.length})</p>
              </div>
              <Link href="/student/reminders" className="text-[10px] font-mono text-gray-500 hover:text-amber-400 flex items-center transition">
                VIEW_ALL <FaArrowRight className="ml-1 text-[8px]" />
              </Link>
            </div>
            <div className="space-y-2">
              {reminders.slice(0, 3).map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-start space-x-3 px-4 py-2 rounded-xl text-sm ${
                    reminder.severity === "high" ? "bg-red-500/10 text-red-300" :
                    reminder.severity === "medium" ? "bg-amber-500/10 text-amber-300" :
                    "bg-green-500/10 text-green-300"
                  }`}
                >
                  <FaBell className="text-xs mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold">{reminder.title}</span>
                    <span className="text-gray-400 ml-2 text-xs">{reminder.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Intelligence Grid: Combat Strategist & GPA Matrix */}
        <div className="w-full mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceCombat currentAttendance={0} totalClasses={attendanceStats.total} attendedClasses={attendanceStats.attended} />
            <GPAMatrix marks={marks} />
        </div>

        {/* Neural Analysis Deck: Survivalist & Synapse Mesh */}
        <div className="w-full mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurvivalistPanel attendanceInsights={attendanceInsights} />
            <SynapseMesh attendanceInsights={attendanceInsights} />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
          {dashboardModules.map((mod, index) => (
            <Link href={mod.path} key={index}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 rounded-[2rem] h-full flex flex-col items-center text-center hover:border-[#0096FF]/50 hover:shadow-[0_0_20px_rgba(0,150,255,0.1)] transition-all cursor-pointer group"
              >
                <div className={`mb-4 text-2xl ${mod.color} group-hover:scale-110 transition-transform duration-300`}>
                  {mod.icon}
                </div>
                <h3 className="text-sm font-bold mb-1 tracking-tight text-white/90">{mod.name}</h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{mod.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
        {/* SLCM Sync Card Trigger */}
        <motion.div 
          className="mt-12 w-full max-w-3xl bg-gray-900 border border-blue-900 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_20px_rgba(0,150,255,0.1)] relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
           <div className="mb-4 md:mb-0">
             <h3 className="text-2xl font-black text-white">Sync MUJ Portal</h3>
             <p className="text-gray-400 text-sm mt-1">Automatically extract your real timetable and attendance from SLCM.</p>
           </div>
           <button onClick={() => setShowSyncModal(true)} className="bg-[#0096FF] text-black px-8 py-3 rounded-xl font-bold hover:bg-[#007acc] transition shadow-lg">
             Connect Account
           </button>
        </motion.div>

        {/* Sync Modal Popup */}
        {showSyncModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => { setShowSyncModal(false); setSyncStatus(""); }} 
                className="absolute top-4 right-6 text-gray-400 hover:text-white text-3xl"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-[#0096FF] mb-2">Link SLCM Account</h2>
              <p className="text-xs text-gray-500 mb-6 italic">Your credentials are never stored permanently. They are used once by our robotic browser to securely sync your academic data.</p>
              
              <form onSubmit={handleSyncSLCM} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-1">Username</label>
                  <p className="text-xs text-gray-500 mb-2">Automatically sourced from your profile</p>
                  <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-500 cursor-not-allowed focus:outline-none" readOnly value={user?.username || ""} />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-bold mb-2">SLCM Password</label>
                  <input type="password" className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#0096FF] focus:outline-none" required value={slcmPassword} onChange={e=>setSlcmPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isSyncing} className="w-full bg-[#0096FF] text-black font-bold text-lg rounded-lg py-3 mt-4 hover:bg-[#007acc] transition disabled:opacity-50">
                  {isSyncing ? 'Scraping Portal (≈ 15 secs)...' : 'Extract Data'}
                </button>
              </form>
              
              {syncStatus && (
                <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold ${syncStatus.includes('Error') || syncStatus.includes('Critical') ? 'bg-red-900/50 text-red-500' : 'bg-green-900/50 text-green-500'}`}>
                  {syncStatus}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
