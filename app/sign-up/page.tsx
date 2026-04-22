"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, firebaseAuth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaUserPlus, FaChevronRight, FaDatabase, FaShieldAlt, FaTimes } from 'react-icons/fa';

export default function SignUp() {
  const [role, setRole] = useState("student");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [batch, setBatch] = useState("2027");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [designation, setDesignation] = useState("");
  const [name, setName] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentSubject, setCurrentSubject] = useState("");
  const [error, setError] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const router = useRouter();

  const formatToTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
      if (word.length <= 1) return word.toUpperCase();
      // Professional Title casing
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const lookupFacultyIdentity = (emailInput: string) => {
    const prefix = emailInput.split('@')[0].toLowerCase();
    
    // Mapping for Dr. Manmohan Sharma and universal structures
    const facultyRegistry: Record<string, { name: string, designation: string }> = {
      'manmohan.sharma': {
        name: "Dr. Manmohan Sharma",
        designation: "Assistant Professor (Selection Grade)"
      }
    };

    if (facultyRegistry[prefix]) {
      setName(facultyRegistry[prefix].name);
      setDesignation(facultyRegistry[prefix].designation);
    } else {
      // Default identity structure if not found in cache
      setName("");
      setDesignation("Faculty Member");
    }
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set( (e.clientX - rect.left) / rect.width - 0.5);
    y.set( (e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const validateEmail = (emailToCheck: string, currentRole: string) => {
    if (currentRole === "student") {
      const regex = /^[a-zA-Z]+\.[0-9]{2}[a-zA-Z0-9]+@muj\.manipal\.edu$/i;
      setIsValidEmail(regex.test(emailToCheck));
    } else if (currentRole === "faculty") {
      const regex = /^[a-zA-Z0-9._%+-]+@jaipur\.manipal\.edu$/i;
      setIsValidEmail(regex.test(emailToCheck));
    } else {
      setIsValidEmail(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setError("");

    if (!isValidEmail) {
      setError(`INVALID_EMAIL_FORMAT`);
      setIsRegistering(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("PASSPHRASE_MISMATCH");
      setIsRegistering(false);
      return;
    }

    try {
      let finalName = name;
      let finalDesignation = designation;

      // Faculty Autonomous Uplink Pulse
      if (role === 'faculty') {
          setIsSynchronizing(true);
          try {
              const verifyRes = await fetch('/api/verify-faculty', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.status === 'IDENTITY_VERIFIED') {
                  finalName = verifyData.nomenclature;
                  finalDesignation = verifyData.designation;
              } else {
                  setError(verifyData.error || 'IDENTITY_NOT_FOUND_IN_UNIVERSITY_CORE');
                  setIsSynchronizing(false);
                  setIsRegistering(false);
                  return;
              }
          } catch (oracleErr) {
              setError('UNIVERSITY_ORACLE_OFFLINE');
              setIsSynchronizing(false);
              setIsRegistering(false);
              return;
          }
          setIsSynchronizing(false);
      }

      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (role === 'student') {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(user);
      }

      const userData = { email, role, createdAt: new Date() };

      if (role === "student") {
        await setDoc(doc(db, "users", user.uid), {
          ...userData, name: formatToTitleCase(name), rollNo: rollNo.toUpperCase(), username: email.split('@')[0], batch, branch,
        });
        alert("REGISTRY_INITIALIZED: Check Outlook for verification link.");
        router.push("/sign-in");
      } else {
        await setDoc(doc(db, "users", user.uid), {
          ...userData, name: finalName, designation: finalDesignation, subjects: subjects.filter(s => s.length > 0),
        });
        router.push("/admin");
      }
    } catch (err: any) {
      setError("REGISTRY_FAILURE: " + err.message);
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-12">

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="glass-card p-10 sm:p-16 rounded-[4rem] border-white/5 bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(34,197,94,0.02)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0096FF]/5 to-transparent opacity-30" />
          
          <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase underline decoration-[#0096FF]/40 mb-2">INITIALIZE_REGISTRY</h2>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">
                      {role === 'student' ? 'ESTABLISHING_STUDENT_NODE' : 'AUTONOMOUS_FACULTY_IDENTIFICATION_ACTIVE'}
                    </p>
                </div>
                <div className="p-4 bg-[#0096FF]/10 rounded-2xl border border-[#0096FF]/20 hidden md:block">
                    <FaUserPlus className="text-3xl text-[#0096FF]" />
                </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl text-red-500 text-[10px] font-mono text-center mb-10 tracking-widest uppercase"
              >
                CRITICAL_SYSTEM_ERROR: {error}
              </motion.div>
            )}

            <form onSubmit={handleSignUp} className="grid grid-cols-1 md:grid-cols-6 gap-8 text-left">
              
              <div className="group md:col-span-3">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Role</label>
                <select
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all appearance-none cursor-pointer"
                  value={role}
                  onChange={(e) => { 
                    setRole(e.target.value); 
                    validateEmail(email, e.target.value);
                    setRollNo("");
                    setName("");
                  }}
                >
                  <option value="student">STUDENT</option>
                  <option value="faculty">FACULTY</option>
                </select>
              </div>
 
                <div className="group md:col-span-3">
                  <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(formatToTitleCase(e.target.value))}
                    required
                    placeholder="Full Name as per Official Records"
                  />
                  <p className="text-[8px] font-mono text-gray-700 mt-2 ml-1">* As per Official Academic Records</p>
                </div>

              {role === "student" ? (
                <>
                   <div className="group md:col-span-2">
                    <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Registration Number</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                      value={rollNo}
                      maxLength={batch === '2027' ? 14 : 10}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (batch !== '2027') {
                          // Numeric only for 2028-2030
                          val = val.replace(/\D/g, '');
                        } else {
                          // Alphanumeric CAPS for 2027
                          val = val.toUpperCase();
                        }
                        setRollNo(val);
                      }}
                      required
                      placeholder=""
                    />
                  </div>
                   <div className="group md:col-span-2">
                    <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Department</label>
                    <select
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all appearance-none cursor-pointer"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    >
                      <option value="Computer Science & Engineering">CSE</option>
                      <option value="Information Technology">IT</option>
                      <option value="BCA">BCA</option>
                    </select>
                  </div>
                   <div className="group md:col-span-2">
                    <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Batch</label>
                    <select
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all appearance-none cursor-pointer"
                      value={batch}
                      onChange={(e) => {
                        setBatch(e.target.value);
                        setRollNo("");
                      }}
                    >
                      {["2027", "2028", "2029", "2030"].map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                    <div className="group md:col-span-6">
                    <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Subjects Taught</label>
                    <div className="min-h-[56px] w-full bg-black/40 border border-white/10 p-2 rounded-2xl flex flex-wrap gap-2 transition-all focus-within:border-[#0096FF]">
                        {subjects.map((sub, i) => (
                           <div key={i} className="bg-[#0096FF]/10 border border-[#0096FF]/30 px-3 py-1 rounded-lg flex items-center space-x-2 animate-in fade-in zoom-in duration-300">
                               <span className="text-[10px] font-mono text-white">{sub}</span>
                               <button onClick={() => setSubjects(subjects.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-500"><FaTimes size={8} /></button>
                           </div>
                        ))}
                        <input
                           type="text"
                           placeholder={subjects.length === 0 ? "Agile Methodology" : ""}
                           className="bg-transparent border-none outline-none font-mono text-xs p-2 flex-grow min-w-[120px]"
                           value={currentSubject}
                           onChange={(e) => setCurrentSubject(e.target.value)}
                           onKeyDown={(e) => {
                             if(e.key === 'Enter' && currentSubject.trim()) {
                                e.preventDefault();
                                const formatted = formatToTitleCase(currentSubject.trim());
                                if(!subjects.includes(formatted)) setSubjects([...subjects, formatted]);
                                setCurrentSubject("");
                             }
                           }}
                        />
                    </div>
                    <p className="text-[8px] font-mono text-gray-700 mt-2 ml-1">* Press ENTER to add subjects</p>
                  </div>
                </>
              )}

               <div className="group md:col-span-6">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">College Email</label>
                <input
                  type="email"
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                  value={email}
                  onChange={(e) => { 
                    let val = e.target.value;
                    if (role === 'student' && val.includes('.')) {
                      const firstDotIndex = val.indexOf('.');
                      const namePart = val.substring(0, firstDotIndex).toLowerCase();
                      let rest = val.substring(firstDotIndex + 1);
                      
                      const idLimit = batch === '2027' ? 14 : 10;
                      const atIndex = rest.indexOf('@');
                      
                      let idPart = atIndex !== -1 ? rest.substring(0, atIndex) : rest;
                      
                      // Hardware-Level ID Filtering
                      if (batch !== '2027') {
                        idPart = idPart.replace(/\D/g, ''); // Numeric only for 2028-2030
                      } else {
                        idPart = idPart.toUpperCase(); // Alphanumeric CAPS for 2027
                      }
                      
                      // Hard Capping
                      if (idPart.length > idLimit) {
                        idPart = idPart.substring(0, idLimit);
                      }
                      
                      // Domain Reconstruction
                      const domain = "@muj.manipal.edu";
                      if (idPart.length === idLimit) {
                         val = `${namePart}.${idPart}${domain}`;
                      } else {
                         val = `${namePart}.${idPart}${atIndex !== -1 ? rest.substring(atIndex) : ""}`;
                      }
                    } else if (role === 'faculty') {
                      val = val.toLowerCase();
                    }
                    setEmail(val); 
                    validateEmail(val, role);
                    if (role === 'faculty') lookupFacultyIdentity(val);
                  }}
                  required
                  placeholder={role === 'faculty' ? "name@jaipur.manipal.edu" : "name.regno@muj.manipal.edu"}
                />
                <p className="text-[8px] font-mono text-gray-700 mt-2 ml-1">* Official Outlook ID Required</p>
              </div>

               <div className="group md:col-span-3">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Password</label>
                <input
                  type="password"
                  className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="group md:col-span-3">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">Confirm Password</label>
                <div className="relative">
                    <input
                    type="password"
                    className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    />
                    <FaShieldAlt className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600" />
                </div>
              </div>

              <div className="col-span-full pt-10 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] max-w-md bg-white/5 p-4 rounded-2xl">
                    <p className="mb-2 text-[#0096FF] font-black">ENTRY_PROTOCOLS:</p>
                    <ul className="space-y-1">
                        <li>• STUDENTS: @MUJ.MANIPAL.EDU</li>
                        <li>• FACULTY: @JAIPUR.MANIPAL.EDU</li>
                        <li>• SYNC_TIME: ~60 SECONDS</li>
                    </ul>
                </div>
                
                <div className="flex flex-col items-end gap-6 w-full lg:w-auto">
                    <button
                        type="submit"
                        disabled={!isValidEmail || isRegistering}
                        className={`w-full lg:w-96 py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center space-x-4 shadow-[0_0_40px_rgba(0,150,255,0.1)] ${!isValidEmail || isRegistering ? "bg-gray-800 text-gray-600 cursor-not-allowed opacity-50" : "bg-[#0096FF] text-black hover:bg-white hover:shadow-[0_0_30px_rgba(0,150,255,0.4)]"}`}
                    >
                        <span>{isRegistering ? "SYNCING..." : "COMMIT_REGISTRY"}</span>
                        {!isRegistering && <FaChevronRight />}
                    </button>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pr-2">
                        Existing_Uplink? <a href="/sign-in" className="text-white hover:text-[#0096FF] transition-colors border-b border-white/20 ml-2">LOGIN_HERE</a>
                    </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}