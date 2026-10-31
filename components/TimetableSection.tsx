"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Building2,
  DoorOpen,
  Users,
  UserRound,
  Zap,
  ArrowRight,
  Star,
  HelpCircle,
} from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import ExplainModal from "@/components/ExplainModal";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
type Dimension = "group" | "faculty" | "room";
type Tone = "blue" | "violet" | "green" | "amber" | "rose" | "cyan";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** P1-P5 before lunch, P6-P9 after (lunch is 13:00-14:00). */
const PERIODS = [
  { p: 1, start: "08:00", end: "09:00" },
  { p: 2, start: "09:00", end: "10:00" },
  { p: 3, start: "10:00", end: "11:00" },
  { p: 4, start: "11:00", end: "12:00" },
  { p: 5, start: "12:00", end: "13:00" },
  { p: 6, start: "14:00", end: "15:00" },
  { p: 7, start: "15:00", end: "16:00" },
  { p: 8, start: "16:00", end: "17:00" },
  { p: 9, start: "17:00", end: "18:00" },
];

const TONES: Tone[] = ["blue", "violet", "green", "amber", "rose", "cyan"];
const LUNCH_ROW = 7; // grid row of the lunch strip (row 1 is the day header)

const DEFAULT_ENTITY: Record<Dimension, string> = { group: "CSE-2", faculty: "F01", room: "LH-1" };

