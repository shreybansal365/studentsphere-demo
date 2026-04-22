export interface SubjectAttendance {
  subject?: string;
  percentage?: string;
  attendedClasses?: number | string;
  totalClasses?: number | string;
}

export interface AttendanceRecord {
  id?: string;
  subject?: string;
  date?: string;
  isPresent?: boolean;
}

export interface AssignmentItem {
  id: string;
  title?: string;
  subject?: string;
  batch?: string;
  deadline?: string;
  description?: string;
}

export interface MarksItem {
  id: string;
  subject?: string;
  examType?: string;
  score?: number | string;
  timestamp?: string;
}

export interface TimetableSlot {
  day: number;
  start: string;
  end: string;
  title: string;
  room: string;
  source?: "slcm" | "faculty";
}

export interface AttendanceInsight {
  key: string;
  subject: string;
  attendedClasses: number;
  totalClasses: number;
  percentage: number;
  status: "healthy" | "warning" | "critical";
  classesSafeToMiss: number;
  classesNeededFor75: number;
  projectedAfterOneAbsence: number;
  recentTrend: "up" | "down" | "flat";
  recentPresentCount: number;
  recentAbsentCount: number;
  lastUpdatedLabel: string;
}

export interface ReminderItem {
  id: string;
  type: "attendance" | "assignment" | "exam" | "timetable" | "marks";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

const subjectAliases: Record<string, string> = {
  ds: "data structures",
  dsa: "data structures",
  os: "operating systems",
  dbms: "database management systems",
  ai: "artificial intelligence",
  ml: "machine learning",
};

export const normalizeValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const normalizeSubject = (value: string) => {
  const normalized = normalizeValue(value);
  return subjectAliases[normalized] ?? normalized;
};

export const parseNumber = (value?: number | string) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(String(value).replace(/[^\d.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parsePercentage = (value?: string) => {
  if (!value) {
    return 0;
  }

  const match = value.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
};

export const formatDateTime = (value?: string) => {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const formatDate = (value?: string) => {
  if (!value) {
    return "Unknown";
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

const calculateClassesSafeToMiss = (attendedClasses: number, totalClasses: number) => {
  if (totalClasses === 0) {
    return 0;
  }

  let safeMisses = 0;
  while (attendedClasses / (totalClasses + safeMisses + 1) >= 0.75) {
    safeMisses += 1;
    if (safeMisses > 365) {
      break;
    }
  }

  return safeMisses;
};

const calculateClassesNeededFor75 = (attendedClasses: number, totalClasses: number) => {
  if (totalClasses === 0 || attendedClasses / totalClasses >= 0.75) {
    return 0;
  }

  let classesNeeded = 0;
  while ((attendedClasses + classesNeeded) / (totalClasses + classesNeeded) < 0.75) {
    classesNeeded += 1;
    if (classesNeeded > 365) {
      break;
    }
  }

  return classesNeeded;
};

export const buildAttendanceInsights = (
  slcmAttendance: SubjectAttendance[],
  manualRecords: AttendanceRecord[]
): AttendanceInsight[] => {
  const baselineMap = new Map(
    slcmAttendance.map((entry) => {
      const subject = entry.subject?.trim() || "Unnamed Subject";
      return [
        normalizeSubject(subject),
        {
          subject,
          attendedClasses: parseNumber(entry.attendedClasses),
          totalClasses: parseNumber(entry.totalClasses),
        },
      ] as const;
    })
  );

  const recordsBySubject = new Map<string, AttendanceRecord[]>();
  manualRecords.forEach((record) => {
    const subject = record.subject?.trim() || "General";
    const key = normalizeSubject(subject);
    const existing = recordsBySubject.get(key) ?? [];
    existing.push(record);
    recordsBySubject.set(key, existing);
  });

  const allSubjects = new Set([...baselineMap.keys(), ...recordsBySubject.keys()]);

  return Array.from(allSubjects)
    .map((key) => {
      const baseline = baselineMap.get(key);
      const records = (recordsBySubject.get(key) ?? []).sort((firstRecord, secondRecord) =>
        String(firstRecord.date ?? "").localeCompare(String(secondRecord.date ?? ""))
      );

      let attendedClasses = baseline?.attendedClasses ?? 0;
      let totalClasses = baseline?.totalClasses ?? 0;

      records.forEach((record) => {
        totalClasses += 1;
        if (record.isPresent) {
          attendedClasses += 1;
        }
      });

      const percentage =
        totalClasses > 0 ? Number(((attendedClasses / totalClasses) * 100).toFixed(1)) : 0;
      const projectedAfterOneAbsence =
        totalClasses > 0
          ? Number(((attendedClasses / (totalClasses + 1)) * 100).toFixed(1))
          : 0;
      const recentWindow = records.slice(-5);
      const recentPresentCount = recentWindow.filter((record) => record.isPresent).length;
      const recentAbsentCount = recentWindow.length - recentPresentCount;

      let recentTrend: "up" | "down" | "flat" = "flat";
      if (recentWindow.length >= 2) {
        const firstHalf = recentWindow.slice(0, Math.ceil(recentWindow.length / 2));
        const secondHalf = recentWindow.slice(Math.ceil(recentWindow.length / 2));
        const firstHalfRate =
          firstHalf.length > 0
            ? firstHalf.filter((record) => record.isPresent).length / firstHalf.length
            : 0;
        const secondHalfRate =
          secondHalf.length > 0
            ? secondHalf.filter((record) => record.isPresent).length / secondHalf.length
            : 0;

        if (secondHalfRate > firstHalfRate) {
          recentTrend = "up";
        } else if (secondHalfRate < firstHalfRate) {
          recentTrend = "down";
        }
      }

      const status: AttendanceInsight["status"] =
        percentage < 70
          ? "critical"
          : percentage < 75 || projectedAfterOneAbsence < 75
            ? "warning"
            : "healthy";

      return {
        key,
        subject: baseline?.subject ?? records[0]?.subject ?? "General",
        attendedClasses,
        totalClasses,
        percentage,
        status,
        classesSafeToMiss: calculateClassesSafeToMiss(attendedClasses, totalClasses),
        classesNeededFor75: calculateClassesNeededFor75(attendedClasses, totalClasses),
        projectedAfterOneAbsence,
        recentTrend,
        recentPresentCount,
        recentAbsentCount,
        lastUpdatedLabel: records.at(-1)?.date ?? "SLCM baseline",
      };
    })
    .sort((firstInsight, secondInsight) => firstInsight.percentage - secondInsight.percentage);
};

export const buildLiveReminders = (params: {
  attendanceInsights: AttendanceInsight[];
  assignments: AssignmentItem[];
  marks: MarksItem[];
  timetableSlots: TimetableSlot[];
}): ReminderItem[] => {
  const reminders: ReminderItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  params.attendanceInsights.forEach((insight) => {
    if (insight.status === "critical") {
      reminders.push({
        id: `attendance-critical-${insight.key}`,
        type: "attendance",
        severity: "high",
        title: `${insight.subject} attendance is in danger`,
        detail: `${insight.percentage}% currently. You need ${insight.classesNeededFor75} consecutive present class(es) to recover to 75%.`,
      });
    } else if (insight.status === "warning") {
      reminders.push({
        id: `attendance-warning-${insight.key}`,
        type: "attendance",
        severity: "medium",
        title: `${insight.subject} is close to the minimum limit`,
        detail: `Current attendance is ${insight.percentage}%. Missing one more class would drop it to ${insight.projectedAfterOneAbsence}%.`,
      });
    }
  });

  params.assignments.forEach((assignment) => {
    if (!assignment.deadline) {
      return;
    }

    const deadline = new Date(`${assignment.deadline}T00:00:00`);
    deadline.setHours(0, 0, 0, 0);
    const daysRemaining = Math.round(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
      reminders.push({
        id: `assignment-overdue-${assignment.id}`,
        type: "assignment",
        severity: "high",
        title: `${assignment.title ?? "Assignment"} is overdue`,
        detail: `${assignment.subject ?? "Course"} deadline was ${formatDate(assignment.deadline)}.`,
      });
    } else if (daysRemaining <= 2) {
      reminders.push({
        id: `assignment-soon-${assignment.id}`,
        type: "assignment",
        severity: daysRemaining === 0 ? "high" : "medium",
        title: `${assignment.title ?? "Assignment"} is due soon`,
        detail: `${assignment.subject ?? "Course"} deadline is ${formatDate(assignment.deadline)}.`,
      });
    }
  });

  if (params.marks.length === 0) {
    reminders.push({
      id: "marks-empty",
      type: "marks",
      severity: "low",
      title: "No marks uploaded yet",
      detail: "Faculty uploads will appear in your marks dashboard once they are published.",
    });
  }

  if (params.timetableSlots.length === 0) {
    reminders.push({
      id: "timetable-missing",
      type: "timetable",
      severity: "medium",
      title: "No timetable found yet",
      detail: "Sync SLCM or check whether your faculty timetable has been published for your batch and branch.",
    });
  }

  const severityRank = { high: 0, medium: 1, low: 2 };
  return reminders.sort((firstReminder, secondReminder) => {
    return severityRank[firstReminder.severity] - severityRank[secondReminder.severity];
  });
};

export const categorizeForumMessage = (text: string) => {
  const normalized = normalizeValue(text);

  if (/(assignment|deadline|submission|submit|project|homework)/.test(normalized)) {
    return "Assignments";
  }

  if (/(attendance|absent|present|proxy|percentage|shortage)/.test(normalized)) {
    return "Attendance";
  }

  if (/(timetable|schedule|class timing|room|period|lecture)/.test(normalized)) {
    return "Timetable";
  }

  if (/(marks|grade|cgpa|result|score|mid term|end term|quiz)/.test(normalized)) {
    return "Marks";
  }

  if (/(exam|test|paper|preparation|syllabus|revision)/.test(normalized)) {
    return "Exams";
  }

  if (/(group|team|collab|study partner|doubt)/.test(normalized)) {
    return "Study Groups";
  }

  return "General";
};

export const parseFacultyTimetableEntry = (
  value: string,
  fallbackStart: string,
  fallbackEnd: string
): TimetableSlot | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const [mainPart, roomPart] = trimmed.split("@");
  const subject = mainPart.trim();

  return {
    day: 0,
    start: fallbackStart,
    end: fallbackEnd,
    title: subject,
    room: roomPart?.trim() ?? "Faculty Schedule",
    source: "faculty",
  };
};

export const buildChatbotAcademicContext = (params: {
  profileSummary: string;
  attendanceInsights: AttendanceInsight[];
  assignments: AssignmentItem[];
  marks: MarksItem[];
  timetableSlots: TimetableSlot[];
  reminders?: ReminderItem[];
  forumPosts?: Array<{ title?: string; content?: string; author?: string; category?: string; votes?: number; isOfficial?: boolean }>;
  events?: Array<{ eventTitle?: string; eventDescription?: string; eventDate?: string; user?: string }>;
  notifications?: Array<{ title?: string; message?: string; instructor?: string }>;
  resources?: Array<{ title?: string; category?: string; courseCode?: string; instructor?: string; sourceLink?: string }>;
}) => {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date();
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const attendanceSummary =
    params.attendanceInsights.length > 0
      ? params.attendanceInsights
          .map(
            (insight) =>
              `${insight.subject}: ${insight.percentage}% (${insight.attendedClasses}/${insight.totalClasses}), risk: ${insight.status}, safe misses: ${insight.classesSafeToMiss}, need for 75%: ${insight.classesNeededFor75}, if miss one more: ${insight.projectedAfterOneAbsence}%, trend: ${insight.recentTrend}`
          )
          .join("\n  ")
      : "No attendance data available.";

  const assignmentSummary =
    params.assignments.length > 0
      ? params.assignments
          .map(
            (assignment) =>
              `${assignment.title ?? "Assignment"} (${assignment.subject ?? "Subject"}) — deadline: ${assignment.deadline ?? "unknown"}, description: ${assignment.description ?? "none"}`
          )
          .join("\n  ")
      : "No assignment data available.";

  const marksSummary =
    params.marks.length > 0
      ? params.marks
          .map(
            (mark) =>
              `${mark.subject ?? "Subject"} — ${mark.examType ?? "Exam"}: ${mark.score ?? "--"}`
          )
          .join("\n  ")
      : "No marks data available.";

  let timetableSummary = "No timetable data available.";
  if (params.timetableSlots.length > 0) {
    const byDay = new Map<number, TimetableSlot[]>();
    params.timetableSlots.forEach((slot) => {
      const existing = byDay.get(slot.day) ?? [];
      existing.push(slot);
      byDay.set(slot.day, existing);
    });
    timetableSummary = Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, slots]) => {
        const isToday = day === todayDayIndex;
        const slotList = slots
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((s) => `    ${s.start}-${s.end} ${s.title} in ${s.room}`)
          .join("\n");
        return `  ${dayNames[day]}${isToday ? " (TODAY)" : ""}:\n${slotList}`;
      })
      .join("\n");
  }

  const todaysClasses = params.timetableSlots
    .filter((s) => s.day === todayDayIndex)
    .sort((a, b) => a.start.localeCompare(b.start));
  const todaySummary =
    todaysClasses.length > 0
      ? todaysClasses.map((s) => `${s.start}-${s.end}: ${s.title} in ${s.room}`).join(", ")
      : "No classes today.";

  const reminderSummary =
    params.reminders && params.reminders.length > 0
      ? params.reminders.map((r) => `[${r.severity.toUpperCase()}] ${r.title}: ${r.detail}`).join("\n  ")
      : "No active reminders.";

  const forumSummary =
    params.forumPosts && params.forumPosts.length > 0
      ? params.forumPosts
          .map((p) => `"${p.title ?? "Untitled"}" by ${p.author?.split("@")[0] ?? "anon"} [${p.category ?? "general"}] ${p.votes ?? 0} votes${p.isOfficial ? " (OFFICIAL)" : ""}`)
          .join("\n  ")
      : "No forum posts.";

  const eventsSummary =
    params.events && params.events.length > 0
      ? params.events.map((e) => `${e.eventTitle ?? "Event"} on ${e.eventDate ?? "TBD"} by ${e.user ?? "unknown"}: ${e.eventDescription ?? ""}`).join("\n  ")
      : "No events listed.";

  const notificationsSummary =
    params.notifications && params.notifications.length > 0
      ? params.notifications.map((n) => `${n.title ?? "Notification"} from ${n.instructor ?? "faculty"}: ${n.message ?? ""}`).join("\n  ")
      : "No notifications.";

  const resourcesSummary =
    params.resources && params.resources.length > 0
      ? params.resources.map((r) => `${r.title ?? "Resource"} [${r.category ?? "general"}] for ${r.courseCode ?? "course"} by ${r.instructor ?? "unknown"}`).join("\n  ")
      : "No study resources.";

  return [
    params.profileSummary,
    `\nToday is ${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`,
    `\nToday's Classes: ${todaySummary}`,
    `\nAttendance (all subjects):\n  ${attendanceSummary}`,
    `\nAssignments:\n  ${assignmentSummary}`,
    `\nMarks:\n  ${marksSummary}`,
    `\nWeekly Timetable:\n${timetableSummary}`,
    `\nActive Reminders:\n  ${reminderSummary}`,
    `\nForum Discussions:\n  ${forumSummary}`,
    `\nCampus Events:\n  ${eventsSummary}`,
    `\nNotifications:\n  ${notificationsSummary}`,
    `\nStudy Resources:\n  ${resourcesSummary}`,
  ].join("\n");
};
