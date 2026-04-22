"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FaArrowLeft, FaPaperPlane, FaRobot, FaBolt, FaDatabase, FaSpinner } from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { fetchStudentAcademicBundle } from "@/lib/student-data";
import { buildAttendanceInsights, buildChatbotAcademicContext, buildLiveReminders } from "@/lib/academic";
import { motion, AnimatePresence } from "framer-motion";

const quickActions = [
  { label: "📊 My Attendance", prompt: "Give me a detailed breakdown of my attendance for all subjects with risk levels and how many classes I can safely miss." },
  { label: "📅 Today's Classes", prompt: "What classes do I have today? Include timings and room numbers." },
  { label: "⏰ Upcoming Deadlines", prompt: "What are my upcoming assignment deadlines? List them with subjects and dates." },
  { label: "📈 GPA Projection", prompt: "Based on my current marks, what's my estimated GPA? How can I improve it?" },
  { label: "💬 Forum Latest", prompt: "What are the latest discussions on the student forum?" },
  { label: "🔔 My Reminders", prompt: "Show me all my active reminders and alerts." },
];

export default function Chatbot() {
  const [msgs, setMsgs] = useState([
    {
      sender: "bot",
      text: "Hey! I'm **SphereAI** — your intelligent campus assistant. I have live access to your attendance, timetable, marks, assignments, forum, events, notifications, and study resources. Ask me literally anything about your academic life! 🚀",
    },
  ]);
  const [inp, setInp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [academicContext, setAcademicContext] = useState("");
  const [dataStatus, setDataStatus] = useState<string[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const auth = getAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs, isLoading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const academicBundle = await fetchStudentAcademicBundle(user.uid);
      if (!academicBundle) return;

      const attendanceInsights = buildAttendanceInsights(
        academicBundle.slcmAttendance,
        academicBundle.attendanceRecords
      );

      const reminders = buildLiveReminders({
        attendanceInsights,
        assignments: academicBundle.assignments,
        marks: academicBundle.marks,
        timetableSlots: academicBundle.timetableSlots,
      });

      const profileSummary = `I am a student at Manipal University Jaipur. My name is ${
        academicBundle.profile.name || academicBundle.profile.username || "unknown"
      }, my email is ${academicBundle.profile.email}, my branch is ${
        academicBundle.profile.branch
      }, batch: ${academicBundle.profile.batch}, roll number: ${academicBundle.profile.rollNo || "unknown"}.`;

      setAcademicContext(
        buildChatbotAcademicContext({
          profileSummary,
          attendanceInsights,
          assignments: academicBundle.assignments,
          marks: academicBundle.marks,
          timetableSlots: academicBundle.timetableSlots,
          reminders,
          forumPosts: academicBundle.forumPosts,
          events: academicBundle.events,
          notifications: academicBundle.notifications,
          resources: academicBundle.resources,
        })
      );

      // Build data status indicators
      const status: string[] = [];
      if (attendanceInsights.length > 0) status.push(`${attendanceInsights.length} subjects`);
      if (academicBundle.timetableSlots.length > 0) status.push("timetable");
      if (academicBundle.assignments.length > 0) status.push(`${academicBundle.assignments.length} assignments`);
      if (academicBundle.marks.length > 0) status.push(`${academicBundle.marks.length} marks`);
      if (academicBundle.forumPosts.length > 0) status.push("forum");
      if (academicBundle.events.length > 0) status.push("events");
      if (academicBundle.notifications.length > 0) status.push("notifications");
      if (academicBundle.resources.length > 0) status.push("resources");
      setDataStatus(status);
    });

    return () => unsubscribe();
  }, [auth]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setShowQuickActions(false);
    const nextMessages = [...msgs, { sender: "user", text }];
    setMsgs(nextMessages);
    setInp("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicContext,
          messages: nextMessages.map((message) => ({
            role: message.sender === "user" ? "user" : "assistant",
            content: message.text,
          })),
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        setMsgs((currentMessages) => [
          ...currentMessages,
          { sender: "bot", text: data.choices[0].message.content },
        ]);
      } else {
        setMsgs((currentMessages) => [
          ...currentMessages,
          { sender: "bot", text: `⚠️ Error: ${data.error || "Failed to fetch AI response."}` },
        ]);
      }
    } catch (error) {
      setMsgs((currentMessages) => [
        ...currentMessages,
        { sender: "bot", text: "⚠️ Error connecting to the backend server. Please try again." },
      ]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendMessage(inp);
  };

  // Simple markdown-like rendering for bot messages
  const renderMessage = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (processed.trim().startsWith("- ") || processed.trim().startsWith("• ")) {
        processed = `<span class="ml-4 block">${processed}</span>`;
      }
      // Numbered lists
      if (/^\d+\.\s/.test(processed.trim())) {
        processed = `<span class="ml-4 block">${processed}</span>`;
      }
      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: processed || "&nbsp;" }} />
      );
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto p-6 md:p-8 flex-shrink-0">
        <Link
          href="/student"
          className="text-gray-400 hover:text-[#0096FF] flex items-center mb-6 transition"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0096FF] to-[#0050FF] flex items-center justify-center shadow-[0_0_25px_rgba(0,150,255,0.3)]">
                <FaRobot className="text-2xl text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#0096FF]">SphereAI</h1>
              <p className="text-gray-400 text-sm">
                Omniscient campus intelligence • Live data access
              </p>
            </div>
          </div>

          {/* Data Status Badge */}
          {dataStatus.length > 0 && (
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
              <FaDatabase className="text-green-400" />
              <span className="tracking-wider uppercase">{dataStatus.length} data feeds active</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-5xl mx-auto w-full custom-scrollbar flex flex-col">
        <AnimatePresence>
          {msgs.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`max-w-[85%] ${
                message.sender === "user" ? "self-end" : "self-start"
              }`}
            >
              <div
                className={`p-4 rounded-2xl shadow-lg text-[15px] leading-relaxed ${
                  message.sender === "user"
                    ? "bg-[#0096FF] text-black rounded-tr-sm font-medium"
                    : "bg-gray-800/80 text-white border border-gray-700/50 rounded-tl-sm backdrop-blur-sm"
                }`}
              >
                {message.sender === "bot" ? renderMessage(message.text) : message.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start max-w-[85%]"
          >
            <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm p-4 flex items-center space-x-3">
              <FaSpinner className="animate-spin text-[#0096FF]" />
              <span className="text-sm text-gray-400 font-mono tracking-wider">SphereAI is analyzing...</span>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        {showQuickActions && msgs.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="self-start w-full pt-4"
          >
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3 flex items-center">
              <FaBolt className="mr-2 text-[#0096FF]" /> Quick Actions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-[#0096FF]/10 hover:border-[#0096FF]/30 hover:text-white transition-all duration-200"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 max-w-5xl mx-auto w-full mb-4 flex-shrink-0">
        <form onSubmit={send} className="flex bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 p-5 bg-transparent text-white focus:outline-none placeholder-gray-500"
            value={inp}
            onChange={(event) => setInp(event.target.value)}
            placeholder="Ask about attendance, timetable, assignments, marks, forum, events..."
          />
          <button
            type="submit"
            disabled={!inp.trim() || isLoading}
            className="bg-[#0096FF] text-black px-8 font-bold text-2xl hover:bg-[#007bcc] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FaPaperPlane />
          </button>
        </form>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-600">
            SphereAI answers with your live academic context. Verify critical deadlines through official channels.
          </p>
          {dataStatus.length > 0 && (
            <p className="text-[10px] text-gray-700 font-mono hidden md:block">
              FEEDS: {dataStatus.join(" • ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
