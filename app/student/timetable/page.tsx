"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaArrowLeft, FaCalendarAlt } from "react-icons/fa";
import { fetchStudentAcademicBundle } from "@/lib/student-data";
import type { TimetableSlot } from "@/lib/academic";

const timeSlots = [
  { label: "08:00", hour: 8 },
  { label: "09:00", hour: 9 },
  { label: "10:00", hour: 10 },
  { label: "11:00", hour: 11 },
  { label: "12:00", hour: 12 },
  { label: "13:00", hour: 13 },
  { label: "14:00", hour: 14 },
  { label: "15:00", hour: 15 },
  { label: "16:00", hour: 16 },
  { label: "17:00", hour: 17 },
];

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMonday = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const getBlockStyle = (start: string, end: string) => {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const dayStartMinutes = 8 * 60;
  const pixelsPerHour = 72;

  return {
    top: `${((startMinutes - dayStartMinutes) / 60) * pixelsPerHour}px`,
    height: `${((endMinutes - startMinutes) / 60) * pixelsPerHour}px`,
  };
};

export default function TimetableStudent() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getMonday(new Date()));
  const [classesConfig, setClassesConfig] = useState<TimetableSlot[]>([]);
  const [source, setSource] = useState<"slcm" | "faculty" | "none">("none");
  const [lastSynced, setLastSynced] = useState("");

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const academicBundle = await fetchStudentAcademicBundle(user.uid);

      if (academicBundle) {
        setClassesConfig(academicBundle.timetableSlots);
        setSource(academicBundle.timetableSource as "slcm" | "faculty" | "none");
        setLastSynced(academicBundle.profile.slcmScrapeTime || "");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });

  const getHeaderDateRange = () => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return startDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + " - " +
      endDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  };

  const sourceLabel =
    source === "slcm"
      ? "SLCM Synced"
      : source === "faculty"
        ? "Faculty Published"
        : "No Timetable";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-white">
        Loading timetable...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-black text-white flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <Link
          href="/student"
          className="text-gray-400 hover:text-[#0096FF] flex items-center mb-6 transition"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>

        <div className="rounded-[2rem] border border-gray-800 bg-gradient-to-br from-gray-900 via-black to-gray-950 p-8 shadow-[0_0_40px_rgba(0,150,255,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center rounded-full border border-[#0096FF]/30 bg-[#0096FF]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#7fc9ff]">
                Live Timetable
              </p>
              <h1 className="text-4xl font-extrabold text-[#0096FF]">Weekly Schedule</h1>
              <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
                Your timetable is now wired end-to-end. StudentSphere uses SLCM data first,
                then falls back to the faculty-published timetable for your batch and branch.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-5 py-4 text-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Source</p>
              <p className="mt-2 text-lg font-bold text-white">{sourceLabel}</p>
              {lastSynced && source === "slcm" && (
                <p className="mt-1 text-gray-400">
                  Synced {new Date(lastSynced).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 w-full rounded-3xl border border-gray-800 bg-gray-900 shadow-xl overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-800 bg-black/60 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-[#0096FF]" />
              <h2 className="text-2xl font-bold text-white">{getHeaderDateRange()}</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const previousWeek = new Date(startDate);
                  previousWeek.setDate(startDate.getDate() - 7);
                  setStartDate(previousWeek);
                }}
                className="rounded-xl border border-gray-700 px-4 py-2 hover:border-[#0096FF] transition"
              >
                Previous
              </button>
              <button
                onClick={() => setStartDate(getMonday(new Date()))}
                className="rounded-xl border border-gray-700 px-4 py-2 hover:border-[#0096FF] transition"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date(startDate);
                  nextWeek.setDate(startDate.getDate() + 7);
                  setStartDate(nextWeek);
                }}
                className="rounded-xl border border-gray-700 px-4 py-2 hover:border-[#0096FF] transition"
              >
                Next
              </button>
            </div>
          </div>

          {classesConfig.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No timetable is available yet for this account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex min-w-[1100px]">
                <div className="w-20 flex-none border-r border-gray-800 bg-gray-950">
                  <div className="h-16 border-b border-gray-800" />
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.label}
                      className="h-[72px] border-b border-gray-800 text-xs text-gray-500 text-center pt-2"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>

                <div className="flex flex-1">
                  {days.map((day, dayIndex) => (
                    <div
                      key={day.toISOString()}
                      className="flex-1 min-w-[145px] border-r border-gray-800 flex flex-col"
                    >
                      <div className="h-16 border-b border-gray-800 bg-gray-950 p-2 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold text-white">{dayNames[dayIndex]}</span>
                        <span className="text-xs text-gray-400">
                          {day.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <div className="relative h-[720px] bg-gray-900">
                        {timeSlots.map((slot, index) => (
                          <div
                            key={`${day.toISOString()}-${slot.label}`}
                            className="absolute left-0 right-0 h-[72px] border-b border-gray-800"
                            style={{ top: `${index * 72}px` }}
                          />
                        ))}

                        {classesConfig
                          .filter((classSlot) => classSlot.day === dayIndex)
                          .map((classSlot, index) => (
                            <div
                              key={`${classSlot.title}-${classSlot.start}-${index}`}
                              className={`absolute left-1 right-1 rounded-xl border p-2 text-xs shadow-md ${
                                classSlot.source === "faculty"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-100"
                                  : "bg-[#0096FF]/12 border-[#0096FF]/35 text-cyan-100"
                              }`}
                              style={getBlockStyle(classSlot.start, classSlot.end)}
                            >
                              <p className="font-bold">{classSlot.title}</p>
                              <p className="mt-1 text-[11px] opacity-80">
                                {classSlot.start} - {classSlot.end}
                              </p>
                              <p className="mt-1 text-[11px] opacity-80">{classSlot.room}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
