export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { apiError } from "@/lib/api-response";
import { readDurableJson } from "@/lib/durable-state";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export async function GET(req: NextRequest) {
  try {
    const root = process.cwd();
    const [data, schedule] = await Promise.all([
      readDurableJson<any>(path.join(root, "data", "cit_public.json"), null),
      readDurableJson<any>(path.join(root, "exports", "schedule.json"), null),
    ]);
    if (!data || !schedule) return apiError("Dataset or timetable has not been loaded.", 404);

    const params = req.nextUrl.searchParams;
    const group = params.get("group")?.trim();
    const faculty = params.get("faculty")?.trim();
    const room = params.get("room")?.trim();
    const courseMap = new Map((data.courses || []).map((item: any) => [item.id, item]));
    const sessionMap = new Map((data.sessions || []).map((item: any) => [item.id, item]));
    const facultyMap = new Map((data.faculty || []).map((item: any) => [item.id, item]));
    const roomMap = new Map((data.rooms || []).map((item: any) => [item.id, item]));
    const grid: Record<string, Record<number, any[]>> = {};
    for (const day of DAYS) {
      grid[day] = {};
      for (let period = 1; period <= 9; period++) grid[day][period] = [];
    }

    for (const assignment of schedule.sessions || []) {
      const meta: any = sessionMap.get(assignment.session_id);
      if (!meta) continue;
      if (group && !(meta.groups || []).includes(group)) continue;
      if (faculty && meta.faculty_id !== faculty) continue;
      if (room && assignment.room_id !== room) continue;
      const course: any = courseMap.get(meta.course_id);
      const fac: any = facultyMap.get(meta.faculty_id);
      const rm: any = roomMap.get(assignment.room_id);
      const cell = {
        session_id: assignment.session_id,
        course_id: meta.course_id,
        course_name: course?.title || meta.course_id,
        kind: meta.kind,
        room_id: assignment.room_id,
        room_name: rm?.name || assignment.room_id,
        duration: meta.duration || 1,
        faculty_id: meta.faculty_id,
        faculty_name: fac?.name || meta.faculty_id,
        groups: meta.groups || [],
        size: meta.size,
        start_period: assignment.start_period,
      };
      for (let period = assignment.start_period; period < assignment.start_period + (meta.duration || 1); period++) {
        if (grid[assignment.day]?.[period]) grid[assignment.day][period].push(cell);
      }
    }

    const rooms = (data.rooms || []).filter((item: any) => item.type !== "outdoor");
    const usedRooms = new Set((schedule.sessions || []).map((item: any) => item.room_id));
    const bookedHours = (schedule.sessions || []).reduce((sum: number, item: any) => {
      const meta: any = sessionMap.get(item.session_id);
      return sum + (meta?.duration || 1);
    }, 0);
    const availableHours = rooms.length * 5 * 9;
    const stats = {
      percent: availableHours ? Number(((bookedHours / availableHours) * 100).toFixed(1)) : 0,
      roomsUsed: usedRooms.size,
      roomsTotal: rooms.length,
      bookedHours,
      availableHours,
      sessionCount: (schedule.sessions || []).length,
    };

    return NextResponse.json({
      success: true,
      grid,
      metadata: {
        rooms: data.rooms || [],
        faculty: data.faculty || [],
        student_groups: data.student_groups || [],
        courses: data.courses || [],
      },
      stats,
      dataset_id: data.dataset_id || schedule.dataset_id || null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load timetable.";
    return apiError(message, 500);
  }
}
