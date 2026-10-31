import { NextRequest, NextResponse } from "next/server";
import { parseHinglishOrEnglishRequest } from "@/lib/ai-parser";
import { apiError, readJsonBody } from "@/lib/api-response";

// Groq is used when GROQ_API_KEY is set in the environment.
// If Groq is unavailable, the deterministic rule-based parser is used as fallback.
// The LLM output is always post-processed and structured by our own parser logic
// before being returned — the LLM never makes final scheduling decisions.

const GROQ_SYSTEM_PROMPT = `You are a campus scheduling assistant for Chilika Institute of Technology.
Extract booking intent from the user's message (which may be in English or Hinglish) and return ONLY a JSON object with these fields:
{
  "title": <string, e.g. "Coding Hackathon", "Technical Workshop", "Campus Quiz">,
  "category": <"institute_event"|"guest_lecture"|"department_event"|"club_event">,
  "attendance": <number>,
  "duration_periods": <number, 1 period = 1 hour>,
  "day": <"MON"|"TUE"|"WED"|"THU"|"FRI">,
  "from_period": <1-13>,
  "room_types": <array of strings like "classroom","lecture_hall","seminar_hall","auditorium","lab_cs">,
  "needs": <array like "projector","pa_system","stage","computers","accessible">,
  "requested_room": <room ID string or null, e.g. "AUD", "SH-1", "LH-1">,
  "mandatory_for_groups": <array of group IDs like "CSE-3">,
  "follow_up": <string if info is missing or defaulted, or null>,
  "accessibility_warning": <string if accessible room requested but non-accessible mentioned, or null>
}
Rules:
- Period mapping: P1=08:00, P2=09:00, P3=10:00, P4=11:00, P5=12:00, P6=14:00, P7=15:00, P8=16:00, P9=17:00, P10=18:00, P11=19:00, P12=20:00, P13=21:00
- "shaam" means evening (P10+), "dopahar" means afternoon (P6+), "subah" means morning (P1-P5)
- "kal" means tomorrow
- Periods P10-P13 are only for events, not regular classes
- If attendance is unclear, ask in follow_up
- Return ONLY the JSON object, no explanation`;

async function callGroq(prompt: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: GROQ_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse the JSON response from the LLM
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function normaliseGroqOutput(raw: Record<string, unknown>) {
  // Normalise the LLM output into ParsedBookingIntent shape matching form fields
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Campus Event";
  const category = (typeof raw.category === "string" && ["institute_event", "guest_lecture", "department_event", "club_event"].includes(raw.category))
    ? raw.category
    : "club_event";
  const day = (typeof raw.day === "string" && ["MON", "TUE", "WED", "THU", "FRI"].includes(raw.day.toUpperCase()))
    ? raw.day.toUpperCase()
    : "THU";
  const fromPeriod = typeof raw.from_period === "number" ? Math.max(1, Math.min(13, raw.from_period)) : 10;
  const duration = typeof raw.duration_periods === "number" ? Math.max(1, Math.min(6, raw.duration_periods)) : 2;
  const toPeriod = Math.min(13, fromPeriod + duration - 1);
  const requestedRoom = typeof raw.requested_room === "string" ? raw.requested_room.trim().toUpperCase() : null;

  return {
    title,
    category,
    attendance: typeof raw.attendance === "number" ? raw.attendance : 50,
    duration_periods: duration,
    day,
    start_period: fromPeriod,
    end_period: toPeriod,
    windows: [{ day, from_period: fromPeriod, to_period: toPeriod }],
    needs: Array.isArray(raw.needs) ? raw.needs : [],
    room_types: Array.isArray(raw.room_types) && (raw.room_types as unknown[]).length > 0
      ? raw.room_types
      : ["classroom", "lecture_hall", "seminar_hall"],
    requested_room: requestedRoom,
    mandatory_for_groups: Array.isArray(raw.mandatory_for_groups) ? raw.mandatory_for_groups : [],
    follow_up: typeof raw.follow_up === "string" ? raw.follow_up : null,
    accessibility_warning: typeof raw.accessibility_warning === "string" ? raw.accessibility_warning : null,
    _source: "groq",
  };
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody<{ prompt?: unknown }>(req);
  if (!parsed.success) return parsed.response;

  const prompt = parsed.data?.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return apiError("Prompt is required and must be a non-empty string.", 400);
  }
  if (prompt.length > 2000) {
    return apiError("Prompt must be 2,000 characters or fewer.", 413);
  }

  const trimmedPrompt = prompt.trim();

  try {
    // 1. Try Groq LLM first (if key is configured)
    const groqResult = await callGroq(trimmedPrompt);
    if (groqResult) {
      const normalised = normaliseGroqOutput(groqResult);
      return NextResponse.json({ ...normalised, success: true });
    }

    // 2. Fallback to deterministic rule-based parser
    const ruleResult = parseHinglishOrEnglishRequest(trimmedPrompt);
    return NextResponse.json({ ...ruleResult, _source: "rule_based", success: true });
  } catch (error) {
    // 3. Last resort: deterministic parser on any error
    try {
      const ruleResult = parseHinglishOrEnglishRequest(trimmedPrompt);
      return NextResponse.json({ ...ruleResult, _source: "rule_based_fallback", success: true });
    } catch (innerError) {
      const message = innerError instanceof Error ? innerError.message : "Unable to parse this request.";
      return apiError(message, 500);
    }
  }
}
