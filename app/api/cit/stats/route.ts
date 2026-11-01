export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "path";
import { apiError } from "@/lib/api-response";
import { readDurableJson } from "@/lib/durable-state";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export async function GET() {
  try {
    const root = process.cwd();
    const [data, schedule, report] = await Promise.all([
      readDurableJson<any>(path.join(root, "data", "cit_public.json"), null),
      readDurableJson<any>(path.join(root, "exports", "schedule.json"), null),
      readDurableJson<any>(path.join(root, "exports", "validation_report.json"), null),
    ]);
    if (!data || !schedule) return apiError("Dataset or timetable has not been loaded.", 404);

    const sessions = Array.isArray(schedule.sessions) ? schedule.sessions : [];
    const rooms = (data.rooms || []).filter((r: any) => r.type !== "outdoor");
    const roomIds = new Set(rooms.map((r: any) => r.id));
    const sessionMeta = new Map((data.sessions || []).map((s: any) => [s.id, s]));
    const courseMap = new Map((data.courses || []).map((c: any) => [c.id, String(c.title || c.id)]));
    const roomHours: Record<string, number> = Object.fromEntries(rooms.map((r: any) => [r.id, 0]));
    const roomSessions: Record<string, number> = Object.fromEntries(rooms.map((r: any) => [r.id, 0]));
    const dayHours: Record<string, number> = Object.fromEntries(DAYS.map((d) => [d, 0]));
    let bookedHours = 0;
    for (const assignment of sessions) {
      const meta: any = sessionMeta.get(assignment.session_id);
      const duration = Number(meta?.duration || 1);
      bookedHours += duration;
      if (roomIds.has(assignment.room_id)) {
        roomHours[assignment.room_id] = (roomHours[assignment.room_id] || 0) + duration;
        roomSessions[assignment.room_id] = (roomSessions[assignment.room_id] || 0) + 1;
      }
      if (dayHours[assignment.day] !== undefined) dayHours[assignment.day] += duration;
    }
    const usedRooms = new Set(sessions.filter((s: any) => roomIds.has(s.room_id)).map((s: any) => s.room_id));
    const availableHours = rooms.length * 5 * 9;
    const utilization = availableHours ? Number(((bookedHours / availableHours) * 100).toFixed(1)) : 0;
    const hasReport = !!report && typeof report.hard_violations === "number";
    const roomBreakdown = rooms.map((r: any) => {
      const booked = roomHours[r.id] || 0;
      return { id: r.id, name: r.name, type: r.type, capacity: r.capacity, accessible: !!r.accessible, booked_hours: booked, total_hours: 45, utilization_percent: Number(((booked / 45) * 100).toFixed(1)), sessions_count: roomSessions[r.id] || 0 };
    }).sort((a: any, b: any) => b.utilization_percent - a.utilization_percent);
    const dashboardStats = {
      sessionsCount: sessions.length,
      roomsInUse: usedRooms.size,
      roomsTotal: rooms.length,
      capacityPercent: rooms.length ? Math.round((usedRooms.size / rooms.length) * 100) : 0,
      pendingApprovals: (schedule.fest_week?.bookings || []).filter((b: any) => ["alternative_offered", "pending"].includes(b.status)).length,
      previewRows: sessions.slice(0, 4).map((s: any) => ({ date: s.day, period: `P${s.start_period}`, title: String(courseMap.get(String(s.session_id || "").split("-")[0]) || s.session_id || "Untitled session"), room: s.room_id, color: s.start_period === 1 ? "text-blue-600" : s.start_period === 2 ? "text-purple-600" : "text-emerald-600", bar: s.start_period === 1 ? "bg-blue-500" : s.start_period === 2 ? "bg-purple-500" : "bg-emerald-500" })),
    };
    const analytics = {
      kpis: {
        room_utilization: `${utilization}%`, room_utilization_num: utilization,
        conflicts_count: hasReport ? report.hard_violations : null,
        schedule_health: hasReport ? (report.hard_violations === 0 ? "Validator reports 0 hard violations; confirm report matches current schedule" : "See validator report") : "Not verified",
        health_status: hasReport ? "Validator report available; freshness not confirmed" : "Not verified",
        total_sessions: sessions.length, active_rooms: usedRooms.size, total_rooms: rooms.length,
        booked_hours: bookedHours, total_available_hours: availableHours,
        booking_score: typeof report?.bookings?.booking_score === "number" ? report.bookings.booking_score : null,
        soft_penalty_total: typeof report?.soft_total === "number" ? report.soft_total : null,
      },
      constraints: ["Single Scheduling", "Faculty Double-Booking", "Student Cohort Clashes", "Room Double-Booking", "Capacity Verification", "Room Type Compliance", "Faculty Availability", "Room Maintenance", "Lunch & Lab Blocks", "Wheelchair Accessibility", "Elective Basket Sync", "Daily Teaching Limits", "Spectra Fest Bookings", "Fixed Slot Constraints"].map((name, i) => ({ rule: `H${i + 1}`, name, desc: "Review official validator output for this constraint", status: hasReport ? "report_available" : "not_verified", count: hasReport ? "See validator report" : "Not verified" })),
      soft_penalties: report?.soft_penalties || null,
      room_breakdown: roomBreakdown,
      day_wise: DAYS.map((day) => ({ day: day[0] + day.slice(1).toLowerCase(), hours: dayHours[day] || 0, pct: rooms.length ? Math.round(((dayHours[day] || 0) / (rooms.length * 9)) * 100) : 0 })),
      ai_insights: [`Current timetable contains ${sessions.length} scheduled sessions.`, `Room utilization is ${utilization}% based on loaded schedule data.`, hasReport ? "A validation report exists, but freshness against the current schedule is not confirmed." : "No usable validator report is available; schedule is not certified."],
    };
    return NextResponse.json({ success: true, ...dashboardStats, analytics }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard statistics and analytics.";
    return apiError(message, 500);
  }
}
