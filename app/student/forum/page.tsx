"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaPlus, FaFilter, FaFire, FaClock, FaCheckCircle, FaUserGraduate, FaMicrophone, FaStop } from "react-icons/fa";
import { db, auth } from "../../../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc 
} from "firebase/firestore";
import Link from "next/link";
import NeuralBackground from "../../components/NeuralBackground";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  timestamp: any;
  votes: number;
  isOfficial?: boolean;
}

const PostCard = ({ post }: { post: Post }) => {
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
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="glass-card p-8 rounded-[2.5rem] hover:border-[#0096FF]/40 transition-all duration-300 relative group overflow-hidden cursor-pointer bg-white/5 backdrop-blur-3xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0096FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div style={{ transform: "translateZ(50px)" }} className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <FaUserGraduate size={100} />
      </div>

      <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-[10px] font-mono text-[#0096FF] border border-[#0096FF]/30 px-4 py-1.5 rounded-full uppercase tracking-[0.3em] font-black bg-[#0096FF]/5">
            {post.category}
          </div>
          {post.isOfficial && (
            <div className="flex items-center space-x-2 text-[10px] font-mono text-green-500 bg-green-500/10 px-4 py-1.5 rounded-full uppercase tracking-[0.3em] font-black border border-green-500/20">
              <FaCheckCircle className="animate-pulse" /> <span>OFFICIAL_BROADCAST</span>
            </div>
          )}
        </div>

        <h3 className="text-3xl font-black text-white mb-4 group-hover:text-[#0096FF] transition-colors line-clamp-1 italic tracking-tighter">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-2 font-medium">
          {post.content}
        </p>

        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center space-x-5">
             <div className="text-xs font-mono text-gray-500 uppercase tracking-widest px-1">
               ARCHITECT: <span className="text-white font-black">{post.author.split('@')[0]}</span>
             </div>
             <div className="text-[10px] text-gray-700 font-mono tracking-widest">
               [{post.timestamp?.toDate().toLocaleDateString() || "SYNCING..."}]
             </div>
          </div>
          <div className="flex items-center space-x-3 text-[#0096FF]">
              <FaFire className="animate-pulse text-xl" />
              <span className="font-black text-2xl tracking-tighter">{post.votes || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function StudentForum() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [isPosting, setIsPosting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "GENERAL" });

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("VOICE_PROTOCOL_NOT_SUPPORTED_IN_THIS_GRID");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewPost(prev => ({ ...prev, content: prev.content + " " + transcript }));
    };
    recognition.start();
  };

  useEffect(() => {
    const q = query(collection(db, "forum_posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(postData);
      },
      (error) => {
        console.error("Forum read error:", error);
        // Silently handle read errors — posts will remain empty
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;
    if (!auth.currentUser) {
      setPostError("You must be logged in to create a post.");
      return;
    }

    setIsSubmitting(true);
    setPostError("");
    
    try {
      await addDoc(collection(db, "forum_posts"), {
        ...newPost,
        author: auth.currentUser.email || "Anonymous",
        votes: 0,
        timestamp: serverTimestamp(),
        isOfficial: false
      });
      setIsPosting(false);
      setNewPost({ title: "", content: "", category: "GENERAL" });
    } catch (err: any) {
      console.error("Forum write error:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permissions")) {
        setPostError("Firebase permissions error. The forum_posts collection needs write rules. Ask your admin to add: allow write: if request.auth != null;");
      } else {
        setPostError("Failed to publish post: " + (err?.message || "Unknown error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = filter === "ALL" ? posts : posts.filter(p => p.category === filter);

  return (
    <div className="min-h-screen bg-black text-white">
      <NeuralBackground />
      
      <main className="p-6 md:p-12 relative z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-6 md:space-y-0">
            <div>
              <p className="text-[#0096FF] font-mono text-xs tracking-[0.4em] mb-4">NEURAL_HUB_DASHBOARD</p>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                STUDENT <span className="text-[#0096FF] italic">FORUM</span>
              </h1>
            </div>
            
            <button 
              onClick={() => setIsPosting(true)}
              className="px-8 py-4 bg-[#0096FF] text-black font-black rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(0,150,255,0.4)] flex items-center"
            >
              <FaPlus className="mr-3" /> INITIATE_THREAD
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
             <div className="p-1 glass-card rounded-full flex items-center space-x-1">
                {["ALL", "GENERAL", "ACADEMICS", "EVENTS"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2 rounded-full text-[10px] font-mono tracking-widest transition-all ${filter === f ? "bg-[#0096FF] text-black" : "hover:bg-white/5 text-gray-400"}`}
                  >
                    {f}
                  </button>
                ))}
             </div>
          </div>

          {/* New Post Modal */}
          <AnimatePresence>
            {isPosting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[3rem] max-w-xl w-full"
                >
                   <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase underline decoration-[#0096FF]">CREATE_NEW_THREAD</h2>
                   <form onSubmit={handleCreatePost} className="space-y-6">
                      <input 
                        placeholder="THREAD_TITLE"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-[#0096FF] outline-none transition-colors"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      />
                      <select 
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-[#0096FF] outline-none appearance-none"
                        value={newPost.category}
                        onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                      >
                         <option value="GENERAL">GENERAL</option>
                         <option value="ACADEMICS">ACADEMICS</option>
                         <option value="EVENTS">EVENTS</option>
                      </select>
                      <div className="relative">
                        <textarea 
                          placeholder="INPUT_NEURAL_DATA_HERE..."
                          rows={6}
                          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-mono text-xs focus:border-[#0096FF] outline-none transition-all resize-none pr-16"
                          value={newPost.content}
                          onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        />
                        <button 
                          type="button"
                          onClick={startVoiceInput}
                          className={`absolute bottom-6 right-6 p-4 rounded-xl transition-all ${isListening ? "bg-red-500 animate-pulse" : "bg-white/5 text-[#0096FF] hover:bg-[#0096FF]/10"}`}
                        >
                          {isListening ? <FaStop /> : <FaMicrophone />}
                        </button>
                      </div>
                      {postError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 font-mono">
                          {postError}
                        </div>
                      )}
                      <div className="flex space-x-4">
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-[#0096FF] text-black font-black rounded-full hover:shadow-[0_0_20px_rgba(0,150,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "PUBLISHING..." : "PUBLISH_STREAM"}</button>
                        <button type="button" onClick={() => { setIsPosting(false); setPostError(""); }} className="flex-1 py-4 glass-card font-black rounded-full hover:bg-red-500 transition-all">ABORT</button>
                      </div>
                   </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
