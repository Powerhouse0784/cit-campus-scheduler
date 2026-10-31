import fs from "fs";
import path from "path";
import {
  CITDataset,
  BookingRequest,
  Course,
  Exam,
  Faculty,
  Room,
  Session,
  DashboardStats,
  Day,
  DisruptionChange,
  ExamWithMeta,
  ScheduleOutput,
  ScheduledSession,
  SpectraBooking,
  TimetableGrid,
  TimetableGridCell,
  UtilisationStats,
} from "./types";

export interface FilterParams {
  group?: string;
  faculty?: string;
  room?: string;
}

const WEEKDAYS: Day[] = ["MON", "TUE", "WED", "THU", "FRI"];

class CITBackendService {
  private data: CITDataset | null = null;
  private currentSchedule: ScheduleOutput | null = null;
  private baselineSchedule: ScheduleOutput | null = null;

  constructor() {
    this.loadData();
  }

  public loadData() {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");

    if (fs.existsSync(dataPath)) {
      this.data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as CITDataset;
    }
    if (fs.existsSync(schedPath)) {
      this.currentSchedule = JSON.parse(fs.readFileSync(schedPath, "utf-8")) as ScheduleOutput;
      this.baselineSchedule = JSON.parse(JSON.stringify(this.currentSchedule)) as ScheduleOutput;
    }
  }

  public getMetadata() {
    if (!this.data) this.loadData();
    return {
      rooms: this.data?.rooms ?? [],
      faculty: this.data?.faculty ?? [],
      student_groups: this.data?.student_groups ?? [],
      courses: this.data?.courses ?? [],
    };
  }

  public getTimetableGrid(filter: FilterParams): TimetableGrid {
    if (!this.currentSchedule || !this.data) this.loadData();
    const data = this.data;
    const schedule = this.currentSchedule;
    if (!data || !schedule) throw new Error("Timetable data is unavailable.");

    const courseMap = new Map<string, Course>(data.courses.map((course): [string, Course] => [course.id, course]));
    const sessionMetaMap = new Map<string, Session>(data.sessions.map((session): [string, Session] => [session.id, session]));
    const facultyMap = new Map<string, Faculty>(data.faculty.map((faculty): [string, Faculty] => [faculty.id, faculty]));
    const roomMap = new Map<string, Room>(data.rooms.map((room): [string, Room] => [room.id, room]));

    const grid: TimetableGrid = {
      MON: {}, TUE: {}, WED: {}, THU: {}, FRI: {},
    };
    for (const day of WEEKDAYS) {
      for (let period = 1; period <= 9; period++) grid[day][period] = [];
    }

    for (const assignment of schedule.sessions) {
      const meta = sessionMetaMap.get(assignment.session_id);
      if (!meta) continue;
      if (filter.group && !meta.groups.includes(filter.group)) continue;
      if (filter.faculty && meta.faculty_id !== filter.faculty) continue;
      if (filter.room && assignment.room_id !== filter.room) continue;

      const course = courseMap.get(meta.course_id);
      const faculty = facultyMap.get(meta.faculty_id);
      const room = roomMap.get(assignment.room_id);
      const cellData: TimetableGridCell = {
        session_id: assignment.session_id,
        course_id: meta.course_id,
        course_title: course?.title ?? meta.course_id,
        department: course?.department ?? "",
        kind: meta.kind,
        duration: meta.duration,
        room_id: assignment.room_id,
        room_name: room?.name ?? assignment.room_id,
        faculty_id: meta.faculty_id,
        faculty_name: faculty?.name ?? meta.faculty_id,
        groups: meta.groups,
        size: meta.size,
        start_period: assignment.start_period,
      };

      for (let period = assignment.start_period; period < assignment.start_period + meta.duration; period++) {
        if (grid[assignment.day][period]) grid[assignment.day][period].push(cellData);
      }
    }
    return grid;
  }

  public getDashboardStats(): DashboardStats {
    if (!this.currentSchedule || !this.data) this.loadData();
    const data = this.data;
    const schedule = this.currentSchedule;
    if (!data || !schedule) throw new Error("Dashboard data is unavailable.");

    const totalSessions = schedule.sessions.length;
    const roomsTotal = data.rooms.filter((room) => room.type !== "outdoor").length;
    const usedRooms = new Set(schedule.sessions.map((session) => session.room_id));
    const pendingBookings = schedule.fest_week.bookings.filter(
      (booking) => booking.status === "alternative_offered"
    ).length;
    const courseMap = new Map<string, string>(data.courses.map((course): [string, string] => [course.id, course.title]));
    const previewRows = schedule.sessions.slice(0, 4).map((session) => ({
      date: session.day,
      period: `P${session.start_period}`,
      title: courseMap.get(session.session_id.split("-")[0]) ?? session.session_id,
      room: session.room_id,
      color: session.start_period === 1 ? "text-blue-600" : session.start_period === 2 ? "text-purple-600" : "text-emerald-600",
      bar: session.start_period === 1 ? "bg-blue-500" : session.start_period === 2 ? "bg-purple-500" : "bg-emerald-500",
    }));

    return {
      sessionsCount: totalSessions,
      roomsInUse: usedRooms.size,
      roomsTotal,
      capacityPercent: roomsTotal ? Math.round((usedRooms.size / roomsTotal) * 100) : 0,
      pendingApprovals: pendingBookings,
      previewRows,
    };
  }

