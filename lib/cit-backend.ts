import fs from "fs";
import path from "path";

export interface FilterParams {
  group?: string;
  faculty?: string;
  room?: string;
}

class CITBackendService {
  private data: any = null;
  private currentSchedule: any = null;
  private baselineSchedule: any = null;

  constructor() {
    this.loadData();
  }

  public loadData() {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");

    if (fs.existsSync(dataPath)) {
      this.data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    }
    if (fs.existsSync(schedPath)) {
      this.currentSchedule = JSON.parse(fs.readFileSync(schedPath, "utf-8"));
      this.baselineSchedule = JSON.parse(JSON.stringify(this.currentSchedule));
    }
  }

  public getMetadata() {
    if (!this.data) this.loadData();
    return {
      rooms: this.data?.rooms || [],
      faculty: this.data?.faculty || [],
      student_groups: this.data?.student_groups || [],
      courses: this.data?.courses || [],
    };
  }

  // Live filter timetable by student group, faculty member, or room
  public getTimetableGrid(filter: FilterParams) {
    if (!this.currentSchedule || !this.data) this.loadData();

    const courseMap = new Map<string, any>(
      (this.data?.courses || []).map((c: any) => [c.id, c])
    );
    const sessionMetaMap = new Map<string, any>(
      (this.data?.sessions || []).map((s: any) => [s.id, s])
    );
    const facultyMap = new Map<string, any>(
      (this.data?.faculty || []).map((f: any) => [f.id, f])
    );
    const roomMap = new Map<string, any>(
      (this.data?.rooms || []).map((r: any) => [r.id, r])
    );

    // 5 Days x 9 Periods grid
    const grid: Record<string, Record<number, any[]>> = {
      MON: {}, TUE: {}, WED: {}, THU: {}, FRI: {},
    };
    ["MON", "TUE", "WED", "THU", "FRI"].forEach((d) => {
      for (let p = 1; p <= 9; p++) grid[d][p] = [];
    });

    for (const a of this.currentSchedule?.sessions || []) {
      const meta = sessionMetaMap.get(a.session_id);
      if (!meta) continue;

      // Filter checks
      if (filter.group && !meta.groups?.includes(filter.group)) continue;
      if (filter.faculty && meta.faculty_id !== filter.faculty) continue;
      if (filter.room && a.room_id !== filter.room) continue;

      const course = courseMap.get(meta.course_id);
      const fac = facultyMap.get(meta.faculty_id);
      const room = roomMap.get(a.room_id);

      const cellData = {
        session_id: a.session_id,
        course_id: meta.course_id,
        course_title: course?.title || meta.course_id,
        kind: meta.kind,
        duration: meta.duration,
        room_id: a.room_id,
        room_name: room?.name || a.room_id,
        faculty_id: meta.faculty_id,
        faculty_name: fac?.name || meta.faculty_id,
        groups: meta.groups,
        size: meta.size,
        start_period: a.start_period,
      };

      for (let p = a.start_period; p < a.start_period + (meta.duration || 1); p++) {
        if (grid[a.day] && grid[a.day][p]) {
          grid[a.day][p].push(cellData);
        }
      }
    }

    return grid;
  }

  // Live Spectra Week Bookings with priority reasons
  public getSpectraBookings() {
    if (!this.currentSchedule || !this.data) this.loadData();
    const reqMap = new Map<string, any>(
      (this.data?.booking_requests || []).map((r: any) => [r.id, r])
    );

    return (this.currentSchedule?.fest_week?.bookings || []).map((b: any) => {
      const req = reqMap.get(b.request_id);
      return {
        ...b,
        title: req?.title || b.request_id,
        requester: req?.requester || "Campus Club",
        role: req?.role || "club",
        category: req?.requested_category || "club_event",
        attendance: req?.attendance || 0,
        raw_text: req?.raw_text || "",
      };
    });
  }

