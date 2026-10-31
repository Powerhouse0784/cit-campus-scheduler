import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ScheduledSession {
  session_id: string;
  day: string;
  start_period: number;
  room_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const afterFilePath = path.join(process.cwd(), "exports", "schedule_after.json");
    const baselineFilePath = path.join(process.cwd(), "exports", "schedule.json");

    if (!fs.existsSync(afterFilePath) || !fs.existsSync(baselineFilePath)) {
      return NextResponse.json({ error: "Schedules not found in exports/" }, { status: 404 });
    }

    const baseline = JSON.parse(fs.readFileSync(baselineFilePath, "utf-8"));
    const after = JSON.parse(fs.readFileSync(afterFilePath, "utf-8"));

    const baseMap = new Map<string, ScheduledSession>(
      baseline.sessions.map((s: ScheduledSession) => [s.session_id, s])
    );
    const moved = [];

    for (const curr of after.sessions as ScheduledSession[]) {
      const prev = baseMap.get(curr.session_id);
      if (
        prev &&
        (prev.day !== curr.day ||
          prev.start_period !== curr.start_period ||
          prev.room_id !== curr.room_id)
      ) {
        moved.push({
          session_id: curr.session_id,
          before: prev,
          after: curr,
          type:
            prev.day !== curr.day || prev.start_period !== curr.start_period
              ? "time_changed"
              : "room_only_changed",
        });
      }
    }

    return NextResponse.json({
      status: "success",
      sessions_moved: moved.length,
      moved_details: moved,
      schedule_after: after,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}