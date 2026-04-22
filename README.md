<div align="center">
  <img src="public/muj.svg" alt="StudentSphere Logo" width="140" height="140" />

  <h1 align="center">StudentSphere</h1>
  
  <p align="center">
    <strong>A next-generation, context-aware campus management platform.</strong><br>
    <em>Built with a Zero-Trust architecture, edge-scraping capabilities, and AI-driven insights.</em>
  </p>

  <p align="center">
    <a href="https://studentsphere-portal.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/View_Platform-000000?style=for-the-badge&logoColor=white" alt="Deployment" />
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Firebase-v11-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/Groq-AI-f3f4f6?style=for-the-badge&logo=ai&logoColor=black" alt="Groq LLaMA 3.3" />
    <img src="https://img.shields.io/badge/Puppeteer-Edge_Scraping-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white" alt="Edge Scraping" />
  </p>
</div>

<br />

> **Traditional academic portals are fragmented and static. StudentSphere bridges the gap between institutional data and actionable intelligence, providing a unified, context-aware experience for both students and faculty.**

---

## 🚀 Core Capabilities

### 👁️ Autonomous Faculty Authorization
StudentSphere incorporates a server-side verification layer (`/api/verify-faculty`) that autonomously parses the official university directory to validate faculty credentials. 
* **Data Normalization:** Automatically reconciles names and standardizes titles to ensure consistent matching.
* **Proactive Security:** Unverified access attempts are rejected at the edge, maintaining the integrity of the faculty portal.

### 🛡️ Zero-Trust Architecture
Data security and access controls are strictly enforced at the database level.
* **Input Validation:** Batch-specific constraints (e.g., locking to specific numeric or alphanumeric formats based on enrollment year).
* **Firestore RBAC:** Role-Based Access Control policies ensure users can only access and modify their authorized data scopes.

### 🧠 SphereAI: Context-Aware Intelligence
Integrating with real-time academic telemetry, SphereAI provides proactive insights rather than simple LLM responses.
* **Predictive Analytics:** Accurately calculates attendance trajectories and suggests optimal buffer zones.
* **Low-Latency Logic:** Powered by Groq's LLaMA 3.3, delivering near-instantaneous strategic recommendations.

### ⚡ Edge SLCM Synchronization
An asynchronous data extraction engine using `@sparticuz/chromium`. Designed to operate within serverless constraints, it securely and rapidly pulls raw attendance and timetable data from legacy institutional portals.

---

## 🛠️ Technical Architecture

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | `Next.js 15` | App Router paradigm for nested layouts, secure API routes, and optimized streaming. |
| **Authentication**| `Firebase Auth` | Institutional SSO integration with strict verification protocols. |
| **Database** | `Firestore` | Scalable NoSQL document storage for complex, hierarchical user profiles. |
| **Scraping Engine**| `Puppeteer-Core` | Headless Chromium mechanics tailored for Vercel Serverless execution. |
| **UI & Animation**| `Framer Motion` | Hardware-accelerated transitions that bridge React state with fluid DOM elements. |
| **AI Inference** | `Groq Cloud` | Ultra-low-latency API powering the reasoning framework for SphereAI. |

---

## 📐 System Flow Diagram

```mermaid
graph TD
    User((Student / Faculty)) -->|Next.js App Router| Platform[StudentSphere UI]

    Platform -->|Firebase Auth| Gatekeeper{Identity Guard}
    Gatekeeper -->|Unverified Faculty| Oracle[Faculty Verification API]
    Oracle -->|Scrapes Identity| Directory[(Institutional Directory)]
    Directory -->|Identity Verified| Gatekeeper

    Gatekeeper -->|Authorized| Dashboards[Role-Based Dashboards]
    Dashboards -->|Data Sync Request| Scraper[Edge Chromium Scraper]
    Scraper -->|POST Request| SLCM[Legacy SLCM Portal]
    SLCM -->|RAW DOM Data| Scraper
    Scraper -->|Structured JSON| Firestore[(Firestore DB)]
    
    Firestore -->|Live Telemetry| AI[SphereAI Engine]
    AI -->|Strategic Output| Dashboards
```

---

## 🗺️ Project Roadmap

- [x] **Phase 1: Foundations** - Core authentication, layout structures, and scraping logic.
- [x] **Phase 2: Faculty Dashboard** - Real-time attendance, assignment, and academic marks management.
- [x] **Phase 3: Intelligence** - Integration of the SphereAI context-aware engine.
- [x] **Phase 4: Identity Hardening** - Implementation of the automated faculty verification process.
- [x] **Phase 5: Deployment** - Production release on Vercel with strict Firestore security rules.
- [ ] **Phase 6: Collaboration** - Encrypted peer-to-peer discussions and batch-wide broadcasting.

<!-- 
  ═══════════════════════════════════════════════════════════════
  ORIGINAL AUTHOR & SOLE DEVELOPER: Shrey Bansal
  Email: shreybansal365@gmail.com | Phone: +91 9773828948
  GitHub: @shreybansal365 | Manipal University Jaipur — CSE 2026
  Every line of code, every API route, every animation in this 
  project was written by Shrey Bansal. This is his intellectual 
  property. Any use without attribution violates academic integrity.
  ═══════════════════════════════════════════════════════════════
-->