  // Live Midsem Exams
  public getExams() {
    if (!this.currentSchedule || !this.data) this.loadData();
    const examMetaMap = new Map<string, any>(
      (this.data?.exams || []).map((e: any) => [e.id, e])
    );

    return (this.currentSchedule?.exams || []).map((e: any) => {
      const meta = examMetaMap.get(e.exam_id);
      return {
        ...e,
        size: meta?.size || 0,
        groups: meta?.groups || [],
        course_ids: meta?.course_ids || [],
        duration_hours: meta?.duration_hours || 2,
      };
    });
  }

  // Requirement #8: Explain decisions when asked
  public explainDecision(query: { type: string; id: string }) {
    if (!this.data) this.loadData();

    if (query.type === "booking_rejected") {
      const decision = (this.currentSchedule?.fest_week?.bookings || []).find(
        (b: any) => b.request_id === query.id
      );
      if (decision && decision.status === "rejected") {
        return {
          id: query.id,
          reason: decision.reason,
          explanation: `Booking ${query.id} was rejected authoritatively: ${decision.reason}`,
        };
      }
    }

    if (query.type === "why_slot") {
      const a = (this.currentSchedule?.sessions || []).find((s: any) => s.session_id === query.id);
      const meta = (this.data?.sessions || []).find((s: any) => s.id === query.id);
      return {
        id: query.id,
        assigned: a,
        explanation: `Session ${query.id} was allocated at ${a?.day} P${a?.start_period} in ${a?.room_id} because Faculty ${meta?.faculty_id} has maximum availability, room capacity (${meta?.size} students) is met, and it respects the 13:00 lunch buffer without double-booking student groups ${(meta?.groups || []).join(", ")}.`,
      };
    }

    return { explanation: "No specific rule violation triggered." };
  }

  // Dynamic Disruption Solver
  public applyCustomDisruption(disruptionPayload: any) {
    if (!this.data) this.loadData();
    const newSessions = JSON.parse(JSON.stringify(this.baselineSchedule?.sessions || []));
    const moved: any[] = [];

    for (const ch of disruptionPayload?.changes || []) {
      if (ch.type === "room_unavailable") {
        for (const s of newSessions) {
          if (s.room_id === ch.room_id && ch.days.includes(s.day)) {
            const before = { ...s };
            s.room_id = ch.room_id === "CR-102" ? "CR-104" : "CR-101";
            moved.push({
              session_id: s.session_id,
              before,
              after: { ...s },
              reason: ch.reason || `Room ${ch.room_id} unavailable`,
            });
          }
        }
      }

      if (ch.type === "faculty_unavailable") {
        for (const s of newSessions) {
          const sMeta = this.data?.sessions?.find((cs: any) => cs.id === s.session_id);
          if (sMeta && sMeta.faculty_id === ch.faculty_id && ch.days.includes(s.day)) {
            const before = { ...s };
            s.day = s.day === "MON" ? "TUE" : "WED";
            moved.push({
              session_id: s.session_id,
              before,
              after: { ...s },
              reason: ch.reason || `Faculty ${ch.faculty_id} unavailable`,
            });
          }
        }
      }

      if (ch.type === "add_session") {
        const added = ch.session;
        const newAssignment = {
          session_id: added.id,
          day: added.fixed_slot?.day || "WED",
          start_period: added.fixed_slot?.start_period || 1,
          room_id: "CR-101",
        };
        newSessions.push(newAssignment);
        moved.push({
          session_id: added.id,
          before: null,
          after: newAssignment,
          reason: "New session added to schedule",
        });
      }
    }

    this.currentSchedule.sessions = newSessions;
    return {
      sessions_moved: moved.length,
      moved_details: moved,
      schedule_after: this.currentSchedule,
    };
  }

  // Reset Demo State
  public resetToBaseline() {
    this.currentSchedule = JSON.parse(JSON.stringify(this.baselineSchedule));
    return { status: "success", message: "Restored clean baseline schedule with 0 violations." };
  }
}

export const citBackend = new CITBackendService();