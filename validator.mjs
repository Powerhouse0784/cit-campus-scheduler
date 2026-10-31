#!/usr/bin/env node
import fs from "fs";
import path from "path";

const CAT_WEIGHT = { institute_event: 5, guest_lecture: 4, department_event: 3, club_event: 2 };
const MAX_PERIOD = 13;
const LAST_TEACHING = 9;

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function applyDisruption(data, dis) {
  const d = JSON.parse(JSON.stringify(data));
  const fac = new Map(d.faculty.map(f => [f.id, f]));
  for (const ch of dis.changes || []) {
    const t = ch.type;
    if (t === "faculty_unavailable") {
      for (const day of ch.days) {
        fac.get(ch.faculty_id).unavailable.push({ day, periods: ch.periods, reason: ch.reason || "" });
      }
    } else if (t === "room_unavailable") {
      for (const day of ch.days) {
        d.room_unavailability.push({ room_id: ch.room_id, day, periods: ch.periods, reason: ch.reason || "" });
      }
    } else if (t === "add_faculty") {
      d.faculty.push(ch.faculty);
      fac.set(ch.faculty.id, ch.faculty);
    } else if (t === "add_session") {
      d.sessions.push(ch.session);
    } else if (t === "remove_session") {
      d.sessions = d.sessions.filter(s => s.id !== ch.session_id);
    }
  }
  return d;
}

function effectiveCategory(data, req) {
  const order = data.priority_order;
  const cap = data.role_category_cap[req.role] || "club_event";
  const a = order.includes(req.requested_category) ? order.indexOf(req.requested_category) : order.length - 1;
  return order[Math.max(a, order.indexOf(cap))];
}

function outranks(data, r1, r2) {
  const order = data.priority_order;
  const c1 = order.indexOf(effectiveCategory(data, r1));
  const c2 = order.indexOf(effectiveCategory(data, r2));
  if (c1 !== c2) return c1 < c2;
  return r1.submitted_at < r2.submitted_at;
}

class Ctx {
  constructor(data) {
    this.data = data;
    this.days = data.calendar.days;
    this.lab_starts = new Set(data.calendar.lab_start_periods);
    this.lunch = data.calendar.lunch.after_period;
    this.rooms = new Map(data.rooms.map(r => [r.id, r]));
    this.fac = new Map(data.faculty.map(f => [f.id, f]));
    this.groups = new Map(data.student_groups.map(g => [g.id, g]));
    this.sessions = new Map(data.sessions.map(s => [s.id, s]));
    this.req = new Map(data.booking_requests.map(b => [b.id, b]));
    this.cancelled = new Set((data.cancellations || []).map(c => c.request_id));

    this.fac_un = new Set();
    for (const f of data.faculty) {
      for (const u of f.unavailable || []) {
        for (const p of u.periods) {
          this.fac_un.add(`${f.id}:${u.day}:${p}`);
        }
      }
    }

    this.room_un = new Set();
    for (const u of data.room_unavailability || []) {
      for (const p of u.periods) {
        this.room_un.add(`${u.room_id}:${u.day}:${p}`);
      }
    }
  }
}

function block(start, dur) {
  return Array.from({ length: dur }, (_, i) => start + i);
}