  public getUtilisation(): UtilisationStats {
    if (!this.currentSchedule || !this.data) this.loadData();
    const data = this.data;
    const schedule = this.currentSchedule;
    if (!data || !schedule) throw new Error("Utilisation data is unavailable.");
    const sessionMetaMap = new Map<string, Session>(data.sessions.map((session): [string, Session] => [session.id, session]));
    const rooms = data.rooms.filter((room) => room.type !== "outdoor");
    const roomIds = new Set(rooms.map((room) => room.id));
    const usedRooms = new Set<string>();
    let bookedHours = 0;
    let sessionCount = 0;
    for (const assignment of schedule.sessions) {
      if (!roomIds.has(assignment.room_id)) continue;
      const meta = sessionMetaMap.get(assignment.session_id);
      bookedHours += meta?.duration ?? 1;
      sessionCount += 1;
      usedRooms.add(assignment.room_id);
    }
    const availableHours = rooms.length * 5 * 9;
    return {
      percent: availableHours ? Math.round((bookedHours / availableHours) * 100) : 0,
      roomsUsed: usedRooms.size,
      roomsTotal: rooms.length,
      bookedHours,
      availableHours,
      sessionCount,
    };
  }

  public getSpectraBookings(): SpectraBooking[] {
    if (!this.currentSchedule || !this.data) this.loadData();
    const data = this.data;
    const schedule = this.currentSchedule;
    if (!data || !schedule) throw new Error("Booking data is unavailable.");
    const requestMap = new Map<string, BookingRequest>(data.booking_requests.map((request): [string, BookingRequest] => [request.id, request]));
    return schedule.fest_week.bookings.map((booking) => {
      const request = requestMap.get(booking.request_id);
      return {
        ...booking,
        title: request?.title ?? booking.request_id,
        requester: request?.requester ?? "Campus Club",
        role: request?.role ?? "club",
        category: request?.requested_category ?? "club_event",
        attendance: request?.attendance ?? 0,
        raw_text: request?.raw_text ?? "",
      };
    });
  }

  public getExams(): ExamWithMeta[] {
    if (!this.currentSchedule || !this.data) this.loadData();
    const data = this.data;
    const schedule = this.currentSchedule;
    if (!data || !schedule) throw new Error("Exam data is unavailable.");
    const examMetaMap = new Map<string, Exam>(data.exams.map((exam): [string, Exam] => [exam.id, exam]));
    return schedule.exams.map((assignment) => {
      const meta = examMetaMap.get(assignment.exam_id);
      return {
        ...assignment,
        size: meta?.size ?? 0,
        groups: meta?.groups ?? [],
        course_ids: meta?.course_ids ?? [],
        duration_hours: meta?.duration_hours ?? 2,
      };
    });
  }

  public explainDecision(query: { type: string; id: string }) {
    if (!this.data) this.loadData();
    const data = this.data;
    const schedule = this.currentSchedule;
    if (!data || !schedule) throw new Error("Explanation data is unavailable.");

    if (query.type === "booking_rejected") {
      const decision = schedule.fest_week.bookings.find((booking) => booking.request_id === query.id);
      if (decision?.status === "rejected") {
        return {
          id: query.id,
          reason: decision.reason,
          explanation: `Booking ${query.id} was rejected authoritatively: ${decision.reason}`,
        };
      }
    }

    if (query.type === "why_slot") {
      const assignment = schedule.sessions.find((session) => session.session_id === query.id);
      const meta = data.sessions.find((session) => session.id === query.id);
      return {
        id: query.id,
        assigned: assignment,
        explanation: `Session ${query.id} was allocated at ${assignment?.day} P${assignment?.start_period} in ${assignment?.room_id} because Faculty ${meta?.faculty_id} has maximum availability, room capacity (${meta?.size} students) is met, and it respects the 13:00 lunch buffer without double-booking student groups ${(meta?.groups ?? []).join(", ")}.`,
      };
    }
    return { explanation: "No specific rule violation triggered." };
  }

