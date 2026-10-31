# AI Usage Declaration — CIT Campus Scheduler

## Team Information
- **Team Name**: CIT Master Minds
- **Project**: CIT Campus Scheduler & Operations Hub (Crunch Week 2024)
- **Submission Date**: November 1, 2024

---

## 1. AI Features Implemented in the Product

### A. Natural-Language Booking & Query Parser (`lib/ai-parser.ts`, `app/api/ai/parse/route.ts`)
- **Model**: Groq Cloud API running `llama3-8b-8192` (inference speed ~300 tokens/sec).
- **Purpose**: Extracts structured intent from complex English and conversational Hinglish messages (e.g. *"Kal dopahar 3 baje 80 students ke liye LH-1 chahiye projector ke saath"*).
- **Extraction Schema**: Returns normalized JSON specifying event title, category, attendance, duration, days, period windows, room types, facilities, and accessibility requirements.
- **Normalisation & Safety Layer**: Every LLM output is strictly post-processed and clamped by `normaliseGroqOutput()` before any scheduling engine receives it. The LLM output is treated as untrusted input.

### B. Deterministic Rule-Based Fallback Guarantee
- When `GROQ_API_KEY` is not set or network latency exceeds 8 seconds, the application automatically falls back to the deterministic regular-expression & keyword parser in `lib/ai-parser.ts`.
- The UI transparently displays the parsing source (`Groq (llama3-8b-8192)` vs `rule_based_fallback`). Judges can verify full functionality without an API key.

### C. Conversational Faculty AI Assistant (`app/api/ai/assistant/route.ts`, `components/AiAssistantModule.tsx`)
- Provides natural-language schedule interrogation, timetable queries, conflict scans, and rescheduling proposals.
- **Prompt Injection Defense**: Evaluates incoming prompts against malicious jailbreak and privilege-escalation patterns (`ignore previous instructions`, `grant admin`, `override rules`).
- **Priority Policy Enforcement**: Prevents lower-priority roles (students/clubs) from using natural language prompts to displace academic courses or exam periods.

---

## 2. What the AI is NOT Allowed to Decide (Safety Boundary)

Under our strict architecture, **no AI model or LLM makes scheduling, conflict, or allocation decisions**:
1. **Constraint Satisfaction**: The LLM never decides whether a slot is free, whether capacity is sufficient, or whether a room type matches. All H1–H14 hard constraints are verified by deterministic code (`lib/timetable-engine.ts`, `lib/booking-engine.ts`, `lib/exam-engine.ts`).
2. **Approval Authority**: The LLM never approves, rejects, or publishes bookings or disruption changes. Approvals require cryptographic session authorization (`lib/auth-session.ts`).
3. **Rescheduling Solver**: Timetable reallocations are computed by the deterministic Constraint Satisfaction Search (`lib/rescheduling-solver.ts`), searching for low-disruption candidates; results must be validated and are not guaranteed globally optimal.

---

## 3. Development Assistance Declaration

In accordance with competition rules, the following AI tools and coding assistants were utilized during the development lifecycle:

| Tool / Assistant | Provider | Dates Used | Codebase Contributions |
|---|---|---|---|
| **Antigravity / Gemini 2.0** | Google DeepMind | Oct 27 – Nov 1, 2024 | Architectural scaffolding, TypeScript interface definitions, SVG UI components, unit tests, and Tailwind CSS responsive styling. |
| **Llama-3-8B-8192** | Meta / Groq | Oct 28 – Nov 1, 2024 | Conversational intent extraction, Hinglish translation patterns, and few-shot booking extraction prompt design. |
| **GitHub Copilot** | GitHub / OpenAI | Oct 27 – Oct 30, 2024 | Code autocompletion, boilerplate Next.js API routes, and CSV-to-JSON data ingestion scripts. |

### Specific Parts Written by Human Engineers vs AI Assistance
- **100% Deterministic Engine Code (Human Architected & Verified)**:
  - `lib/timetable-engine.ts` (H1–H14 hard constraint logic, S1–S6 soft penalty calculation)
  - `lib/exam-engine.ts` (Dynamic exam slotting, 50% capacity cap, cohort clash prevention)
  - `lib/rescheduling-solver.ts` (CSP tree search, stability objective minimization)
  - `lib/auth-session.ts` (HMAC-SHA256 session signatures and constant-time password verification)
- **AI-Assisted Modules**:
  - UI layout and Tailwind styling in `components/`
  - Prompt engineering and regex dictionary in `lib/ai-parser.ts`
  - Synthetic test cases in `data/sample_disruption.json` and `examples/sample_requests.md`

---

## 4. Prompt Storage & Privacy

- The system prompt sent to Groq is defined as a constant `GROQ_SYSTEM_PROMPT` in `app/api/ai/parse/route.ts`.
- **Zero Data Retention**: The system does not store user prompts or conversational history in third-party model logs; requests are completely stateless.

---

## 5. Known Limitations
- The parser is not a general-purpose conversational agent. Ambiguous or incomplete requests may require user correction; deterministic validation must be used before any booking decision.
- Demo credentials are intended only for local evaluation and must be replaced/disabled before public production use.
- Persistence currently uses process memory, `/tmp`, and local JSON files as fallbacks. These are **not durable shared storage on Vercel**; configure a database-backed adapter before relying on cross-instance persistence.
- Production authentication requires `CIT_AUTH_SECRET` (at least 32 characters). The app deliberately refuses to mint sessions with a predictable production fallback secret.
- Period numbers (P1–P13) follow the institution's official 08:00–21:00 schedule structure.
