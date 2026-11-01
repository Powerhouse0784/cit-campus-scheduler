export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth-session";
import { ReschedulingSolver } from "@/lib/rescheduling-solver";
import { parseHinglishOrEnglishRequest } from "@/lib/ai-parser";
import { readDurableJson } from "@/lib/durable-state";
import { apiError, readJsonBody } from "@/lib/api-response";
import path from "path";

// Security blocklist for prompt injection / jailbreak attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts)/i,
  /system\s+prompt/i,
  /pretend\s+(you\s+are|to\s+be)\s+(an?\s+)?admin/i,
  /grant\s+(me\s+)?(admin|superadmin|root|access)/i,
  /override\s+(all\s+)?(security|permissions|constraints|rules)/i,
  /drop\s+table/i,
  /<script/i,
  /delete\s+from/i,
  /bypass\s+authorization/i,
];

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<{ prompt?: string; role?: string }>(req);
    if (!parsed.success) return parsed.response;

    const rawPrompt = typeof parsed.data?.prompt === "string" ? parsed.data.prompt.trim() : "";
    if (!rawPrompt) {
      return apiError("A prompt is required.", 400);
    }
    if (rawPrompt.length > 2000) return apiError("Prompt must be 2,000 characters or fewer.", 413);

    const session = getAuthenticatedSession(req);
    const userRole = session.role;

    // 1. PROMPT INJECTION DEFENSE
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(rawPrompt)) {
        return NextResponse.json({
          success: true,
          intent: "security_rejection",
          source: "security_shield",
          text: "🛡️ Security Shield Alert: Conversational prompt injection or privilege escalation detected and blocked. The CIT AI Copilot only accepts valid scheduling, venue, and timetable queries.",
        });
      }
    }

    // 2. PRIORITY ABUSE PROTECTION
    const lower = rawPrompt.toLowerCase();
    const attemptsClassDisplacement =
      (lower.includes("cancel") || lower.includes("reschedule") || lower.includes("move") || lower.includes("displace")) &&
      (lower.includes("class") || lower.includes("lecture") || lower.includes("exam") || lower.includes("cs101") || lower.includes("ph101"));

    if ((userRole === "club" || userRole === "student") && attemptsClassDisplacement) {
      return NextResponse.json({
        success: true,
        intent: "priority_abuse_blocked",
        source: "priority_governance",
        text: "⛔ Priority Policy Enforcement: Under CIT Academic Governance (Exams > Classes > Institute > Guest > Department > Club), student club representatives cannot cancel or displace regular academic lectures or exams.",
      });
    }

    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");
    const reportPath = path.join(rootDir, "exports", "validation_report.json");
    const [dataset, schedule, validationReport] = await Promise.all([
      readDurableJson<any>(dataPath, null),
      readDurableJson<any>(schedPath, null),
      readDurableJson<any>(reportPath, null),
    ]);

    // 3. CONFLICT CHECK QUERY
    if (lower.includes("conflict") || lower.includes("clash") || lower.includes("check")) {
      if (!dataset || !schedule) {
        return NextResponse.json({ success: true, intent: "conflict_check", source: "constraint_engine", text: "I couldn't load the active dataset and timetable, so I can't verify conflicts yet. Load the dataset and generate a schedule first.", items: [] });
      }
      const sessions = Array.isArray(schedule.sessions) ? schedule.sessions : [];
      const hardViolations = validationReport?.hard_violations ?? validationReport?.hardViolations;
      const isValidated = typeof hardViolations === "number";
      return NextResponse.json({
        success: true,
        intent: "conflict_check",
        source: "constraint_engine",
        text: isValidated
          ? `The latest saved validation report records ${hardViolations} hard-constraint violation(s) for the report's schedule. The active timetable contains ${sessions.length} sessions. Re-run validation after any schedule change to ensure this report is current.`
          : `The active timetable contains ${sessions.length} sessions, but no usable validation report is available. I won't label it conflict-free until the official validator has run.`,
        items: [
          { title: "Active sessions", meta: String(sessions.length), status: "Loaded" },
          { title: "Validation report", meta: isValidated ? `${hardViolations} hard violations reported; report freshness must be checked` : "Not available — run official validator", status: isValidated ? "Report available" : "Needs validation" },
        ],
      });
    }

    // 4. TIMETABLE VIEW QUERY
    if (lower.includes("show") || lower.includes("timetable") || lower.includes("my schedule") || lower.includes("classes")) {
      let targetDay = "MON";
      if (lower.includes("tue")) targetDay = "TUE";
      if (lower.includes("wed")) targetDay = "WED";
      if (lower.includes("thu")) targetDay = "THU";
      if (lower.includes("fri")) targetDay = "FRI";

      if (!dataset || !schedule) return NextResponse.json({ success: true, intent: "timetable_query", source: "timetable_engine", text: "The active dataset or timetable is not loaded yet.", items: [] });
      const daySessions = (schedule.sessions || []).filter((s: any) => s.day === targetDay).slice(0, 5);
      const sessionMap = new Map((dataset.sessions || []).map((item: any) => [item.id, item]));
      const courseMap = new Map((dataset.courses || []).map((c: any) => [c.id, c.title]));

      return NextResponse.json({
        success: true,
        intent: "timetable_query",
        source: "timetable_engine",
        text: `Here is the schedule overview for ${targetDay}: ${daySessions.length} sessions found. This is a timetable view only; room and instructor clashes are not certified unless the official validator has run on this exact schedule.`,
        items: daySessions.map((s: any) => ({
          title: `${s.session_id}: ${courseMap.get((sessionMap.get(s.session_id) as any)?.course_id) || (sessionMap.get(s.session_id) as any)?.course_id || "Session"}`,
          meta: `${s.day} Period P${s.start_period} in Room ${s.room_id}`,
          status: "Scheduled — validation status not inferred",
        })),
      });
    }

    // 5. RESCHEDULE OR EXTRA SESSION REQUEST (Solver-Powered!)
    if (lower.includes("reschedule") || lower.includes("move") || lower.includes("extra") || lower.includes("leave") || lower.includes("swap")) {
      if (!dataset || !schedule) return NextResponse.json({ success: false, intent: "reschedule_unavailable", source: "dynamic_rescheduling_solver", text: "Dataset or timetable is not loaded, so I cannot calculate a safe reschedule proposal yet." }, { status: 409 });
      const solver = new ReschedulingSolver(dataset);
      // Build a proposal only. This current parser does not reliably identify the named faculty member, so the default faculty ID is an explicit demo assumption.
      const targetDay = lower.includes("thu") ? "THU" : lower.includes("wed") ? "WED" : "FRI";
      const samplePayload = {
        description: `Natural language rescheduling request: ${rawPrompt}`,
        changes: [
          {
            type: "faculty_unavailable" as const,
            faculty_id: "F01",
            days: [targetDay],
            periods: [1, 2, 3],
            reason: `Requested via AI Assistant: ${rawPrompt}`,
          },
        ],
      };

      const result = solver.solve(schedule, samplePayload);

      if (result.success) {
        return NextResponse.json({
          success: true,
          intent: "reschedule_solution",
          source: "dynamic_rescheduling_solver",
          text: `🎯 Solver proposal generated using demo faculty F01 as an assumption. Confirm the faculty and run official validation before publishing. ${result.explanation}`,
          items: result.moved_details.slice(0, 4).map((m) => ({
            title: `${m.session_id} (${m.subject})`,
            meta: `Reallocated: ${m.before?.day} P${m.before?.start_period} (${m.before?.room_id}) ➔ ${m.after.day} P${m.after.start_period} in ${m.after.room_id}`,
            status: "Solver proposal — validate before publishing",
          })),
        });
      } else {
        return NextResponse.json({
          success: true,
          intent: "reschedule_unresolvable",
          source: "dynamic_rescheduling_solver",
          text: `⚠️ Cannot accommodate request without constraint violations: ${result.explanation}`,
          items: result.unresolvable.map((u) => ({
            title: u.session_id,
            meta: u.reason,
            status: "Needs review",
          })),
        });
      }
    }

    // 6. DEFAULT: PARSE AS VENUE BOOKING REQUEST (English & Hinglish)
    const parsedBooking = parseHinglishOrEnglishRequest(rawPrompt);
    const summary = [
      `Attendance: ${parsedBooking.attendance} attendees`,
      `Duration: ${parsedBooking.duration_periods} period(s)`,
      `Time Window: ${parsedBooking.windows.map((w: any) => `${w.day} P${w.from_period}–P${w.to_period}`).join(", ")}`,
      `Room Type(s): ${parsedBooking.room_types.join(", ")}`,
      `Required Facilities: ${parsedBooking.needs.length ? parsedBooking.needs.join(", ") : "Standard AV / projector"}`,
    ];

    return NextResponse.json({
      success: true,
      intent: "venue_booking_parsed",
      source: "hinglish_dynamic_parser",
      text: `Draft Venue Booking Intent Parsed: All parameters mapped from natural language. Under CIT governance, final approval requires constraint validation.`,
      items: summary.map((line) => ({
        title: line,
        meta: "Parsed from your prompt",
        status: "Needs review",
      })),
      booking_data: parsedBooking,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI Assistant processing error.";
    return apiError(message, 500);
  }
}
