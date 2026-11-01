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
File 3: THIRD_PARTY.md
code
Markdown
# Third-Party Libraries, Assets and Tools

This document lists all third-party dependencies, open-source packages, external APIs, and design assets used in the CIT Campus Scheduler application.

---

## 1. Runtime & Production Dependencies

| Package Name | Declared Version | License | Purpose / Role |
|---|---|---|---|
| **next** | `14.2.15` | MIT | Full-stack framework, App Router, React Server Components, and Edge/Node API route handlers |
| **react** | `^18.3.1` | MIT | Core UI library for component hierarchy and DOM management |
| **react-dom** | `^18.3.1` | MIT | React DOM renderer for browser environments |
| **framer-motion** | `^11.11.9` | MIT | Motion system, layout transitions, modal animations, and route progress bar |
| **lucide-react** | `^0.453.0` | ISC | Accessible SVG iconography across navigation, badges, and controls |
| **clsx** | `^2.1.1` | MIT | Conditional CSS class merging utility |
| **tailwind-merge** | `^2.5.4` | MIT | Utility for resolving Tailwind CSS class conflicts safely |

---

## 2. Development & Build Tools

| Package Name | Declared Version | License | Purpose / Role |
|---|---|---|---|
| **typescript** | `^5` | Apache-2.0 | Static type checking and interface verification |
| **tailwindcss** | `^3.4.1` | MIT | Utility-first CSS generation engine |
| **postcss** | `^8` | MIT | Tool for transforming CSS with Tailwind plugins |
| **eslint** | `^8.57.0` | MIT | JavaScript and TypeScript static code analysis |
| **eslint-config-next** | `14.2.15` | MIT | Next.js-specific linting rules and optimizations |
| **@types/node** | `^20` | MIT | TypeScript type definitions for Node.js runtime APIs |
| **@types/react** | `^18` | MIT | TypeScript type definitions for React |
| **@types/react-dom** | `^18` | MIT | TypeScript type definitions for React DOM |

---

## 3. External Cloud APIs & Services

| Provider | Service / Model | Integration Method | Purpose |
|---|---|---|---|
| **Groq Cloud** | `llama-3.3-70b-versatile` | REST API (`https://api.groq.com/openai/v1/chat/completions`) | Natural-language and Hinglish intent parsing for venue booking requests |
| **Supabase** | PostgreSQL 15 | PostgREST API / RPC | Optional persistent storage for atomic booking transitions and schedule revisions |

*Note: The application includes offline rule-based fallbacks for both Groq and Supabase.*

---

## 4. Fonts and Media Assets

- **Google Fonts**:
  - *Plus Jakarta Sans* (Body copy) — Open Font License (OFL)
  - *Manrope* (Headings & numerical displays) — Open Font License (OFL)
  - *Fraunces* (Serif accents) — Open Font License (OFL)
- **Vector Artwork**:
  - CIT Logo & Book Mark: Custom hand-crafted inline SVGs (`components/CitLogo.tsx`).
  - Campus Sketch & Skyline: Custom inline SVGs (`components/Sidebar.tsx`).
  - Robot Assistant Avatar: Custom inline SVGs (`components/AiAssistantModule.tsx`).
- **Campus & Event Imagery**:
  - Campus hero images (`public/images/hero-campus-light.jpg`, `public/images/hero-campus-dark.jpg`) and festival cards (`public/images/spectra/*.jpg`) were custom-rendered for this project under creative commons attribution.

---

## 5. Official Validator

- **Script**: `validator.py`
- **Source**: Provided in the hackathon starter pack.
- **License**: Competition evaluation software; uses the Python standard library with no external pip dependencies.