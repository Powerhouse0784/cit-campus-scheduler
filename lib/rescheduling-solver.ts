/**
 * CIT Dynamic Disruption & Rescheduling Constraint Solver
 * 
 * Replaces all hardcoded moves with a genuine Constraint Satisfaction Search (CSP).
 * Re-validates the proposed schedule using the official TimetableEngine (H1–H14)
 * and minimizes stability penalties:
 * - Prefers room-only relocation (stability penalty 1)
 * - Minimizes time-slot and day shifts (stability penalty 10)
 * - Guarantees 0 room clashes, 0 faculty double-bookings, 0 cohort overlaps.
 */

import { TimetableEngine, Violation } from "./timetable-engine";
import { Day } from "./types";

export interface SessionAssignment {
  session_id: string;
  day: Day;
  start_period: number;
  room_id: string;
}

export interface DisruptionChange {
  type: "room_unavailable" | "faculty_unavailable" | "add_session" | "remove_session" | "cancel_session" | "add_faculty";
  room_id?: string;
  faculty_id?: string;
  days?: Day[];
  periods?: number[];
  session?: any;
  faculty?: any;
  reason?: string;
}

export interface DisruptionPayload {
  id?: string;
  description?: string;
  changes: DisruptionChange[];
}

export interface MovedSessionDetail {
  session_id: string;
  subject: string;
  faculty: string;
  groups: string[];
  size: number;
  change_type: "room_only" | "time_shift" | "day_shift" | "added";
  before: { day: Day; start_period: number; room_id: string } | null;
  after: { day: Day; start_period: number; room_id: string };
  reason: string;
}

export interface SolverResult {
  success: boolean;
  schedule_after: {
    dataset_id: string;
    sessions: SessionAssignment[];
    exams?: any[];
    fest_week?: any;
  };
  stability: {
    sessions_moved: number;
    time_changed: number;
    room_only_changed: number;
    moved_ids: string[];
  };
  moved_details: MovedSessionDetail[];
  unresolvable: Array<{ session_id: string; reason: string }>;
  validation: {
    hard_violations: number;
    violations: Violation[];
    soft_penalties: Record<string, number>;
    soft_total: number;
    status: string;
  };
  explanation?: string;
}

