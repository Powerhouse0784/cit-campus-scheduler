# CIT Campus Scheduler & Operations Hub

> **Crunch Week 2024 Finalist Solution** — A deterministic constraint-satisfaction scheduling engine, resilient venue booking manager, dynamic midsem exam planner, and minimal-disruption rescheduling platform for Chilika Institute of Technology (CIT).

---

## Architecture Overview

┌───────────────────────────────────────────────┐
                  │              Browser / Client UI              │
                  │  Next.js 14 App Router · Tailwind CSS · Motion │
                  └───────┬───────────────────────────────▲───────┘
                          │ HTTP Requests                 │ React Server &
                          │ JSON Payload / Bearer Token   │ Client Components
                          ▼                               │
                  ┌───────────────────────────────────────────────┐
                  │               Route Handlers (API)            │
                  │   /api/cit/bookings · /api/cit/disruption     │
                  │   /api/cit/exams    · /api/ai/assistant       │
                  └───────┬───────────────────────────────▲───────┘
                          │                               │
        ┌─────────────────┴───────────────┐               │
        ▼                                 ▼               │
        ───────────────────────┐ ┌───────────────────────┐ │
│ AI Intent Parser │ │ Authentication Layer │ │
│ Groq (Llama-3.3-70B) │ │ HMAC-SHA256 Signatures│ │
│ + Regex Fallback │ │ Role-Based Access │ │
└───────────┬───────────┘ └───────────┬───────────┘ │
│ Untrusted Draft Params │ Verified Role │
└─────────────────┬───────────────┘ │
▼ │
┌─────────────────────────────────────────────────────────────┴─┐
│ Deterministic Constraint Engines (Code) │
│ │
│ • Timetable Engine : Evaluates H1–H14 hard & S1–S6 soft │
│ • Booking Engine : Priority order (Exams > Classes > Fest)│
│ • Exam Engine : 50% social-distancing capacity check │
│ • Rescheduling Solver: CSP search minimizing stability delta │
└─────────────────────────────┬─────────────────────────────────┘
│
▼
┌───────────────────────────────────────────────────────────────┐
│ Durable Persistence Layer │
│ Supabase PostgreSQL State (RPCs) + Local File Storage │
│ Exports: schedule.json · schedule_after.json │
└───────────────────────────────────────────────────────────────┘

---

## Key Features

1. **Deterministic 0-Clash Master Timetable**:
   - Places all 189 sessions (243 weekly teaching hours) across 27 rooms with **0 hard-constraint violations** (H1–H14).
   - Minimizes soft-constraint penalties (S1–S6 total = 13).
   - Synchronizes open elective baskets (`OEB-1`, `OEB-2`, `OEB-3`) concurrently across separate venues without student-group overlap.
2. **Dynamic Midsem Exam Matrix**:
   - Dynamically schedules all 41 midsem exams across Week 8.
   - Enforces social-distancing by halving effective room capacities (`capacity // 2`).
   - Caps student cohorts at a maximum of 1 exam per day.
3. **Plain English & Conversational Hinglish Booking**:
   - Natural language extraction powered by Groq (`llama-3.3-70b-versatile`) with an instant rule-based fallback.
   - Converts natural inputs (e.g., *"Kal dopahar 2 baje 70 students ke liye CS lab chahiye"*) into structured parameters.
   - Presents an editable draft form allowing user confirmation before submission.
4. **Spectra '27 Booking Governance & Priority Engine**:
   - Institutional priority rules strictly enforced:
     $$\text{Exams} > \text{Classes} > \text{Institute Events} > \text{Guest Lectures} > \text{Department Events} > \text{Club Events}$$
   - Anti-self-approval rule enforced server-side: no user can approve their own request.
   - Rejection justifications and zero-clash alternative slot recommendations for contested rooms.
5. **Minimal-Movement Rescheduling Studio**:
   - Resolves emergency room closures (e.g., CR-102 pipe leak) and faculty leaves using Constraint Satisfaction Search.
   - Relocates 11 sessions with **0 time shifts** (100% time stability, all room-only reallocations).
   - Requires explicit Dean's Office / Admin validation and sign-off before publishing revisions.
