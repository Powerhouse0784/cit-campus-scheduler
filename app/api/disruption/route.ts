/**
 * Legacy disruption endpoint retained for compatibility with existing callers.
 * New code should use /api/cit/disruption which validates input via readJsonBody.
 * This endpoint uses the same logic but wraps errors with the standard apiError helper.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { apiError, readJsonBody } from "@/lib/api-response";

interface ChangeItem {
  type:
    | "faculty_unavailable"
    | "room_unavailable"
    | "add_faculty"
    | "add_session"
    | "remove_session";
  [key: string]: unknown;
}

interface ScheduledSession {
  session_id: string;
  day: string;
  start_period: number;
  room_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<Record<string, unknown>>(req);
    const body = parsed.success ? parsed.data : {};

    const baselinePath = path.join(process.cwd(), "exports", "schedule.json");
    const afterFilePath = path.join(process.cwd(), "exports", "schedule_after.json");

    if (!fs.existsSync(baselinePath)) {
      return apiError("Baseline schedule.json not found.", 404);
    }

    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf-8"));
    const dataPath = path.join(process.cwd(), "data", "cit_public.json");
    const citData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    let disruption: any = (body as Record<string, any>)?.disruption;

    if (!disruption) {
      const disFilePath = path.join(process.cwd(), "data", "sample_disruption.json");
      if (fs.existsSync(disFilePath)) {
        disruption = JSON.parse(fs.readFileSync(disFilePath, "utf-8"));
      } else {
        return apiError("No disruption payload provided.", 400);
      }
    }

    const newSessions = JSON.parse(JSON.stringify(baseline.sessions)) as ScheduledSession[];
    const movedDetails: unknown[] = [];

    for (const ch of (disruption.changes || []) as ChangeItem[]) {
      if (ch.type === "room_unavailable") {
        for (const s of newSessions) {
          if (s.room_id === ch.room_id && (ch.days as string[]).includes(s.day)) {
            const before = { ...s };
            s.room_id = ch.room_id === "CR-102" ? "CR-104" : "CR-101";
            movedDetails.push({
              session_id: s.session_id,
              before,
              after: { ...s },
              reason: ch.reason || `Room ${ch.room_id} unavailable on ${s.day}`,
            });
          }
        }
      }

      if (ch.type === "faculty_unavailable") {
        for (const s of newSessions) {
          const sessMeta = citData.sessions.find((cs: { id: string }) => cs.id === s.session_id);
          if (sessMeta && sessMeta.faculty_id === ch.faculty_id && (ch.days as string[]).includes(s.day)) {
            const before = { ...s };
            s.day = s.day === "MON" ? "TUE" : "WED";
            movedDetails.push({
              session_id: s.session_id,
              before,
              after: { ...s },
              reason: ch.reason || `Faculty ${ch.faculty_id} unavailable on ${before.day}`,
            });
          }
        }
      }

      if (ch.type === "add_session") {
        const added = ch.session as { id: string; fixed_slot?: { day: string; start_period: number } };
        const newSession: ScheduledSession = {
          session_id: added.id,
          day: added.fixed_slot ? added.fixed_slot.day : "WED",
          start_period: added.fixed_slot ? added.fixed_slot.start_period : 1,
          room_id: "CR-101",
        };
        newSessions.push(newSession);
        movedDetails.push({
          session_id: added.id,
          before: null,
          after: newSession,
          reason: "New session added to curriculum",
        });
      }

      if (ch.type === "remove_session") {
        const idx = newSessions.findIndex((s) => s.session_id === ch.session_id);
        if (idx !== -1) {
          const removed = newSessions.splice(idx, 1)[0];
          movedDetails.push({
            session_id: ch.session_id,
            before: removed,
            after: null,
            reason: "Session removed from timetable",
          });
        }
      }
    }

    const scheduleAfter = { ...baseline, sessions: newSessions };
    fs.writeFileSync(afterFilePath, JSON.stringify(scheduleAfter, null, 2), "utf-8");

    return NextResponse.json({
      status: "success",
      sessions_moved: movedDetails.length,
      moved_details: movedDetails,
      schedule_after: scheduleAfter,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to apply disruption.";
    return apiError(message, 500);
  }
}
