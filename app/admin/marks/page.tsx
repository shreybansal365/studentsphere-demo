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
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGraduationCap,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

type MessageState = {
  text: string;
  type: "success" | "error" | "";
};

interface FacultyProfile {
  uid: string;
  name?: string;
  subjects?: string[] | string;
}

interface StudentRecord {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  rollNo?: string;
  branch?: string;
  batch?: string;
}

interface MarksUploadRecord {
  id: string;
  subject?: string;
  examType?: string;
  batch?: string;
  timestamp?: string;
  createdAt?: string;
  records?: Record<string, number | string>;
}

const AVAILABLE_BATCHES = ["2026", "2027", "2028", "2029"];
const EXAM_TYPES = ["Mid Term", "End Term", "Assignment", "Quiz", "Lab"];

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

const formatDateTime = (value?: string) => {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const parseScore = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

export default function FacultyMarksDashboard() {
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const [batch, setBatch] = useState("2026");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("Mid Term");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [history, setHistory] = useState<MarksUploadRecord[]>([]);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const router = useRouter();

  const loadHistory = async (uid: string) => {
    try {
      const marksQuery = query(collection(db, "marks"), where("facultyId", "==", uid));
      const snapshot = await getDocs(marksQuery);

      const uploads = snapshot.docs
        .map((markDoc) => ({
          id: markDoc.id,
          ...(markDoc.data() as Omit<MarksUploadRecord, "id">),
        }))
        .sort((firstUpload, secondUpload) => {
          const firstTime = new Date(firstUpload.timestamp || firstUpload.createdAt || 0).getTime();
          const secondTime = new Date(secondUpload.timestamp || secondUpload.createdAt || 0).getTime();
          return secondTime - firstTime;
        });

      setHistory(uploads);
    } catch (error) {
      console.error("Error loading mark history:", error);
    }
  };

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

        await loadHistory(currentUser.uid);
      } catch (error) {
        console.error("Error loading faculty marks workspace:", error);
        setMessage({
          text: "Your faculty marks workspace did not load correctly. You can still enter details manually.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const facultySubjects = extractSubjectOptions(facultyProfile?.subjects);

  const branchOptions = Array.from(
    new Set(students.map((student) => student.branch).filter(Boolean))
  ) as string[];

  const filteredStudents = students.filter((student) => {
    const matchesBranch = branchFilter === "all" || student.branch === branchFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      normalizeValue(
        `${student.name ?? ""} ${student.username ?? ""} ${student.rollNo ?? ""} ${student.branch ?? ""}`
      ).includes(normalizeValue(searchQuery));

    return matchesBranch && matchesSearch;
  });

  const scoreEntries = students.map((student) => {
    const rawScore = marks[student.id] ?? "";
    const parsedScore = parseScore(rawScore);
    const isBlank = rawScore.trim() === "";
    const isInvalid = !isBlank && (parsedScore === null || parsedScore < 0 || parsedScore > 100);

    return {
      studentId: student.id,
      rawScore,
      parsedScore,
      isBlank,
      isInvalid,
    };
  });

  const gradedEntries = scoreEntries.filter(
    (entry) => !entry.isBlank && !entry.isInvalid && entry.parsedScore !== null
  );
  const invalidCount = scoreEntries.filter((entry) => entry.isInvalid).length;
  const incompleteCount = scoreEntries.filter((entry) => entry.isBlank).length;
  const averageScore =
    gradedEntries.length > 0
      ? (
          gradedEntries.reduce(
            (total, entry) => total + (entry.parsedScore ?? 0),
            0
          ) / gradedEntries.length
        ).toFixed(1)
      : "0.0";
  const highestScore =
    gradedEntries.length > 0
      ? Math.max(...gradedEntries.map((entry) => entry.parsedScore ?? 0))
      : 0;

  const handleFetchStudents = async () => {
    if (!subject.trim()) {
      setMessage({
        text: "Enter a subject first so the grading workspace knows which roster you are preparing.",
        type: "error",
      });
      return;
    }

    setIsFetching(true);
    setMessage({ text: "", type: "" });

    try {
      const studentQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("batch", "==", batch)
      );
      const snapshot = await getDocs(studentQuery);

      const roster = snapshot.docs
        .map((studentDoc) => ({
          id: studentDoc.id,
          ...(studentDoc.data() as Omit<StudentRecord, "id">),
        }))
        .sort((firstStudent, secondStudent) =>
          (firstStudent.rollNo ?? "").localeCompare(secondStudent.rollNo ?? "")
        );

      setStudents(roster);
      setMarks({});
      setSearchQuery("");
      setBranchFilter("all");

      if (roster.length === 0) {
        setMessage({
          text: `No students were found for batch ${batch}.`,
          type: "error",
        });
      } else {
        setMessage({
          text: `Loaded ${roster.length} students for ${subject.trim()} ${examType}.`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error loading roster for marks:", error);
      setMessage({
        text: "The student roster could not be loaded. Please try again.",
        type: "error",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const updateScore = (studentId: string, value: string) => {
    setMarks((currentMarks) => ({
      ...currentMarks,
      [studentId]: value,
    }));
  };

  const fillVisibleStudents = (value: string) => {
    setMarks((currentMarks) => {
      const nextMarks = { ...currentMarks };

      filteredStudents.forEach((student) => {
        nextMarks[student.id] = value;
      });

      return nextMarks;
    });
  };

  const clearWorkspace = () => {
    setStudents([]);
    setMarks({});
    setSearchQuery("");
    setBranchFilter("all");
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async () => {
    if (!facultyUser) {
      setMessage({
        text: "Your session expired. Please sign in again before uploading marks.",
        type: "error",
      });
      return;
    }

    if (students.length === 0) {
      setMessage({
        text: "Load a roster before uploading marks.",
        type: "error",
      });
      return;
    }

    if (invalidCount > 0 || incompleteCount > 0) {
      setMessage({
        text: "Every student needs a score from 0 to 100 before you can submit this sheet.",
        type: "error",
      });
      return;
    }

    const records = scoreEntries.reduce<Record<string, string>>((accumulator, entry) => {
      if (entry.parsedScore !== null) {
        accumulator[entry.studentId] = String(entry.parsedScore);
      }

      return accumulator;
    }, {});

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const now = new Date().toISOString();

      await addDoc(collection(db, "marks"), {
        facultyId: facultyUser.uid,
        facultyName: facultyProfile?.name ?? facultyUser.email ?? "Faculty",
        batch,
        subject: subject.trim(),
        examType,
        records,
        gradedCount: Object.keys(records).length,
        averageScore: Number(averageScore),
        highestScore,
        timestamp: now,
        createdAt: now,
      });

      clearWorkspace();
      setMessage({
        text: `Marks uploaded for ${subject.trim()} ${examType}.`,
        type: "success",
      });
      await loadHistory(facultyUser.uid);
    } catch (error) {
      console.error("Error uploading marks:", error);
      setMessage({
        text: "Marks could not be uploaded. Please retry.",
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
                Grading Desk
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF]">
                Faculty Marks Uploader
              </h1>
              <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
                Load a batch roster, validate every score before submission, and keep
                recent grading runs visible in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-5 py-4 text-sm">
              <p className="text-gray-500 uppercase tracking-[0.25em] text-xs">Faculty Focus</p>
              <p className="mt-2 text-lg font-bold text-white">
                {facultyProfile?.name ?? facultyUser?.email ?? "Faculty Member"}
              </p>
              <p className="mt-1 text-gray-400">{history.length} previous upload(s)</p>
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
            <FaGraduationCap className="text-[#0096FF]" />
            <h2 className="text-2xl font-bold">Grading Controls</h2>
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
                placeholder="e.g. Operating Systems"
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Exam Type
              </span>
              <select
                value={examType}
                onChange={(event) => setExamType(event.target.value)}
                className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
                onClick={clearWorkspace}
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
              {isFetching ? "Loading Roster..." : "Load Grading Sheet"}
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
                <p className="mt-2 text-sm text-gray-400">Students ready for grading</p>
              </div>

              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Graded</p>
                <p className="mt-3 text-4xl font-black text-emerald-400">{gradedEntries.length}</p>
                <p className="mt-2 text-sm text-gray-400">{incompleteCount} still blank</p>
              </div>

              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Average</p>
                <p className="mt-3 text-4xl font-black text-cyan-300">{averageScore}</p>
                <p className="mt-2 text-sm text-gray-400">Across valid entries only</p>
              </div>

              <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Validation</p>
                <p className="mt-3 text-4xl font-black text-amber-300">{invalidCount}</p>
                <p className="mt-2 text-sm text-gray-400">Scores outside 0 to 100</p>
              </div>
            </motion.div>

            <motion.div
              className="mb-8 rounded-3xl border border-gray-800 bg-gray-900 p-6"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
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
              </div>

              <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <span className="rounded-full border border-gray-700 px-4 py-2">
                    Visible: <span className="font-bold text-white">{filteredStudents.length}</span>
                  </span>
                  <span className="rounded-full border border-gray-700 px-4 py-2">
                    Highest: <span className="font-bold text-white">{highestScore}</span>
                  </span>
                  <span className="rounded-full border border-gray-700 px-4 py-2">
                    Ready to Submit:{" "}
                    <span className="font-bold text-white">
                      {invalidCount === 0 && incompleteCount === 0 ? "Yes" : "No"}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => fillVisibleStudents("0")}
                    className="rounded-2xl border border-amber-700/40 bg-amber-500/10 px-5 py-3 font-semibold text-amber-300 transition hover:border-amber-500"
                  >
                    Fill Visible With 0
                  </button>
                  <button
                    onClick={() => fillVisibleStudents("")}
                    className="rounded-2xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-black"
                  >
                    Clear Visible
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
                    Grading Sheet
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Every student needs a score between 0 and 100 before submission.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-2xl bg-[#0096FF] px-6 py-3 font-bold text-black transition hover:bg-[#0a84d1] disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  {isSubmitting ? "Uploading..." : "Submit Marks"}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-black text-xs uppercase tracking-[0.25em] text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Roll No</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Score / 100</th>
                      <th className="px-6 py-4">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredStudents.map((student) => {
                      const rawScore = marks[student.id] ?? "";
                      const parsedScore = parseScore(rawScore);
                      const isBlank = rawScore.trim() === "";
                      const isInvalid =
                        !isBlank && (parsedScore === null || parsedScore < 0 || parsedScore > 100);

                      return (
                        <tr key={student.id} className="transition hover:bg-gray-800/50">
                          <td className="px-6 py-5 align-top font-mono text-sm text-gray-300">
                            {student.rollNo?.toUpperCase() ?? "N/A"}
                          </td>
                          <td className="px-6 py-5 align-top">
                            <p className="text-base font-bold text-white">
                              {student.name ?? student.username ?? "Unnamed Student"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {student.email ?? student.username ?? "Student profile"}
                            </p>
                          </td>
                          <td className="px-6 py-5 align-top text-sm text-gray-300">
                            {student.branch ?? "Not specified"}
                          </td>
                          <td className="px-6 py-5 align-top">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rawScore}
                              onChange={(event) => updateScore(student.id, event.target.value)}
                              placeholder="0"
                              className={`w-28 rounded-2xl border px-4 py-3 text-center text-lg font-bold text-white focus:outline-none ${
                                isInvalid
                                  ? "border-red-500 bg-red-950/20 focus:border-red-400"
                                  : "border-gray-700 bg-black focus:border-[#0096FF]"
                              }`}
                            />
                          </td>
                          <td className="px-6 py-5 align-top">
                            {isBlank ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                                <FaExclamationTriangle />
                                Pending
                              </span>
                            ) : isInvalid ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                                <FaExclamationTriangle />
                                Invalid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                                <FaCheckCircle />
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        <motion.div
          className="mt-8 rounded-3xl border border-gray-800 bg-gray-900 p-6"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
        >
          <div className="mb-6 flex items-center gap-3">
            <FaChartLine className="text-[#0096FF]" />
            <h2 className="text-2xl font-bold">Recent Uploads</h2>
          </div>

          {history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-700 bg-black/40 px-6 py-14 text-center">
              <FaGraduationCap className="mx-auto text-3xl text-gray-600" />
              <h3 className="mt-4 text-2xl font-bold text-white">No marks uploaded yet</h3>
              <p className="mt-2 text-gray-400">
                Your recent grading runs will appear here once the first sheet is submitted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {history.slice(0, 6).map((upload) => {
                const gradedCount = upload.records ? Object.keys(upload.records).length : 0;

                return (
                  <div
                    key={upload.id}
                    className="rounded-3xl border border-gray-800 bg-black/60 p-6 shadow-lg"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#0096FF]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#7fc9ff]">
                        {upload.subject ?? "Subject"}
                      </span>
                      <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
                        {upload.examType ?? "Exam"}
                      </span>
                      <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
                        Batch {upload.batch ?? "--"}
                      </span>
                    </div>

                    <p className="mt-4 text-lg font-bold text-white">{gradedCount} graded students</p>
                    <p className="mt-2 text-sm text-gray-400">
                      Uploaded {formatDateTime(upload.timestamp || upload.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
