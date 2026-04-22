"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const batch = userData.batch || "2026";
          const q = query(collection(db, "assignments"), where("batch", "==", batch));
          const snapshot = await getDocs(q);
          const fetched: any[] = [];
          snapshot.forEach(d => fetched.push({ id: d.id, ...d.data() }));
          // simple sort by creation manually or assume ordering
          setAssignments(fetched.reverse());
        }
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF] mb-8">My Assignments</h1>
        
        {loading ? <p>Syncing Assignments...</p> : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.length === 0 ? <p className="text-gray-400">No assignments found for your batch.</p> : assignments.map(a => (
              <div key={a.id} className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-lg flex flex-col">
                <h3 className="text-2xl font-bold text-[#0096FF]">{a.title}</h3>
                <h4 className="text-lg text-gray-300 font-bold">{a.subject}</h4>
                <p className="text-sm font-semibold text-red-400 mt-2 bg-red-900/20 w-fit px-2 py-1 rounded">Deadline: {a.deadline}</p>
                <p className="mt-4 text-gray-400 flex-1">{a.description}</p>
                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition shadow-md">Mark as Done</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