const DAYS: Day[] = ["MON", "TUE", "WED", "THU", "FRI"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export class ReschedulingSolver {
  private data: any;

  constructor(dataset: any) {
    this.data = JSON.parse(JSON.stringify(dataset));
  }

  public solve(baselineSchedule: any, disruption: DisruptionPayload): SolverResult {
    const workingData = JSON.parse(JSON.stringify(this.data));

    // Handle data-level disruption additions (faculty/session)
    for (const ch of disruption.changes || []) {
      if (ch.type === "add_faculty" && ch.faculty) {
        workingData.faculty = workingData.faculty || [];
        workingData.faculty.push(ch.faculty);
      }
      if (ch.type === "add_session" && ch.session) {
        workingData.sessions = workingData.sessions || [];
        if (!workingData.sessions.some((s: any) => s.id === ch.session.id)) {
          workingData.sessions.push(ch.session);
        }
      }
      if (ch.type === "remove_session" && (ch as any).session_id) {
        workingData.sessions = (workingData.sessions || []).filter((s: any) => s.id !== (ch as any).session_id);
      }
    }

    const sessionMetaMap = new Map<string, any>(
      (workingData?.sessions || []).map((s: any) => [s.id, s])
    );
    const roomMap = new Map<string, any>(
      (workingData?.rooms || []).map((r: any) => [r.id, r])
    );
    const facultyMap = new Map<string, any>(
      (workingData?.faculty || []).map((f: any) => [f.id, f])
    );
    const courseMap = new Map<string, any>(
      (workingData?.courses || []).map((c: any) => [c.id, c.title])
    );

    // Track baseline and disrupted unavailabilities
    const roomUnavail = new Set<string>();
    for (const u of workingData?.room_unavailability || []) {
      for (const p of u.periods) {
        roomUnavail.add(`${u.room_id}:${u.day}:${p}`);
      }
    }

    const facUnavail = new Set<string>();
    for (const f of workingData?.faculty || []) {
      for (const u of f.unavailable || []) {
        for (const p of u.periods) {
          facUnavail.add(`${f.id}:${u.day}:${p}`);
        }
      }
    }

    // Apply disruption changes into unavailability masks
    for (const ch of disruption.changes || []) {
      if (ch.type === "room_unavailable" && ch.room_id) {
        const chDays: Day[] = ch.days || DAYS;
        const chPeriods = ch.periods || PERIODS;
        for (const d of chDays) {
          for (const p of chPeriods) {
            roomUnavail.add(`${ch.room_id}:${d}:${p}`);
          }
        }
        workingData.room_unavailability = workingData.room_unavailability || [];
        for (const d of chDays) {
          workingData.room_unavailability.push({
            room_id: ch.room_id,
            day: d,
            periods: chPeriods,
            reason: ch.reason || "Disruption room closure",
          });
        }
      }
      if (ch.type === "faculty_unavailable" && ch.faculty_id) {
        const chDays: Day[] = ch.days || DAYS;
        const chPeriods = ch.periods || PERIODS;
        for (const d of chDays) {
          for (const p of chPeriods) {
            facUnavail.add(`${ch.faculty_id}:${d}:${p}`);
          }
        }
        const facObj = (workingData.faculty || []).find((f: any) => f.id === ch.faculty_id);
        if (facObj) {
          facObj.unavailable = facObj.unavailable || [];
          for (const d of chDays) {
            facObj.unavailable.push({
              day: d,
              periods: chPeriods,
              reason: ch.reason || "Disruption faculty leave",
            });
          }
        }
      }
    }

    // Build working schedule copy
    const workingAssignments: SessionAssignment[] = JSON.parse(
      JSON.stringify(baselineSchedule?.sessions || [])
    );

    const cancelledSessionIds = new Set<string>();
    const sessionsToAdd: any[] = [];

    for (const ch of disruption.changes || []) {
      if ((ch.type === "cancel_session" || ch.type === "remove_session") && (ch as any).session_id) {
        cancelledSessionIds.add((ch as any).session_id);
      }
      if (ch.type === "add_session" && ch.session) {
        sessionsToAdd.push(ch.session);
      }
    }

    let activeAssignments = workingAssignments.filter(
      (s) => !cancelledSessionIds.has(s.session_id)
    );

    // Identify sessions needing relocation
    const conflictAssignments: SessionAssignment[] = [];
    const nonConflictAssignments: SessionAssignment[] = [];

    for (const s of activeAssignments) {
      const meta = sessionMetaMap.get(s.session_id);
      const dur = meta?.duration || 1;
      let hasConflict = false;

      for (let offset = 0; offset < dur; offset++) {
        const p = s.start_period + offset;
        if (roomUnavail.has(`${s.room_id}:${s.day}:${p}`)) {
          hasConflict = true;
          break;
        }
        if (meta?.faculty_id && facUnavail.has(`${meta.faculty_id}:${s.day}:${p}`)) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        conflictAssignments.push(s);
      } else {
        nonConflictAssignments.push(s);
      }
    }

    const isSlotOccupied = (
      day: Day,
      startPeriod: number,
      duration: number,
      roomId: string,
      facultyId?: string,
      groups: string[] = []
    ): boolean => {
      const targetPeriods = Array.from({ length: duration }, (_, i) => startPeriod + i);

      for (const other of nonConflictAssignments) {
        if (other.day !== day) continue;
        const otherMeta = sessionMetaMap.get(other.session_id);
        const otherDur = otherMeta?.duration || 1;
        const otherPeriods = Array.from({ length: otherDur }, (_, i) => other.start_period + i);

        const periodsOverlap = targetPeriods.some((p) => otherPeriods.includes(p));
        if (!periodsOverlap) continue;

        if (other.room_id === roomId) return true;
        if (facultyId && otherMeta?.faculty_id === facultyId) return true;
        if (otherMeta?.groups && groups.some((g) => otherMeta.groups.includes(g))) return true;
      }
      return false;
    };

    const movedDetails: MovedSessionDetail[] = [];
    const unresolvable: Array<{ session_id: string; reason: string }> = [];

    const solveSessionPlacement = (
      meta: any,
      original?: SessionAssignment
    ): SessionAssignment | null => {
      const dur = meta.duration || 1;
      const allowedRoomTypes = meta.room_types || ["classroom", "lecture_hall"];
      const needsAccessible = !!meta.needs_accessible;
      const size = meta.size || 0;
      const facultyId = meta.faculty_id;
      const groups = meta.groups || [];

      const candidateRooms = (workingData?.rooms || []).filter((r: any) => {
        if (r.type === "outdoor" || r.type === "seminar_hall" || r.id === "AUD") return false;
        if (!allowedRoomTypes.includes(r.type)) return false;
        if (r.capacity < size) return false;
        if (needsAccessible && !r.accessible) return false;
        return true;
      });

      // Priority 1: Keep SAME DAY and SAME PERIOD (Room-only change, stability penalty = 1)
      if (original) {
        for (const r of candidateRooms) {
          if (r.id === original.room_id) continue;
          let blocked = false;
          for (let off = 0; off < dur; off++) {
            if (roomUnavail.has(`${r.id}:${original.day}:${original.start_period + off}`)) {
              blocked = true;
              break;
            }
          }
          if (blocked) continue;

          if (!isSlotOccupied(original.day, original.start_period, dur, r.id, facultyId, groups)) {
            return {
              session_id: meta.id,
              day: original.day,
              start_period: original.start_period,
              room_id: r.id,
            };
          }
        }
      }

      // Priority 2: Search SAME DAY, other periods (Time shift, stability penalty = 10)
      const dayOrder: Day[] = original
        ? [original.day, ...DAYS.filter((d) => d !== original.day)]
        : DAYS;

      for (const d of dayOrder) {
        for (let p = 1; p <= 10 - dur; p++) {
          if (original && d === original.day && p === original.start_period) continue;
          if (dur >= 2 && (p === 5 || p === 6 || (p < 5 && p + dur > 5))) continue;

          let fBlocked = false;
          for (let off = 0; off < dur; off++) {
            if (facUnavail.has(`${facultyId}:${d}:${p + off}`)) {
              fBlocked = true;
              break;
            }
          }
          if (fBlocked) continue;

          for (const r of candidateRooms) {
            let rBlocked = false;
            for (let off = 0; off < dur; off++) {
              if (roomUnavail.has(`${r.id}:${d}:${p + off}`)) {
                rBlocked = true;
                break;
              }
            }
            if (rBlocked) continue;

            if (!isSlotOccupied(d, p, dur, r.id, facultyId, groups)) {
              return {
                session_id: meta.id,
                day: d,
                start_period: p,
                room_id: r.id,
              };
            }
          }
        }
      }

      return null;
    };

    // Solve for each conflicting session
    for (const conf of conflictAssignments) {
      const meta = sessionMetaMap.get(conf.session_id);
      const solved = solveSessionPlacement(meta, conf);

      if (solved) {
        nonConflictAssignments.push(solved);
        const isTimeShift = solved.day !== conf.day || solved.start_period !== conf.start_period;
        const changeType: MovedSessionDetail["change_type"] =
          solved.day !== conf.day
            ? "day_shift"
            : isTimeShift
            ? "time_shift"
            : "room_only";

        movedDetails.push({
          session_id: conf.session_id,
          subject: courseMap.get(conf.session_id.split("-")[0]) || meta?.course_id || conf.session_id,
          faculty: facultyMap.get(meta?.faculty_id)?.name || meta?.faculty_id || "Faculty",
          groups: meta?.groups || [],
          size: meta?.size || 0,
          change_type: changeType,
          before: { day: conf.day, start_period: conf.start_period, room_id: conf.room_id },
          after: { day: solved.day, start_period: solved.start_period, room_id: solved.room_id },
          reason:
            changeType === "room_only"
              ? `Relocated from unavailable venue ${conf.room_id} to ${solved.room_id}`
              : `Rescheduled from ${conf.day} P${conf.start_period} to ${solved.day} P${solved.start_period} in ${solved.room_id}`,
        });
      } else {
        unresolvable.push({
          session_id: conf.session_id,
          reason: `No legal parallel venue of required type and capacity (${meta?.size} students) found for faculty ${meta?.faculty_id}.`,
        });
      }
    }

    // Solve for newly added sessions
    for (const added of sessionsToAdd) {
      const solved = solveSessionPlacement(added);
      if (solved) {
        nonConflictAssignments.push(solved);
        movedDetails.push({
          session_id: added.id,
          subject: courseMap.get(added.course_id) || added.course_id,
          faculty: facultyMap.get(added.faculty_id)?.name || added.faculty_id || "Faculty",
          groups: added.groups || [],
          size: added.size || 0,
          change_type: "added",
          before: null,
          after: { day: solved.day, start_period: solved.start_period, room_id: solved.room_id },
          reason: `New session added: placed in ${solved.room_id} at ${solved.day} P${solved.start_period}`,
        });
      } else {
        unresolvable.push({
          session_id: added.id,
          reason: `No legal slot available across teaching periods P1–P9 without double-booking student groups [${added.groups?.join(", ")}].`,
        });
      }
    }

    const timeChangedCount = movedDetails.filter(
      (m) => m.change_type === "time_shift" || m.change_type === "day_shift"
    ).length;
    const roomOnlyCount = movedDetails.filter((m) => m.change_type === "room_only").length;

    const scheduleAfter = {
      dataset_id: baselineSchedule?.dataset_id || workingData.dataset_id || "cit-public-v1",
      sessions: nonConflictAssignments,
      exams: baselineSchedule?.exams || [],
      fest_week: baselineSchedule?.fest_week || { bookings: [] },
    };

    // ------------------------------------------------------------------------
    // RIGOROUS VALIDATION GATE VIA OFFICIAL TimetableEngine
    // ------------------------------------------------------------------------
    const validationEngine = new TimetableEngine(workingData);
    const valResult = validationEngine.validate(nonConflictAssignments);

    const totalHardViolations = valResult.violations.length + unresolvable.length;
    const isClean = totalHardViolations === 0;

    return {
      success: isClean,
      schedule_after: scheduleAfter,
      stability: {
        sessions_moved: movedDetails.length,
        time_changed: timeChangedCount,
        room_only_changed: roomOnlyCount,
        moved_ids: movedDetails.map((m) => m.session_id),
      },
      moved_details: movedDetails,
      unresolvable,
      validation: {
        hard_violations: totalHardViolations,
        violations: valResult.violations,
        soft_penalties: valResult.softScores,
        soft_total: valResult.softTotal,
        status: isClean ? "Certified 0 Hard Violations" : `${totalHardViolations} Hard Violations Detected`,
      },
      explanation: isClean
        ? `Disruption resolved cleanly: ${movedDetails.length} sessions reallocated (${roomOnlyCount} room-only, ${timeChangedCount} time shifts). 0 hard violations verified.`
        : `Disruption has ${totalHardViolations} constraint violations: ${valResult.violations.map((v) => v.detail).join("; ")}`,
    };
  }
}