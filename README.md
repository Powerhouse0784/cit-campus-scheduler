# CIT Campus Scheduler

A campus scheduling and venue-operations platform for the CIT Crunch Week hackathon. It brings timetable views, exam planning, venue requests, Spectra event screens, disruption/rescheduling views, analytics, and role-oriented navigation into one Next.js application.

## Architecture

```text
Browser (Next.js 14 / React 18)
        │
        ├── Dashboard, Timetable, Exams, Venues, Spectra
        ├── AI Assistant, Rescheduling Studio, Analytics, Settings
        │
Next.js Route Handlers (/app/api)
        │
        ├── /api/schedule, /api/schedule/generate
        ├── /api/cit/exams (Dynamic Exam Engine)
        ├── /api/cit/spectra (Festival Governance & Approvals)
        ├── /api/cit/timetable, /api/cit/stats, /api/cit/bookings
        ├── /api/cit/disruption, /api/cit/explain, /api/cit/reset
        ├── /api/ai/parse (Groq Llama-3 + deterministic fallback)
        │
Core Engine Services (lib/)
        │
        ├── lib/timetable-engine.ts (Hard constraints H1-H14, soft S1-S6)
        ├── lib/exam-engine.ts (Dynamic slotting, halved capacity, 0 clashes)
        ├── lib/booking-engine.ts (Spectra priority hierarchy & rules)
        ├── lib/disruption-handler.ts (Minimal-movement rescheduling)
        ├── lib/ai-parser.ts (English & Hinglish rule-based parsing)
        │
JSON / CSV Dataset (data/, exports/)
        │
        ├── data/cit_public.json, data/sample_disruption.json
        ├── exports/schedule.json (Validated baseline schedule)
        ├── exports/schedule_after.json (Validated disruption schedule)
        │
Official Schedule Validator (validator.py / validator.mjs)
```

## Technology Stack

- **Framework**: Next.js 14.2.15 (App Router) & React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 & PostCSS
- **Animation & Icons**: Framer Motion & Lucide React
- **Constraint Engines**: Pure deterministic Node.js & TypeScript algorithms
- **AI Integration**: Groq API (`llama3-8b-8192`) with automatic deterministic fallback
- **Validation**: Python 3.8+ official validator (`validator.py`)

## Storage & Persistence Architecture

- **Evaluation / Hackathon Runtime**: Deterministic zero-dependency file-based persistence (`data/user_bookings.json` and `exports/schedule.json`). This ensures 100% offline reproducibility and seamless integration with the official Python validator (`validator.py`).
- **Production Architecture**: Structured around `IBookingStorageAdapter` ([`lib/storage.ts`](file:///D:/Hackthon/cit-campus-scheduler/lib/storage.ts)) defining clean repository contracts for drop-in PostgreSQL / Prisma ORM persistence in enterprise deployment.

## Requirements

- Node.js 18.17+ or 20+
- npm 9+
- Python 3.8+ for `validator.py`

## Installation & Setup

```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
```

Copy `.env.example` to `.env.local` and configure variables as needed:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js local development server |
| `npm run build` | Compile and build production application |
| `npm run start` | Run production server after build |
| `npm run lint` | Run Next.js ESLint checks |
| `npm run typecheck` | Run TypeScript check without emitting files |
| `npm run generate:schedules` | Run constraint-aware timetable & exam solver with automatic Python validation |
| `npm run validate:schedule` | Run official Python validator on `exports/schedule.json` |
| `npm run validate:disruption` | Run official Python validator on `exports/schedule_after.json` |

## Demo Accounts & Role Permissions

The platform includes four preset demo accounts matching hackathon requirements. Use the top navigation role selector to test all four role perspectives:

| Demo Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Admin (Dean's Office)** | `admin@cit.edu` | `CITAdmin2024!` | Full authority: generates timetables, approves disruption changes, overrides sessions for fest, resets demo data. |
| **Department Coordinator** | `coordinator@cit.edu` | `CITCoord2024!` | Requests department session changes, books department venues, approves department lab requests. |
| **Faculty Member** | `faculty@cit.edu` | `CITFaculty2024!` | Views personal schedule, marks unavailability windows, requests rescheduled sessions. |
| **Club Representative** | `clubrep@cit.edu` | `CITClub2024!` | Submits natural-language venue requests, views status and explanations, cancels own requests. |

To reset data back to clean state, log in as Admin and click **Reset Demo Data**.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Optional | API key for Groq (`llama3-8b-8192`) natural language booking parsing. If not set, system automatically uses deterministic rule-based parser. |
| `OPENAI_API_KEY` | Optional | Reserved for alternative OpenAI LLM provider fallback. |
| `NEXT_PUBLIC_APP_URL` | Optional | Public application base URL (defaults to `http://localhost:3000`). |

## Validator Results

Both generated exports pass the official `validator.py` with **zero hard violations**:

1. **Baseline Schedule (`exports/schedule.json`)**:
   - Hard Violations: **0**
   - Soft Penalty: **13** (S1=0, S2=10, S3=0, S4=3, S5=0, S6=0)
   - Exam Soft Penalty: **0**
   - Bookings Score: **53.0** (17 approved, 1 alternative, 7 rejected, 1 session override, 0 priority inversions)

2. **Disrupted Schedule (`exports/schedule_after.json`)**:
   - Hard Violations: **0**
   - Soft Penalty: **15**
   - Exam Soft Penalty: **0**
   - Stability: **11 sessions moved** (0 time changed, 11 room-only relocations for closed CR-102)