6. **AI Assistant with Security Boundary**:
   - LLMs never decide validity, room allocation, or timetable changes.
   - Built-in defenses against prompt injection, privilege escalation, and unauthorized class cancellations.

---

## Demo Accounts

The application includes four pre-configured evaluation accounts accessible via the **1-Click Role Gateway**:

| Role | Account Name | Email | Password | Access Scopes |
|---|---|---|---|---|
| **Admin** | Dean's Office | `admin@cit.edu` | `CITAdmin2024!` | Full authority, schedule publish, all bookings, demo data reset |
| **Department Coordinator** | ECE Coordinator | `coordinator@cit.edu` | `CITCoord2024!` | Dept venues, lab allocations, faculty availability, dept approvals |
| **Faculty** | Dr. Amit Behera | `faculty@cit.edu` | `CITFaculty2024!` | Personal schedule, leave requests, conversational AI assistant |
| **Club Representative** | Aarav Sharma | `clubrep@cit.edu` | `CITClub2024!` | Fest venue booking, Hinglish requests, status & alternatives tracking |

> **Admin Demo Reset**: The Admin role has access to the **"Reset Demo Data"** action (backed by `POST /api/cit/reset`), which restores baseline schedules and purges transient test records.

---

## Tech Stack

- **Framework**: Next.js 14.2.15 (App Router, Server & Client Components)
- **Language**: TypeScript 5 (Strict Typing)
- **Styling**: Tailwind CSS 3.4.1 + Custom Aurora Motion System
- **Animation**: Framer Motion 11.11.9
- **Icons**: Lucide React
- **Database / Persistence**: Supabase PostgreSQL (Atomic RPCs) + Local File System Fallback
- **AI / LLM**: Groq Cloud SDK (`llama-3.3-70b-versatile` / `llama3-8b-8192`)
- **Validator**: Python 3.10+ Standard Library (`validator.py`)

---

## Local Setup & Installation

### Prerequisites
- Node.js 20 LTS or newer
- npm 9+
- Python 3.10+ (for official constraint validator)

### Step-by-Step Instructions

