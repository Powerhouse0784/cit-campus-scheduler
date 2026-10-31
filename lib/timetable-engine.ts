import { Session, Room, Faculty, StudentGroup, SessionAssignment, CITDataset } from "./types";

export interface Violation {
  rule: string;
  where: string;
  detail: string;
}

export class TimetableEngine {
  private rooms: Map<string, Room>;
  private faculty: Map<string, Faculty>;
  private groups: Map<string, StudentGroup>;
  private sessions: Map<string, Session>;
  private roomUnavail: Set<string>;
  private facUnavail: Set<string>;
  private lunchPeriod: number;

  constructor(dataset: CITDataset) {
    this.rooms = new Map(dataset.rooms.map((r: Room) => [r.id, r]));
    this.faculty = new Map(dataset.faculty.map((f: Faculty) => [f.id, f]));
    this.groups = new Map(dataset.student_groups.map((g: StudentGroup) => [g.id, g]));
    this.sessions = new Map(dataset.sessions.map((s: Session) => [s.id, s]));
    this.lunchPeriod = dataset.calendar?.lunch?.after_period ?? 5;

    this.roomUnavail = new Set();
    for (const u of dataset.room_unavailability || []) {
      for (const p of u.periods) {
        this.roomUnavail.add(`${u.room_id}:${u.day}:${p}`);
      }
    }

    this.facUnavail = new Set();
    for (const f of dataset.faculty) {
      for (const u of f.unavailable || []) {
        for (const p of u.periods) {
          this.facUnavail.add(`${f.id}:${u.day}:${p}`);
        }
      }
    }
  }

