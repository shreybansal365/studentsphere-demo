"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  FaArrowLeft,
  FaArrowDown,
  FaArrowUp,
  FaEquals,
  FaExclamationTriangle,
  FaShieldAlt,
} from "react-icons/fa";
import { fetchStudentAcademicBundle } from "@/lib/student-data";
import { buildAttendanceInsights, formatDateTime, type AttendanceInsight } from "@/lib/academic";

export default function StudentAttendance() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AttendanceInsight[]>([]);
  const [lastSynced, setLastSynced] = useState("");
  const [recentRecords, setRecentRecords] = useState<
    Array<{ subject?: string; date?: string; isPresent?: boolean }>
  >([]);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const academicBundle = await fetchStudentAcademicBundle(user.uid);

      if (academicBundle) {
        setInsights(
          buildAttendanceInsights(
            academicBundle.slcmAttendance,
            academicBundle.attendanceRecords
          )
        );
        setLastSynced(formatDateTime(academicBundle.profile.slcmScrapeTime));
        setRecentRecords(academicBundle.attendanceRecords.slice(0, 8));
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const riskySubjects = insights.filter((insight) => insight.status !== "healthy").length;
  const averageAttendance =
    insights.length > 0
      ? (
          insights.reduce((total, insight) => total + insight.percentage, 0) / insights.length
        ).toFixed(1)
      : "0.0";
  const strongestSubject = insights.reduce<AttendanceInsight | null>((bestInsight, currentInsight) => {
    if (!bestInsight || currentInsight.percentage > bestInsight.percentage) {
      return currentInsight;
    }

    return bestInsight;
  }, null);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-white">
        Loading attendance intelligence...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="w-full flex justify-start mb-6">
          <Link
            href="/student"
            className="text-gray-400 hover:text-[#0096FF] flex items-center transition"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>

        <div className="rounded-[2rem] border border-gray-800 bg-gradient-to-br from-gray-900 via-black to-gray-950 p-8 shadow-[0_0_40px_rgba(0,150,255,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center rounded-full border border-[#0096FF]/30 bg-[#0096FF]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#7fc9ff]">
                Attendance Intelligence
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF]">My Attendance</h1>
              <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
                Live attendance analytics built from your synced SLCM baseline plus faculty-marked
                attendance records.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-5 py-4 text-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Last Synced</p>
              <p className="mt-2 text-lg font-bold text-white">{lastSynced || "Not synced"}</p>
            </div>
          </div>
        </div>

        {insights.length === 0 ? (
          <div className="mt-10 text-center text-gray-400 bg-gray-900 border border-gray-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-2 text-[#0096FF]">No attendance data available</h2>
            <p>Sync your SLCM account from the dashboard or wait for faculty attendance to be published.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Average</p>
                <p className="mt-3 text-4xl font-black text-white">{averageAttendance}%</p>
                <p className="mt-2 text-sm text-gray-400">Across your tracked subjects</p>
              </div>
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">At Risk</p>
                <p className="mt-3 text-4xl font-black text-red-400">{riskySubjects}</p>
                <p className="mt-2 text-sm text-gray-400">Subjects needing action now</p>
              </div>
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Best Buffer</p>
                <p className="mt-3 text-4xl font-black text-emerald-400">
                  {strongestSubject?.classesSafeToMiss ?? 0}
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Safe misses in {strongestSubject?.subject ?? "your top subject"}
                </p>
              </div>
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Recent Logs</p>
                <p className="mt-3 text-4xl font-black text-cyan-300">{recentRecords.length}</p>
                <p className="mt-2 text-sm text-gray-400">Faculty attendance entries tracked</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {insights.map((insight) => {
                const trendIcon =
                  insight.recentTrend === "up" ? (
                    <FaArrowUp className="text-emerald-400" />
                  ) : insight.recentTrend === "down" ? (
                    <FaArrowDown className="text-red-400" />
                  ) : (
                    <FaEquals className="text-gray-400" />
                  );

                return (
                  <div
                    key={insight.key}
                    className={`rounded-3xl border p-6 shadow-lg ${
                      insight.status === "critical"
                        ? "border-red-800 bg-red-950/20"
                        : insight.status === "warning"
                          ? "border-amber-800 bg-amber-950/10"
                          : "border-gray-800 bg-gray-900"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{insight.subject}</h3>
                        <p className="mt-2 text-sm text-gray-400">
                          {insight.attendedClasses} attended out of {insight.totalClasses} total
                          classes tracked
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-right ${
                          insight.status === "critical"
                            ? "bg-red-500/10"
                            : insight.status === "warning"
                              ? "bg-amber-500/10"
                              : "bg-emerald-500/10"
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Current</p>
                        <p className="mt-1 text-3xl font-black text-white">{insight.percentage}%</p>
                      </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-black border border-gray-800">
                      <div
                        className={`h-full rounded-full ${
                          insight.status === "critical"
                            ? "bg-red-500"
                            : insight.status === "warning"
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(insight.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-gray-800 bg-black/50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Prediction</p>
                        <p className="mt-2 text-lg font-bold text-white">
                          One more absence would make this {insight.projectedAfterOneAbsence}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-800 bg-black/50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Recovery</p>
                        <p className="mt-2 text-lg font-bold text-white">
                          Need {insight.classesNeededFor75} straight present class(es) for 75%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-800 bg-black/50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Safe Buffer</p>
                        <p className="mt-2 text-lg font-bold text-white">
                          Can safely miss {insight.classesSafeToMiss} more class(es)
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-800 bg-black/50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Recent Trend</p>
                        <p className="mt-2 flex items-center gap-2 text-lg font-bold text-white">
                          {trendIcon}
                          {insight.recentPresentCount} present / {insight.recentAbsentCount} absent recently
                        </p>
                      </div>
                    </div>

                    {insight.status !== "healthy" && (
                      <div className="mt-5 rounded-2xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                        <FaExclamationTriangle className="mr-2 inline" />
                        {insight.status === "critical"
                          ? "This subject is below the safe limit. Prioritise attending the next classes."
                          : "This subject is still above the threshold, but your buffer is getting thin."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {recentRecords.length > 0 && (
              <div className="mt-8 rounded-3xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                  <FaShieldAlt className="text-[#0096FF]" />
                  Recent Faculty Attendance Logs
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {recentRecords.map((record, index) => (
                    <div
                      key={`${record.subject}-${record.date}-${index}`}
                      className="rounded-2xl border border-gray-800 bg-black/50 px-4 py-3"
                    >
                      <p className="text-lg font-bold text-white">{record.subject ?? "Subject"}</p>
                      <p className="mt-1 text-sm text-gray-400">{record.date ?? "Unknown date"}</p>
                      <p
                        className={`mt-2 text-sm font-bold ${
                          record.isPresent ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {record.isPresent ? "Marked Present" : "Marked Absent"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