function checkTimetable(ctx, assign, label) {
  const V = [];
  const v = (rule, msg) => V.push({ rule, where: label, detail: msg });

  const room_occ = new Map();
  const fac_occ = new Map();
  const grp_occ = new Map();
  const fac_day = new Map();
  const basket_time = new Map();

  for (const [sid] of ctx.sessions) {
    if (!assign.has(sid)) v("H1", `Session ${sid} is not scheduled`);
  }

  for (const [sid, [day, start, rid]] of assign) {
    const s = ctx.sessions.get(sid);
    if (!s) { v("H1", `Unknown session id ${sid}`); continue; }
    if (!ctx.days.includes(day)) { v("H1", `${sid}: invalid day ${day}`); continue; }
    if (typeof start !== "number" || start < 1 || start + s.duration - 1 > LAST_TEACHING) {
      v("H9", `${sid}: start period ${start} with duration ${s.duration} runs outside P1-P9`);
      continue;
    }
    const r = ctx.rooms.get(rid);
    if (!r) { v("H1", `${sid}: unknown room ${rid}`); continue; }

    const per = block(start, s.duration);
    if (per[0] <= ctx.lunch && ctx.lunch < per[per.length - 1]) {
      v("H9", `${sid}: crosses lunch (${day} P${per[0]}-P${per[per.length - 1]})`);
    }
    if (s.kind === "lab" && !ctx.lab_starts.has(start)) {
      v("H9", `${sid}: lab must start at P2 or P6, starts at P${start}`);
    }
    const fx = s.fixed_slot;
    if (fx && (fx.day !== day || fx.start_period !== start)) {
      v("H14", `${sid}: fixed at ${fx.day} P${fx.start_period}, placed at ${day} P${start}`);
    }
    if (r.capacity < s.size) {
      v("H5", `${sid}: size ${s.size} > ${rid} capacity ${r.capacity}`);
    }
    if (!s.room_types.includes(r.type)) {
      v("H6", `${sid}: needs ${s.room_types.join(",")}, ${rid} is ${r.type}`);
    }
    if (s.needs_accessible && !r.accessible) {
      v("H10", `${sid}: needs an accessible room, ${rid} is not`);
    }

    const f = s.faculty_id;
    for (const p of per) {
      const rKey = `${rid}:${day}:${p}`;
      const fKey = `${f}:${day}:${p}`;
      room_occ.set(rKey, [...(room_occ.get(rKey) || []), sid]);
      fac_occ.set(fKey, [...(fac_occ.get(fKey) || []), sid]);

      const key = s.basket_slot || sid;
      for (const g of s.groups) {
        const gKey = `${g}:${day}:${p}`;
        const current = grp_occ.get(gKey) || new Set();
        current.add(key);
        grp_occ.set(gKey, current);
      }

      if (ctx.fac_un.has(`${f}:${day}:${p}`)) v("H7", `${sid}: ${f} unavailable ${day} P${p}`);
      if (ctx.room_un.has(`${rid}:${day}:${p}`)) v("H8", `${sid}: ${rid} unavailable ${day} P${p}`);
    }

    const fdKey = `${f}:${day}`;
    fac_day.set(fdKey, (fac_day.get(fdKey) || 0) + s.duration);

    if (s.basket_slot) {
      const bt = basket_time.get(s.basket_slot) || new Set();
      bt.add(`${day}:${start}`);
      basket_time.set(s.basket_slot, bt);
    }
  }

  for (const [k, sids] of room_occ) {
    if (sids.length > 1) v("H4", `${k.split(":")[0]} double-booked ${k.split(":")[1]} P${k.split(":")[2]}: ${sids.sort().join(", ")}`);
  }
  for (const [k, sids] of fac_occ) {
    if (sids.length > 1) v("H2", `${k.split(":")[0]} double-booked ${k.split(":")[1]} P${k.split(":")[2]}: ${sids.sort().join(", ")}`);
  }
  for (const [k, keys] of grp_occ) {
    if (keys.size > 1) v("H3", `Group ${k.split(":")[0]} double-booked ${k.split(":")[1]} P${k.split(":")[2]}: ${Array.from(keys).sort().join(", ")}`);
  }
  for (const [b, times] of basket_time) {
    if (times.size > 1) v("H11", `Basket ${b} sessions are not at the same time: ${Array.from(times).sort().join(", ")}`);
  }
  for (const [k, h] of fac_day) {
    const fId = k.split(":")[0];
    const mx = ctx.fac.get(fId)?.max_hours_per_day || 4;
    if (h > mx) v("H12", `${fId} teaches ${h} hours on ${k.split(":")[1]} (max ${mx})`);
  }

  return { V, grp_occ };
}

function softScore(ctx, assign) {
  const pen = { S1: 0, S2: 0, S3: 0, S4: 0, S5: 0, S6: 0 };
  const grp_day = new Map();
  const grp_hours = new Map();
  const grp_course = new Map();
  const seen_basket = new Set();

  for (const [sid, [day, start, rid]] of assign) {
    const s = ctx.sessions.get(sid);
    const r = ctx.rooms.get(rid);
    if (!s || !r) continue;

    const per = block(start, s.duration);
    for (const pref of ctx.fac.get(s.faculty_id)?.preferences || []) {
      if (pref.type === "avoid" && (pref.days || ctx.days).includes(day)) {
        pen.S1 += 2 * per.filter(p => pref.periods.includes(p)).length;
      }
    }
    if (r.capacity && s.size / r.capacity < 0.4) pen.S5 += 1;
    if (per.includes(LAST_TEACHING)) pen.S6 += 1;

    for (const g of s.groups) {
      const gdKey = `${g}:${day}`;
      const existingPs = grp_day.get(gdKey) || new Set();
      per.forEach(p => existingPs.add(p));
      grp_day.set(gdKey, existingPs);

      if (s.basket_slot) {
        if (!seen_basket.has(`${g}:${s.basket_slot}`)) {
          seen_basket.add(`${g}:${s.basket_slot}`);
          grp_hours.set(gdKey, (grp_hours.get(gdKey) || 0) + s.duration);
        }
      } else {
        grp_hours.set(gdKey, (grp_hours.get(gdKey) || 0) + s.duration);
      }

      if (s.kind === "lecture" && !s.basket_slot) {
        const gcKey = `${g}:${day}:${s.course_id}`;
        grp_course.set(gcKey, (grp_course.get(gcKey) || 0) + 1);
      }
    }
  }

  for (const [, ps] of grp_day) {
    const arr = Array.from(ps);
    const minP = Math.min(...arr);
    const maxP = Math.max(...arr);
    for (let p = minP; p <= maxP; p++) {
      if (!ps.has(p)) pen.S2 += 1;
    }
  }
  for (const [, h] of grp_hours) {
    if (h > 6) pen.S3 += 3 * (h - 6);
  }
  for (const [, c] of grp_course) {
    if (c > 1) pen.S4 += 3 * (c - 1);
  }

  const total = Object.values(pen).reduce((a, b) => a + b, 0);
  return { pen, total };
}

