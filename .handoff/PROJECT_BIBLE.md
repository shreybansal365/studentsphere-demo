# StudentSphere — Project Bible

<!-- AI INSTRUCTIONS (do not delete this block):
  1. Update this file ONLY when: new dependencies added, new pages/routes created,
     database schema changed, auth flow modified, or deployment config altered
  2. When you make a non-obvious technical decision, ADD it to "Key Decisions" section
  3. Keep this file UNDER 300 lines — be comprehensive but concise
  4. Update the "Last Updated" timestamp and your model name when you modify this file
  5. The "Key Decisions" section is the MOST IMPORTANT part — always explain WHY
-->

> Last Updated: 2026-04-19 | Author: Shrey Bansal

---

## What Is This Project?

**StudentSphere** is a full-stack academic management platform for **Manipal University Jaipur (MUJ)**. It provides students and faculty with a single unified portal for timetables, attendance, assignments, marks, AI chatbot assistance, and SLCM data syncing.

**Live Production URL:** https://studentsphere-portal.vercel.app  
**Deployment Platform:** Vercel (Hobby Plan)  
**Repository:** Local Git on macOS at `/Users/shreybansal/Pictures/Agile Project/studentsphere`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.1.11 |
| Language | TypeScript + JavaScript | TS 5.x |
| Styling | TailwindCSS | 3.4.1 |
| Animation | Framer Motion + GSAP | framer 12.x, gsap 3.12.x |
| Auth & DB | Firebase (Auth + Firestore) | 11.2.0 |
| Scraping (local) | Puppeteer | 24.39.1 |
| Scraping (cloud) | puppeteer-core + @sparticuz/chromium | 24.40.0 / 143.0.4 |
| Parsing & Helpers | Cheerio + Moment Timezone | 1.2.0 / 0.5.47 |
| AI Chatbot | Groq API (llama-3.3-70b-versatile) | REST API |
| UI Primitives | shadcn/ui + Radix Radio Group | local / 1.2.2 |
| Icons | react-icons + lucide-react | 5.4.0 / 0.474.0 |
| Client Utilities | react-toastify + react-intersection-observer | 11.0.3 / 9.15.1 |
| Deployment | Vercel CLI | Latest |

---

## Project Structure Map

