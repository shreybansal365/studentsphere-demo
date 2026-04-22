# StudentSphere — Active Session Context

<!-- AI INSTRUCTIONS (do not delete this block):
  1. Update this file AT THE END of every session using the "handoff" keyword
  2. Be SPECIFIC about what you were doing when the session ended
  3. Include the exact file paths and line numbers for half-finished code
  4. Summarize critical technical decisions made during the session
  5. Use the "Currently Broken" section to flag any bugs or build failures
-->

> Current State of Development. Last Updated: 2026-04-14

---

## 🎯 Current Objective
Architectural hardening of the platform's Identity Verification Layer—specifically building an Autonomous Faculty Oracle and ensuring symmetrical, logic-driven Registry matrices.

## 🛠️ Work In Progress
- Transitioning internal dashboards to the high-fidelity command-terminal aesthetic.
- Finalizing edge-case logic for the Faculty Oracle (handling missing faculty titles, irregular designations).

## ✅ Completed Recently
- ✅ **Autonomous Faculty Verification**: Engineered an Oracle API that scrapes the university database (`/api/verify-faculty`) to cross-reference faculty details, allowing them to bypass mandatory Outlook verification upon sign up.
- ✅ **Gatekeeper Logic Unified**: Removed the legacy Outlook `emailVerified` requirement for the `faculty` role inside the Sign-In Gateway (`app/sign-in/page.tsx`). Faculty now access the Admin Hub immediately.
- ✅ **Grid Matrix Symmetrization**: Overhauled the Student Registration Form in `app/sign-up/page.tsx` into a perfectly balanced 6-column matrix, providing visual weight parity with the Faculty form.
- ✅ **RegNo Input Lock Fixed**: Neutralized the "23" vector lock by setting the default batch state from a legacy `2026` to `2027`, allowing full 14-character alphanumeric input.
- ✅ **Dashboard Directive Fixed**: Injected the `"use client";` directive into the `admin/page.tsx` sector, unblocking the Build Error and allowing Framer Motion physics to render.

## ⚠️ Important Technical Context
- **Validation Logic:** We rely on hard-coded nomenclature (Template-Enforced Validation). The `regNo` and `College ID` inputs auto-construct based on the selected batch (14 chars for 2027, 10 numeric digits for 2028+). 
- **Oracle Logic:** The `/api/verify-faculty` uses fuzzy title stripping (stripping "Dr.", "Prof.", etc.) and targets `<h2>` instead of `<h4>` tags on the university's DOM to find identities.

## 🔴 Currently Broken
- None.

## 📝 Next Task For Resumption
- [ ] Transition the Admin Dashboard and Student Modules fully to the Command-Terminal aesthetic.
- [ ] Perform final boundary testing on the Oracle scraping logic in case the University changes their DOM selectors.