function checkBookings(ctx, base, fest) {
  const V = [];
  const W = [];
  const data = ctx.data;
  const overrides = fest.session_overrides || [];
  const decisions = fest.bookings || [];
  const dec_by = new Map();

  for (const d of decisions) {
    if (dec_by.has(d.request_id)) V.push({ rule: "B1", where: "fest_week", detail: `Two decisions for ${d.request_id}` });
    dec_by.set(d.request_id, d);
  }

  const week = new Map(base);
  for (const o of overrides) {
    const sid = o.session_id;
    if (!ctx.sessions.has(sid)) {
      V.push({ rule: "B2", where: "fest_week", detail: `Override for unknown session ${sid}` });
      continue;
    }
    const disp = dec_by.get(o.displaced_by);
    const req = ctx.req.get(o.displaced_by);
    if (!req || !disp || disp.status !== "approved") {
      V.push({ rule: "B2", where: "fest_week", detail: `Override of ${sid} names ${o.displaced_by}, which is not an approved booking` });
    } else if (data.priority_order.indexOf(effectiveCategory(data, req)) > data.priority_order.indexOf("institute_event")) {
      V.push({ rule: "B2", where: "fest_week", detail: `${o.displaced_by} is not allowed to displace a regular session` });
    }
    week.set(sid, [o.day, o.start_period, o.room_id]);
  }

  const { V: wv, grp_occ: wgrp } = checkTimetable(ctx, week, "fest_week");
  V.push(...wv);

  const room_busy = new Map();
  for (const [sid, [day, start, rid]] of week) {
    const s = ctx.sessions.get(sid);
    if (s) {
      for (const p of block(start, s.duration)) {
        const key = `${rid}:${day}:${p}`;
        room_busy.set(key, [...(room_busy.get(key) || []), sid]);
      }
    }
  }

  let score = 0.0;
  let max_score = 0;
  for (const [rid_, req] of ctx.req) {
    if (!ctx.cancelled.has(rid_)) {
      max_score += CAT_WEIGHT[effectiveCategory(data, req)];
    }
  }

  const placed = new Map();
  for (const [req_id, req] of ctx.req) {
    const d = dec_by.get(req_id);
    if (!d) { W.push(`No decision for ${req_id}`); continue; }
    const st = d.status;

    if (ctx.cancelled.has(req_id)) {
      if (st === "approved" || st === "alternative_offered") {
        V.push({ rule: "B3", where: "fest_week", detail: `${req_id} was cancelled but is ${st}` });
      }
      continue;
    }
    if (!["approved", "rejected", "alternative_offered"].includes(st)) {
      V.push({ rule: "B1", where: "fest_week", detail: `${req_id}: unknown status ${st}` });
      continue;
    }
    if (st === "rejected") continue;

    let ok = true;
    const bad = (msg) => { ok = false; V.push({ rule: "H13", where: "fest_week", detail: `${req_id}: ${msg}` }); };

    const room = ctx.rooms.get(d.room_id);
    const day = d.day;
    const a = d.start_period;
    const b = d.end_period;

    if (!room) { bad(`unknown room ${d.room_id}`); continue; }
    if (!ctx.days.includes(day) || typeof a !== "number" || typeof b !== "number" || a < 1 || b > MAX_PERIOD || b < a) {
      bad(`invalid time ${day} P${a}-P${b}`); continue;
    }
    if (b - a + 1 !== req.duration_periods) {
      bad(`booked ${b - a + 1} periods, request needs ${req.duration_periods}`);
    }
    if (!room.allowed_uses.includes("event")) bad(`${room.id} cannot host events`);
    if (!req.room_types.includes(room.type)) bad(`${room.id} is not one of ${req.room_types}`);
    if (room.capacity < req.attendance) bad(`${room.id} seats ${room.capacity}, needs ${req.attendance}`);

    const feats = new Set(room.features);
    if (room.accessible) feats.add("accessible");
    for (const need of req.needs) {
      if (!feats.has(need)) bad(`${room.id} lacks ${need}`);
    }

    if (st === "approved") {
      const inside = req.windows.some(w => w.day === day && w.from_period <= a && b <= w.to_period);
      if (!inside) bad(`approved at ${day} P${a}-P${b}, outside requested windows`);
    }

    for (let p = a; p <= b; p++) {
      if (ctx.room_un.has(`${room.id}:${day}:${p}`)) bad(`${room.id} unavailable ${day} P${p}`);
      const busyList = room_busy.get(`${room.id}:${day}:${p}`);
      if (busyList && busyList.length > 0) bad(`${room.id} ${day} P${p} already used by ${busyList.join(", ")}`);
      for (const g of req.mandatory_for_groups) {
        if (wgrp.has(`${g}:${day}:${p}`)) bad(`mandatory for ${g}, who have class ${day} P${p}`);
      }
    }

    if (ok) {
      for (let p = a; p <= b; p++) {
        const key = `${room.id}:${day}:${p}`;
        room_busy.set(key, [...(room_busy.get(key) || []), req_id]);
      }
      placed.set(req_id, [room.id, day, a, b]);
      score += CAT_WEIGHT[effectiveCategory(data, req)] * (st === "approved" ? 1 : 0.5);
    }
  }

  return {
    V,
    W,
    bstats: {
      booking_score: score,
      booking_score_max: max_score,
      approved: decisions.filter(x => x.status === "approved").length,
      alternatives: decisions.filter(x => x.status === "alternative_offered").length,
      rejected: decisions.filter(x => x.status === "rejected").length,
      session_overrides: overrides.length,
      priority_inversions: []
    }
  };
}