/** Same course -> same colour, everywhere. */
function toneFor(courseId: string): Tone {
  let h = 0;
  for (let i = 0; i < courseId.length; i++) h = (h * 31 + courseId.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** Grid row for a period (row 1 is the day header, row 7 is lunch). */
const rowOf = (p: number) => (p <= 5 ? p + 1 : p + 2);

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

/** "03 – 07 Nov", or "30 Nov – 04 Dec" when the range crosses a month. */
const fmtRange = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth()
    ? `${String(a.getDate()).padStart(2, "0")} – ${fmtDay(b)}`
    : `${fmtDay(a)} – ${fmtDay(b)}`;

/** Monday of the shown week. Weekends roll forward to the coming week. */
function mondayOf(base: Date, weekOffset: number) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun
  const diff = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  d.setDate(d.getDate() + diff + weekOffset * 7);
  return d;
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

interface TimetableSectionProps {
  isDark?: boolean;
  searchQuery?: string;
  onNavigateTab?: (tab: string) => void;
}

interface Placed {
  dayIndex: number;
  startPeriod: number;
  span: number;
  extra: number;
  session: any;
}

/* ------------------------------------------------------------------ */
/* Week picker                                                         */
/* ------------------------------------------------------------------ */
function WeekPicker({
  offset,
  setOffset,
  rangeLabel,
}: {
  offset: number;
  setOffset: (n: number) => void;
  rangeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = offset === 0 ? "This Week" : offset === -1 ? "Previous Week" : offset === 1 ? "Next Week" : rangeLabel;
  const options = [
    { value: -1, label: "Previous Week" },
    { value: 0, label: "This Week" },
    { value: 1, label: "Next Week" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-11 px-4 rounded-full border flex items-center gap-2.5 text-[13.5px] font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)", boxShadow: "var(--pill-shadow)" }}
      >
        <CalendarDays className="w-[17px] h-[17px] text-[var(--brand-700)]" />
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-48 rounded-2xl border bg-[var(--surface)] p-1.5 z-30"
          style={{ borderColor: "var(--border)", boxShadow: "0 18px 48px rgba(15,35,85,.22)" }}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={offset === o.value}>
              <button
                onClick={() => {
                  setOffset(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-semibold transition ${
                  offset === o.value ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "hover:bg-[var(--row-hover)]"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Course chip                                                         */
/* ------------------------------------------------------------------ */
function CourseChip({
  s,
  extra,
  dimension,
  dim,
  highlighted,
  ariaWhen,
  compact = false,
  onExplainSlot,
}: {
  s: any;
  extra: number;
  dimension: Dimension;
  dim: boolean;
  highlighted: boolean;
  ariaWhen: string;
  compact?: boolean;
  onExplainSlot?: () => void;
}) {
  const tone = toneFor(s.course_id);
  const groups = (s.groups || []).join(", ");
  const third = dimension === "faculty" ? `${s.room_id} · ${groups}` : dimension === "room" ? groups : s.room_id;

  return (
    <div
      tabIndex={0}
      aria-label={`${s.course_title}, ${s.course_id}, ${s.room_name || s.room_id}, ${s.faculty_name}, ${ariaWhen}`}
      title={`${s.course_title} (${s.course_id})\n${s.faculty_name}\n${s.room_name || s.room_id}\n${groups}`}
      className={`chip chip-${tone} h-full w-full ${compact ? "px-3 py-2.5" : "px-3 py-2"} flex flex-col justify-center text-left leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 relative group ${
        dim ? "opacity-25" : ""
      } ${highlighted ? "ring-2 ring-blue-500 shadow-lg" : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className={`font-bold ${compact ? "text-[14px]" : "text-[12.5px]"} truncate`}>{s.course_title}</div>
        {onExplainSlot && (
          <button
            type="button"
            title="Why this slot? (Constraint allocation proof)"
            onClick={(e) => {
              e.stopPropagation();
              onExplainSlot();
            }}
            className="opacity-0 group-hover:opacity-100 hover:scale-110 transition p-0.5 rounded text-[var(--ink)]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className={`${compact ? "text-[12px]" : "text-[11px]"} opacity-70 truncate`}>({s.course_id})</div>
      <div className={`${compact ? "text-[12px]" : "text-[11px]"} font-semibold opacity-85 truncate`}>
        {third}
        {extra > 0 && (
          <span className="ml-1.5 px-1.5 py-px rounded-full bg-black/10 dark:bg-white/15 text-[10px]">+{extra}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick info panel                                                    */
/* ------------------------------------------------------------------ */
function Donut({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-[68px] h-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--brand-100)" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--brand-600)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(Math.min(percent, 100) / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold font-heading">
        {percent}%
      </span>
    </div>
  );
}

function CrowdSilhouette() {
  const heads = [8, 22, 36, 50, 64, 78, 92, 106, 120, 134, 148, 162, 176, 190, 204, 218, 232, 246];
  return (
    <svg
      viewBox="0 0 260 44"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 w-full h-10 opacity-60"
      aria-hidden="true"
    >
      <g fill="#0B0F3A">
        {heads.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={26 - (i % 3) * 3} r="5" />
            <rect x={x - 7} y={30 - (i % 3) * 3} width="14" height="20" rx="6" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function QuickInfo({
  nextClass,
  midsemRange,
  stats,
  onShowNext,
  onNavigateTab,
}: {
  nextClass: { title: string; when: string } | null;
  midsemRange: string;
  stats: any;
  onShowNext: () => void;
  onNavigateTab?: (tab: string) => void;
}) {
  const tile = "rounded-2xl border p-3.5 flex items-center gap-3";
  const tileStyle = { background: "var(--surface)", borderColor: "var(--border)" };

  return (
    <aside className="space-y-3" aria-label="Quick info">
      <div
        className="rounded-[22px] border p-4 space-y-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 px-1 font-heading font-extrabold text-[17px]">
          <Zap className="w-[18px] h-[18px] text-amber-500 fill-amber-500" />
          Quick Info
        </div>

        {/* Next class */}
        <div className={tile} style={tileStyle}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]">
            <CalendarCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[12px] text-[var(--muted)] font-medium">Next Class</div>
            {nextClass ? (
              <>
                <div className="text-[13.5px] font-extrabold truncate">{nextClass.title}</div>
                <div className="text-[11.5px] text-[var(--muted)] font-medium truncate">{nextClass.when}</div>
              </>
            ) : (
              <div className="text-[12.5px] font-semibold mt-0.5">No upcoming classes</div>
            )}
          </div>
          {nextClass && (
            <button
              onClick={onShowNext}
              aria-label="Show next class in timetable"
              className="w-8 h-8 rounded-full bg-[var(--brand-600)] text-white flex items-center justify-center shrink-0 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Midsem */}
        <div className={tile} style={tileStyle}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[var(--qa-lilac-bg)] text-violet-600 dark:text-violet-300 border border-[var(--qa-lilac-border)]">
            <ClipboardCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[13.5px] font-extrabold">Midsem Exams</div>
            <div className="text-[12px] text-[var(--muted)] font-semibold">Next Week</div>
            <div className="text-[11.5px] text-[var(--muted)] font-medium">{midsemRange && `(${midsemRange})`}</div>
          </div>
          <button
            onClick={() => onNavigateTab?.("exams")}
            aria-label="Open exams"
            className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Room utilisation */}
        <div className="rounded-2xl border p-3.5" style={tileStyle}>
          <div className="flex items-center gap-2 text-[13px] font-extrabold mb-2.5">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Room Utilisation
          </div>
          {stats ? (
            <div className="flex items-center gap-3.5">
              <Donut percent={stats.percent} />
              <div className="leading-tight min-w-0">
                <div className="text-[12px] text-[var(--muted)] font-medium">Rooms in Use</div>
                <div className="text-[15px] font-extrabold font-heading">
                  {stats.roomsUsed} / {stats.roomsTotal}
                </div>
                <div className="text-[11px] text-[var(--muted)] font-medium mt-0.5">
                  {stats.bookedHours} of {stats.availableHours} room-hours booked
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-[var(--muted)]">Loading…</div>
          )}
        </div>
      </div>

      {/* Spectra card */}
      <div
        className="relative overflow-hidden rounded-[20px] p-4 text-white min-h-[128px]"
        style={{
          background: "linear-gradient(125deg,#141B63 0%,#2A2C92 48%,#5B3FB8 100%)",
          boxShadow: "0 14px 32px rgba(40,40,140,.35)",
        }}
      >
        <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full opacity-50" aria-hidden="true">
          <g fill="#FDE68A">
            <circle cx="150" cy="22" r="1.6" />
            <circle cx="176" cy="40" r="1.2" />
            <circle cx="120" cy="14" r="1" />
            <circle cx="188" cy="12" r="1.4" />
            <circle cx="90" cy="30" r="0.9" />
          </g>
        </svg>
        <CrowdSilhouette />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            <span className="font-heading font-extrabold text-[19px] tracking-tight">Spectra 2K26</span>
          </div>
          <div className="mt-0.5 text-[12px] font-medium text-white/85">Tech Fest · Book Your Venue</div>
          <button
            onClick={() => onNavigateTab?.("spectra")}
            className="mt-3 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white/10 border border-white/40 text-[12px] font-bold hover:bg-white/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Timetable screen                                                    */
/* ------------------------------------------------------------------ */
export default function TimetableSection({ isDark = false, searchQuery = "", onNavigateTab }: TimetableSectionProps) {
  const [dimension, setDimension] = useState<Dimension>("group");
  const [entities, setEntities] = useState<Record<Dimension, string>>(DEFAULT_ENTITY);
  const [metadata, setMetadata] = useState<any>({ student_groups: [], faculty: [], rooms: [] });
  const [grid, setGrid] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const [now, setNow] = useState<Date | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileDay, setMobileDay] = useState(0);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [explainQuery, setExplainQuery] = useState<{ type: "booking_rejected" | "why_slot"; id: string } | null>(null);

  const entity = entities[dimension];

  /* Clock: set after mount (avoids server/client date mismatch), refresh each minute. */
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  /* Start the mobile view on today (weekdays only). */
  useEffect(() => {
    const dow = new Date().getDay();
    if (dow >= 1 && dow <= 5) setMobileDay(dow - 1);
  }, []);

  /* Load the schedule for the selected group / faculty / room. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const qs = `${dimension}=${encodeURIComponent(entity)}`;
        const res = await fetch(`/api/cit/timetable?${qs}`);
        if (!res.ok) throw new Error("bad response");
        const json = await res.json();
        if (cancelled) return;
        setGrid(json.grid);
        if (json.metadata) setMetadata(json.metadata);
        if (json.stats) setStats(json.stats);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dimension, entity, reloadKey]);

  useEffect(() => {
    if (!highlight) return;
    const id = setTimeout(() => setHighlight(null), 3000);
    return () => clearTimeout(id);
  }, [highlight]);

  /* Dates */
  const monday = useMemo(() => (now ? mondayOf(now, weekOffset) : null), [now, weekOffset]);
  const dayDate = (i: number) => (monday ? addDays(monday, i) : null);
  const todayIndex = useMemo(() => {
    if (!now || !monday) return -1;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((today.getTime() - monday.getTime()) / 86400000);
    return diff >= 0 && diff <= 4 ? diff : -1;
  }, [now, monday]);
  const rangeLabel = monday ? fmtRange(monday, addDays(monday, 4)) : "";
  const midsemRange = now ? fmtRange(addDays(mondayOf(now, 0), 7), addDays(mondayOf(now, 0), 11)) : "";

  /* Merge multi-period sessions (labs) into single tall cells. */
  const { placed, covered } = useMemo(() => {
    const placed: Placed[] = [];
    const covered = new Set<string>();
    if (!grid) return { placed, covered };
    DAYS.forEach((d, dayIndex) => {
      for (let p = 1; p <= 9; p++) {
        const cell: any[] = grid?.[d]?.[p] || [];
        if (cell.length === 0) continue;
        const first = cell[0];
        if (first.start_period < p) continue; // continuation of a session drawn earlier
        const span = Math.max(1, first.duration || 1);
        for (let k = 0; k < span; k++) covered.add(`${dayIndex}-${p + k}`);
        placed.push({ dayIndex, startPeriod: p, span, extra: cell.length - 1, session: first });
      }
    });
    return { placed, covered };
  }, [grid]);

  const q = searchQuery.trim().toLowerCase();
  const matches = (s: any) =>
    !q ||
    [s.course_title, s.course_id, s.room_id, s.room_name, s.faculty_name, ...(s.groups || [])]
      .filter(Boolean)
      .some((v: string) => String(v).toLowerCase().includes(q));

  /* Next class for the quick info card. */
  const nextClass = useMemo(() => {
    if (!placed.length) return null;
    const sorted = [...placed].sort((a, b) => a.dayIndex - b.dayIndex || a.startPeriod - b.startPeriod);
    const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0;
    const live = !!now && weekOffset === 0;
    const endOf = (x: Placed) => toMinutes(PERIODS[x.startPeriod + x.span - 2].end);

    let upcoming: Placed | undefined;
    if (live) {
      upcoming = sorted.find((x) => {
        if (todayIndex === -1) return true; // weekend: first class of the coming week
        if (x.dayIndex !== todayIndex) return x.dayIndex > todayIndex;
        return endOf(x) > nowMin;
      });
    }
    if (!upcoming) upcoming = sorted[0];

    const startP = PERIODS[upcoming.startPeriod - 1];
    const endP = PERIODS[upcoming.startPeriod + upcoming.span - 2];
    const isToday = live && upcoming.dayIndex === todayIndex;
    return {
      key: `${upcoming.dayIndex}-${upcoming.startPeriod}`,
      dayIndex: upcoming.dayIndex,
      title: upcoming.session.course_title as string,
      when: `${isToday ? "" : `${DAY_SHORT[upcoming.dayIndex]} · `}${startP.start} – ${endP.end} | ${upcoming.session.room_id}`,
    };
  }, [placed, now, weekOffset, todayIndex]);

  const showNext = () => {
    if (!nextClass) return;
    setMobileDay(nextClass.dayIndex);
    setHighlight(nextClass.key);
  };

  /* Entity picker options */
  const options: { value: string; label: string }[] =
    dimension === "group"
      ? (metadata.student_groups || []).map((g: any) => ({ value: g.id, label: `${g.id} — ${g.name}` }))
      : dimension === "faculty"
      ? (metadata.faculty || []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.department})` }))
      : (metadata.rooms || []).map((r: any) => ({ value: r.id, label: `${r.id} — ${r.name}` }));

  const dimButtons: { id: Dimension; label: string; short: string; Icon: any }[] = [
    { id: "faculty", label: "By Faculty", short: "Faculty", Icon: UserRound },
    { id: "room", label: "By Room", short: "Room", Icon: DoorOpen },
    { id: "group", label: "By Group", short: "Group", Icon: Users },
  ];

  const shiftMobileDay = (delta: number) => {
    let d = mobileDay + delta;
    if (d < 0) {
      d = 4;
      setWeekOffset((w) => w - 1);
    } else if (d > 4) {
      d = 0;
      setWeekOffset((w) => w + 1);
    }
    setMobileDay(d);
  };

  const mobileDate = dayDate(mobileDay);
  const mobileSessions = placed.filter((x) => x.dayIndex === mobileDay).sort((a, b) => a.startPeriod - b.startPeriod);
  const hasAny = placed.length > 0;

  return (
    <div className="space-y-4">
      <HeroBanner
        isDark={isDark}
        title={
          <>
            <span className="block sm:inline">Smart Timetable.</span>{" "}
            <span className="block sm:inline">A Well-Planned Campus.</span>
          </>
        }
        subtitle="No clashes. No confusion. Just a perfect schedule!"
      />

      {/* View controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="h-11 px-5 rounded-full flex items-center gap-2 text-[13.5px] font-bold text-white"
          style={{ background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" }}
          aria-current="true"
        >
          <CalendarDays className="w-[17px] h-[17px]" />
          <span className="hidden sm:inline">Weekly View</span>
          <span className="sm:hidden">Weekly</span>
        </div>

        <div
          role="group"
          aria-label="Timetable view"
          className="h-11 rounded-full border flex items-center p-1 gap-0.5"
          style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)" }}
        >
          {dimButtons.map(({ id, label, short, Icon }) => {
            const active = dimension === id;
            return (
              <button
                key={id}
                onClick={() => setDimension(id)}
                aria-pressed={active}
                className={`h-9 px-3 sm:px-5 rounded-full flex items-center gap-1.5 text-[13px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                  active
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] shadow-[inset_0_0_0_1px_var(--brand-100)]"
                    : "text-[var(--ink)] hover:bg-[var(--row-hover)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 md:ml-auto max-md:w-full">
          <select
            aria-label={`Choose ${dimension}`}
            value={entity}
            onChange={(e) => setEntities((prev) => ({ ...prev, [dimension]: e.target.value }))}
            className="h-11 min-w-0 max-w-full md:max-w-[260px] flex-1 md:flex-none px-4 rounded-full border text-[13px] font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)" }}
          >
            {options.length === 0 && <option value={entity}>{entity}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="hidden md:block">
            <WeekPicker offset={weekOffset} setOffset={setWeekOffset} rangeLabel={rangeLabel} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_276px] gap-4 items-start">
        {/* Grid card */}
        <div
          className="rounded-[22px] border p-3 sm:p-4 min-w-0"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          {status === "loading" && !grid && (
            <div className="py-16 text-center text-sm font-semibold text-[var(--muted)]">Loading your timetable…</div>
          )}

          {status === "error" && (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm font-semibold text-[var(--muted)]">We couldn&apos;t load the timetable. Try again.</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="h-9 px-4 rounded-full bg-[var(--brand-600)] text-white text-[13px] font-bold"
              >
                Try again
              </button>
            </div>
          )}

          {grid && status !== "error" && (
            <div
              className={status === "loading" ? "opacity-60 transition-opacity" : "transition-opacity"}
              aria-busy={status === "loading"}
            >
              {!hasAny && status === "ready" && (
                <div className="py-16 text-center text-sm font-semibold text-[var(--muted)]">
                  No sessions found for these filters.
                </div>
              )}

              {/* Desktop / tablet grid */}
              {hasAny && (
                <div className="hidden md:block overflow-x-auto">
                  <div
                    className="min-w-[780px] grid gap-[6px]"
                    style={{
                      gridTemplateColumns: "120px repeat(5, minmax(0, 1fr))",
                      gridTemplateRows: "auto repeat(5, minmax(74px, auto)) 34px repeat(4, minmax(74px, auto))",
                    }}
                  >
                    <div
                      className="rounded-xl flex items-center justify-center font-heading font-extrabold text-[14px]"
                      style={{ gridRow: 1, gridColumn: 1, background: "var(--brand-50)", minHeight: 56 }}
                    >
                      Time / Day
                    </div>
                    {DAY_SHORT.map((d, i) => {
                      const dt = dayDate(i);
                      const isToday = i === todayIndex;
                      return (
                        <div
                          key={d}
                          className={`rounded-xl flex flex-col items-center justify-center leading-tight ${
                            isToday ? "text-white" : ""
                          }`}
                          style={{
                            gridRow: 1,
                            gridColumn: i + 2,
                            minHeight: 56,
                            background: isToday ? "var(--nav-active-bg)" : "var(--brand-50)",
                          }}
                        >
                          <span className="font-heading font-extrabold text-[14px]">{d}</span>
                          <span className={`text-[12px] font-medium ${isToday ? "text-white/90" : "text-[var(--muted)]"}`}>
                            {dt ? fmtDay(dt) : "\u00A0"}
                          </span>
                        </div>
                      );
                    })}

                    {PERIODS.map(({ p, start, end }) => (
                      <div
                        key={`t-${p}`}
                        className="flex flex-col justify-center pl-2 leading-snug"
                        style={{ gridRow: rowOf(p), gridColumn: 1 }}
                      >
                        <span className="text-[13px] font-extrabold">
                          {start} – {end}
                        </span>
                        <span className="text-[11.5px] font-semibold text-[var(--muted)]">(P{p})</span>
                      </div>
                    ))}

                    {/* Lunch strip */}
                    <div
                      className="rounded-xl flex items-center justify-center text-[11.5px] font-bold tracking-wide text-[var(--muted)] border border-dashed"
                      style={{ gridRow: LUNCH_ROW, gridColumn: "1 / -1", borderColor: "var(--border)" }}
                    >
                      Lunch · 13:00 – 14:00
                    </div>

                    {/* Empty slots */}
                    {DAYS.flatMap((_, di) =>
                      PERIODS.filter(({ p }) => !covered.has(`${di}-${p}`)).map(({ p }) => (
                        <div
                          key={`e-${di}-${p}`}
                          className="rounded-[14px]"
                          style={{ gridRow: rowOf(p), gridColumn: di + 2, background: "var(--brand-50)", opacity: 0.45 }}
                          aria-hidden="true"
                        />
                      ))
                    )}

                    {/* Sessions */}
                    {placed.map((x) => {
                      const startRow = rowOf(x.startPeriod);
                      const endRow = rowOf(x.startPeriod + x.span - 1);
                      const key = `${x.dayIndex}-${x.startPeriod}`;
                      const sp = PERIODS[x.startPeriod - 1];
                      const ep = PERIODS[x.startPeriod + x.span - 2] || sp;
                      return (
                        <div
                          key={key}
                          style={{ gridRow: `${startRow} / ${endRow + 1}`, gridColumn: x.dayIndex + 2 }}
                          className="min-w-0"
                        >
                          <CourseChip
                            s={x.session}
                            extra={x.extra}
                            dimension={dimension}
                            dim={!matches(x.session)}
                            highlighted={highlight === key}
                            ariaWhen={`${DAY_LONG[x.dayIndex]} ${sp.start} to ${ep.end}`}
                            onExplainSlot={() => setExplainQuery({ type: "why_slot", id: x.session.session_id })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile day view */}
              {status === "ready" && (
                <div className="md:hidden">
                  <div
                    className="flex items-center justify-between rounded-2xl border px-2 py-1.5 mb-3"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <button
                      onClick={() => shiftMobileDay(-1)}
                      aria-label="Previous day"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--brand-700)] hover:bg-[var(--row-hover)]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-heading font-extrabold text-[15px]">
                      {DAY_SHORT[mobileDay]}
                      {mobileDate ? `, ${fmtDay(mobileDate)}` : ""}
                    </span>
                    <button
                      onClick={() => shiftMobileDay(1)}
                      aria-label="Next day"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--brand-700)] hover:bg-[var(--row-hover)]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {mobileSessions.length === 0 && hasAny && (
                      <div className="py-10 text-center text-sm font-semibold text-[var(--muted)]">
                        No sessions found for these filters.
                      </div>
                    )}
                    {mobileSessions.map((x) => {
                      const sp = PERIODS[x.startPeriod - 1];
                      const ep = PERIODS[x.startPeriod + x.span - 2] || sp;
                      const key = `${x.dayIndex}-${x.startPeriod}`;
                      return (
                        <div key={key} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 items-stretch">
                          <div className="flex flex-col justify-center leading-snug">
                            <span className="text-[13px] font-extrabold">
                              {sp.start} – {ep.end}
                            </span>
                            <span className="text-[11.5px] font-semibold text-[var(--muted)]">
                              (P{x.startPeriod}
                              {x.span > 1 ? `–P${x.startPeriod + x.span - 1}` : ""})
                            </span>
                          </div>
                          <CourseChip
                            s={x.session}
                            extra={x.extra}
                            dimension={dimension}
                            dim={!matches(x.session)}
                            highlighted={highlight === key}
                            ariaWhen={`${DAY_LONG[x.dayIndex]} ${sp.start} to ${ep.end}`}
                            compact
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <QuickInfo
          nextClass={nextClass}
          midsemRange={midsemRange}
          stats={stats}
          onShowNext={showNext}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* Decision Explanation Modal */}
      <ExplainModal
        isOpen={!!explainQuery}
        onClose={() => setExplainQuery(null)}
        query={explainQuery}
        isDark={isDark}
      />
    </div>
  );
}
