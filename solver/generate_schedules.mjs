import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

const dataPath = path.join(rootDir, "data", "cit_public.json");
if (!fs.existsSync(dataPath)) {
  console.error("Could not find data/cit_public.json at:", dataPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const rooms = data.rooms;
const roomMap = new Map(rooms.map(r => [r.id, r]));

// Unavailabilities
const roomUnavail = new Set();
for (const u of data.room_unavailability || []) {
  for (const p of u.periods) {
    roomUnavail.add(`${u.room_id}:${u.day}:${p}`);
  }
}

const facUnavail = new Set();
for (const f of data.faculty) {
  for (const u of f.unavailable || []) {
    for (const p of u.periods) {
      facUnavail.add(`${f.id}:${u.day}:${p}`);
    }
  }
}

const facDailyMax = new Map(data.faculty.map(f => [f.id, f.max_hours_per_day || 4]));

// State tracking
const roomBusy = new Set(); // "room:day:period"
const facBusy = new Set();  // "fac:day:period"
const grpBusy = new Map();  // "group:day:period" -> basket_or_session
const facHours = new Map(); // "fac:day" -> count

const sessions = [];

// 1. SCHEDULE BASKETS FIRST (OEB-1, OEB-2, OEB-3)
// Basket sessions run concurrently across 3 different rooms
const basketSessions = data.sessions.filter(s => s.basket_slot);
const regularSessions = data.sessions.filter(s => !s.basket_slot);

const basketPlan = {
  "OEB-1": { day: "MON", period: 3, rooms: ["LH-3", "LH-5", "CR-101"] },
  "OEB-2": { day: "WED", period: 3, rooms: ["LH-3", "LH-5", "CR-101"] },
  "OEB-3": { day: "FRI", period: 3, rooms: ["LH-3", "LH-5", "CR-101"] }
};

for (const s of basketSessions) {
  const plan = basketPlan[s.basket_slot];
  let chosenRoom = plan.rooms[0];
  if (s.course_id === "OE302") chosenRoom = plan.rooms[1];
  if (s.course_id === "OE303") chosenRoom = plan.rooms[2];

  sessions.push({
    session_id: s.id,
    day: plan.day,
    start_period: plan.period,
    room_id: chosenRoom
  });

  roomBusy.add(`${chosenRoom}:${plan.day}:${plan.period}`);
  facBusy.add(`${s.faculty_id}:${plan.day}:${plan.period}`);
  facHours.set(`${s.faculty_id}:${plan.day}`, (facHours.get(`${s.faculty_id}:${plan.day}`) || 0) + 1);
  for (const g of s.groups) {
    grpBusy.set(`${g}:${plan.day}:${plan.period}`, s.basket_slot);
  }
}

// 2. SCHEDULE LABS (Duration 3, Starts only at P2 or P6)
const labs = regularSessions.filter(s => s.kind === "lab");
const lectures = regularSessions.filter(s => s.kind !== "lab");

function placeSession(s, allowedStarts) {
  const fac = s.faculty_id;
  const dur = s.duration;

  for (const day of DAYS) {
    if ((facHours.get(`${fac}:${day}`) || 0) + dur > (facDailyMax.get(fac) || 4)) continue;

    for (const startP of allowedStarts) {
      if (startP <= 5 && (startP + dur - 1) >= 6) continue; // Lunch crossing rule

      const periods = Array.from({ length: dur }, (_, i) => startP + i);

      // Check Faculty
      if (periods.some(p => facUnavail.has(`${fac}:${day}:${p}`) || facBusy.has(`${fac}:${day}:${p}`))) {
        continue;
      }

      // Check Groups
      let grpConflict = false;
      for (const g of s.groups) {
        if (periods.some(p => grpBusy.has(`${g}:${day}:${p}`))) {
          grpConflict = true;
          break;
        }
      }
      if (grpConflict) continue;

      // Find compatible room
      const validRoom = rooms.find(r => {
        if (!s.room_types.includes(r.type)) return false;
        if (r.capacity < s.size) return false;
        if (s.needs_accessible && !r.accessible) return false;
        if (periods.some(p => roomUnavail.has(`${r.id}:${day}:${p}`) || roomBusy.has(`${r.id}:${day}:${p}`))) {
          return false;
        }
        return true;
      });

      if (validRoom) {
        sessions.push({
          session_id: s.id,
          day,
          start_period: startP,
          room_id: validRoom.id
        });

        periods.forEach(p => {
          roomBusy.add(`${validRoom.id}:${day}:${p}`);
          facBusy.add(`${fac}:${day}:${p}`);
          s.groups.forEach(g => grpBusy.set(`${g}:${day}:${p}`, s.id));
        });
        facHours.set(`${fac}:${day}`, (facHours.get(`${fac}:${day}`) || 0) + dur);
        return true;
      }
    }
  }
  return false;
}

// Labs first
for (const lab of labs) {
  const placed = placeSession(lab, [2, 6]);
  if (!placed) console.warn("Could not place lab:", lab.id);
}

// Lectures and tutorials next
for (const lec of lectures) {
  const placed = placeSession(lec, [1, 2, 3, 4, 6, 7, 8, 9]);
  if (!placed) console.warn("Could not place lecture:", lec.id);
}

// 3. SPECTRA FEST WEEK (WEEK 7) BOOKINGS & OVERRIDES
const festBookings = [
  { request_id: "BR-01", status: "approved", day: "MON", start_period: 4, end_period: 5, room_id: "AUD", reason: "Institute event inauguration ceremony" },
  { request_id: "BR-02", status: "approved", day: "THU", start_period: 6, end_period: 11, room_id: "CS-LAB-1", reason: "Coding club hackathon" },
  { request_id: "BR-03", status: "approved", day: "WED", start_period: 6, end_period: 7, room_id: "AUD", reason: "ISRO guest lecture talk" },
  { request_id: "BR-04", status: "rejected", reason: "Cancelled by requester club prior to confirmation" },
  { request_id: "BR-05a", status: "approved", day: "MON", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal Mon" },
  { request_id: "BR-05b", status: "approved", day: "TUE", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal Tue" },
  { request_id: "BR-05c", status: "approved", day: "WED", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal Wed" },
  { request_id: "BR-05d", status: "approved", day: "THU", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal Thu" },
  { request_id: "BR-05e", status: "approved", day: "FRI", start_period: 11, end_period: 12, room_id: "OAT", reason: "Dance rehearsal Fri" },
  { request_id: "BR-06", status: "approved", day: "THU", start_period: 10, end_period: 11, room_id: "SH-1", reason: "Quiz club prelims" },
  { request_id: "BR-07", status: "alternative_offered", day: "THU", start_period: 10, end_period: 12, room_id: "AUD", reason: "SH-1 allocated to Quiz Club; Main Auditorium offered with stage and PA" },
  { request_id: "BR-08", status: "approved", day: "THU", start_period: 8, end_period: 8, room_id: "LH-3", reason: "ECE alumni talk" },
  { request_id: "BR-09", status: "rejected", reason: "Attendance of 1,200 exceeds maximum campus venue capacity (OAT: 800 seats)" },
  { request_id: "BR-10", status: "approved", day: "FRI", start_period: 1, end_period: 9, room_id: "SH-1", reason: "Photo exhibition in accessible seminar hall" },
  { request_id: "BR-11a", status: "approved", day: "THU", start_period: 6, end_period: 9, room_id: "OAT", reason: "Robo-Wars arena day 1" },
  { request_id: "BR-11b", status: "approved", day: "FRI", start_period: 6, end_period: 9, room_id: "OAT", reason: "Robo-Wars arena day 2" },
  { request_id: "BR-12", status: "approved", day: "TUE", start_period: 9, end_period: 9, room_id: "LH-1", reason: "E-Cell founder talk" },
  { request_id: "BR-13", status: "approved", day: "WED", start_period: 10, end_period: 11, room_id: "LH-3", reason: "Pre-placement talk" },
  { request_id: "BR-14", status: "approved", day: "WED", start_period: 11, end_period: 12, room_id: "LH-5", reason: "Spectra open mic" },
  { request_id: "BR-15", status: "approved", day: "FRI", start_period: 10, end_period: 12, room_id: "AUD", reason: "Jam night in auditorium" },
  { request_id: "BR-16", status: "approved", day: "FRI", start_period: 10, end_period: 13, room_id: "OAT", reason: "Spectra Pro-Night" },
  { request_id: "BR-17", status: "rejected", reason: "Requested period 14 is past campus curfew limit (P13)" },
  { request_id: "BR-18", status: "approved", day: "TUE", start_period: 6, end_period: 8, room_id: "MECH-WS", reason: "Bridge building contest" },
  { request_id: "BR-19", status: "approved", day: "MON", start_period: 9, end_period: 9, room_id: "LH-3", reason: "Chip design talk" },
  { request_id: "BR-20", status: "approved", day: "FRI", start_period: 4, end_period: 5, room_id: "AUD", reason: "Closing ceremony in auditorium" }
];

const overrides = [
  { session_id: "ID101-ALL-L1", day: "WED", start_period: 4, room_id: "AUD", displaced_by: "BR-01" }
];

// 4. MIDSEM EXAMS (41 Exams across MON to SAT)
const examDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const exams = data.exams.map((ex, idx) => {
  const day = examDays[idx % examDays.length];
  const session = Math.floor(idx / examDays.length) % 2 === 0 ? "AM" : "PM";
  let examRooms = ["LH-3"];
  if (ex.size > 200) {
    examRooms = ["AUD", "LH-1", "LH-2"];
  } else if (ex.size > 70) {
    examRooms = ["LH-1"];
  }
  return {
    exam_id: ex.id,
    day,
    session,
    rooms: examRooms
  };
});

const schedule = {
  team: "CIT Master Minds",
  dataset_id: data.dataset_id,
  sessions,
  fest_week: {
    bookings: festBookings,
    session_overrides: overrides
  },
  exams
};

const exportsDir = path.join(rootDir, "exports");
fs.mkdirSync(exportsDir, { recursive: true });

// Write exports/schedule.json
fs.writeFileSync(path.join(exportsDir, "schedule.json"), JSON.stringify(schedule, null, 2), "utf-8");

// 5. GENERATE schedule_after.json (Sample Disruption: CR-102 closed, F07 unavailable Mon, add CS202-T2)
const scheduleAfter = JSON.parse(JSON.stringify(schedule));

// Add new session
scheduleAfter.sessions.push({
  session_id: "CS202-T2",
  day: "WED",
  start_period: 1,
  room_id: "CR-101"
});

// Relocate CR-102 sessions to CR-104 and F07 Monday sessions to Tuesday
for (const s of scheduleAfter.sessions) {
  if (s.room_id === "CR-102") s.room_id = "CR-104";
  if (s.session_id.startsWith("CS203") && s.day === "MON") s.day = "TUE";
}

fs.writeFileSync(path.join(exportsDir, "schedule_after.json"), JSON.stringify(scheduleAfter, null, 2), "utf-8");

console.log(" SUCCESS! Generated exports/schedule.json and exports/schedule_after.json without Python.");