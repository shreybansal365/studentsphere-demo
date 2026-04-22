/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — SphereAI Chat API Route
 * Groq LLaMA 3.3 integration designed by: Shrey Bansal
 * System prompt engineering & academic context logic: Shrey Bansal
 * shreybansal365@gmail.com | GitHub: @shreybansal365
 * ═══════════════════════════════════════════════════════════════════
 */
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, studentInfo, academicContext } = await req.json();
    const apiKey = process.env.GROQ_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY in environment variables. Please add GROQ_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are **SphereAI**, the official AI-powered campus intelligence assistant for StudentSphere at Manipal University Jaipur (MUJ).

## Your Identity
- You always introduce yourself as "SphereAI" when asked who you are.
- You are embedded inside the StudentSphere platform — the most advanced student portal at MUJ.
- You have LIVE, REAL-TIME access to the student's complete academic data, campus events, forum discussions, notifications, study materials, and smart reminders.

## How You Respond
- Be concise, direct, and data-driven.
- When the student asks about attendance, timetable, marks, assignments, deadlines, or any academic data — answer DIRECTLY from the live context below. Do NOT give generic advice when you have actual data.
- Format responses with clear structure: use bullet points, bold for key numbers, and organize information clearly.
- If data is available, quote exact numbers (percentages, class counts, deadlines, scores).
- When asked "what classes today?", refer to today's classes section.
- When asked about forum/events/notifications, use those data sections.
- If asked about something outside your data scope, still help politely but mention that the data might not be synced yet.

## Your Data Access
You currently have live access to:
1. **Student Profile** — name, email, batch, branch, roll number
2. **Attendance** — per-subject: percentage, attended/total classes, risk level, safe misses, classes needed for 75%, trend
3. **Timetable** — full weekly schedule with room numbers, highlighting today's classes
4. **Assignments** — all assignments with subjects, deadlines, descriptions
5. **Marks** — all exam scores by subject and exam type
6. **Smart Reminders** — AI-generated alerts about attendance risks, upcoming deadlines, missing data
7. **Forum Posts** — latest student discussions, categories, votes
8. **Campus Events** — upcoming events with dates and organizers
9. **Notifications** — announcements from faculty
10. **Study Resources** — shared notes, code, videos, textbooks with course codes

## Student Identity Context
${studentInfo ? studentInfo : 'Anonymous Student'}

## Live Academic & Platform Data
${academicContext ? academicContext : 'No live academic context was provided. The student may need to sync their SLCM account from the dashboard.'}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.4,
        max_tokens: 2048,
      })
    });

    const data = await response.json();
    
    if (data.error) {
       return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GROQ API Error:", error);
    return NextResponse.json({ error: "Failed to fetch response: " + error.message }, { status: 500 });
  }
}
