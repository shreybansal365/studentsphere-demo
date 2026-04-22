"use client"
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaLock, FaUserShield, FaChevronRight } from 'react-icons/fa';

const Signin = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set( (e.clientX - rect.left) / rect.width - 0.5);
    y.set( (e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');

    if (!role || !email || !password) {
      setError('MISSING_IDENTIFICATION_DATA');
      setIsAuthenticating(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (role === 'student' && !user.emailVerified) {
        setError('VERIFICATION_REQUIRED_CHECK_OUTLOOK');
        await auth.signOut();
        setIsAuthenticating(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== role) {
          setError('ACCESS_DENIED_ROLE_MISMATCH');
          setIsAuthenticating(false);
          return;
        }
        window.location.href = role === 'faculty' ? '/admin' : '/student';
      } else {
        setError('USER_REGISTRY_NOT_FOUND');
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      setError('AUTHENTICATION_FAILURE');
      console.log('Login attempt failed:', err.message);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden flex items-center justify-center p-6">

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-12 rounded-[3.5rem] border-white/5 bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,150,255,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0096FF]/10 to-transparent opacity-20" />
          
          <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
            <div className="flex justify-center mb-8">
               <div className="p-5 bg-[#0096FF]/10 rounded-3xl border border-[#0096FF]/30 animate-pulse">
                  <FaUserShield className="text-4xl text-[#0096FF]" />
               </div>
            </div>

            <h2 className="text-4xl font-black text-center mb-2 tracking-tighter italic italic tracking-tighter uppercase">IDENTITY_VERIFICATION</h2>
            <p className="text-center text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-12">DECRYPTING_USER_SESSION</p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-500 text-[10px] font-mono text-center mb-8 tracking-widest"
              >
                CRITICAL_ERROR: {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Protocol_Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="student">STUDENT_ACCESS</option>
                  <option value="faculty">FACULTY_ACCESS</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Neural_Identity (Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                  placeholder={role === 'faculty' ? "name@jaipur.manipal.edu" : "name.regno@muj.manipal.edu"}
                />
              </div>

              <div className="group">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Security_Passphrase</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <FaLock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className={`w-full mt-8 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 ${isAuthenticating ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-[#0096FF] text-black hover:bg-white hover:shadow-[0_0_30px_rgba(0,150,255,0.4)]"}`}
              >
                <span>{isAuthenticating ? "INITIATING..." : "GRANT_ACCESS"}</span>
                {!isAuthenticating && <FaChevronRight className="text-[10px]" />}
              </button>

              <div className="pt-8 text-center border-t border-white/5 mt-8">
                 <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                   No_Registry? <a href="/sign-up" className="text-white hover:text-[#0096FF] transition-colors border-b border-white/20 ml-2">CREATE_ACCOUNT</a>
                 </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signin;