function checkExams(ctx, exams_out) {
  const data = ctx.data;
  const V = [];
  let pen = 0;
  const ex = new Map((data.exams || []).map(e => [e.id, e]));
  const cal = data.calendar.exam_week;
  const sess_ids = new Set(cal.sessions.map(s => s.id));
  const room_use = new Map();
  const grp_use = new Map();
  const grp_day = new Map();
  const seen = new Set();

  for (const e of exams_out) {
    const eid = e.exam_id;
    if (!ex.has(eid)) { V.push({ rule: "E1", where: "exams", detail: `Unknown exam ${eid}` }); continue; }
    if (seen.has(eid)) V.push({ rule: "E1", where: "exams", detail: `${eid} scheduled twice` });
    seen.add(eid);

    if (!cal.days.includes(e.day) || !sess_ids.has(e.session)) {
      V.push({ rule: "E1", where: "exams", detail: `${eid}: invalid slot` });
      continue;
    }

    let seats = 0;
    for (const rid of e.rooms || []) {
      const r = ctx.rooms.get(rid);
      if (!r || !r.allowed_uses.includes("exam")) {
        V.push({ rule: "E2", where: "exams", detail: `${eid}: ${rid} cannot host exams` });
        continue;
      }
      seats += Math.floor(r.capacity / 2);
      const key = `${rid}:${e.day}:${e.session}`;
      room_use.set(key, [...(room_use.get(key) || []), eid]);
    }

    if (seats < ex.get(eid).size) {
      V.push({ rule: "H5", where: "exams", detail: `${eid}: ${seats} seats at half capacity for ${ex.get(eid).size} students` });
    }

    for (const g of ex.get(eid).groups) {
      const gSlot = `${g}:${e.day}:${e.session}`;
      const gDay = `${g}:${e.day}`;
      grp_use.set(gSlot, [...(grp_use.get(gSlot) || []), eid]);
      const existing = grp_day.get(gDay) || new Set();
      existing.add(eid);
      grp_day.set(gDay, existing);
    }
  }

  for (const [eid] of ex) {
    if (!seen.has(eid)) V.push({ rule: "E1", where: "exams", detail: `${eid} not scheduled` });
  }

  for (const [k, v] of room_use) {
    if (v.length > 1) V.push({ rule: "H4", where: "exams", detail: `${k.split(":")[0]} has ${v.join(", ")} in ${k.split(":")[1]} ${k.split(":")[2]}` });
  }
  for (const [k, v] of grp_use) {
    if (v.length > 1) V.push({ rule: "H3", where: "exams", detail: `Group ${k.split(":")[0]} has ${v.join(", ")} in ${k.split(":")[1]} ${k.split(":")[2]}` });
  }
  for (const [, v] of grp_day) {
    if (v.size > 1) pen += 5 * (v.size - 1);
  }

  return { V, pen };
}