  public validate(assignments: SessionAssignment[]): {
    violations: Violation[];
    softScores: Record<string, number>;
    softTotal: number;
  } {
    const violations: Violation[] = [];
    const roomOcc = new Map<string, string[]>();
    const facOcc = new Map<string, string[]>();
    const grpOcc = new Map<string, Set<string>>();
    const facDayHours = new Map<string, number>();
    const basketTimes = new Map<string, Set<string>>();

    const scheduledIds = new Set<string>();

    for (const a of assignments) {
      scheduledIds.add(a.session_id);
      const s = this.sessions.get(a.session_id);
      if (!s) {
        violations.push({ rule: "H1", where: "timetable", detail: `Unknown session ${a.session_id}` });
        continue;
      }

      const r = this.rooms.get(a.room_id);
      if (!r) {
        violations.push({ rule: "H1", where: "timetable", detail: `${s.id}: unknown room ${a.room_id}` });
        continue;
      }

      if (a.start_period < 1 || a.start_period + s.duration - 1 > 9) {
        violations.push({ rule: "H9", where: "timetable", detail: `${s.id}: period ${a.start_period} outside P1-P9` });
      }

      const periods = Array.from({ length: s.duration }, (_, i) => a.start_period + i);

      // Lunch rule: crosses lunch
      if (periods[0] <= this.lunchPeriod && periods[periods.length - 1] > this.lunchPeriod) {
        violations.push({ rule: "H9", where: "timetable", detail: `${s.id}: crosses lunch break` });
      }

      // Labs start rule (duration 3, starts at P2 or P6)
      if (s.kind === "lab" && ![2, 6].includes(a.start_period)) {
        violations.push({ rule: "H9", where: "timetable", detail: `${s.id}: lab must start at P2 or P6` });
      }

      // Fixed slot
      if (s.fixed_slot && (s.fixed_slot.day !== a.day || s.fixed_slot.start_period !== a.start_period)) {
        violations.push({ rule: "H14", where: "timetable", detail: `${s.id}: fixed slot mismatch` });
      }

      // Room capacity & type & accessibility
      if (r.capacity < s.size) {
        violations.push({ rule: "H5", where: "timetable", detail: `${s.id}: size ${s.size} > ${r.id} cap ${r.capacity}` });
      }
      if (!s.room_types.includes(r.type)) {
        violations.push({ rule: "H6", where: "timetable", detail: `${s.id}: needs ${s.room_types.join(",")} but ${r.id} is ${r.type}` });
      }
      if (s.needs_accessible && !r.accessible) {
        violations.push({ rule: "H10", where: "timetable", detail: `${s.id}: requires accessible room, ${r.id} is not` });
      }

      // Faculty / Room / Group occurrences
      for (const p of periods) {
        const rKey = `${r.id}:${a.day}:${p}`;
        const fKey = `${s.faculty_id}:${a.day}:${p}`;
        roomOcc.set(rKey, [...(roomOcc.get(rKey) || []), s.id]);
        facOcc.set(fKey, [...(facOcc.get(fKey) || []), s.id]);

        if (this.roomUnavail.has(rKey)) {
          violations.push({ rule: "H8", where: "timetable", detail: `${s.id}: room ${r.id} unavailable ${a.day} P${p}` });
        }
        if (this.facUnavail.has(fKey)) {
          violations.push({ rule: "H7", where: "timetable", detail: `${s.id}: faculty ${s.faculty_id} unavailable ${a.day} P${p}` });
        }

        const bOrS = s.basket_slot || s.id;
        for (const g of s.groups) {
          const gKey = `${g}:${a.day}:${p}`;
          const current = grpOcc.get(gKey) || new Set<string>();
          current.add(bOrS);
          grpOcc.set(gKey, current);
        }
      }

      // Faculty daily hours
      const facDayKey = `${s.faculty_id}:${a.day}`;
      facDayHours.set(facDayKey, (facDayHours.get(facDayKey) || 0) + s.duration);

      // Basket consistency
      if (s.basket_slot) {
        const bt = basketTimes.get(s.basket_slot) || new Set<string>();
        bt.add(`${a.day}:${a.start_period}`);
        basketTimes.set(s.basket_slot, bt);
      }
    }

    // Check all sessions scheduled
    for (const [sid] of Array.from(this.sessions.entries())) {
      if (!scheduledIds.has(sid)) {
        violations.push({ rule: "H1", where: "timetable", detail: `Session ${sid} is not scheduled` });
      }
    }

    // Check overlaps
    for (const [k, sids] of Array.from(roomOcc.entries())) {
      if (sids.length > 1) {
        violations.push({ rule: "H4", where: "timetable", detail: `Room double booked at ${k}: ${sids.join(", ")}` });
      }
    }
    for (const [k, sids] of Array.from(facOcc.entries())) {
      if (sids.length > 1) {
        violations.push({ rule: "H2", where: "timetable", detail: `Faculty double booked at ${k}: ${sids.join(", ")}` });
      }
    }
    for (const [k, keys] of Array.from(grpOcc.entries())) {
      if (keys.size > 1) {
        violations.push({ rule: "H3", where: "timetable", detail: `Group double booked at ${k}: ${Array.from(keys).join(", ")}` });
      }
    }
    for (const [b, times] of Array.from(basketTimes.entries())) {
      if (times.size > 1) {
        violations.push({ rule: "H11", where: "timetable", detail: `Basket ${b} not scheduled concurrently: ${Array.from(times).join(", ")}` });
      }
    }
    for (const [facDay, hrs] of Array.from(facDayHours.entries())) {
      const [fId] = facDay.split(":");
      const maxH = this.faculty.get(fId)?.max_hours_per_day || 4;
      if (hrs > maxH) {
        violations.push({ rule: "H12", where: "timetable", detail: `Faculty ${fId} exceeds daily limit (${hrs} > ${maxH}) on ${facDay}` });
      }
    }

    // Calculate full soft scores S1-S6 matching official validator
    const soft = { S1: 0, S2: 0, S3: 0, S4: 0, S5: 0, S6: 0 };
    const grpDayPeriods = new Map<string, Set<number>>();
    const grpHours = new Map<string, number>();
    const grpCourse = new Map<string, number>();
    const seenBasket = new Set<string>();

    for (const a of assignments) {
      const s = this.sessions.get(a.session_id);
      const r = this.rooms.get(a.room_id);
      if (!s || !r) continue;
      const periods = Array.from({ length: s.duration }, (_, i) => a.start_period + i);

      // S1: Faculty avoid preference (+2 per period)
      const facObj = this.faculty.get(s.faculty_id);
      for (const pref of facObj?.preferences || []) {
        if (pref.type === "avoid" && (pref.days || ["MON", "TUE", "WED", "THU", "FRI"]).includes(a.day)) {
          for (const p of periods) {
            if (pref.periods.includes(p)) soft.S1 += 2;
          }
        }
      }

      // S5: Low room occupancy (<40%)
      if (r.capacity && s.size / r.capacity < 0.4) soft.S5 += 1;

      // S6: Period 9 class
      if (periods.includes(9)) soft.S6 += 1;

      for (const g of s.groups) {
        const gdKey = `${g}:${a.day}`;
        const pSet = grpDayPeriods.get(gdKey) || new Set<number>();
        periods.forEach((p) => pSet.add(p));
        grpDayPeriods.set(gdKey, pSet);

        if (s.basket_slot) {
          const bKey = `${g}:${s.basket_slot}`;
          if (seenBasket.has(bKey)) continue;
          seenBasket.add(bKey);
        }
        grpHours.set(gdKey, (grpHours.get(gdKey) || 0) + s.duration);

        if (s.kind === "lecture" && !s.basket_slot) {
          const gcKey = `${g}:${a.day}:${s.course_id}`;
          grpCourse.set(gcKey, (grpCourse.get(gcKey) || 0) + 1);
        }
      }
    }

    // S2: Gaps between classes for a student group on the same day
    for (const [, pSet] of Array.from(grpDayPeriods.entries())) {
      if (pSet.size <= 1) continue;
      const pArr = Array.from(pSet);
      const minP = Math.min(...pArr);
      const maxP = Math.max(...pArr);
      for (let p = minP; p <= maxP; p++) {
        if (!pSet.has(p)) soft.S2 += 1;
      }
    }

    // S3: Group has > 6 hours in a day (+3 per hour over 6)
    for (const [, h] of Array.from(grpHours.entries())) {
      if (h > 6) soft.S3 += 3 * (h - 6);
    }

    // S4: Group has multiple lectures of same course in same day (+3 per extra)
    for (const [, c] of Array.from(grpCourse.entries())) {
      if (c > 1) soft.S4 += 3 * (c - 1);
    }

    const softTotal = soft.S1 + soft.S2 + soft.S3 + soft.S4 + soft.S5 + soft.S6;
    return { violations, softScores: soft, softTotal };
  }
}
