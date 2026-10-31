# CIT Campus Scheduler

A campus scheduling and venue-operations prototype for the CIT Crunch Week hackathon. It brings timetable views, exam planning, venue requests, Spectra event screens, disruption/rescheduling views, analytics and role-oriented navigation into one Next.js application.

> **Implementation note:** This repository is a prototype. The presence of a screen or engine module does not mean its complete workflow is production-ready. Some screens currently contain demonstration data or simulated interactions. Consult the current implementation and the Phase 1 audit before presenting functionality as complete.

## Architecture

```text
Browser (Next.js / React)
        |
        +-- Dashboard, Timetable, Exams, Venues, Spectra
        +-- AI Assistant, Rescheduling, Analytics, Settings
        |
Next.js Route Handlers (/app/api)
        |
        +-- lib/cit-backend.ts
        +-- lib/timetable-engine.ts
        +-- lib/exam-engine.ts
        +-- lib/booking-engine.ts
        +-- app/api/ai/parse (Groq extraction + rule-based fallback)
        +-- lib/ai-parser.ts (deterministic parser)
        |
JSON / CSV demo dataset (data/, exports/)
        |
Official schedule validator (validator.py / validator.mjs)
```

## Technology

- Next.js 14.2.15 and React 18
- TypeScript 5
- Tailwind CSS 3
- Framer Motion
- Lucide React
- Node.js schedule utilities
- Python standard-library schedule validator

## Requirements

- Node.js compatible with Next.js 14 (Node.js 18.17 or later recommended)
- npm
- Python 3.8+ for `validator.py`

## Installation

```bash
git clone <your-repository-url>
cd <repository-folder>
npm install
```

Copy `.env.example` to `.env.local` and adjust values if needed:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Install and run locally:

```bash
npm run dev
```

Open http://localhost:3000.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server after build |
| `npm run lint` | Run Next.js lint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run generate:schedules` | Run the schedule generation script |
| `npm run validate:schedule` | Run the Python schedule validator |

The validator can also be run directly:

```bash
python validator.py
```

Run generation and validation separately. A generator message is not proof of correctness; treat the validator output as authoritative.

## Demo navigation and roles

The interface includes four **role-view presets**. Use the role selector in the top navigation to switch the visible role. These are not login accounts: there is no username/password authentication, session management, or server-side RBAC in this prototype. Do not use the role selector as a security boundary or expose this demo with sensitive data.

| Role view | Intended demonstration scope |
|---|---|
| Admin (Dean's office) | Institute overview, reset demo state and administrative screens |
| Coordinator | Department timetable and venue-related screens |
| Faculty | Timetable and availability-related screens |
| Club Representative | Venue request screens |

The role selector is client-side only. Server-enforced permissions and real user accounts are outside this prototype's current implementation. The reset endpoint restores the baseline in the running server process; it does not provide durable multi-user persistence.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | No | Server-side credential used by `/api/ai/parse` to request structured booking-intent extraction from Groq; rule-based fallback is used when unavailable |
| `GROQ_MODEL` | No | Optional Groq model override; defaults to `llama3-8b-8192` |
| `OPENAI_API_KEY` | No | Reserved; no OpenAI API call is implemented |
| `NEXT_PUBLIC_APP_URL` | No | Public application base URL; defaults to local development URL |

Copy `.env.example` to `.env.local` for local development. `.env`, `.env.local`, and other `.env.*` files are ignored by Git; only the example template is tracked. Never commit real credentials. If a key was ever committed or shared, revoke/rotate it at the provider and remove it from repository history.

## Project structure

```text
app/                 Next.js pages and API route handlers
components/          Dashboard and feature UI modules
lib/                 Scheduling, booking, exam and parsing logic
data/                Demo JSON and CSV datasets
solver/              Schedule generation scripts
exports/             Schedule export examples
examples/             Example requests and disruption inputs
public/images/       Campus hero imagery
validator.py         Official Python schedule validator
validator.mjs        JavaScript validator mirror
```

## Data and exports

The `data/` directory contains the supplied demo dataset and CSV inputs. The `exports/` directory contains schedule output examples. Review generated exports with the validator before using them in a demonstration or submission.

## Role permissions

| Role | Permissions |
|---|---|
| **Admin** (Dean's office) | Generate timetable · approve/reject timetable changes · approve any booking that moves a class · reset demo data · manage all users · export schedule.json |
| **Coordinator** | Request changes to department sessions · book rooms for department events · approve bookings of department labs |
| **Faculty** | View own timetable · mark unavailability · request extra or moved sessions |
| **Club Representative** | Submit venue requests · cancel own requests · view request status and rejection reason |

> **Important:** Nobody can approve their own request. Self-approval is blocked.

- The application does not currently provide verified production authentication or server-enforced role-based access control. Demo accounts above use client-side role switching.
- The AI parser calls Groq using `GROQ_MODEL` (default `llama3-8b-8192`) when `GROQ_API_KEY` is set, with a deterministic rule-based fallback. Output is normalised, but parsed intent remains a draft and is not a validated booking.
- Spectra event cards and Rescheduling Studio contain clearly labelled illustrative sample data. Their approval/solver actions are not connected to live workflows.
- Disruption requests are strictly validated. The current prototype does not run a constraint-aware rescheduling solver for every change type; unsupported changes are rejected rather than presented as completed.
- JSON-backed demo state is not a substitute for durable multi-user database persistence.
- Schedule generation and disruption outputs must be independently validated; do not claim zero violations unless the official validator confirms it.

## Before hackathon submission

1. Verify every feature against the original problem statement.
2. Run lint, TypeScript and production build checks.
3. Run the official validator against every exported schedule.
4. Test each role's complete workflow.
5. Replace demo interactions with working, validated backend actions.
6. Update this README with the actual deployed URL, repository URL and verified demo instructions.