function toAssign(sched) {
  const out = new Map();
  const dup = [];
  for (const e of sched.sessions || []) {
    if (out.has(e.session_id)) dup.push(e.session_id);
    out.set(e.session_id, [e.day, e.start_period, e.room_id]);
  }
  return { out, dup };
}

function run(data, sched, baseline = null) {
  const ctx = new Ctx(data);
  const { out: assign, dup } = toAssign(sched);

  let { V } = checkTimetable(ctx, assign, "timetable");
  for (const d of dup) V.push({ rule: "H1", where: "timetable", detail: `Session ${d} appears more than once` });

  const { pen: soft, total } = softScore(ctx, assign);
  let W = [];
  let bstats = null;

  if (sched.fest_week) {
    const { V: bv, W: bw, bstats: bs } = checkBookings(ctx, assign, sched.fest_week);
    V.push(...bv);
    W.push(...bw);
    bstats = bs;
  }

  let epen = 0;
  if (data.exams && (!baseline || sched.exams)) {
    const { V: ev, pen } = checkExams(ctx, sched.exams || []);
    V.push(...ev);
    epen = pen;
  }

  let stability = null;
  if (baseline) {
    const { out: b } = toAssign(baseline);
    const moved = [];
    for (const [sid, val] of assign) {
      if (b.has(sid) && ctx.sessions.has(sid)) {
        const bVal = b.get(sid);
        if (val[0] !== bVal[0] || val[1] !== bVal[1] || val[2] !== bVal[2]) {
          moved.push(sid);
        }
      }
    }
    stability = {
      sessions_moved: moved.length,
      time_changed: moved.filter(s => assign.get(s)[0] !== b.get(s)[0] || assign.get(s)[1] !== b.get(s)[1]).length,
      room_only_changed: moved.filter(s => assign.get(s)[0] === b.get(s)[0] && assign.get(s)[1] === b.get(s)[1]).length,
      moved_ids: moved.sort()
    };
  }

  // Deduplicate
  const seenK = new Set();
  const uniqV = [];
  for (const x of V) {
    const k = `${x.rule}:${x.detail}`;
    if (!seenK.has(k)) { seenK.add(k); uniqV.push(x); }
  }

  return {
    dataset_id: data.dataset_id,
    schedule_dataset_id: sched.dataset_id,
    team: sched.team,
    hard_violation_count: uniqV.length,
    hard_violations: uniqV,
    soft_total: total,
    soft_penalties: soft,
    bookings: bstats,
    exam_soft_penalty: epen,
    stability,
    warnings: W
  };
}

// CLI Execution
const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const dataFile = getArg("--data");
const schedFile = getArg("--schedule");
const disFile = getArg("--disruption");
const baseFile = getArg("--baseline");

if (!dataFile || !schedFile) {
  console.log("Usage: node validator.mjs --data data/cit_public.json --schedule exports/schedule.json");
  process.exit(1);
}

let data = load(dataFile);
if (disFile) data = applyDisruption(data, load(disFile));
const sched = load(schedFile);
const base = baseFile ? load(baseFile) : null;

const rep = run(data, sched, base);

console.log(`\n==================================================`);
console.log(`Dataset: ${rep.dataset_id}   Schedule: ${rep.schedule_dataset_id}   Team: ${rep.team}`);
console.log(`--------------------------------------------------`);
console.log(`Hard violations: ${rep.hard_violation_count}`);
if (rep.hard_violations.length > 0) {
  for (const x of rep.hard_violations.slice(0, 20)) {
    console.log(`  ❌ [${x.rule}] (${x.where}) ${x.detail}`);
  }
} else {
  console.log(`  🎉 ZERO HARD VIOLATIONS! Perfect score.`);
}
console.log(`Soft penalty: ${rep.soft_total}`);
if (rep.bookings) {
  console.log(`Bookings: score ${rep.bookings.booking_score} | approved ${rep.bookings.approved}, alternatives ${rep.bookings.alternatives}, rejected ${rep.bookings.rejected}`);
}
if (rep.stability) {
  console.log(`Stability: ${rep.stability.sessions_moved} sessions moved (${rep.stability.time_changed} changed time, ${rep.stability.room_only_changed} room only)`);
}
console.log(`==================================================\n`);