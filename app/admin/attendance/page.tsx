"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaSyncAlt,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";

type MessageState = {
  text: string;
  type: "success" | "error" | "";
};

type AttendanceState = Record<string, boolean>;
type RiskFilter = "all" | "low" | "unsynced" | "absent";

interface SubjectAttendance {
  subject?: string;
  percentage?: string;
  attendedClasses?: number | string;
  totalClasses?: number | string;
}

interface FacultyProfile {
  uid: string;
  name?: string;
  designation?: string;
  subjects?: string[] | string;
}

interface StudentRecord {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  rollNo?: string;
  batch?: string;
  branch?: string;
  slcmAttendanceHTML?: SubjectAttendance[];
  slcmAttendanceData?: SubjectAttendance[];
  slcmScrapeTime?: string;
}

interface EnrichedStudent extends StudentRecord {
  displayName: string;
  subjectInsight: SubjectAttendance | null;
  percentageNumber: number | null;
  percentageLabel: string;
  isLowAttendance: boolean;
  isUnsynced: boolean;
  lastSyncedLabel: string;
}

const AVAILABLE_BATCHES = ["2026", "2027", "2028", "2029"];

const normalizeValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const extractSubjectOptions = (subjects?: string[] | string): string[] => {
  if (Array.isArray(subjects)) {
    return subjects
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof subjects === "string") {
    return subjects
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getStudentAttendanceEntries = (student: StudentRecord): SubjectAttendance[] => {
  if (Array.isArray(student.slcmAttendanceHTML)) {
    return student.slcmAttendanceHTML;
  }

  if (Array.isArray(student.slcmAttendanceData)) {
    return student.slcmAttendanceData;
  }

  return [];
};

const getSubjectInsight = (
  student: StudentRecord,
  subjectQuery: string
): SubjectAttendance | null => {
  if (!subjectQuery.trim()) {
    return null;
  }

  const normalizedQuery = normalizeValue(subjectQuery);

  return (
    getStudentAttendanceEntries(student).find((entry) => {
      const entrySubject = normalizeValue(entry.subject ?? "");

      return (
        entrySubject === normalizedQuery ||
        entrySubject.includes(normalizedQuery) ||
        normalizedQuery.includes(entrySubject)
      );
    }) ?? null
  );
};

const getPercentageNumber = (entry: SubjectAttendance | null): number | null => {
  if (!entry?.percentage) {
    return null;
  }

  const match = String(entry.percentage).match(/(\d+(\.\d+)?)/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatValue = (value?: number | string) => {
  if (value === undefined || value === null || value === "") {
    return "--";
  }

  return String(value);
};

const formatLastSynced = (value?: string) => {
  if (!value) {
    return "Not synced";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Not synced";
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function FacultyAttendanceDashboard() {
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batch, setBatch] = useState("2026");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [branchFilter, setBranchFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const auth = getAuth(app);
  const db = getFirestore(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/sign-in");
        setLoading(false);
        return;
      }

      setFacultyUser(currentUser);

      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as Omit<FacultyProfile, "uid">;
          const subjectOptions = extractSubjectOptions(userData.subjects);

          setFacultyProfile({ uid: currentUser.uid, ...userData });
          setSubject((currentSubject) => currentSubject || subjectOptions[0] || "");
        }
      } catch (error) {
        console.error("Error loading faculty profile:", error);
        setMessage({
          text: "We could not load your faculty profile. You can still enter the subject manually.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const facultySubjects = extractSubjectOptions(facultyProfile?.subjects);

  const enrichedStudents: EnrichedStudent[] = students.map((student) => {
    const subjectInsight = getSubjectInsight(student, subject);
    const percentageNumber = getPercentageNumber(subjectInsight);

    return {
      ...student,
      displayName:
        student.name ?? student.username ?? student.email?.split("@")[0] ?? "Unnamed Student",
      subjectInsight,
      percentageNumber,
      percentageLabel: subjectInsight?.percentage ?? "No data",
      isLowAttendance: percentageNumber !== null && percentageNumber < 75,
      isUnsynced: !subjectInsight,
      lastSyncedLabel: formatLastSynced(student.slcmScrapeTime),
    };
  });

  const branchOptions = Array.from(
    new Set(enrichedStudents.map((student) => student.branch).filter(Boolean))
  ) as string[];

  const filteredStudents = enrichedStudents.filter((student) => {
    const searchHaystack = `${student.displayName} ${student.rollNo ?? ""} ${student.branch ?? ""}`;
    const matchesSearch =
      !searchQuery.trim() ||
      normalizeValue(searchHaystack).includes(normalizeValue(searchQuery));
    const matchesBranch = branchFilter === "all" || student.branch === branchFilter;
    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "low" && student.isLowAttendance) ||
      (riskFilter === "unsynced" && student.isUnsynced) ||
      (riskFilter === "absent" && attendance[student.id] === false);

    return matchesSearch && matchesBranch && matchesRisk;
  });

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;
  const visiblePresentCount = filteredStudents.filter((student) => attendance[student.id] !== false).length;
  const lowAttendanceCount = enrichedStudents.filter((student) => student.isLowAttendance).length;
  const unsyncedCount = enrichedStudents.filter((student) => student.isUnsynced).length;

  const resetRoster = () => {
    setStudents([]);
    setAttendance({});
    setBranchFilter("all");
    setRiskFilter("all");
    setSearchQuery("");
    setMessage({ text: "", type: "" });
  };

  const handleFetchStudents = async () => {
    if (!subject.trim()) {
      setMessage({
        text: "Choose or enter a subject first so the Magic Filter can match SLCM attendance.",
        type: "error",
      });
      return;
    }

    setMessage({ text: "", type: "" });
    setIsFetching(true);

    try {
      const studentQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("batch", "==", batch)
      );
      const snapshot = await getDocs(studentQuery);

      const roster: StudentRecord[] = snapshot.docs
        .map((studentDoc) => ({
          id: studentDoc.id,
          ...(studentDoc.data() as Omit<StudentRecord, "id">),
        }))
        .sort((firstStudent, secondStudent) =>
          (firstStudent.rollNo ?? "").localeCompare(secondStudent.rollNo ?? "")
        );

      const defaultAttendance = roster.reduce<AttendanceState>((accumulator, student) => {
        accumulator[student.id] = true;
        return accumulator;
      }, {});

      setStudents(roster);
      setAttendance(defaultAttendance);
      setBranchFilter("all");
      setRiskFilter("all");
      setSearchQuery("");

      if (roster.length === 0) {
        setMessage({
          text: "No students were found for this batch. Try a different batch or verify user profiles.",
          type: "error",
        });
      } else {
        setMessage({
          text: `Loaded ${roster.length} students for batch ${batch}. Subject insight is now filtered against ${subject.trim()}.`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setMessage({
        text: "We could not load the roster from Firestore. Please try again.",
        type: "error",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const toggleAttendance = (studentId: string, isPresent: boolean) => {
    setAttendance((currentAttendance) => ({
      ...currentAttendance,
      [studentId]: isPresent,
    }));
  };

  const markVisibleStudents = (isPresent: boolean) => {
    setAttendance((currentAttendance) => {
      const nextAttendance = { ...currentAttendance };

      filteredStudents.forEach((student) => {
        nextAttendance[student.id] = isPresent;
      });

      return nextAttendance;
    });
  };

  const handleSubmitAttendance = async () => {
    if (!facultyUser) {
      setMessage({
        text: "Your session expired. Please sign in again before submitting attendance.",
        type: "error",
      });
      return;
    }

    if (!subject.trim() || students.length === 0) {
      setMessage({
        text: "Load a roster first before submitting attendance.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      await addDoc(collection(db, "attendance"), {
        facultyId: facultyUser.uid,
        facultyName: facultyProfile?.name ?? facultyUser.email ?? "Faculty",
        batch,
        subject: subject.trim(),
        date,
        records: attendance,
        presentCount,
        absentCount,
        filters: {
          branchFilter,
          riskFilter,
          searchQuery,
        },
        createdAt: new Date().toISOString(),
        timestamp: new Date(),
      });

      setMessage({
        text: `Attendance saved for ${subject.trim()} on ${date}. ${absentCount} student(s) marked absent.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setMessage({
        text: "Attendance could not be saved. Please retry once your connection is stable.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading faculty workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-start mb-6">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-[#0096FF] flex items-center transition"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>

        <motion.div
          className="mb-8 rounded-[2rem] border border-gray-800 bg-gradient-to-br from-gray-900 via-black to-gray-950 p-8 shadow-[0_0_40px_rgba(0,150,255,0.08)]"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center rounded-full border border-[#0096FF]/30 bg-[#0096FF]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-[#7fc9ff]">
                Magic Filter
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF]">
                Faculty Attendance Hub
              </h1>
              <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
                Load a class roster, match subject-specific SLCM attendance, flag risk
                students instantly, and submit the day&apos;s attendance from one screen.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-5 py-4 text-sm">
              <p className="text-gray-500 uppercase tracking-[0.25em] text-xs">Faculty Focus</p>
              <p className="mt-2 text-lg font-bold text-white">
                {facultyProfile?.name ?? facultyUser?.email ?? "Faculty Member"}
              </p>
              <p className="mt-1 text-gray-400">
                {facultyProfile?.designation ?? "Attendance coordinator"}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mb-8 rounded-3xl border border-gray-800 bg-gray-900 p-6 md:p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <div className="mb-6 flex items-center gap-3">
            <FaFilter className="text-[#0096FF]" />
            <h2 className="text-2xl font-bold">Class Controls</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Batch
              </span>
              <select
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
              >
                {AVAILABLE_BATCHES.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g. Data Structures"
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Session Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
              />
            </label>
          </div>

          {facultySubjects.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {facultySubjects.map((facultySubject) => {
                const isActive = normalizeValue(facultySubject) === normalizeValue(subject);

                return (
                  <button
                    key={facultySubject}
                    onClick={() => setSubject(facultySubject)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-[#0096FF] bg-[#0096FF] text-black"
                        : "border-gray-700 bg-black text-gray-300 hover:border-[#0096FF] hover:text-white"
                    }`}
                  >
                    {facultySubject}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {students.length > 0 && (
              <button
                onClick={resetRoster}
                className="rounded-2xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-black"
              >
                Clear Workspace
              </button>
            )}

            <button
              onClick={handleFetchStudents}
              disabled={isFetching}
              className="rounded-2xl bg-[#0096FF] px-5 py-3 font-bold text-black transition hover:bg-[#0a84d1] disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              {isFetching ? "Loading Roster..." : "Load Subject Roster"}
            </button>
          </div>

          {message.text && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                message.type === "error"
                  ? "border-red-800 bg-red-950/40 text-red-200"
                  : "border-emerald-800 bg-emerald-950/40 text-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </motion.div>

        {students.length > 0 && (
          <>
            <motion.div
              className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Roster Size</p>
                <p className="mt-3 text-4xl font-black text-white">{students.length}</p>
                <p className="mt-2 text-sm text-gray-400">Students loaded for batch {batch}</p>
              </div>

              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Low Attendance</p>
                <p className="mt-3 text-4xl font-black text-red-400">{lowAttendanceCount}</p>
                <p className="mt-2 text-sm text-gray-400">Below 75% for {subject.trim()}</p>
              </div>

              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Missing Sync</p>
                <p className="mt-3 text-4xl font-black text-amber-300">{unsyncedCount}</p>
                <p className="mt-2 text-sm text-gray-400">No matching SLCM subject data found</p>
              </div>

              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Today&apos;s Call</p>
                <p className="mt-3 text-4xl font-black text-emerald-400">{presentCount}</p>
                <p className="mt-2 text-sm text-gray-400">{absentCount} student(s) marked absent</p>
              </div>
            </motion.div>

            <motion.div
              className="mb-8 rounded-3xl border border-gray-800 bg-gray-900 p-6"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Search
                  </span>
                  <div className="flex items-center rounded-2xl border border-gray-700 bg-black px-4">
                    <FaSearch className="text-gray-500" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by name, roll number, or branch"
                      className="w-full bg-transparent px-3 py-3 text-white placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Branch Filter
                  </span>
                  <select
                    value={branchFilter}
                    onChange={(event) => setBranchFilter(event.target.value)}
                    className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
                  >
                    <option value="all">All branches</option>
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Risk View
                  </span>
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
                    className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
                  >
                    <option value="all">Show entire roster</option>
                    <option value="low">Low attendance only</option>
                    <option value="unsynced">Missing sync only</option>
                    <option value="absent">Marked absent only</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <span className="rounded-full border border-gray-700 px-4 py-2">
                    Visible: <span className="font-bold text-white">{filteredStudents.length}</span>
                  </span>
                  <span className="rounded-full border border-gray-700 px-4 py-2">
                    Visible Present:{" "}
                    <span className="font-bold text-white">{visiblePresentCount}</span>
                  </span>
                  <span className="rounded-full border border-gray-700 px-4 py-2">
                    Visible Absent:{" "}
                    <span className="font-bold text-white">
                      {filteredStudents.length - visiblePresentCount}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => markVisibleStudents(true)}
                    className="rounded-2xl border border-emerald-700/40 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:border-emerald-500"
                  >
                    Mark Visible Present
                  </button>
                  <button
                    onClick={() => markVisibleStudents(false)}
                    className="rounded-2xl border border-red-700/40 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition hover:border-red-500"
                  >
                    Mark Visible Absent
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div className="flex flex-col gap-4 border-b border-gray-800 bg-black/60 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                    <FaUsers className="text-[#0096FF]" />
                    Subject Roster Intelligence
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Faculty can see the latest subject signal from SLCM and make the
                    day&apos;s attendance decision in the same flow.
                  </p>
                </div>

                <button
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting}
                  className="rounded-2xl bg-[#0096FF] px-6 py-3 font-bold text-black transition hover:bg-[#0a84d1] disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  {isSubmitting ? "Submitting..." : "Submit Attendance"}
                </button>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FaFilter className="mx-auto text-3xl text-gray-600" />
                  <h3 className="mt-4 text-2xl font-bold text-white">No students match these filters</h3>
                  <p className="mt-2 text-gray-400">
                    Broaden the search, reset branch selection, or switch the risk view.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-black text-xs uppercase tracking-[0.25em] text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Roll No</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4">Subject Signal</th>
                        <th className="px-6 py-4">Last Sync</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredStudents.map((student) => {
                        const isPresent = attendance[student.id] !== false;

                        return (
                          <tr
                            key={student.id}
                            className={`transition hover:bg-gray-800/50 ${
                              student.isLowAttendance ? "bg-red-950/10" : ""
                            }`}
                          >
                            <td className="px-6 py-5 align-top font-mono text-sm text-gray-300">
                              {student.rollNo?.toUpperCase() ?? "N/A"}
                            </td>
                            <td className="px-6 py-5 align-top">
                              <p className="text-base font-bold text-white">{student.displayName}</p>
                              <p className="mt-1 text-sm text-gray-400">
                                {student.email ?? student.username ?? "Student profile"}
                              </p>
                            </td>
                            <td className="px-6 py-5 align-top text-sm text-gray-300">
                              {student.branch ?? "Not specified"}
                            </td>
                            <td className="px-6 py-5 align-top">
                              {student.subjectInsight ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    {student.isLowAttendance ? (
                                      <FaExclamationTriangle className="text-red-400" />
                                    ) : (
                                      <FaCheckCircle className="text-emerald-400" />
                                    )}
                                    <span
                                      className={`text-sm font-bold ${
                                        student.isLowAttendance ? "text-red-300" : "text-emerald-300"
                                      }`}
                                    >
                                      {student.percentageLabel}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {formatValue(student.subjectInsight.attendedClasses)} attended /{" "}
                                    {formatValue(student.subjectInsight.totalClasses)} total
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 text-sm text-amber-300">
                                  <div className="flex items-center gap-2">
                                    <FaSyncAlt />
                                    <span>No matching subject data</span>
                                  </div>
                                  <p className="text-gray-500">
                                    Student needs a fresh SLCM sync or the subject name differs.
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-5 align-top text-sm text-gray-300">
                              {student.lastSyncedLabel}
                            </td>
                            <td className="px-6 py-5 align-top">
                              <div className="flex flex-col items-center gap-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                                    isPresent
                                      ? "bg-emerald-500/15 text-emerald-300"
                                      : "bg-red-500/15 text-red-300"
                                  }`}
                                >
                                  {isPresent ? "Present" : "Absent"}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleAttendance(student.id, true)}
                                    className={`rounded-full p-3 transition ${
                                      isPresent
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : "bg-black text-gray-500 hover:text-emerald-300"
                                    }`}
                                    title="Mark Present"
                                  >
                                    <FaCheckCircle />
                                  </button>
                                  <button
                                    onClick={() => toggleAttendance(student.id, false)}
                                    className={`rounded-full p-3 transition ${
                                      !isPresent
                                        ? "bg-red-500/15 text-red-300"
                                        : "bg-black text-gray-500 hover:text-red-300"
                                    }`}
                                    title="Mark Absent"
                                  >
                                    <FaTimesCircle />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
