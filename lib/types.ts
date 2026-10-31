export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI";
export type ExamDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
export type ExamSession = "AM" | "PM";
export type UserRole = "admin" | "department_coordinator" | "faculty" | "club";

export interface Period {
  id: number;
  start: string;
  end: string;
  teaching: boolean;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
  features: string[];
  accessible: boolean;
  allowed_uses: string[];
}

export interface RoomUnavailability {
  room_id: string;
  day: Day;
  periods: number[];
  reason: string;
}

export interface FacultyPreference {
  type: "avoid";
  days: Day[];
  periods: number[];
  note: string;
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
  max_hours_per_day: number;
  needs_accessible: boolean;
  unavailable: { day: Day; periods: number[]; reason: string }[];
  preferences: FacultyPreference[];
}

export interface StudentGroup {
  id: string;
  name: string;
  year: number;
  department: string;
  size: number;
  needs_accessible: boolean;
}

export interface Course {
  id: string;
  title: string;
  department: string;
  year: number;
  lecture_hours: number;
  tutorial_hours: number;
  lab_blocks: number;
}

export interface Session {
  id: string;
  course_id: string;
  kind: "lecture" | "tutorial" | "lab";
  groups: string[];
  faculty_id: string;
  size: number;
  duration: number;
  room_types: string[];
  needs_accessible: boolean;
  basket_slot: string | null;
  fixed_slot: { day: Day; start_period: number } | null;
}

export interface BookingWindow {
  day: Day;
  from_period: number;
  to_period: number;
}

export interface BookingRequest {
  id: string;
  submitted_at: string;
  requester: string;
  role: UserRole;
  department: string | null;
  requested_category: string;
  title: string;
  attendance: number;
  duration_periods: number;
  windows: BookingWindow[];
  room_types: string[];
  needs: string[];
  requested_room: string | null;
  mandatory_for_groups: string[];
  series_id: string | null;
  raw_text: string;
}

export interface Cancellation {
  request_id: string;
  cancelled_at: string;
  by: string;
  note: string;
}

export interface Exam {
  id: string;
  course_ids: string[];
  groups: string[];
  size: number;
  duration_hours: number;
}

export interface SessionAssignment {
  session_id: string;
  day: Day;
  start_period: number;
  room_id: string;
}

export interface BookingDecision {
  request_id: string;
  status: "approved" | "rejected" | "alternative_offered";
  day?: Day;
  start_period?: number;
  end_period?: number;
  room_id?: string;
  reason: string;
}

export interface SessionOverride {
  session_id: string;
  day: Day;
  start_period: number;
  room_id: string;
  displaced_by: string;
}

export interface ExamAssignment {
  exam_id: string;
  day: ExamDay;
  session: ExamSession;
  rooms: string[];
}

export interface ScheduleOutput {
  team: string;
  dataset_id: string;
  sessions: SessionAssignment[];
  fest_week: {
    bookings: BookingDecision[];
    session_overrides: SessionOverride[];
  };
  exams: ExamAssignment[];
}