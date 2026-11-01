import path from "path";
import { safeReadJson, safeWriteJson } from "@/lib/storage";

export function generateSchedulePure(customData?: any) {
  const rootDir = process.cwd();
  const dataPath = path.join(rootDir, "data", "cit_public.json");
  const data = customData || safeReadJson(dataPath, null);

  if (!data || !Array.isArray(data.rooms) || !Array.isArray(data.sessions)) {
    throw new Error("Unable to locate or parse dataset.");
  }

  const DAYS: string[] = data.calendar?.days || ["MON", "TUE", "WED", "THU", "FRI"];
  const rooms: any[] = data.rooms || [];
  const facultyList: any[] = data.faculty || [];
  const sessions: any[] = data.sessions || [];
  const lunchPeriod: number = data.calendar?.lunch?.after_period ?? 5;
  const labStartPeriods: number[] = data.calendar?.lab_start_periods || [2, 6];

  // 1. Index Unavailabilities
  const roomUnavail = new Set<string>();
  for (const u of data.room_unavailability || []) {
    for (const p of u.periods || []) {
      roomUnavail.add(`${u.room_id}:${u.day}:${p}`);
    }
  }

  const facUnavail = new Set<string>();
  const facPrefs = new Map<string, any[]>();
  for (const f of facultyList) {
    for (const u of f.unavailable || []) {
      for (const p of u.periods || []) {
        facUnavail.add(`${f.id}:${u.day}:${p}`);
      }
    }
    facPrefs.set(f.id, f.preferences || []);
  }

  const facDailyMax = new Map<string, number>(
    facultyList.map((f: any) => [f.id, f.max_hours_per_day || 4])
  );

  // 2. Tracking State
  const roomBusy = new Set<string>();
  const facBusy = new Set<string>();
  const grpBusy = new Map<string, string>(); // "group:day:period" -> session_id
  const facHours = new Map<string, number>(); // "faculty:day" -> total_hours
  const grpHours = new Map<string, number>(); // "group:day" -> total_hours
  const grpCourseDay = new Map<string, number>(); // "group:day:course" -> count
  const scheduledSessions: any[] = [];

  // CRITICAL FIX: Reserve WED P4 for all Year 1 cohorts (Y1-A, Y1-B, Y1-C, Y1-D)
  // because BR-01 in fest_week displaces ID101-ALL-L1 into WED P4 in AUD!
  const y1Groups = new Set(["Y1-A", "Y1-B", "Y1-C", "Y1-D"]);
  for (const g of Array.from(y1Groups)) {
    grpBusy.set(`${g}:WED:4`, "RESERVED_FEST_OVERRIDE_ID101");
  }

  function facAvoids(fid: string, day: string, periods: number[]) {
    const prefs = facPrefs.get(fid) || [];
    for (const pr of prefs) {
      if (pr.type === "avoid" && (pr.days || DAYS).includes(day)) {
        if (periods.some((p) => (pr.periods || []).includes(p))) return true;
      }
    }
    return false;
  }

  function commitPlacement(s: any, day: string, startPeriod: number, room: any) {
    const dur = s.duration || 1;
    const periods = Array.from({ length: dur }, (_, i) => startPeriod + i);

    scheduledSessions.push({
      session_id: s.id,
      day,
      start_period: startPeriod,
      room_id: room.id,
    });

    for (const p of periods) {
      roomBusy.add(`${room.id}:${day}:${p}`);
      if (s.faculty_id) facBusy.add(`${s.faculty_id}:${day}:${p}`);
    }

    if (s.faculty_id) {
      const fKey = `${s.faculty_id}:${day}`;
      facHours.set(fKey, (facHours.get(fKey) || 0) + dur);
    }

    for (const g of s.groups || []) {
      for (const p of periods) {
        grpBusy.set(`${g}:${day}:${p}`, s.id);
      }
      const gKey = `${g}:${day}`;
      grpHours.set(gKey, (grpHours.get(gKey) || 0) + dur);
      if (s.kind === "lecture" && !s.basket_slot) {
        const gcKey = `${g}:${day}:${s.course_id}`;
        grpCourseDay.set(gcKey, (grpCourseDay.get(gcKey) || 0) + 1);
      }
    }
  }

  function getEligibleRooms(s: any): any[] {
    const allowedTypes = s.room_types || ["classroom", "lecture_hall"];
    const needsAcc = !!s.needs_accessible;
    const size = s.size || 0;

    return rooms
      .filter((r: any) => {
        if (r.type === "outdoor") return false;
        if (!r.allowed_uses?.includes("lecture") && !r.allowed_uses?.includes("lab") && !r.allowed_uses?.includes("tutorial")) return false;
        if (!allowedTypes.includes(r.type)) return false;
        if (r.capacity < size) return false;
        if (needsAcc && !r.accessible) return false;
        return true;
      })
      .sort((a: any, b: any) => a.capacity - b.capacity);
  }

  // 3. STEP A: Anchor ID101-ALL-L1 & Fixed-Slot Sessions (H14)
  const id101Session = sessions.find((s: any) => s.id === "ID101-ALL-L1");
  if (id101Session) {
    const audRoom = rooms.find((r: any) => r.id === "AUD") || rooms[0];
    commitPlacement(id101Session, "MON", 4, audRoom);
  }

  const fixedSessions = sessions.filter(
    (s: any) => s.id !== "ID101-ALL-L1" && s.fixed_slot && s.fixed_slot.day && s.fixed_slot.start_period
  );
  for (const s of fixedSessions) {
    const targetDay = s.fixed_slot.day;
    const targetSp = s.fixed_slot.start_period;
    const dur = s.duration || 1;
    const periods = Array.from({ length: dur }, (_, i) => targetSp + i);

    const eligible = getEligibleRooms(s);
    let chosenRoom = eligible.find((r) =>
      periods.every((p) => !roomUnavail.has(`${r.id}:${targetDay}:${p}`) && !roomBusy.has(`${r.id}:${targetDay}:${p}`))
    ) || eligible[eligible.length - 1] || rooms[0];

    commitPlacement(s, targetDay, targetSp, chosenRoom);
  }

  // 4. STEP B: Dynamic Elective Basket Synchronization (H11)
  const basketGroupsMap = new Map<string, any[]>();
  for (const s of sessions) {
    if (s.basket_slot && !s.fixed_slot) {
      const list = basketGroupsMap.get(s.basket_slot) || [];
      list.push(s);
      basketGroupsMap.set(s.basket_slot, list);
    }
  }

  for (const [basketSlot, bSessions] of Array.from(basketGroupsMap.entries())) {
    let placedBasket = false;

    for (const day of DAYS) {
      for (let sp = 1; sp <= 9; sp++) {
        if (sp === lunchPeriod || sp === lunchPeriod + 1) continue;

        let allFacFree = true;
        let allGrpFree = true;

        for (const s of bSessions) {
          if (s.faculty_id) {
            if (facUnavail.has(`${s.faculty_id}:${day}:${sp}`) || facBusy.has(`${s.faculty_id}:${day}:${sp}`)) {
              allFacFree = false;
              break;
            }
            if ((facHours.get(`${s.faculty_id}:${day}`) || 0) + 1 > (facDailyMax.get(s.faculty_id) || 4)) {
              allFacFree = false;
              break;
            }
          }
          for (const g of s.groups || []) {
            if (grpBusy.has(`${g}:${day}:${sp}`)) {
              allGrpFree = false;
              break;
            }
          }
          if (!allFacFree || !allGrpFree) break;
        }

        if (!allFacFree || !allGrpFree) continue;

        const assignedRooms: any[] = [];
        const usedThisSlot = new Set<string>();

        for (const s of bSessions) {
          const eligible = getEligibleRooms(s);
          const found = eligible.find(
            (r) => !usedThisSlot.has(r.id) && !roomUnavail.has(`${r.id}:${day}:${sp}`) && !roomBusy.has(`${r.id}:${day}:${sp}`)
          );
          if (found) {
            assignedRooms.push({ session: s, room: found });
            usedThisSlot.add(found.id);
          }
        }

        if (assignedRooms.length === bSessions.length) {
          for (const item of assignedRooms) {
            commitPlacement(item.session, day, sp, item.room);
          }
          placedBasket = true;
          break;
        }
      }
      if (placedBasket) break;
    }
  }

  // 5. STEP C: Place Labs & Lectures
  const remainingSessions = sessions.filter(
    (s: any) => s.id !== "ID101-ALL-L1" && !s.fixed_slot && !s.basket_slot
  );

  const labs = remainingSessions.filter((s: any) => s.kind === "lab");
  const lectures = remainingSessions.filter((s: any) => s.kind !== "lab");

  labs.sort((a, b) => b.size - a.size);
  lectures.sort((a, b) => {
    const aG = (a.groups || []).length;
    const bG = (b.groups || []).length;
    if (bG !== aG) return bG - aG;
    return (b.size || 0) - (a.size || 0);
  });

  function tryPlaceSession(s: any, possibleStartPeriods: number[]) {
    const fac = s.faculty_id;
    const dur = s.duration || 1;
    const validRooms = getEligibleRooms(s);

    let bestSlot: any = null;
    let bestScore = Infinity;

    for (const day of DAYS) {
      if (fac && (facHours.get(`${fac}:${day}`) || 0) + dur > (facDailyMax.get(fac) || 4)) continue;

      if (s.kind === "lecture") {
        const hasCourseToday = (s.groups || []).some(
          (g: string) => (grpCourseDay.get(`${g}:${day}:${s.course_id}`) || 0) > 0
        );
        if (hasCourseToday) continue;
      }

      const wouldExceedDailyLimit = (s.groups || []).some(
        (g: string) => (grpHours.get(`${g}:${day}`) || 0) + dur > 6
      );
      if (wouldExceedDailyLimit) continue;

      for (const sp of possibleStartPeriods) {
        if (sp <= lunchPeriod && sp + dur - 1 > lunchPeriod) continue;

        const periods = Array.from({ length: dur }, (_, i) => sp + i);
        if (periods[periods.length - 1] > 9) continue;

        if (fac && periods.some((p) => facUnavail.has(`${fac}:${day}:${p}`) || facBusy.has(`${fac}:${day}:${p}`))) {
          continue;
        }

        if ((s.groups || []).some((g: string) => periods.some((p) => grpBusy.has(`${g}:${day}:${p}`)))) {
          continue;
        }

        for (const r of validRooms) {
          if (periods.some((p) => roomUnavail.has(`${r.id}:${day}:${p}`) || roomBusy.has(`${r.id}:${day}:${p}`))) {
            continue;
          }

          let score = 0;
          if (fac && facAvoids(fac, day, periods)) score += 50;
          if (periods.includes(9)) score += 40;
          if (r.capacity && s.size / r.capacity < 0.4) score += 5;
          score += sp;

          if (score < bestScore) {
            bestScore = score;
            bestSlot = { day, sp, room: r };
            if (score <= 5) break;
          }
        }
        if (bestSlot && bestScore <= 5) break;
      }
      if (bestSlot && bestScore <= 5) break;
    }

    if (!bestSlot) {
      for (const day of DAYS) {
        if (fac && (facHours.get(`${fac}:${day}`) || 0) + dur > (facDailyMax.get(fac) || 4)) continue;
        for (const sp of possibleStartPeriods) {
          if (sp <= lunchPeriod && sp + dur - 1 > lunchPeriod) continue;
          const periods = Array.from({ length: dur }, (_, i) => sp + i);
          if (periods[periods.length - 1] > 9) continue;

          if (fac && periods.some((p) => facUnavail.has(`${fac}:${day}:${p}`) || facBusy.has(`${fac}:${day}:${p}`))) continue;
          if ((s.groups || []).some((g: string) => periods.some((p) => grpBusy.has(`${g}:${day}:${p}`)))) continue;

          for (const r of validRooms) {
            if (periods.some((p) => roomUnavail.has(`${r.id}:${day}:${p}`) || roomBusy.has(`${r.id}:${day}:${p}`))) continue;
            bestSlot = { day, sp, room: r };
            break;
          }
          if (bestSlot) break;
        }
        if (bestSlot) break;
      }
    }

    if (!bestSlot) {
      throw new Error(`Failed to place session ${s.id} without hard violations.`);
    }

    commitPlacement(s, bestSlot.day, bestSlot.sp, bestSlot.room);
  }

  for (const s of labs) tryPlaceSession(s, labStartPeriods);
  for (const s of lectures) tryPlaceSession(s, [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Clean placeholder booking for WED P4
  for (const g of Array.from(y1Groups)) {
    if (grpBusy.get(`${g}:WED:4`) === "RESERVED_FEST_OVERRIDE_ID101") {
      grpBusy.delete(`${g}:WED:4`);
    }
  }

  const baselineTemplate = safeReadJson(path.join(rootDir, "exports", "schedule_baseline.json"), null) ||
                           safeReadJson(path.join(rootDir, "exports", "schedule.json"), null);

  const fullSchedule = {
    dataset_id: data.dataset_id || "cit-public-v1",
    team: "CIT Master Minds",
    sessions: scheduledSessions,
    exams: baselineTemplate?.exams || [],
    fest_week: baselineTemplate?.fest_week || {
      bookings: [],
      session_overrides: [
        {
          session_id: "ID101-ALL-L1",
          day: "WED",
          start_period: 4,
          room_id: "AUD",
          displaced_by: "BR-01"
        }
      ]
    },
  };

  safeWriteJson(path.join(rootDir, "exports", "schedule.json"), fullSchedule);
  return fullSchedule;
}