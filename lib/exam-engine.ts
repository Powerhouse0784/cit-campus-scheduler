import { Exam, Room, CITDataset } from "./types";

export interface ScheduledExam {
  exam_id: string;
  course_ids: string[];
  course_title: string;
  groups: string[];
  size: number;
  day: string;
  date_iso: string;
  date_formatted: string;
  session: "AM" | "PM";
  start_time: string;
  end_time: string;
  rooms: string[];
  room_names: string[];
  capacity_allocated: number;
  effective_capacity: number;
  duration_hours: number;
  year: number;
}

export interface ExamViolation {
  rule: string;
  detail: string;
}

export interface ExamValidationResult {
  valid: boolean;
  violations: ExamViolation[];
  soft_penalty: number;
  scheduled_count: number;
  total_count: number;
}

export class ExamEngine {
  private exams: Exam[];
  private rooms: Room[];
  private courses: Map<string, any>;
  private examDays: string[];
  private examDates: Record<string, string>;
  private sessionTimings: Record<string, { start: string; end: string }>;

  constructor(dataset: CITDataset) {
    this.exams = dataset.exams || [];
    this.rooms = (dataset.rooms || []).filter((r: Room) => r.allowed_uses.includes("exam"));
    this.courses = new Map((dataset.courses || []).map((c) => [c.id, c]));
    this.examDays = dataset.calendar?.exam_week?.days || ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
    this.examDates = (dataset.calendar?.exam_week as any)?.dates || {
      MON: "2027-02-15",
      TUE: "2027-02-16",
      WED: "2027-02-17",
      THU: "2027-02-18",
      FRI: "2027-02-19",
      SAT: "2027-02-20",
    };
    this.sessionTimings = {
      AM: { start: "09:30", end: "11:30" },
      PM: { start: "14:00", end: "16:00" },
    };
  }

