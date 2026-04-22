"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function StudentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(collection(db, "marks"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const fetched: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.records && data.records[user.uid] !== undefined) {
             fetched.push({
               id: doc.id,
               subject: data.subject,
               examType: data.examType,
               score: data.records[user.uid]
             });
          }
        });
        setMarks(fetched);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12">
      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-start mb-6">
          <Link href="/student" className="text-gray-400 hover:text-[#0096FF] flex items-center transition">
             <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF] mb-8">My Marks</h1>
        
        {loading ? <p>Loading Grades...</p> : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {marks.length === 0 ? <p className="text-gray-400">No marks uploaded yet.</p> : marks.map((m, i) => (
               <div key={i} className="bg-gray-900 border border-gray-700 p-6 rounded-2xl flex justify-between items-center shadow-lg hover:border-[#0096FF] transition">
                 <div>
                   <h3 className="text-2xl font-bold">{m.subject}</h3>
                   <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-semibold">{m.examType}</p>
                 </div>
                 <div className="text-3xl font-extrabold text-[#0096FF] bg-black p-4 rounded-xl border border-gray-800">
                   {m.score}/100
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