```
studentsphere/
├── .github/                     ← GitHub metadata/workflows
├── .handoff/                    ← THIS SYSTEM (context transfer files)
├── .next/                       ← Next.js build output (generated)
├── .vercel/                     ← Local Vercel project metadata
├── app/
│   ├── page.tsx                 ← Landing page (redirects or hero)
│   ├── layout.tsx               ← Root layout (Google Fonts, global CSS)
│   ├── globals.css              ← Global TailwindCSS styles
│   ├── favicon.svg              ← App favicon
│   │
│   ├── sign-in/page.tsx         ← Student/Faculty login (Firebase Auth)
│   ├── sign-up/page.tsx         ← Registration (role-based, email verification)
│   ├── access-denied/           ← Unauthorized access page
│   │
│   ├── student/                 ← STUDENT DASHBOARD (protected)
│   │   ├── page.tsx             ← Main dashboard with SLCM sync modal
│   │   ├── layout.tsx           ← Student layout with Stnav sidebar
│   │   ├── timetable/page.tsx   ← Weekly calendar grid (SLCM-synced)
│   │   ├── attendance/page.tsx  ← Attendance percentages (SLCM-synced)
│   │   ├── assignments/page.tsx ← Assignment tracker
│   │   ├── marks/page.tsx       ← Marks/grades viewer
│   │   ├── chatbot/page.tsx     ← SphereAI chatbot (Groq-powered)
│   │   ├── forum/page.tsx       ← Discussion forum
│   │   ├── reminders/page.tsx   ← Academic reminders
│   │   ├── events/              ← Events page
│   │   ├── materials/           ← Study materials
│   │   ├── notifications/       ← Notifications
│   │   └── profile/             ← User profile
│   │
│   ├── admin/                   ← FACULTY DASHBOARD (protected)
│   │   ├── page.tsx             ← Faculty portal main page
│   │   ├── layout.tsx           ← Faculty layout with Adnav sidebar
│   │   ├── attendance/          ← Mark attendance
│   │   ├── timetable/           ← Manage timetable
│   │   ├── assignments/         ← Create assignments
│   │   ├── marks/               ← Upload marks
│   │   ├── data/                ← Data management
│   │   ├── forum/               ← Discussion forum (faculty side)
│   │   ├── events/              ← Events management
│   │   ├── materials/           ← Upload materials
│   │   ├── notifications/       ← Send notifications
│   │   └── profile/             ← Faculty profile
│   │
│   ├── api/
│   │   ├── chat/route.ts        ← Groq AI chatbot API endpoint
│   │   └── slcm/route.ts        ← SLCM scraper API (Puppeteer)
│   │
│   ├── components/
│   │   ├── Navbar.tsx           ← Public pages navbar
│   │   ├── Stnav.tsx            ← Student sidebar navigation
│   │   ├── Adnav.tsx            ← Faculty/Admin sidebar navigation
│   │   ├── Footer.tsx            ← Global footer
│   │   ├── Hero.tsx             ← Landing page hero section
│   │   ├── Features.tsx         ← Landing page features showcase
│   │   ├── Squares.tsx          ← Animated background squares
│   │   ├── PrivateRoute.tsx     ← Auth guard component
│   │   └── ui/                  ← shadcn/ui primitives
│   │
│   ├── about/page.tsx           ← About page
│   ├── contact/page.tsx         ← Contact page
│   ├── feedback/page.tsx        ← Feedback form
│   ├── members/page.tsx         ← Team members page
│   └── Dbtest/                  ← Firebase debug/test page
│
├── lib/
│   ├── firebase.js              ← Firebase initialization (HARDCODED keys)
│   └── utils.ts                 ← Utility functions (cn for tailwind-merge)
│
├── public/
│   ├── muj.svg                  ← MUJ logo
│   └── debug.png                ← Debug screenshot
│
├── node_modules/                ← Installed dependencies (generated)
├── .env.local                   ← Vercel OIDC token (NOT Firebase keys)
├── next.config.ts               ← Next.js configuration
├── tailwind.config.ts           ← Tailwind configuration
├── tsconfig.json                ← TypeScript configuration
├── components.json              ← shadcn/ui configuration
└── package.json                 ← Dependencies
```

---

## Authentication Architecture

### Two-Wall Security System
1. **Wall 1 — Firebase Auth:** Email/password registration with mandatory Microsoft Outlook email verification (`@muj.manipal.edu` for students, `@jaipur.manipal.edu` for faculty).
2. **Wall 2 — Firestore Role Check:** After auth, the app queries Firestore `users/{uid}` to verify the user's role matches their selection (student vs faculty).

### Registration Flow
- Students must use `firstname.YYROLLNO@muj.manipal.edu` format
- Faculty must use `name@jaipur.manipal.edu` format
- Registration numbers are forced to uppercase via `onChange`
- Emails are forced to lowercase via `onChange`
- Username is auto-extracted from email (everything before `@`)
- "Data Science & Engineering" branch was intentionally removed from dropdown

### Sign-In Flow
1. `signInWithEmailAndPassword()` authenticates against Firebase Auth
2. `emailVerified` check — blocks unverified users
3. Firestore `users/{uid}` role check — prevents role mismatch
4. Redirects to `/student` or `/admin` based on role

---

## SLCM Scraper Architecture

### What It Does
Scrapes the MUJ SLCM portal (`mujslcm.jaipur.manipal.edu`) to extract real timetable and attendance data for each student.

### How It Works (file: `app/api/slcm/route.ts`)
1. **Environment Detection:** Uses `process.env.VERCEL` to decide browser engine:
   - Local dev → standard `puppeteer` (heavy, full Chrome)
   - Vercel cloud → `puppeteer-core` + `@sparticuz/chromium` (lightweight, fits 50MB limit)
2. **Login:** Types credentials into SLCM login form (strips `@muj.manipal.edu` suffix first)
3. **Timetable Extraction:** Navigates to timetable page, parses `a.fc-time-grid-event` DOM elements
4. **Attendance Extraction:** Navigates to attendance summary, parses `#kt_ViewTable` rows
5. **Returns JSON** to the frontend, which stores it in Firestore under the user's document