1. **Clone or extract repository**:
   ```bash
   git clone <YOUR_REPO_URL>
   cd cit-campus-scheduler

   1. Install project dependencies:
   npm ci

   2. Configure environment variables:
   cp .env.example .env.local

   3. Run development server:
   npm run dev

   4. Open application:
   Navigate to http://localhost:3000 in your browser.

   Useful Commands
    Task	Command	Description
    Start Dev Server	npm run dev	Boots local Next.js server on port 3000
    Production Build	npm run build	Compiles server components and optimizes bundles
    Type Check	npm run typecheck	Validates TypeScript types across the project
    Lint Check	npm run lint	Runs ESLint on components and API routes
    Verify Release	npm run verify:release	Runs release checks and schedules validation
    Validate Baseline	npm run validate:schedule	Validates exports/schedule.json using validator.py
    Validate Disruption	npm run validate:disruption	Validates exports/schedule_after.json using validator.py

    <!-- Official Validator Verification Results -->
        Baseline Master Schedule (exports/schedule.json)

        Dataset: cit-public-v1   Schedule says: cit-public-v1   Team: CIT Master Minds
        Hard violations: 0  {}
        Soft penalty: 13  {'S1': 0, 'S2': 10, 'S3': 0, 'S4': 3, 'S5': 0, 'S6': 0}
        Bookings: score 53.0 | approved 17, alternatives 1, rejected 7, session overrides 1, priority inversions 0
        Exam soft penalty: 0

        <!-- Disruption Timetable (exports/schedule_after.json) -->
        
        Dataset: cit-public-v1   Schedule says: cit-public-v1   Team: CIT Master Minds
        Hard violations: 0  {}
        Soft penalty: 15  {'S1': 0, 'S2': 10, 'S3': 0, 'S4': 3, 'S5': 2, 'S6': 0}
        Bookings: score 53.0 | approved 17, alternatives 1, rejected 7, session overrides 1, priority inversions 0
        Exam soft penalty: 0
        Stability: 11 sessions moved (0 changed time, 11 room only)

<!-- Project Layout -->

├── app/
│   ├── api/
│   │   ├── ai/assistant/       # Prompt-injected defended conversational assistant
│   │   ├── ai/parse/           # Groq natural language intent extraction
│   │   ├── cit/auth/           # Session management & credential verification
│   │   ├── cit/bookings/       # Venue reservations & atomic transitions
│   │   ├── cit/disruption/     # Dynamic rescheduling solver & publish gate
│   │   ├── cit/exams/          # Exam engine & social-distancing validator
│   │   └── cit/spectra/        # Priority-order decisions & audit logging
│   ├── globals.css             # Theme variables & accessibility styling
│   ├── layout.tsx              # Root HTML & Toast context provider
│   └── page.tsx                # Master container & 1-Click Role Gateway
├── components/
│   ├── AiAssistantModule.tsx   # Conversational assistant & quick judge chips
│   ├── AnalyticsConflictsModule.tsx # P1–P9 Rooms × Periods utilization heatmap
│   ├── DashboardModule.tsx     # KPI statistics & animated preview cards
│   ├── ExamsModule.tsx         # 41-exam matrix & halved capacity verification
│   ├── ReschedulingStudioModule.tsx # Before/After diff tables & publish modal
│   ├── SpectraEventsModule.tsx # P1–P13 venue timeline & reason chips
│   ├── TimetableSection.tsx    # 3-way view (Group, Faculty, Room) + PDF export
│   └── VenueBookingSection.tsx # Natural-language booking & popular venues
├── data/
│   ├── cit_public.json         # Master benchmark dataset (rooms, faculty, sessions)
│   └── sample_disruption.json  # Emergency CR-102 closure scenario
├── exports/
│   ├── schedule.json           # Certified baseline timetable (0 hard violations)
│   └── schedule_after.json     # Certified disrupted timetable (11 room-only moves)
├── lib/
│   ├── ai-parser.ts            # Natural language & Hinglish regex engine
│   ├── auth-session.ts         # Constant-time auth & HMAC cookie signing
│   ├── booking-engine.ts       # Priority hierarchy & alternative slot search
│   ├── exam-engine.ts          # Constraint-satisfaction exam generator
│   ├── rescheduling-solver.ts  # Minimal-movement disruption search
│   └── timetable-engine.ts     # Complete H1–H14 & S1–S6 validation rules
├── supabase/
│   └── migrations/             # Schema & atomic booking workflow functions
├── AI_USAGE.md                 # Mandatory competition AI declaration
├── THIRD_PARTY.md              # Open-source libraries and licensing inventory
└── validator.py                # Official Python constraint checker

Known Limitations
Authentication Scope: Demo credentials are hardcoded for evaluation. A production deployment should integrate an external OAuth2/SAML identity provider.
Serverless Storage: When running without Supabase credentials on stateless platforms like Vercel, persistent state uses an in-memory//tmp fallback. Set up a Supabase instance for multi-instance persistence.
Search Completeness: The rescheduling solver uses a greedy CSP heuristic to prioritize zero-time shifts. While it produces 0 hard violations on benchmark datasets, it does not guarantee a global mathematical optimum on arbitrary inputs.

---

### File 2: `AI_USAGE.md`

```markdown
# AI Usage Declaration — CIT Campus Scheduler

- **Team Name**: CIT Master Minds
- **Project**: CIT Campus Scheduler & Operations Hub (Crunch Week 2024)
- **Submission Date**: November 1, 2024

---

## 1. AI Features Implemented in the Product

### A. Conversational & Hinglish Booking Intent Parser (`lib/ai-parser.ts`, `app/api/ai/parse/route.ts`)
- **Model**: Groq Cloud API running `llama-3.3-70b-versatile` (fallback support for `llama3-8b-8192`).
- **Purpose**: Extracts structured scheduling variables from conversational English and Hinglish inputs (e.g., *"Kal dopahar 2 baje 70 students ke liye CS lab chahiye"*).
- **Extracted Fields**:
  - Event title & institutional category
  - Expected attendance
  - Duration in periods (1 period = 1 hour)
  - Target weekday (`MON`–`FRI`)
  - Target start period (`P1`–`P13`)
  - Equipment requirements (`projector`, `pa_system`, `stage`, `computers`)
  - Accessibility constraints (`accessible`)
