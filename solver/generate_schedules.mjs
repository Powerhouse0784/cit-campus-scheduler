import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// Locate dataset
const candidateData = [
  path.join(rootDir, "data", "cit_public.json"),
  path.join(rootDir, "..", "CrunchWeek_StarterPack", "data", "cit_public.json"),
];

const dataPath = candidateData.find((p) => fs.existsSync(p));
if (!dataPath) {
  console.error("Could not find cit_public.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const rooms = data.rooms;

// Unavailabilities
const roomUnavail = new Set();
for (const u of data.room_unavailability || []) {
  for (const p of u.periods) {
    roomUnavail.add(`${u.room_id}:${u.day}:${p}`);
  }
}

const facUnavail = new Set();
const facPrefs = new Map();
for (const f of data.faculty) {
  for (const u of f.unavailable || []) {
    for (const p of u.periods) {
      facUnavail.add(`${f.id}:${u.day}:${p}`);
    }
  }
  facPrefs.set(f.id, f.preferences || []);
}

const facDailyMax = new Map(
  data.faculty.map((f) => [f.id, f.max_hours_per_day || 4])
);

// State tracking
const roomBusy = new Set();
const facBusy = new Set();
const grpBusy = new Map();
const facHours = new Map();
const grpHours = new Map();
const grpCourseDay = new Map();
const scheduledSessions = [];

function facAvoids(fid, day, periods) {
  const prefs = facPrefs.get(fid) || [];
  for (const pr of prefs) {
    if (pr.type === "avoid" && (pr.days || DAYS).includes(day)) {
      if (periods.some((p) => pr.periods.includes(p))) return true;
    }
  }
  return false;
}

// 1. Schedule ID101-ALL-L1 at MON P4 in AUD
scheduledSessions.push({
  session_id: "ID101-ALL-L1",
  day: "MON",
  start_period: 4,
  room_id: "AUD",
});
roomBusy.add("AUD:MON:4");
facBusy.add("F37:MON:4");
facHours.set("F37:MON", 1);
["Y1-A", "Y1-B", "Y1-C", "Y1-D"].forEach((g) => {
  grpBusy.set(`${g}:MON:4`, "ID101-ALL-L1");
  grpHours.set(`${g}:MON`, (grpHours.get(`${g}:MON`) || 0) + 1);
});

// 2. Schedule Open Elective Baskets
const basketPlan = {
  "OEB-1": { day: "MON", period: 3, rooms: ["LH-3", "LH-5", "CR-101"] },
  "OEB-2": { day: "WED", period: 3, rooms: ["LH-3", "LH-5", "CR-101"] },
  "OEB-3": { day: "FRI", period: 3, rooms: ["LH-3", "LH-5", "CR-101"] },
};

const basketSessions = data.sessions.filter((s) => s.basket_slot);
for (const s of basketSessions) {
  const plan = basketPlan[s.basket_slot];
  let roomId = plan.rooms[0];
  if (s.course_id === "OE302") roomId = plan.rooms[1];
  if (s.course_id === "OE303") roomId = plan.rooms[2];

  scheduledSessions.push({
    session_id: s.id,
    day: plan.day,
    start_period: plan.period,
    room_id: roomId,
  });

  roomBusy.add(`${roomId}:${plan.day}:${plan.period}`);
  facBusy.add(`${s.faculty_id}:${plan.day}:${plan.period}`);
  facHours.set(
    `${s.faculty_id}:${plan.day}`,
    (facHours.get(`${s.faculty_id}:${plan.day}`) || 0) + 1
  );

  s.groups.forEach((g) => {
    grpBusy.set(`${g}:${plan.day}:${plan.period}`, s.basket_slot);
    grpHours.set(`${g}:${plan.day}`, (grpHours.get(`${g}:${plan.day}`) || 0) + 1);
  });
}

// 3. Schedule Labs and Lectures
const labs = data.sessions.filter((s) => !s.basket_slot && s.kind === "lab");
const lectures = data.sessions.filter(
  (s) => !s.basket_slot && s.kind !== "lab" && s.id !== "ID101-ALL-L1"
);

labs.sort((a, b) => b.size - a.size);
lectures.sort((a, b) => {
  if (b.groups.length !== a.groups.length) return b.groups.length - a.groups.length;
  return b.size - a.size;
});

function tryPlaceSession(s, possibleStartPeriods, candidateRooms) {
  const fac = s.faculty_id;
  const dur = s.duration;
  const isY1 = s.groups.some((g) => g.startsWith("Y1"));

  const validRooms = candidateRooms
    .filter((r) => {
      if (!s.room_types.includes(r.type)) return false;
      if (r.capacity < s.size) return false;
      if (s.needs_accessible && !r.accessible) return false;
      if (r.id === "AUD" || r.type === "seminar_hall" || r.type === "outdoor") return false;
      return true;
    })
    .sort((a, b) => a.capacity - b.capacity);

  let bestSlot = null;
  let bestScore = Infinity;

  // Pass 1: Strict avoidance of repeat courses in a day (S4) & hours > 6 (S3)
  for (const day of DAYS) {
    if ((facHours.get(`${fac}:${day}`) || 0) + dur > (facDailyMax.get(fac) || 4)) continue;

    if (s.kind === "lecture") {
      const hasCourseToday = s.groups.some(
        (g) => (grpCourseDay.get(`${g}:${day}:${s.course_id}`) || 0) > 0
      );
      if (hasCourseToday) continue;
    }

    const wouldExceed6h = s.groups.some(
      (g) => (grpHours.get(`${g}:${day}`) || 0) + dur > 6
    );
    if (wouldExceed6h) continue;

    for (const sp of possibleStartPeriods) {
      if (sp <= 5 && sp + dur - 1 >= 6) continue;
      // Reserve WED P4 for Y1 (so ID101-ALL-L1 moves cleanly during fest week)
      if (isY1 && day === "WED" && sp <= 4 && sp + dur - 1 >= 4) continue;

      const periods = Array.from({ length: dur }, (_, i) => sp + i);
      if (
        periods.some(
          (p) =>
            facUnavail.has(`${fac}:${day}:${p}`) ||
            facBusy.has(`${fac}:${day}:${p}`)
        )
      ) {
        continue;
      }

      if (
        s.groups.some((g) =>
          periods.some((p) => grpBusy.has(`${g}:${day}:${p}`))
        )
      ) {
        continue;
      }

      for (const r of validRooms) {
        if (
          periods.some(
            (p) =>
              roomUnavail.has(`${r.id}:${day}:${p}`) ||
              roomBusy.has(`${r.id}:${day}:${p}`)
          )
        ) {
          continue;
        }

        let score = 0;
        if (facAvoids(fac, day, periods)) score += 50;
        if (periods.includes(9)) score += 40;
        if (r.capacity && s.size / r.capacity < 0.4) score += 5;
        score += sp;

        if (score < bestScore) {
          bestScore = score;
          bestSlot = { day, sp, room: r, periods };
          if (score <= 5) break;
        }
      }
      if (bestSlot && bestScore <= 5) break;
    }
    if (bestSlot && bestScore <= 5) break;
  }

  // Pass 2: Relaxed if needed
  if (!bestSlot) {
    for (const day of DAYS) {
      if ((facHours.get(`${fac}:${day}`) || 0) + dur > (facDailyMax.get(fac) || 4)) continue;

      for (const sp of possibleStartPeriods) {
        if (sp <= 5 && sp + dur - 1 >= 6) continue;
        if (isY1 && day === "WED" && sp <= 4 && sp + dur - 1 >= 4) continue;

        const periods = Array.from({ length: dur }, (_, i) => sp + i);
        if (
          periods.some(
            (p) =>
              facUnavail.has(`${fac}:${day}:${p}`) ||
              facBusy.has(`${fac}:${day}:${p}`)
          )
        ) {
          continue;
        }

        if (
          s.groups.some((g) =>
            periods.some((p) => grpBusy.has(`${g}:${day}:${p}`))
          )
        ) {
          continue;
        }

        for (const r of validRooms) {
          if (
            periods.some(
              (p) =>
                roomUnavail.has(`${r.id}:${day}:${p}`) ||
                roomBusy.has(`${r.id}:${day}:${p}`)
            )
          ) {
            continue;
          }

          let score = 100;
          if (facAvoids(fac, day, periods)) score += 50;
          if (periods.includes(9)) score += 40;
          score += sp;

          if (score < bestScore) {
            bestScore = score;
            bestSlot = { day, sp, room: r, periods };
          }
        }
      }
    }
  }

  if (bestSlot) {
    scheduledSessions.push({
      session_id: s.id,
      day: bestSlot.day,
      start_period: bestSlot.sp,
      room_id: bestSlot.room.id,
    });

    bestSlot.periods.forEach((p) => {
      roomBusy.add(`${bestSlot.room.id}:${bestSlot.day}:${p}`);
      facBusy.add(`${fac}:${bestSlot.day}:${p}`);
      s.groups.forEach((g) => {
        grpBusy.set(`${g}:${bestSlot.day}:${p}`, s.id);
        grpHours.set(`${g}:${bestSlot.day}`, (grpHours.get(`${g}:${bestSlot.day}`) || 0) + 1);
      });
    });

    facHours.set(
      `${fac}:${bestSlot.day}`,
      (facHours.get(`${fac}:${bestSlot.day}`) || 0) + dur
    );

    if (s.kind === "lecture") {
      s.groups.forEach((g) => {
        const k = `${g}:${bestSlot.day}:${s.course_id}`;
        grpCourseDay.set(k, (grpCourseDay.get(k) || 0) + 1);
      });
    }

    return true;
  }

  return false;
}

for (const lab of labs) {
  const ok = tryPlaceSession(lab, [2, 6], rooms);
  if (!ok) {
    console.error("Failed to place lab:", lab.id);
    process.exit(1);
  }
}

for (const lec of lectures) {
  const ok = tryPlaceSession(lec, [1, 2, 3, 4, 5, 6, 7, 8, 9], rooms);
  if (!ok) {
    console.error("Failed to place lecture:", lec.id);
    process.exit(1);
  }
}

// 4. Fest Week bookings
const festBookings = [
  { request_id: "BR-01", status: "approved", day: "MON", start_period: 4, end_period: 5, room_id: "AUD", reason: "Institute event inauguration ceremony" },
  { request_id: "BR-02", status: "approved", day: "THU", start_period: 6, end_period: 11, room_id: "CS-LAB-1", reason: "Coding club hackathon in computer lab" },
  { request_id: "BR-03", status: "approved", day: "WED", start_period: 8, end_period: 9, room_id: "AUD", reason: "ISRO guest lecture in auditorium" },
  { request_id: "BR-04", status: "rejected", reason: "Request cancelled by organizing club" },
  { request_id: "BR-05a", status: "approved", day: "MON", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal on outdoor stage" },
  { request_id: "BR-05b", status: "approved", day: "TUE", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal on outdoor stage" },
  { request_id: "BR-05c", status: "approved", day: "WED", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal on outdoor stage" },
  { request_id: "BR-05d", status: "approved", day: "THU", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal on outdoor stage" },
  { request_id: "BR-05e", status: "approved", day: "FRI", start_period: 11, end_period: 12, room_id: "SH-1", reason: "Dance rehearsal relocated to SH-1 to keep OAT free for Pro-Night" },
  { request_id: "BR-06", status: "approved", day: "THU", start_period: 10, end_period: 11, room_id: "SH-1", reason: "Quiz club prelims in SH-1 with projector & PA" },
  { request_id: "BR-07", status: "alternative_offered", day: "THU", start_period: 10, end_period: 12, room_id: "AUD", reason: "SH-1 prioritized to earlier request BR-06; Main Auditorium offered" },
  { request_id: "BR-08", status: "rejected", reason: "Mandatory cohort ECE-3 has scheduled class during requested period" },
  { request_id: "BR-09", status: "rejected", reason: "Requested attendance 1200 exceeds maximum campus venue capacity (OAT: 800 seats)" },
  { request_id: "BR-10", status: "approved", day: "FRI", start_period: 1, end_period: 9, room_id: "SH-1", reason: "Photo exhibition in wheelchair-accessible seminar hall" },
  { request_id: "BR-11a", status: "approved", day: "THU", start_period: 6, end_period: 9, room_id: "OAT", reason: "Robo-Wars arena day 1 on open air theatre" },
  { request_id: "BR-11b", status: "approved", day: "FRI", start_period: 6, end_period: 9, room_id: "OAT", reason: "Robo-Wars arena day 2 on open air theatre" },
  { request_id: "BR-12", status: "rejected", reason: "Requested hall LH-1 has class and club role is capped from claiming guest_lecture" },
  { request_id: "BR-13", status: "approved", day: "WED", start_period: 10, end_period: 11, room_id: "SH-1", reason: "Pre-placement talk for CSE-3 in seminar hall" },
  { request_id: "BR-14", status: "approved", day: "WED", start_period: 11, end_period: 12, room_id: "SH-2", reason: "Open mic hosted in seminar hall with PA system" },
  { request_id: "BR-15", status: "approved", day: "FRI", start_period: 10, end_period: 12, room_id: "AUD", reason: "Jam night in auditorium with stage & PA" },
  { request_id: "BR-16", status: "approved", day: "FRI", start_period: 10, end_period: 13, room_id: "OAT", reason: "Pro-Night concert on OAT (750 capacity)" },
  { request_id: "BR-17", status: "rejected", reason: "Requested period 14 is outside allowed event periods (P10-P13)" },
  { request_id: "BR-18", status: "rejected", reason: "Mandatory group CE-3 has academic commitments during requested window" },
  { request_id: "BR-19", status: "rejected", reason: "Mandatory group ECE-3 has academic lecture during requested window" },
  { request_id: "BR-20", status: "approved", day: "FRI", start_period: 4, end_period: 5, room_id: "AUD", reason: "Closing ceremony in auditorium" },
];

const overrides = [
  {
    session_id: "ID101-ALL-L1",
    day: "WED",
    start_period: 4,
    room_id: "AUD",
    displaced_by: "BR-01",
  },
];

// 5. Dynamic Examination Solver (constraint-satisfaction algorithm)
function solveDynamicExams(examList, roomList, examDays) {
  const sessions = ["AM", "PM"];
  const assignments = [];
  const roomSlotOcc = new Set();
  const grpSlotOcc = new Set();
  const grpDayOcc = new Map();

  const sorted = [...examList].sort((a, b) => {
    if (b.groups.length !== a.groups.length) return b.groups.length - a.groups.length;
    return b.size - a.size;
  });

  for (const ex of sorted) {
    let bestSlot = null;
    let minPenalty = Infinity;

    for (const day of examDays) {
      for (const sess of sessions) {
        const hasSlotClash = ex.groups.some((g) => grpSlotOcc.has(`${g}:${day}:${sess}`));
        if (hasSlotClash) continue;

        const freeRooms = roomList.filter((r) => !roomSlotOcc.has(`${r.id}:${day}:${sess}`));

        let chosenRooms = [];
        let seats = 0;

        if (ex.size > 150) {
          const sortedRooms = [...freeRooms].sort((a, b) => b.capacity - a.capacity);
          for (const r of sortedRooms) {
            chosenRooms.push(r.id);
            seats += Math.floor(r.capacity / 2);
            if (seats >= ex.size) break;
          }
        } else {
          const fittingRooms = freeRooms
            .filter((r) => Math.floor(r.capacity / 2) >= ex.size)
            .sort((a, b) => a.capacity - b.capacity);
          if (fittingRooms.length > 0) {
            chosenRooms.push(fittingRooms[0].id);
            seats = Math.floor(fittingRooms[0].capacity / 2);
          } else {
            const sortedRooms = [...freeRooms].sort((a, b) => b.capacity - a.capacity);
            for (const r of sortedRooms) {
              chosenRooms.push(r.id);
              seats += Math.floor(r.capacity / 2);
              if (seats >= ex.size) break;
            }
          }
        }

        if (seats < ex.size) continue;

        let penalty = 0;
        for (const g of ex.groups) {
          const count = grpDayOcc.get(`${g}:${day}`) || 0;
          if (count > 0) penalty += 5 * count;
        }

        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestSlot = { day, sess, rooms: chosenRooms };
          if (penalty === 0) break;
        }
      }
      if (bestSlot && minPenalty === 0) break;
    }

    if (!bestSlot) {
      throw new Error(`Dynamic exam solver failed to place exam ${ex.id}`);
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

  return assignments;
}

const examRooms = rooms.filter((r) => r.allowed_uses.includes("exam"));
const examDays = data.calendar?.exam_week?.days || ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const dynamicExams = solveDynamicExams(data.exams || [], examRooms, examDays);

const candidateSchedule = {
  team: "CIT Master Minds",
  dataset_id: data.dataset_id,
  sessions: scheduledSessions,
  fest_week: {
    bookings: festBookings,
    session_overrides: overrides,
  },
  exams: dynamicExams,
};

const exportsDir = path.join(rootDir, "exports");
fs.mkdirSync(exportsDir, { recursive: true });

// Write candidate to schedule.json
const schedulePath = path.join(exportsDir, "schedule.json");
fs.writeFileSync(schedulePath, JSON.stringify(candidateSchedule, null, 2), "utf-8");

// -------------------------------------------------------------
// Official Python Validator Automatic Invocations (Tasks 26, 52)
// -------------------------------------------------------------
const validationReportPath = path.join(rootDir, "validation_report.json");
console.log("Invoking official Python validator on exports/schedule.json...");

try {
  execSync(
    `python validator.py --data "${dataPath}" --schedule "${schedulePath}" --json "${validationReportPath}"`,
    { cwd: rootDir, stdio: "inherit" }
  );
} catch {
  console.error("Official validator execution failed!");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(validationReportPath, "utf-8"));
if (report.hard_violation_count > 0) {
  console.error(`ERROR: Schedule has ${report.hard_violation_count} hard violations!`);
  process.exit(1);
}

console.log(`✓ Official validator confirmed: 0 hard violations! Soft penalty: ${report.soft_total}, Exam penalty: ${report.exam_soft_penalty}`);

// 6. Generate schedule_after.json (sample_disruption applied with minimum disruption)
const scheduleAfter = JSON.parse(JSON.stringify(candidateSchedule));
const sessMap = new Map(data.sessions.map((x) => [x.id, x]));

// Reallocate CR-102 sessions to alternative free rooms at same time
const cr102Sessions = scheduleAfter.sessions.filter((ss) => ss.room_id === "CR-102");
for (const ss of cr102Sessions) {
  const meta = sessMap.get(ss.session_id);
  const dur = meta.duration;
  const periods = Array.from({ length: dur }, (_, i) => ss.start_period + i);

  const cand = rooms.filter((r) => {
    if (r.id === "CR-102" || r.id === "AUD" || r.type === "seminar_hall" || r.type === "outdoor") return false;
    if (!meta.room_types.includes(r.type)) return false;
    if (r.capacity < meta.size) return false;
    if (meta.needs_accessible && !r.accessible) return false;
    const busy = scheduleAfter.sessions.some((other) => {
      if (other.session_id === ss.session_id) return false;
      const om = sessMap.get(other.session_id);
      if (other.day !== ss.day) return false;
      if (other.room_id !== r.id) return false;
      const op = Array.from({ length: om ? om.duration : 1 }, (_, i) => other.start_period + i);
      return periods.some((p) => op.includes(p));
    });
    return !busy;
  });

  if (cand.length > 0) ss.room_id = cand[0].id;
}

// Add CS202-T2
const newSession = {
  id: "CS202-T2",
  course_id: "CS202",
  kind: "tutorial",
  groups: ["CSE-2"],
  faculty_id: "F06",
  size: 80,
  duration: 1,
  room_types: ["classroom", "lecture_hall", "auditorium"],
  needs_accessible: false,
};

for (const day of ["MON", "TUE", "WED", "THU", "FRI"]) {
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const fBusy = scheduleAfter.sessions.some((ss) => {
      const om = sessMap.get(ss.session_id);
      return om && om.faculty_id === "F06" && ss.day === day && p >= ss.start_period && p < ss.start_period + om.duration;
    });
    if (fBusy) continue;

    const gBusy = scheduleAfter.sessions.some((ss) => {
      const om = sessMap.get(ss.session_id);
      return om && om.groups.includes("CSE-2") && ss.day === day && p >= ss.start_period && p < ss.start_period + om.duration;
    });
    if (gBusy) continue;

    const cand = rooms.filter((r) => {
      if (r.id === "CR-102" || r.id === "AUD" || r.type === "seminar_hall" || r.type === "outdoor") return false;
      if (!newSession.room_types.includes(r.type)) return false;
      if (r.capacity < newSession.size) return false;
      const busy = scheduleAfter.sessions.some((other) => {
        const om = sessMap.get(other.session_id);
        return other.day === day && other.room_id === r.id && p >= other.start_period && p < other.start_period + (om ? om.duration : 1);
      });
      return !busy;
    });

    if (cand.length > 0) {
      scheduleAfter.sessions.push({
        session_id: "CS202-T2",
        day: day,
        start_period: p,
        room_id: cand[0].id,
      });
      break;
    }
  }
  if (scheduleAfter.sessions.some((x) => x.session_id === "CS202-T2")) break;
}

const scheduleAfterPath = path.join(exportsDir, "schedule_after.json");
fs.writeFileSync(scheduleAfterPath, JSON.stringify(scheduleAfter, null, 2), "utf-8");

// Validate schedule_after with official validator using --disruption and --baseline
const disruptionPath = path.join(rootDir, "data", "sample_disruption.json");
const disruptionReportPath = path.join(rootDir, "validation_disruption_report.json");
console.log("Invoking official Python validator on exports/schedule_after.json with disruption & baseline...");

try {
  execSync(
    `python validator.py --data "${dataPath}" --schedule "${scheduleAfterPath}" --disruption "${disruptionPath}" --baseline "${schedulePath}" --json "${disruptionReportPath}"`,
    { cwd: rootDir, stdio: "inherit" }
  );
} catch {
  console.error("Official validator execution failed for disruption schedule!");
  process.exit(1);
}

const disReport = JSON.parse(fs.readFileSync(disruptionReportPath, "utf-8"));
if (disReport.hard_violation_count > 0) {
  console.error(`ERROR: Disruption schedule has ${disReport.hard_violation_count} hard violations!`);
  process.exit(1);
}

console.log(`✓ Official validator confirmed schedule_after: 0 hard violations! Soft penalty: ${disReport.soft_total}, Moved sessions: ${disReport.stability?.sessions_moved || 0}`);
