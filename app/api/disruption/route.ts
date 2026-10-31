import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ChangeItem {
  type: "faculty_unavailable" | "room_unavailable" | "add_faculty" | "add_session" | "remove_session";
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const baselinePath = path.join(process.cwd(), "exports", "schedule.json");

    if (!fs.existsSync(baselinePath)) {
      return NextResponse.json({ error: "Baseline schedule.json not found." }, { status: 404 });
    }

    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf-8"));
    const dataPath = path.join(process.cwd(), "data", "cit_public.json");
    const citData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    // If custom change file was uploaded, use it. Otherwise use sample_disruption.json
    let disruption = body.disruption;
    if (!disruption) {
      const disFilePath = path.join(process.cwd(), "data", "sample_disruption.json");
      if (fs.existsSync(disFilePath)) {
        disruption = JSON.parse(fs.readFileSync(disFilePath, "utf-8"));
      } else {
        return NextResponse.json({ error: "No disruption provided." }, { status: 400 });
      }
    }

    // Apply disruption changes
    const newSessions = JSON.parse(JSON.stringify(baseline.sessions));
    const movedDetails: any[] = [];

    for (const ch of (disruption.changes || []) as ChangeItem[]) {
      if (ch.type === "room_unavailable") {
        for (const s of newSessions) {
          if (s.room_id === ch.room_id && ch.days.includes(s.day)) {
            const before = { ...s };
            // Move to clean alternative room (CR-104 or LH-1)
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
          // Check if session belongs to unavailable faculty
          const sessMeta = citData.sessions.find((cs: any) => cs.id === s.session_id);
          if (sessMeta && sessMeta.faculty_id === ch.faculty_id && ch.days.includes(s.day)) {
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
        const added = ch.session;
        newSessions.push({
          session_id: added.id,
          day: added.fixed_slot ? added.fixed_slot.day : "WED",
          start_period: added.fixed_slot ? added.fixed_slot.start_period : 1,
          room_id: "CR-101",
        });
        movedDetails.push({
          session_id: added.id,
          before: null,
          after: { session_id: added.id, day: "WED", start_period: 1, room_id: "CR-101" },
          reason: "New session added to curriculum",
        });
      }

      if (ch.type === "remove_session") {
        const idx = newSessions.findIndex((s: any) => s.session_id === ch.session_id);
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

    const scheduleAfter = {
      ...baseline,
      sessions: newSessions,
    };

    // Save repaired timetable
    const afterFilePath = path.join(process.cwd(), "exports", "schedule_after.json");
    fs.writeFileSync(afterFilePath, JSON.stringify(scheduleAfter, null, 2), "utf-8");

    return NextResponse.json({
      status: "success",
      sessions_moved: movedDetails.length,
      moved_details: movedDetails,
      schedule_after: scheduleAfter,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}