- **Sanitization & Clamping**: Every raw LLM output is parsed through `normaliseGroqOutput()` to enforce period bounds (clamping times to the P13 curfew) and detect accessibility issues before passing to any downstream engine.

### B. Deterministic Rule-Based Fallback Guarantee
- If `GROQ_API_KEY` is not configured, or if an API timeout ($\ge 8\text{ seconds}$) occurs, the system falls back to the deterministic keyword and regex parser in `lib/ai-parser.ts`.
- The UI indicates the parsing source (`_source: "groq"` vs `_source: "rule_based"`). All core booking flows remain usable without an API key.

### C. Conversational Faculty Assistant (`app/api/ai/assistant/route.ts`, `components/AiAssistantModule.tsx`)
- Provides natural-language access to schedule inspection, conflict status, and draft rescheduling solutions.
- **Prompt Injection Defense**: Rejects jailbreak patterns (`ignore previous instructions`, `grant admin`, `override constraints`, `drop table`).
- **Priority Policy Enforcement**: Blocks lower-priority roles (students/clubs) from requesting cancellations of regular academic sessions.

---

## 2. What the AI is NOT Allowed to Decide (Safety Boundary)

To comply with competition rules, **the LLM is strictly prohibited from making scheduling, allocation, or validation decisions**:

1. **No Constraint Evaluation by LLM**: The model never decides whether a venue is free, whether student cohorts clash, or whether room capacity is sufficient. All H1–H14 hard constraints are verified by deterministic code (`lib/timetable-engine.ts`, `lib/booking-engine.ts`, `lib/exam-engine.ts`).
2. **No Autonomous Approval**: The LLM cannot approve, reject, or commit bookings or timetable changes. All mutations require verified session authentication (`lib/auth-session.ts`).
3. **No Autonomous Rescheduling**: Relocation candidates are determined by deterministic constraint satisfaction search (`lib/rescheduling-solver.ts`), requiring human Admin approval before publication.

---

## 3. Development Assistance Declaration

The following AI tools and coding assistants were used during development:

| Tool / Assistant | Provider | Dates Used | Contributions |
|---|---|---|---|
| **Google Gemini 2.0 / Antigravity** | Google DeepMind | Oct 27 – Nov 1, 2024 | Boilerplate Next.js scaffolding, TypeScript types, SVG graphics, and Tailwind CSS layouts. |
| **Llama-3.3-70B-Versatile** | Meta / Groq | Oct 28 – Nov 1, 2024 | Hinglish parsing logic, intent extraction schemas, and few-shot extraction prompts. |
| **GitHub Copilot** | GitHub / OpenAI | Oct 27 – Oct 30, 2024 | Autocomplete suggestions for boilerplate API routes and CSV loading scripts. |

### Division of Work: Code Written by Team vs AI-Assisted

- **100% Deterministic Engine Code (Written & Verified by Team)**:
  - `lib/timetable-engine.ts`: Implementation of H1–H14 hard constraints and S1–S6 soft-penalty formulas.
  - `lib/exam-engine.ts`: Midsem exam slotting with 50% social-distancing capacity and single-exam-per-day constraints.
  - `lib/rescheduling-solver.ts`: Multi-pass CSP search prioritizing room-only moves over time shifts.
  - `lib/booking-engine.ts`: Multi-tier priority queue, role caps, and anti-self-approval enforcement.
  - `lib/auth-session.ts`: Cryptographic token signing and constant-time credential matching.
- **AI-Assisted Components**:
  - UI layout, color palettes, and Tailwind utility classes in `components/`.
  - Regex patterns for Hindi/Hinglish weekday and period detection in `lib/ai-parser.ts`.
  - Edge-case scenario design in `examples/sample_requests.md`.

---

## 4. Prompt Storage & Privacy

- The system prompt used for intent extraction is stored as `GROQ_SYSTEM_PROMPT` in `app/api/ai/parse/route.ts`.
- **Privacy & Data Retention**: No user data, student information, or scheduling databases are used for model training. Prompts contain only user-submitted booking text and are processed statelessly.