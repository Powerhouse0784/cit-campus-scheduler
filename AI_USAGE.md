# AI Usage Declaration — CIT Campus Scheduler

## AI features implemented in this product

### 1. Natural-language booking parser (`lib/ai-parser.ts` + `app/api/ai/parse/route.ts`)
- When `GROQ_API_KEY` is set, the POST endpoint calls the Groq API (`llama3-8b-8192`) to extract structured booking intent from English and Hinglish text.
- The Groq response is **always post-processed and normalised by application code** in `normaliseGroqOutput()` before it is returned. The LLM output is treated as untrusted input.
- If Groq is unavailable, times out (8-second limit), or the key is not set, the system **automatically falls back** to the deterministic rule-based parser in `lib/ai-parser.ts`. The manual booking form continues to work without any LLM.
- The parser response field `_source` tells the caller whether the result came from `"groq"` or `"rule_based"` or `"rule_based_fallback"`.

### 2. Deterministic rule-based parser (`lib/ai-parser.ts`)
- Keyword and regular-expression based extraction of attendance, duration, day, time period, room type, facilities, student groups, and accessibility requirements.
- Used as the primary parser when no API key is present, and as the fallback when Groq fails.

## What the LLM is NOT allowed to decide
- Whether a schedule or booking is valid
- Whether a room is available or has a conflict
- Whether a booking is approved or rejected
- Whether hard constraints are satisfied
- Any write operation to scheduling data

All of the above are handled exclusively by deterministic application code (the rule engine in `lib/booking-engine.ts`, `lib/timetable-engine.ts`, and `lib/exam-engine.ts`). Every LLM output goes through these checks before changing any data.

## Provider details
| Provider | Model | Used for | Key env var |
|---|---|---|---|
| Groq | `llama3-8b-8192` | Natural-language booking intent extraction | `GROQ_API_KEY` |

## Manual fallback guarantee
If `GROQ_API_KEY` is not set or Groq is unavailable, the booking form and AI Assistant continue to work using the rule-based parser. Judges can verify this by removing the key from the environment.

## Development assistance
AI coding assistants (including Antigravity / Gemini) were used to accelerate development. The team must update this section before final submission with specific tool names, dates, and which parts of the codebase they contributed to.

## Prompt storage
- The system prompt sent to Groq is defined as a constant `GROQ_SYSTEM_PROMPT` in `app/api/ai/parse/route.ts`.
- No conversation history is stored; each request is stateless.

## Known limitations
- The Groq parser may return incomplete JSON for highly ambiguous requests; the normalisation layer applies safe defaults.
- Date/time interpretation uses period numbers (P1–P13), not calendar dates; users must confirm the parsed output.
- The parser does not produce validated venue alternatives; alternatives require deterministic engine checks.