### Known Gotchas
- SLCM strips `@muj.manipal.edu` from usernames — the scraper must send only the part before `@`
- The scraper is fragile — if MUJ changes their DOM structure, it breaks silently
- `chromium.defaultViewport` and `chromium.headless` are deprecated in newer `@sparticuz/chromium` — we hardcode `headless: true` instead

---

## AI Chatbot Architecture

### SphereAI (file: `app/api/chat/route.ts`)
- **Model:** `llama-3.3-70b-versatile` via Groq API
- **System Prompt:** Identifies as "SphereAI", the official MUJ campus assistant
- **Student Context:** Receives the logged-in student's profile info for personalized responses
- **API Key:** Hardcoded as fallback (`gsk_YLm...kyW`) because Vercel wipes `.env.local`

---

## Deployment Gotchas

> [!CAUTION]
> **CRITICAL:** Firebase API keys are HARDCODED in `lib/firebase.js`. Vercel's CLI overwrites `.env.local` during `vercel pull`, wiping all `NEXT_PUBLIC_*` variables. We permanently solved this by putting keys directly in code. This is safe because Firebase frontend keys are inherently public (they're embedded in client-side JS bundles anyway).

> [!CAUTION]
> **CRITICAL:** The Groq API key is HARDCODED as a fallback in `app/api/chat/route.ts` for the same reason. This is a server-side route, so it's not exposed to the client.

### Deployment Commands
```bash
# Preview deployment (generates random URL)
npx vercel

# Production deployment (updates studentsphere-portal.vercel.app)
npx vercel --prod
```

### Authorized Domains
Firebase Auth requires all deployment domains to be whitelisted:
- `localhost` (default)
- `studentsphere1234.firebaseapp.com` (default)
- `studentsphere1234.web.app` (default)
- `studentsphere-portal.vercel.app` (manually added)

---

## Design System

- **Primary Color:** `#0096FF` (electric blue)
- **Background:** Pure black (`bg-black`) with `bg-gray-900` cards
- **Borders:** `border-gray-800` / `border-gray-700`
- **Accent on Hover:** `hover:border-[#0096FF]`
- **Font:** Default Tailwind (system fonts)
- **Animation Library:** Framer Motion for page transitions, GSAP for complex sequences
- **Card Pattern:** `bg-gray-900 border border-gray-800 rounded-2xl p-6`

---

## Firestore Database Schema

### Collection: `users`
Document ID = Firebase Auth UID

```json
{
  "name": "Shrey Bansal",
  "email": "shreybansal365@gmail.com",
  "username": "shrey.23fe10cse00848",
  "rollNo": "23FE10CSE00848",
  "role": "student",
  "batch": "2026",
  "branch": "Computer Science & Engineering",
  "slcmTimetableHTML": [ /* array of timetable objects from scraper */ ],
  "slcmAttendanceHTML": [ /* array of attendance objects from scraper */ ],
  "slcmScrapeTime": "2026-03-27T03:15:00.000Z"
}
```

Faculty documents have additional fields: `designation`, `subjects`, `facultyOrStaff`.
## Firestore Security Rules

As of April 11, 2026, the database has been moved from "Test Mode" to **Production Rules**.

- **Users Collection:** Users can only read/write their own profiles (match on Auth UID). Faculty accounts can read student profiles to fetch rosters/batches.
- **Academic Collections (`attendance`, `assignments`, `marks`, etc.):** Any authenticated user can **read** (to see their own data). Only **faculty** or **admin** roles can **write** (create/edit/delete).
- **Forum Collection:** Any authenticated user can read or write (to post topics/comments).
- **Authentication:** All requests must be authenticated (`request.auth != null`).

> [!NOTE]
> The roles are enforced by checking the `role` field in the `/users/{uid}` document. If a faculty member cannot access the admin hub, ensure their Firestore doc has `"role": "faculty"`.

---

## Key Decisions & Rationale

> This is the most important section. Code shows WHAT exists. This explains WHY.

