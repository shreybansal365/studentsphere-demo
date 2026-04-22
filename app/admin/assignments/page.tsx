"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import {
  FaArrowLeft,
  FaClock,
  FaEdit,
  FaPlusCircle,
  FaTasks,
  FaTrash,
} from "react-icons/fa";

type MessageState = {
  text: string;
  type: "success" | "error" | "";
};

type AssignmentFilter = "all" | "upcoming" | "dueSoon" | "overdue";

interface FacultyProfile {
  uid: string;
  name?: string;
  subjects?: string[] | string;
}

interface AssignmentFormState {
  title: string;
  subject: string;
  batch: string;
  deadline: string;
  description: string;
}

interface AssignmentRecord extends AssignmentFormState {
  id: string;
  facultyId: string;
  facultyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AVAILABLE_BATCHES = ["2026", "2027", "2028", "2029"];

const emptyFormState: AssignmentFormState = {
  title: "",
  subject: "",
  batch: "2026",
  deadline: "",
  description: "",
};

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

const formatDate = (value: string) => {
  if (!value) {
    return "No deadline";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDueState = (deadline: string): AssignmentFilter => {
  if (!deadline) {
    return "upcoming";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${deadline}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  const differenceInDays = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (differenceInDays < 0) {
    return "overdue";
  }

  if (differenceInDays <= 3) {
    return "dueSoon";
  }

  return "upcoming";
};

export default function FacultyAssignmentsDashboard() {
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });

  const [formState, setFormState] = useState<AssignmentFormState>(emptyFormState);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AssignmentFilter>("all");

  const auth = getAuth(app);
  const db = getFirestore(app);
  const router = useRouter();

  const loadAssignments = async (uid: string) => {
    setIsRefreshing(true);

    try {
      const assignmentQuery = query(collection(db, "assignments"), where("facultyId", "==", uid));
      const snapshot = await getDocs(assignmentQuery);

      const fetchedAssignments = snapshot.docs
        .map((assignmentDoc) => ({
          id: assignmentDoc.id,
          ...(assignmentDoc.data() as Omit<AssignmentRecord, "id">),
        }))
        .sort((firstAssignment, secondAssignment) => {
          const firstTime = new Date(firstAssignment.deadline || firstAssignment.createdAt || 0).getTime();
          const secondTime = new Date(secondAssignment.deadline || secondAssignment.createdAt || 0).getTime();
          return firstTime - secondTime;
        });

      setAssignments(fetchedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setMessage({
        text: "Assignments could not be loaded right now. Please retry in a moment.",
        type: "error",
      });
    } finally {
      setIsRefreshing(false);
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
          setFormState((currentForm) => ({
            ...currentForm,
            subject: currentForm.subject || subjectOptions[0] || "",
          }));
        }

        await loadAssignments(currentUser.uid);
      } catch (error) {
        console.error("Error loading faculty assignment data:", error);
        setMessage({
          text: "Your faculty workspace did not load correctly. You can still try refreshing.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const facultySubjects = extractSubjectOptions(facultyProfile?.subjects);

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesBatch = batchFilter === "all" || assignment.batch === batchFilter;
    const matchesStatus =
      statusFilter === "all" || getDueState(assignment.deadline) === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      normalizeValue(
        `${assignment.title} ${assignment.subject} ${assignment.description} ${assignment.batch}`
      ).includes(normalizeValue(searchQuery));

    return matchesBatch && matchesStatus && matchesSearch;
  });

  const upcomingCount = assignments.filter(
    (assignment) => getDueState(assignment.deadline) === "upcoming"
  ).length;
  const dueSoonCount = assignments.filter(
    (assignment) => getDueState(assignment.deadline) === "dueSoon"
  ).length;
  const overdueCount = assignments.filter(
    (assignment) => getDueState(assignment.deadline) === "overdue"
  ).length;

  const updateFormField = <K extends keyof AssignmentFormState>(
    key: K,
    value: AssignmentFormState[K]
  ) => {
    setFormState((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setFormState((currentForm) => ({
      ...emptyFormState,
      batch: currentForm.batch || "2026",
      subject: facultySubjects[0] || "",
    }));
    setEditingAssignmentId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!facultyUser) {
      setMessage({
        text: "Your session expired. Please sign in again before saving assignments.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    setMessage({ text: "", type: "" });

    const payload = {
      facultyId: facultyUser.uid,
      facultyName: facultyProfile?.name ?? facultyUser.email ?? "Faculty",
      batch: formState.batch,
      subject: formState.subject.trim(),
      title: formState.title.trim(),
      description: formState.description.trim(),
      deadline: formState.deadline,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingAssignmentId) {
        await updateDoc(doc(db, "assignments", editingAssignmentId), payload);
        setMessage({
          text: "Assignment updated successfully.",
          type: "success",
        });
      } else {
        await addDoc(collection(db, "assignments"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        setMessage({
          text: "Assignment created successfully.",
          type: "success",
        });
      }

      await loadAssignments(facultyUser.uid);
      resetForm();
    } catch (error) {
      console.error("Error saving assignment:", error);
      setMessage({
        text: "We could not save this assignment. Please retry.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (assignment: AssignmentRecord) => {
    setEditingAssignmentId(assignment.id);
    setFormState({
      title: assignment.title,
      subject: assignment.subject,
      batch: assignment.batch,
      deadline: assignment.deadline,
      description: assignment.description,
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!facultyUser) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this assignment? Students in the same batch will stop seeing it."
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteDoc(doc(db, "assignments", assignmentId));
      setMessage({
        text: "Assignment deleted successfully.",
        type: "success",
      });
      await loadAssignments(facultyUser.uid);

      if (editingAssignmentId === assignmentId) {
        resetForm();
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      setMessage({
        text: "Assignment could not be deleted. Please retry.",
        type: "error",
      });
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
                Assignment Studio
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#0096FF]">
                Faculty Assignment Manager
              </h1>
              <p className="mt-4 max-w-3xl text-base text-gray-400 md:text-lg">
                Create, revise, and retire assignments from one workspace while
                keeping deadlines and batch visibility easy to track.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 px-5 py-4 text-sm">
              <p className="text-gray-500 uppercase tracking-[0.25em] text-xs">Faculty Focus</p>
              <p className="mt-2 text-lg font-bold text-white">
                {facultyProfile?.name ?? facultyUser?.email ?? "Faculty Member"}
              </p>
              <p className="mt-1 text-gray-400">
                {assignments.length} total assignment{assignments.length === 1 ? "" : "s"}
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
            {editingAssignmentId ? (
              <FaEdit className="text-[#0096FF]" />
            ) : (
              <FaPlusCircle className="text-[#0096FF]" />
            )}
            <h2 className="text-2xl font-bold">
              {editingAssignmentId ? "Edit Assignment" : "Create Assignment"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Title
                </span>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) => updateFormField("title", event.target.value)}
                  placeholder="e.g. Unit 4 Problem Set"
                  required
                  className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Subject
                </span>
                <input
                  type="text"
                  value={formState.subject}
                  onChange={(event) => updateFormField("subject", event.target.value)}
                  placeholder="e.g. Data Structures"
                  required
                  className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Batch
                </span>
                <select
                  value={formState.batch}
                  onChange={(event) => updateFormField("batch", event.target.value)}
                  className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
                >
                  {AVAILABLE_BATCHES.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {facultySubjects.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {facultySubjects.map((facultySubject) => {
                  const isActive = normalizeValue(facultySubject) === normalizeValue(formState.subject);

                  return (
                    <button
                      type="button"
                      key={facultySubject}
                      onClick={() => updateFormField("subject", facultySubject)}
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Deadline
                </span>
                <input
                  type="date"
                  value={formState.deadline}
                  onChange={(event) => updateFormField("deadline", event.target.value)}
                  required
                  className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Description
                </span>
                <textarea
                  value={formState.description}
                  onChange={(event) => updateFormField("description", event.target.value)}
                  placeholder="Explain the task, deliverables, and submission expectations."
                  required
                  rows={5}
                  className="rounded-3xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {editingAssignmentId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-black"
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-[#0096FF] px-5 py-3 font-bold text-black transition hover:bg-[#0a84d1] disabled:cursor-not-allowed disabled:bg-gray-600"
              >
                {isSaving
                  ? "Saving..."
                  : editingAssignmentId
                    ? "Update Assignment"
                    : "Create Assignment"}
              </button>
            </div>
          </form>

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

        <motion.div
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Total</p>
            <p className="mt-3 text-4xl font-black text-white">{assignments.length}</p>
            <p className="mt-2 text-sm text-gray-400">Assignments owned by this faculty profile</p>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Upcoming</p>
            <p className="mt-3 text-4xl font-black text-cyan-300">{upcomingCount}</p>
            <p className="mt-2 text-sm text-gray-400">Healthy runway before deadline</p>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Due Soon</p>
            <p className="mt-3 text-4xl font-black text-amber-300">{dueSoonCount}</p>
            <p className="mt-2 text-sm text-gray-400">Due within the next three days</p>
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Overdue</p>
            <p className="mt-3 text-4xl font-black text-red-400">{overdueCount}</p>
            <p className="mt-2 text-sm text-gray-400">Worth closing or replacing soon</p>
          </div>
        </motion.div>

        <motion.div
          className="rounded-3xl border border-gray-800 bg-gray-900 p-6"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                <FaTasks className="text-[#0096FF]" />
                Assignment Queue
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Review by deadline pressure, filter by batch, and jump straight into edits.
              </p>
            </div>

            <button
              onClick={() => {
                if (facultyUser) {
                  void loadAssignments(facultyUser.uid);
                }
              }}
              className="rounded-2xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-black"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_220px_240px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, subject, description, or batch"
              className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white placeholder:text-gray-600 focus:border-[#0096FF] focus:outline-none"
            />

            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
            >
              <option value="all">All batches</option>
              {AVAILABLE_BATCHES.map((year) => (
                <option key={year} value={year}>
                  Batch {year}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AssignmentFilter)}
              className="rounded-2xl border border-gray-700 bg-black px-4 py-3 text-white focus:border-[#0096FF] focus:outline-none"
            >
              <option value="all">All deadlines</option>
              <option value="upcoming">Upcoming</option>
              <option value="dueSoon">Due soon</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-700 bg-black/40 px-6 py-14 text-center">
              <FaClock className="mx-auto text-3xl text-gray-600" />
              <h3 className="mt-4 text-2xl font-bold text-white">No assignments match this view</h3>
              <p className="mt-2 text-gray-400">
                Adjust the search or filters, or publish the first assignment for this faculty profile.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredAssignments.map((assignment) => {
                const dueState = getDueState(assignment.deadline);

                return (
                  <div
                    key={assignment.id}
                    className="rounded-3xl border border-gray-800 bg-black/60 p-6 shadow-lg"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#0096FF]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#7fc9ff]">
                            {assignment.subject}
                          </span>
                          <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">
                            Batch {assignment.batch}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                              dueState === "overdue"
                                ? "bg-red-500/15 text-red-300"
                                : dueState === "dueSoon"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-emerald-500/15 text-emerald-300"
                            }`}
                          >
                            {dueState === "dueSoon"
                              ? "Due Soon"
                              : dueState === "overdue"
                                ? "Overdue"
                                : "Upcoming"}
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-bold text-white">{assignment.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-gray-400">
                          {assignment.description}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-gray-300">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Deadline</p>
                        <p className="mt-2 font-bold text-white">{formatDate(assignment.deadline)}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="rounded-2xl border border-gray-700 px-5 py-3 font-semibold text-gray-200 transition hover:border-[#0096FF] hover:text-white"
                      >
                        <FaEdit className="mr-2 inline" />
                        Edit
                      </button>
                      <button
                        onClick={() => void handleDelete(assignment.id)}
                        className="rounded-2xl border border-red-800/50 px-5 py-3 font-semibold text-red-300 transition hover:border-red-500 hover:bg-red-950/20"
                      >
                        <FaTrash className="mr-2 inline" />
                        Delete
                      </button>
                    </div>
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
