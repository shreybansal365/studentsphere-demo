/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Student Profile Identity Card
 * Designed, coded, & deployed by: Shrey Bansal
 * Firebase integration, profile state, glassmorphism UI: Shrey Bansal
 * Contact: shreybansal365@gmail.com | GitHub: @shreybansal365
 * This file is part of the StudentSphere proprietary codebase.
 * ═══════════════════════════════════════════════════════════════════
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { app } from '@/lib/firebase';
import Image from "next/image";
import { FaUserShield, FaIdBadge, FaCode, FaLink, FaGithub, FaPhone, FaEdit, FaSave } from "react-icons/fa";
import NeuralBackground from "../../components/NeuralBackground";

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [formData, setFormData] = useState({ 
    phone: "", 
    linkedIn: "", 
    github: "", 
    profileImage: "" 
  });
  
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser(data);
        setFormData({
          phone: data.phone || "",
          linkedIn: data.linkedIn || "",
          github: data.github || "",
          profileImage: data.profileImage || "https://api.dicebear.com/7.x/miniavs/svg?seed=shrey"
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    const userRef = doc(db, "users", auth.currentUser!.uid);
    await updateDoc(userRef, formData);
    setEditing(false);
    window.location.reload(); // Refresh to sync master state
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
      <NeuralBackground />
      
      {/* Background HUD Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-20 left-20 border-l border-t border-[#0096FF]/30 w-40 h-40" />
         <div className="absolute bottom-20 right-20 border-r border-b border-[#0096FF]/30 w-40 h-40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Left: 3D Identity Card */}
          <motion.div 
            whileHover={{ rotateY: -10, rotateX: 5 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="glass-card p-10 rounded-[3rem] border-[#0096FF]/20 relative overflow-hidden group perspective-1000 shadow-[0_0_50px_rgba(0,150,255,0.1)]"
          >
             {/* Card Scanline */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/2 w-full animate-scanline pointer-events-none" />
             
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#0096FF] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,150,255,0.5)]">
                         <FaIdBadge className="text-black text-xl" />
                      </div>
                      <div>
                         <p className="text-[#0096FF] font-mono text-[9px] tracking-[0.4em] uppercase">Security_Protocol_Active</p>
                         <h2 className="text-white font-black tracking-widest text-xs">IDENTITY_MODULE_V5.0</h2>
                      </div>
                   </div>
                   <div className="text-[#0096FF] font-mono text-[8px] border border-[#0096FF]/30 px-2 py-1 rounded">
                      MUJ_CENTRAL_AUTH
                   </div>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8 group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#0096FF] to-[#9D00FF] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <img 
                          src={formData.profileImage} 
                          alt="ID_PFP"
                          className="w-32 h-32 rounded-full border-2 border-[#0096FF] relative z-10 bg-black p-1"
                        />
                    </div>
                    
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-1">
                        {user?.name || "Initializing..."}
                    </h1>
                    <p className="font-mono text-[10px] text-[#0096FF] tracking-[0.3em] uppercase mb-8">
                       {user?.branch || "System_User"} • Batch {user?.batch || "202X"}
                    </p>

                    <div className="w-full space-y-4">
                        <div className="flex justify-between text-[9px] font-mono uppercase text-gray-500 mb-1">
                            <span>Synaptic_Response_Level</span>
                            <span className="text-[#0096FF]">94.2%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "94.2%" }} className="h-full bg-gradient-to-r from-[#0096FF] to-blue-400" />
                        </div>
                    </div>
                </div>
             </div>
          </motion.div>

          {/* Right: Data Terminal */}
          <div className="flex flex-col space-y-6">
             <div className="glass-card p-8 rounded-[2.5rem] flex-1">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-3">
                        <FaUserShield className="text-[#0096FF]" />
                        <h3 className="text-sm font-black tracking-widest uppercase italic">Data_Registry</h3>
                    </div>
                    <button 
                      onClick={() => setEditing(!editing)}
                      className="p-3 bg-white/5 rounded-xl hover:bg-[#0096FF] hover:text-black transition-all"
                    >
                       {editing ? <FaIdBadge /> : <FaEdit />}
                    </button>
                </div>

                <div className="space-y-6">
                    {[
                        { label: "Phone_Line", value: user?.phone, icon: FaPhone, name: "phone" },
                        { label: "Matrix_Hub", value: user?.linkedIn, icon: FaLink, name: "linkedIn" },
                        { label: "Source_Control", value: user?.github, icon: FaGithub, name: "github" }
                    ].map((item, i) => (
                        <div key={i} className="group">
                           <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                              <item.icon className="mr-2 text-[#0096FF]/50" /> {item.label}
                           </p>
                           {editing ? (
                             <input 
                               name={item.name}
                               value={(formData as any)[item.name]}
                               onChange={handleChange}
                               className="w-full bg-black/40 border border-white/10 p-3 rounded-xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                             />
                           ) : (
                             <p className="text-sm font-bold text-white group-hover:text-[#0096FF] transition-colors">
                                {item.value || "NOT_DETECTED"}
                             </p>
                           )}
                        </div>
                    ))}

                    <AnimatePresence>
                      {editing && (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          onClick={handleSave}
                          className="w-full py-4 bg-[#0096FF] text-black font-black rounded-full shadow-[0_0_20px_rgba(0,150,255,0.4)] flex items-center justify-center space-x-3 uppercase text-xs"
                        >
                           <FaSave /> <span>Synchronize_Profile</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                </div>
             </div>

             {/* System Footer Tag */}
             <div className="glass-card p-6 rounded-3xl border-white/5 bg-transparent flex items-center space-x-4 opacity-50">
                <div className="animate-pulse text-red-500 scale-150">
                   <FaCode />
                </div>
                <div>
                   <p className="text-[10px] font-black italic uppercase">System_Architect_Verified</p>
                   {/* [HANDCRAFTED_CREDIT_STRIPPED — Original maker: Shrey Bansal for Muj_Studentsphere] */}
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