- **Firebase keys hardcoded instead of .env:** Vercel's CLI command `vercel pull` overwrites `.env.local`, wiping all `NEXT_PUBLIC_*` variables. After 3 deployment failures, we permanently hardcoded firebase config in `lib/firebase.js`. This is safe because Firebase frontend keys are inherently public — they're embedded in the client-side JS bundle regardless.
- **Groq API key hardcoded as fallback:** Same reason as Firebase. The key is in a server-side API route (`app/api/chat/route.ts`) so it's never exposed to the client. Falls back to hardcoded value only if `process.env.GROQ_API_KEY` is missing.
- **Dual browser engine for SLCM scraper:** Local development uses full `puppeteer` (heavy, ~400MB Chrome). Vercel serverless uses `puppeteer-core` + `@sparticuz/chromium` (compressed, fits 50MB limit). Switching is automatic via `process.env.VERCEL` check.
- **SLCM username stripping:** The MUJ SLCM portal has JavaScript that blocks any input containing `@muj.manipal.edu`. The scraper must strip the email suffix and send only the username portion (everything before `@`).
- **"Data Science & Engineering" branch removed from signup dropdown:** Client (project owner) specifically requested removal — this branch doesn't exist at MUJ.
- **Sparticuz chromium launch options minimized:** `chromium.defaultViewport` and `chromium.headless` properties are deprecated in recent versions of `@sparticuz/chromium`. We hardcode `headless: true` directly and omit the viewport property entirely.
- **Two-wall authentication architecture:** Wall 1 (Firebase Auth) handles credentials + email verification. Wall 2 (Firestore role check) prevents a student from accessing faculty routes by manually navigating to `/admin`. Both walls must pass before any protected content is shown.
- **Faculty attendance "Magic Filter" uses subject matching:** The faculty attendance page loads all students for a batch, then matches the chosen subject against each student’s synced SLCM attendance on the client.
- **Faculty assignment manager preserves the student-facing schema:** The upgraded faculty CRUD flow still writes the same core `assignments` fields (`title`, `subject`, `batch`, `deadline`, `description`) that the student page already reads. Extra metadata like `facultyName` and `updatedAt` is additive, so student assignment rendering stays compatible.
- **Faculty marks uploads require a fully valid sheet before submit:** The upgraded marks page blocks submission until every loaded student has a numeric score from 0 to 100. This avoids half-complete grade documents and keeps the student marks page consistent because each uploaded record is a full roster snapshot.

---

## What Has Been Built (Completion Status)

| Feature | Status | Notes |
|---|---|---|
| Landing Page + Hero | ✅ Complete | Animated squares background, features showcase |
| Sign-Up (Student + Faculty) | ✅ Complete | Email verification, role-based fields |
| Sign-In | ✅ Complete | Two-wall auth, role redirect |
| Student Dashboard | ✅ Complete | SLCM sync modal, personalized greeting |
| Timetable (Student) | ✅ Complete | Weekly calendar grid, SLCM data overlay, holidays |
| Attendance (Student) | ✅ Complete | SLCM-synced attendance percentages |
| SphereAI Chatbot | ✅ Complete | Groq-powered, student context injection |
| SLCM Scraper API | ✅ Complete | Dual-engine (local Puppeteer / cloud Sparticuz) |
| Faculty Dashboard | ✅ Complete | Dashboard now reflects live faculty module status and points to ready workspaces |
| Faculty Attendance Marking | ✅ Complete | "Magic Filter" roster, SLCM subject matching, bulk actions, Firestore submission |
| Faculty Assignment Management | ✅ Complete | CRUD workflow with edit/delete, deadline filters, and faculty subject shortcuts |
| Faculty Marks Upload | ✅ Complete | Validated grading sheet, summary stats, batch filters, and recent upload history |
| Discussion Forum (both sides) | ❌ Not Started | — |
| Vercel Production Deployment | ✅ Complete | studentsphere-portal.vercel.app |
| Student Navbar (Stnav) | ✅ Complete | Sidebar with all module links |
| Faculty Navbar (Adnav) | ✅ Complete | Sidebar with all module links |

---

## Running the Project

```bash
# Navigate to project
cd "/Users/shreybansal/Pictures/Agile Project/studentsphere"

# If npm is not found, prefix with PATH fix:
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# Start dev server
npm run dev
# Opens at http://localhost:3000 (or 3001 if 3000 is occupied)

# Production build test
npm run build

# Deploy to Vercel
npx vercel --prod
```