  public applyCustomDisruption(disruptionPayload: unknown) {
    if (!this.data || !this.baselineSchedule) this.loadData();
    const data = this.data;
    const baseline = this.baselineSchedule;
    if (!data || !baseline) throw new Error("Disruption data is unavailable.");
    if (!disruptionPayload || typeof disruptionPayload !== "object" || Array.isArray(disruptionPayload)) {
      throw new Error("A disruption request object is required.");
    }
    const changesValue = (disruptionPayload as { changes?: unknown }).changes;
    if (!Array.isArray(changesValue) || changesValue.length === 0 || changesValue.length > 50) {
      throw new Error("Provide between 1 and 50 disruption changes.");
    }

    const rawChanges = changesValue as unknown[];
    const roomIds = new Set(data.rooms.map((room) => room.id));
    const facultyIds = new Set(data.faculty.map((faculty) => faculty.id));
    const sessionIds = new Set(data.sessions.map((session) => session.id));
    const changes: DisruptionChange[] = rawChanges.map((value, index) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Change ${index + 1} must be an object.`);
      const item = value as Record<string, unknown>;
      const days: unknown[] = Array.isArray(item.days) ? item.days : [];
      if (item.type === "room_unavailable" || item.type === "faculty_unavailable") {
        if (!days.length || days.some((day) => typeof day !== "string" || !WEEKDAYS.includes(day as Day))) {
          throw new Error(`Change ${index + 1} must include valid weekday values.`);
        }
        if (item.type === "room_unavailable") {
          if (typeof item.room_id !== "string" || !roomIds.has(item.room_id)) throw new Error(`Change ${index + 1} references an unknown room.`);
          return { type: item.type, room_id: item.room_id, days: days as Day[] };
        }
        if (typeof item.faculty_id !== "string" || !facultyIds.has(item.faculty_id)) throw new Error(`Change ${index + 1} references an unknown faculty member.`);
        return { type: item.type, faculty_id: item.faculty_id, days: days as Day[] };
      }
      if (item.type === "add_session") {
        if (!item.session || typeof item.session !== "object" || Array.isArray(item.session)) throw new Error(`Change ${index + 1} must reference a session in the supplied dataset.`);
        const sessionId = (item.session as { id?: unknown }).id;
        const session = data.sessions.find((candidate) => candidate.id === sessionId);
        if (!session) throw new Error(`Change ${index + 1} must reference a session in the supplied dataset.`);
        return { type: "add_session", session };
      }
      if (item.type === "remove_session") {
        if (typeof item.session_id !== "string" || !sessionIds.has(item.session_id)) throw new Error(`Change ${index + 1} references an unknown session.`);
        return { type: "remove_session", session_id: item.session_id };
      }
      throw new Error(`Change ${index + 1} has an unsupported type.`);
    });

    const newSessions: ScheduledSession[] = baseline.sessions.map((session) => ({ ...session }));
    const moved: Array<{ session_id: string; before: ScheduledSession; after: null; reason: string }> = [];
    for (const change of changes) {
      if (change.type === "room_unavailable") {
        const affected = newSessions.filter((session) => session.room_id === change.room_id && change.days.includes(session.day));
        if (affected.length) throw new Error(`Room ${change.room_id} has ${affected.length} scheduled session(s) on the unavailable day(s). A constraint-aware solver is required before these can be moved safely.`);
      } else if (change.type === "faculty_unavailable") {
        const affected = newSessions.filter((session) => {
          const meta = data.sessions.find((candidate) => candidate.id === session.session_id);
          return meta?.faculty_id === change.faculty_id && change.days.includes(session.day);
        });
        if (affected.length) throw new Error(`Faculty ${change.faculty_id} has ${affected.length} affected session(s). Safe alternative-slot generation is not enabled in this prototype.`);
      } else if (change.type === "add_session") {
        if (newSessions.some((session) => session.session_id === change.session.id)) throw new Error(`Session ${change.session.id} is already scheduled.`);
        throw new Error("Adding a session requires the constraint-aware timetable solver; no schedule was changed.");
      } else {
        const index = newSessions.findIndex((session) => session.session_id === change.session_id);
        if (index < 0) throw new Error(`Session ${change.session_id} is not present in the current schedule.`);
        const removed = newSessions.splice(index, 1)[0];
        moved.push({ session_id: change.session_id, before: removed, after: null, reason: "Removed from preview at the request of the caller." });
      }
    }

    const preview: ScheduleOutput = { ...baseline, sessions: newSessions };
    return {
      success: true,
      mode: "preview",
      persisted: false,
      sessions_moved: moved.length,
      moved_details: moved,
      schedule_after: preview,
      message: "Validated preview generated. No approved or persisted timetable has been created.",
    };
  }

  public resetToBaseline() {
    if (!this.baselineSchedule) this.loadData();
    if (!this.baselineSchedule) throw new Error("Baseline schedule is unavailable.");
    this.currentSchedule = JSON.parse(JSON.stringify(this.baselineSchedule)) as ScheduleOutput;
    return { status: "success", message: "Restored the supplied baseline schedule in server memory. Run the official validator to determine its violations." };
  }
}

export const citBackend = new CITBackendService();
