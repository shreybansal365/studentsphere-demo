"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildTimetableDocId } from "@/lib/student-data";
import { FaArrowLeft, FaCalendarAlt, FaSave } from "react-icons/fa";

type TimetableMap = Record<string, string[]>;

interface CourseDetail {
  courseCode: string;
  courseTitle: string;
  instructor: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOT_LABELS = [
  "09:00 - 09:55",
  "10:00 - 10:55",
  "11:00 - 11:55",
  "12:00 - 12:55",
  "Lunch",
  "14:30 - 15:55",
  "16:00 - 17:25",
];

const BATCH_OPTIONS = ["2025", "2026", "2027", "2028"];
const BRANCH_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology",
  "AI & DS",
  "Mathematics & Computing",
];

const createDefaultTimetable = (): TimetableMap => ({
  Monday: ["", "", "", "", "LUNCH", "", ""],
  Tuesday: ["", "", "", "", "LUNCH", "", ""],
  Wednesday: ["", "", "", "", "LUNCH", "", ""],
  Thursday: ["", "", "", "", "LUNCH", "", ""],
  Friday: ["", "", "", "", "LUNCH", "", ""],
});

const createDefaultCourses = (): CourseDetail[] =>
  Array.from({ length: 6 }, () => ({
    courseCode: "",
    courseTitle: "",
    instructor: "",
  }));

export default function TimetableAdmin() {
  const [batch, setBatch] = useState("2026");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [timetable, setTimetable] = useState<TimetableMap>(createDefaultTimetable());
  const [courseDetails, setCourseDetails] = useState<CourseDetail[]>(createDefaultCourses());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true);
      setMessage("");

      const snapshot = await getDoc(doc(db, "timetables", buildTimetableDocId(batch, branch)));

      if (snapshot.exists()) {
        const data = snapshot.data();
        setTimetable((data.timetable as TimetableMap) || createDefaultTimetable());
        setCourseDetails((data.courseDetails as CourseDetail[]) || createDefaultCourses());
      } else {
        setTimetable(createDefaultTimetable());
        setCourseDetails(createDefaultCourses());
      }

      setLoading(false);
    };

    void fetchTimetable();
  }, [batch, branch]);

  const handleTimetableChange = (day: string, index: number, value: string) => {
    setTimetable((currentTimetable) => ({
      ...currentTimetable,
      [day]: currentTimetable[day]?.map((slot, slotIndex) =>
        slotIndex === index ? value : slot
      ) || [],
    }));
  };

  const handleCourseChange = (
    index: number,
    field: keyof CourseDetail,
    value: string
  ) => {
    setCourseDetails((currentCourseDetails) =>
      currentCourseDetails.map((course, courseIndex) =>
        courseIndex === index ? { ...course, [field]: value } : course
      )
    );
  };

  const saveTimetable = async () => {
    setSaving(true);
    setMessage("");

    try {
      await setDoc(
        doc(db, "timetables", buildTimetableDocId(batch, branch)),
        {
          batch,
          branch,
          timetable,
          courseDetails,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setMessage("Timetable saved. Students in this batch and branch can now see the faculty version when SLCM data is unavailable.");
    } catch (error) {
      console.error("Error saving timetable:", error);
      setMessage("Timetable could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="w-full flex justify-start mb-6">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-[#0096FF] flex items-center transition"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>

        <div className="rounded-[2rem] border border-gray-800 bg-gradient-to-br from-gray-900 via-black to-gray-950 p-8 shadow-[0_0_40px_rgba(0,150,255,0.08)]">
          <p className="mb-3 inline-flex items-center rounded-full border border-[#0096FF]/30 bg-[#0096FF]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#7fc9ff]">
            Timetable Publisher
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF]">
            Faculty Timetable Manager
          </h1>
          <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
            Publish a timetable for a specific batch and branch. Students will see this version
            when they do not have synced SLCM timetable data yet.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-800 bg-gray-900 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Batch
              </span>
              <select
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
              >
                {BATCH_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Branch
              </span>
              <select
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
              >
                {BRANCH_OPTIONS.map((branchOption) => (
                  <option key={branchOption} value={branchOption}>
                    {branchOption}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-gray-800 bg-black/50 px-4 py-3 text-sm text-gray-300">
              {message}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-gray-800 bg-gray-900 p-6 overflow-x-auto">
          <div className="flex items-center gap-3 mb-5">
            <FaCalendarAlt className="text-[#0096FF]" />
            <h2 className="text-2xl font-bold text-white">Weekly Slots</h2>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading timetable...</p>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-black text-gray-400 text-sm uppercase tracking-[0.2em]">
                  <th className="border border-gray-800 p-3">Day</th>
                  {SLOT_LABELS.map((slotLabel) => (
                    <th key={slotLabel} className="border border-gray-800 p-3">
                      {slotLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="border border-gray-800 p-3 font-semibold">{day}</td>
                    {timetable[day]?.map((slot, index) => (
                      <td key={`${day}-${index}`} className="border border-gray-800 p-2">
                        {index === 4 ? (
                          <div className="rounded-xl bg-black px-3 py-3 text-center text-sm font-bold text-gray-400">
                            Lunch
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={slot || ""}
                            placeholder="Subject @ Room"
                            onChange={(event) =>
                              handleTimetableChange(day, index, event.target.value)
                            }
                            className="w-full rounded-xl border border-gray-700 bg-black px-3 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-gray-800 bg-gray-900 p-6 overflow-x-auto">
          <h2 className="text-2xl font-bold text-white mb-5">Course Details</h2>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-black text-gray-400 text-sm uppercase tracking-[0.2em]">
                <th className="border border-gray-800 p-3">Course Code</th>
                <th className="border border-gray-800 p-3">Course Title</th>
                <th className="border border-gray-800 p-3">Instructor</th>
              </tr>
            </thead>
            <tbody>
              {courseDetails.map((course, index) => (
                <tr key={index}>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      value={course.courseCode}
                      onChange={(event) =>
                        handleCourseChange(index, "courseCode", event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-700 bg-black px-3 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                    />
                  </td>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      value={course.courseTitle}
                      onChange={(event) =>
                        handleCourseChange(index, "courseTitle", event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-700 bg-black px-3 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                    />
                  </td>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      value={course.instructor}
                      onChange={(event) =>
                        handleCourseChange(index, "instructor", event.target.value)
                      }
                      className="w-full rounded-xl border border-gray-700 bg-black px-3 py-3 text-sm text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveTimetable}
              disabled={saving}
              className="rounded-2xl bg-[#0096FF] px-6 py-3 font-bold text-black transition hover:bg-[#0a84d1] disabled:bg-gray-600"
            >
              <FaSave className="mr-2 inline" />
              {saving ? "Saving..." : "Save Timetable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
