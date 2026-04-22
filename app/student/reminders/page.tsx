"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaArrowLeft, FaBell } from "react-icons/fa";
import { buildAttendanceInsights, buildLiveReminders, type ReminderItem } from "@/lib/academic";
import { fetchStudentAcademicBundle } from "@/lib/student-data";

export default function StudentReminders() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const academicBundle = await fetchStudentAcademicBundle(user.uid);

      if (academicBundle) {
        const attendanceInsights = buildAttendanceInsights(
          academicBundle.slcmAttendance,
          academicBundle.attendanceRecords
        );

        setReminders(
          buildLiveReminders({
            attendanceInsights,
            assignments: academicBundle.assignments,
            marks: academicBundle.marks,
            timetableSlots: academicBundle.timetableSlots,
          })
        );
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const accentBySeverity = {
    high: "border-red-500 text-red-300",
    medium: "border-amber-400 text-amber-300",
    low: "border-emerald-500 text-emerald-300",
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Building live reminders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12 border-t-4 border-red-500">
      <div className="max-w-6xl mx-auto">
        <div className="w-full flex justify-start mb-6">
          <Link
            href="/student"
            className="text-gray-400 hover:text-[#0096FF] flex items-center transition"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>

        <div className="rounded-[2rem] border border-gray-800 bg-gradient-to-br from-gray-900 via-black to-gray-950 p-8 shadow-[0_0_40px_rgba(0,150,255,0.08)]">
          <p className="mb-3 inline-flex items-center rounded-full border border-[#0096FF]/30 bg-[#0096FF]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#7fc9ff]">
            Live Reminder Engine
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF]">Smart Reminders</h1>
          <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
            These reminders are generated from your real attendance, assignments, marks, and timetable data.
          </p>
        </div>

        {reminders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400">
            <h2 className="text-2xl font-bold text-[#0096FF]">No urgent reminders right now</h2>
            <p className="mt-2">Your academic feed looks calm at the moment.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`rounded-3xl border-l-4 border border-gray-800 bg-gray-900 p-6 shadow-lg ${accentBySeverity[reminder.severity]}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <FaBell />
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                        {reminder.type}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-white">{reminder.title}</h2>
                    <p className="mt-3 text-base text-gray-300">{reminder.detail}</p>
                  </div>

                  <span className="rounded-full border border-gray-700 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
                    {reminder.severity} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