  /**
   * Pure dynamic constraint-satisfaction solver:
   * Dynamically places all exams into conflict-free slots with zero room double-booking (H4),
   * zero cohort clashes (H3), social-distancing halved capacity (H5), and minimal soft penalty.
   */
  public generateSchedule(): ScheduledExam[] {
    const roomMap = new Map<string, Room>(this.rooms.map((r) => [r.id, r]));
    const examMetaMap = new Map<string, Exam>(this.exams.map((e) => [e.id, e]));

    const sessions: Array<"AM" | "PM"> = ["AM", "PM"];
    const assignments: Array<{ exam_id: string; day: string; session: "AM" | "PM"; rooms: string[] }> = [];

    const roomSlotOcc = new Set<string>(); // "room:day:sess"
    const grpSlotOcc = new Set<string>();  // "group:day:sess"
    const grpDayOcc = new Map<string, number>(); // "group:day" -> exam count

    // Sort exams by difficulty: most student groups first, then largest size
    const sorted = [...this.exams].sort((a, b) => {
      if (b.groups.length !== a.groups.length) return b.groups.length - a.groups.length;
      return b.size - a.size;
    });

    for (const ex of sorted) {
      let bestSlot: { day: string; sess: "AM" | "PM"; rooms: string[] } | null = null;
      let minPenalty = Infinity;

      for (const day of this.examDays) {
        for (const sess of sessions) {
          // Hard constraint H3: No student group double-booked in this slot
          const hasSlotClash = ex.groups.some((g) => grpSlotOcc.has(`${g}:${day}:${sess}`));
          if (hasSlotClash) continue;

          // Available exam rooms in this slot
          const freeRooms = this.rooms.filter(
            (r) => !roomSlotOcc.has(`${r.id}:${day}:${sess}`)
          );

          // Room selection heuristic
          let chosenRooms: string[] = [];
          let seats = 0;

          if (ex.size > 150) {
            // Large cohort: sort rooms by capacity descending to combine largest halls
            const sortedRooms = [...freeRooms].sort((a, b) => b.capacity - a.capacity);
            for (const r of sortedRooms) {
              chosenRooms.push(r.id);
              seats += Math.floor(r.capacity / 2);
              if (seats >= ex.size) break;
            }
          } else {
            // Smaller cohort: find single best-fit room (smallest room whose half-capacity >= size)
            const fittingRooms = freeRooms
              .filter((r) => Math.floor(r.capacity / 2) >= ex.size)
              .sort((a, b) => a.capacity - b.capacity);

            if (fittingRooms.length > 0) {
              chosenRooms.push(fittingRooms[0].id);
              seats = Math.floor(fittingRooms[0].capacity / 2);
            } else {
              // Need combination
              const sortedRooms = [...freeRooms].sort((a, b) => b.capacity - a.capacity);
              for (const r of sortedRooms) {
                chosenRooms.push(r.id);
                seats += Math.floor(r.capacity / 2);
                if (seats >= ex.size) break;
              }
            }
          }

          if (seats < ex.size) continue; // Inadequate capacity in this slot

          // Calculate soft penalty: avoid > 1 exam for any group on the same day (+5 per extra)
          let penalty = 0;
          for (const g of ex.groups) {
            const count = grpDayOcc.get(`${g}:${day}`) || 0;
            if (count > 0) penalty += 5 * count;
          }

          if (penalty < minPenalty) {
            minPenalty = penalty;
            bestSlot = { day, sess, rooms: chosenRooms };
            if (penalty === 0) break; // Optimal 0-penalty slot found
          }
        }
        if (bestSlot && minPenalty === 0) break;
      }

      if (!bestSlot) {
        throw new Error(`Dynamic exam solver could not place exam ${ex.id} without violations.`);
      }

      assignments.push({
        exam_id: ex.id,
        day: bestSlot.day,
        session: bestSlot.sess,
        rooms: bestSlot.rooms,
      });

      for (const rid of bestSlot.rooms) roomSlotOcc.add(`${rid}:${bestSlot.day}:${bestSlot.sess}`);
      for (const g of ex.groups) {
        grpSlotOcc.add(`${g}:${bestSlot.day}:${bestSlot.sess}`);
        grpDayOcc.set(`${g}:${bestSlot.day}`, (grpDayOcc.get(`${g}:${bestSlot.day}`) || 0) + 1);
      }
    }

    // Map to rich presentation model
    return assignments.map((a) => {
      const meta = examMetaMap.get(a.exam_id);
      const timings = this.sessionTimings[a.session] || { start: "09:30", end: "11:30" };
      const roomsInfo = a.rooms.map((rid) => roomMap.get(rid)).filter(Boolean) as Room[];
      const totalRawCap = roomsInfo.reduce((sum, r) => sum + r.capacity, 0);
      const effectiveCap = roomsInfo.reduce((sum, r) => sum + Math.floor(r.capacity / 2), 0);

      let year = 1;
      const grpSample = meta?.groups?.[0] || "";
      if (grpSample.includes("-2")) year = 2;
      else if (grpSample.includes("-3")) year = 3;

      const courseId = meta?.course_ids?.[0] || a.exam_id.replace("EX-", "");
      const courseObj = this.courses.get(courseId);
      const title = courseObj?.title || meta?.course_ids?.join(", ") || a.exam_id;

      const isoDate = this.examDates[a.day] || "2027-02-15";
      const dt = new Date(`${isoDate}T00:00:00`);
      const dateFormatted = dt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      return {
        exam_id: a.exam_id,
        course_ids: meta?.course_ids || [courseId],
        course_title: title,
        groups: meta?.groups || [],
        size: meta?.size || 0,
        day: a.day,
        date_iso: isoDate,
        date_formatted: dateFormatted,
        session: a.session,
        start_time: timings.start,
        end_time: timings.end,
        rooms: a.rooms,
        room_names: roomsInfo.map((r) => r.name || r.id),
        capacity_allocated: totalRawCap,
        effective_capacity: effectiveCap,
        duration_hours: meta?.duration_hours || 2,
        year,
      };
    });
  }

