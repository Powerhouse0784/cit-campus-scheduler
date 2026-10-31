# AI Usage Declaration — CIT Campus Scheduler

### 1. Models & APIs Used in Product
- **Model**: `llama-3.3-70b-versatile` (via Groq) / `gpt-4o-mini` (via OpenAI).
- **Purpose**: Translates natural language and Hinglish venue requests (e.g., *"seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye"*) into structured booking JSON and drafts conversational explanations.
- **Prompt Definitions**: Located in `lib/ai-parser.ts` and `app/api/ai/parse/route.ts`.

### 2. Strict Boundary: What the LLM is NOT Allowed to Decide
- The LLM **never** determines timetable validity, room allocation, capacity checks, or dispute resolution.
- All constraint checks (H1 to H14, S1 to S6, B1 to B3) are strictly computed by deterministic TypeScript/Python code in `lib/timetable-engine.ts` and `lib/booking-engine.ts`.
- Every LLM-generated JSON payload passes through the deterministic rule-engine before touching state.
- If the AI API fails, goes offline, or runs out of credits, a full offline regex/rule parser takes over seamlessly.

### 3. AI Tools Used During Development
- GitHub Copilot / Claude for drafting boilerplate TypeScript types and UI tailwind mockups.