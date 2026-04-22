"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBroadcastTower, FaTrash, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { db, auth } from "../../../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp 
} from "firebase/firestore";
import NeuralBackground from "../../components/NeuralBackground";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  timestamp: any;
  isOfficial?: boolean;
}

export default function AdminForum() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState("");
  const [newBroadcast, setNewBroadcast] = useState({ title: "", content: "" });

  useEffect(() => {
    const q = query(collection(db, "faculty_forum_posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        setPosts(postData);
      },
      (error) => {
        console.error("Faculty forum read error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.content) return;
    if (!auth.currentUser) {
      setPostError("You must be logged in to broadcast.");
      return;
    }

    setIsSubmitting(true);
    setPostError("");
    
    try {
      await addDoc(collection(db, "faculty_forum_posts"), {
        ...newBroadcast,
        author: auth.currentUser.email || "Faculty_Overseer",
        category: "ACADEMICS",
        votes: 100,
        timestamp: serverTimestamp(),
        isOfficial: true
      });
      setIsPosting(false);
      setNewBroadcast({ title: "", content: "" });
    } catch (err: any) {
      console.error("Faculty forum write error:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permissions")) {
        setPostError("Firebase permissions error. Add a rule for faculty_forum_posts: allow read, write: if request.auth != null;");
      } else {
        setPostError("Failed to publish: " + (err?.message || "Unknown error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("ARCHIVE_THREAD_PERMANENTLY?")) {
      try {
        await deleteDoc(doc(db, "faculty_forum_posts", id));
      } catch (err: any) {
        console.error("Delete error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NeuralBackground />
      
      <main className="p-6 md:p-12 relative z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-6 md:space-y-0">
            <div>
              <p className="text-[#0096FF] font-mono text-xs tracking-[0.4em] mb-4">CENTRAL_BROADCAST_CONTROL</p>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                GRID <span className="text-[#0096FF] not-italic">OVERSEER</span>
              </h1>
              <p className="text-gray-500 text-sm font-mono mt-3">Faculty-only discussion board • Separate from student forum</p>
            </div>
            
            <button 
              onClick={() => setIsPosting(true)}
              className="px-8 py-4 bg-green-500 text-black font-black rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center"
            >
              <FaBroadcastTower className="mr-3" /> INITIATE_BROADCAST
            </button>
          </div>

          <div className="glass-card p-10 rounded-[3rem] border-red-500/20 mb-12 flex items-center space-x-6">
             <FaExclamationTriangle className="text-red-500 text-4xl animate-pulse flex-shrink-0" />
             <div>
                <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Moderation Protocol Active</h2>
                <p className="text-gray-400 text-sm font-mono lowercase">As a representative of the faculty, all broadcasts are cryptographically signed and permanent.</p>
             </div>
          </div>

          {/* Broadcast Modal */}
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
                  className="bg-[#0a0a0a] border border-green-500/20 p-10 rounded-[3rem] max-w-xl w-full"
                >
                   <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase underline decoration-green-500">NEW_OFFICIAL_BROADCAST</h2>
                   <form onSubmit={handleCreateBroadcast} className="space-y-6">
                      <input 
                        placeholder="BROADCAST_SUBJECT"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-green-500 outline-none transition-colors"
                        value={newBroadcast.title}
                        onChange={(e) => setNewBroadcast({...newBroadcast, title: e.target.value})}
                      />
                      <textarea 
                        placeholder="INPUT_BROADCAST_DATA..."
                        rows={5}
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-green-500 outline-none transition-colors resize-none"
                        value={newBroadcast.content}
                        onChange={(e) => setNewBroadcast({...newBroadcast, content: e.target.value})}
                      />
                      {postError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 font-mono">
                          {postError}
                        </div>
                      )}
                      <div className="flex space-x-4">
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-green-500 text-black font-black rounded-full hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSubmitting ? "BROADCASTING..." : "Authorize"}
                        </button>
                        <button type="button" onClick={() => { setIsPosting(false); setPostError(""); }} className="flex-1 py-4 glass-card font-black rounded-full hover:bg-red-500 transition-all uppercase">Abort</button>
                      </div>
                   </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts Control List */}
          <div className="space-y-4 pb-20">
            {posts.length === 0 && (
              <div className="glass-card p-8 rounded-2xl text-center text-gray-500 font-mono">
                No faculty broadcasts yet. Be the first to initiate a thread.
              </div>
            )}
            {posts.map((post) => (
              <div key={post.id} className="glass-card p-6 rounded-2xl flex items-center justify-between border-white/5 hover:border-[#0096FF]/20 transition-all">
                <div className="flex items-center space-x-6 flex-1 min-w-0">
                   <div className={`p-4 rounded-xl flex-shrink-0 ${post.isOfficial ? "bg-green-500/10 text-green-500" : "bg-white/5 text-gray-500"}`}>
                      <FaCheckCircle size={24} />
                   </div>
                   <div className="min-w-0">
                      <h4 className="font-bold text-white truncate">{post.title}</h4>
                      <p className="text-xs text-gray-500 font-mono lowercase">By: {post.author} • {post.category}</p>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{post.content}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] flex-shrink-0 ml-4"
                >
                   <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