  /**
   * Complete validation engine checking all official rules:
   * - duplicate exams
   * - missing exams
   * - invalid calendar slot
   * - room capability (E2)
   * - halved capacity (H5)
   * - room clashes (H4)
   * - group clashes (H3)
   * - soft penalty scoring
   */
  public validateSchedule(
    scheduled: Array<{ exam_id: string; day: string; session: string; rooms: string[] }>
  ): ExamValidationResult {
    const violations: ExamViolation[] = [];
    const seenExams = new Set<string>();
    const roomOcc = new Map<string, string[]>();
    const grpOcc = new Map<string, string[]>();
    const grpDay = new Map<string, Set<string>>();

    const exMap = new Map<string, Exam>(this.exams.map((e) => [e.id, e]));
    const roomMap = new Map<string, Room>(this.rooms.map((r) => [r.id, r]));

    let softPenalty = 0;

    for (const a of scheduled) {
      // Duplicate exam check (E1)
      if (seenExams.has(a.exam_id)) {
        violations.push({ rule: "E1", detail: `Exam ${a.exam_id} is scheduled multiple times` });
      }
      seenExams.add(a.exam_id);

      const meta = exMap.get(a.exam_id);
      if (!meta) {
        violations.push({ rule: "E1", detail: `Unknown exam ID ${a.exam_id}` });
        continue;
      }

      // Valid day & session check
      if (!this.examDays.includes(a.day)) {
        violations.push({ rule: "E1", detail: `${a.exam_id}: Invalid exam day '${a.day}'` });
      }
      if (!["AM", "PM"].includes(a.session)) {
        violations.push({ rule: "E1", detail: `${a.exam_id}: Invalid exam session '${a.session}'` });
      }

      // Halved room capacity check
      let totalSeats = 0;
      for (const rid of a.rooms) {
        const r = roomMap.get(rid);
        if (!r || !r.allowed_uses.includes("exam")) {
          violations.push({ rule: "E2", detail: `${a.exam_id}: Room ${rid} is not permitted for examinations` });
          continue;
        }

        totalSeats += Math.floor(r.capacity / 2);
        const rKey = `${rid}:${a.day}:${a.session}`;
        roomOcc.set(rKey, [...(roomOcc.get(rKey) || []), a.exam_id]);
      }

      if (totalSeats < meta.size) {
        violations.push({
          rule: "H5",
          detail: `${a.exam_id}: Halved capacity (${totalSeats}) is less than student size (${meta.size})`,
        });
      }

      for (const g of meta.groups) {
        const gKey = `${g}:${a.day}:${a.session}`;
        grpOcc.set(gKey, [...(grpOcc.get(gKey) || []), a.exam_id]);

        const gdKey = `${g}:${a.day}`;
        const daySet = grpDay.get(gdKey) || new Set<string>();
        daySet.add(a.exam_id);
        grpDay.set(gdKey, daySet);
      }
    }

    // Missing exam check
    for (const ex of this.exams) {
      if (!seenExams.has(ex.id)) {
        violations.push({ rule: "E1", detail: `Exam ${ex.id} is missing from the schedule` });
      }
    }

    // Room double-booking (H4)
    for (const [k, eids] of Array.from(roomOcc.entries())) {
      if (eids.length > 1) {
        violations.push({
          rule: "H4",
          detail: `Room ${k.split(":")[0]} double-booked at ${k.split(":")[1]} ${k.split(":")[2]}: ${eids.join(", ")}`,
        });
      }
    }

    // Student-group double-booking (H3)
    for (const [k, eids] of Array.from(grpOcc.entries())) {
      if (eids.length > 1) {
        violations.push({
          rule: "H3",
          detail: `Group ${k.split(":")[0]} has concurrent exams at ${k.split(":")[1]} ${k.split(":")[2]}: ${eids.join(", ")}`,
        });
      }
    }

    // Soft constraint: 1 exam per group per day
    for (const [, set] of Array.from(grpDay.entries())) {
      if (set.size > 1) {
        softPenalty += 5 * (set.size - 1);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      soft_penalty: softPenalty,
      scheduled_count: seenExams.size,
      total_count: this.exams.length,
    };
  }
}
