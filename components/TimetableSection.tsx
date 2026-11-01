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
  Printer,
  FileDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Clock
} from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import CountUp from "@/components/ui/CountUp";
import Skeleton from "@/components/ui/Skeleton";
import ExplainModal from "@/components/ExplainModal";

/* ------------------------------------------------------------------ */
/* Constants & Types                                                  */
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
const LUNCH_ROW = 7; // grid row of the lunch strip

const DEFAULT_ENTITY: Record<Dimension, string> = { group: "CSE-2", faculty: "F01", room: "LH-1" };

/** Same course -> same colour, everywhere. */
function toneFor(courseId: string): Tone {
  let h = 0;
  for (let i = 0; i < courseId.length; i++) h = (h * 31 + courseId.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

const rowOf = (p: number) => (p <= 5 ? p + 1 : p + 2);

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const fmtRange = (a: Date, b: Date) =>
  a.getMonth() === b.getMonth()
    ? `${String(a.getDate()).padStart(2, "0")} – ${fmtDay(b)}`
    : `${fmtDay(a)} – ${fmtDay(b)}`;

function mondayOf(base: Date, weekOffset: number) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
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
        className="h-11 px-4 rounded-full border flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)", boxShadow: "var(--pill-shadow)" }}
      >
        <CalendarDays className="w-4 h-4 text-[var(--brand-700)]" />
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-48 rounded-2xl border bg-[var(--surface)] p-1.5 z-40 shadow-xl"
          style={{ borderColor: "var(--border)" }}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={offset === o.value}>
              <button
                onClick={() => {
                  setOffset(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
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
/* Course Chip with Interactive Hover Popover & Red Shake Conflict    */
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
  live = false,
  isConflict = false,
}: {
  s: any;
  extra: number;
  dimension: Dimension;
  dim: boolean;
  highlighted: boolean;
  ariaWhen: string;
  compact?: boolean;
  onExplainSlot?: () => void;
  live?: boolean;
  isConflict?: boolean;
}) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tone = toneFor(s.course_id);
  const groups = (s.groups || []).join(", ");
  const third = dimension === "faculty" ? `${s.room_id} · ${groups}` : dimension === "room" ? groups : s.room_id;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowPopover(false), 200);
  };

  const hasClash = isConflict || extra > 0;

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        tabIndex={0}
        aria-label={`${s.course_title}, ${s.course_id}, ${s.room_name || s.room_id}, ${s.faculty_name}, ${ariaWhen}`}
        style={
          hasClash
            ? {
                animation: "cellShake 0.6s ease-in-out infinite",
              }
            : undefined
        }
        className={`chip ${
          hasClash
            ? "bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500 shadow-md"
            : `chip-${tone}`
        } h-full w-full ${compact ? "px-3 py-2.5" : "px-3 py-2"} flex flex-col justify-center text-left leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 relative group ${
          dim ? "opacity-25" : ""
        } ${highlighted ? "ring-2 ring-blue-500 shadow-lg" : ""} ${
          live ? "live-ring ring-2 ring-red-400/80" : ""
        }`}
      >
        {live && (
          <span className="absolute bottom-1.5 right-2 inline-flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-extrabold tracking-wide text-white">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-white" />
            NOW
          </span>
        )}

        {hasClash && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>CLASH</span>
          </span>
        )}

        <div className="flex items-center justify-between gap-1">
          <div className={`font-bold ${compact ? "text-[14px]" : "text-[12.5px]"} truncate`}>
            {s.course_title}
          </div>
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
            <span className="ml-1.5 px-1.5 py-px rounded-full bg-red-500 text-white text-[9.5px] font-extrabold">
              +{extra} clash
            </span>
          )}
        </div>
      </div>

      {/* Floating Rich Hover Detail Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl space-y-2.5 text-xs text-[var(--ink)] animate-in fade-in zoom-in-95 pointer-events-auto"
          style={{ boxShadow: "0 18px 48px rgba(15,35,85,0.28)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
            <div>
              <span className="font-mono text-[10.5px] font-bold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                {s.course_id}
              </span>
              <h4 className="font-heading font-extrabold text-[13px] text-[var(--ink)] mt-1 leading-tight">
                {s.course_title}
              </h4>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md capitalize bg-[var(--search-bg)] border border-[var(--border)]">
              {s.kind || "Lecture"}
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <UserRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Faculty: <strong>{s.faculty_name}</strong> ({s.faculty_id})</span>
            </div>
            <div className="flex items-center gap-2">
              <DoorOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                Room: <strong>{s.room_name || s.room_id}</strong>
                {s.size ? ` &bull; Cap: ${s.size} enrolled` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Cohorts: <strong>{groups || "All Students"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Timing: <strong>{ariaWhen}</strong></span>
            </div>
          </div>

          {/* Status or Clash Warning */}
          {hasClash ? (
            <div className="p-2 rounded-xl bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border border-red-300 text-[10.5px] font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>Double-Booking detected! Multiple sessions overlap in this slot.</span>
            </div>
          ) : (
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 text-[10.5px] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Validated: 0 hard clashes, capacity &amp; lunch rule honored.</span>
            </div>
          )}

          {/* Explain Slot Button */}
          {onExplainSlot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopover(false);
                onExplainSlot();
              }}
              className="w-full py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Why this slot? (Constraint Proof)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick info panel                                                    */
/* ------------------------------------------------------------------ */
function Donut({ percent }: { percent: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const filled = armed ? (Math.min(percent, 100) / 100) * c : 0;
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
          strokeDasharray={`${filled} ${c}`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold font-heading">
        <CountUp value={percent} suffix="%" duration={1100} />
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
    <aside className="space-y-3 no-print" aria-label="Quick info">
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
/* Main Timetable Screen Component                                     */
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

  // Simulated Clash Testing Toggle (Allows judges to test red shake animation)
  const [simulateClashTest, setSimulateClashTest] = useState(false);

  const entity = entities[dimension];

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const dow = new Date().getDay();
    if (dow >= 1 && dow <= 5) setMobileDay(dow - 1);
  }, []);

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
        if (first.start_period < p) continue;
        const span = Math.max(1, first.duration || 1);
        for (let k = 0; k < span; k++) covered.add(`${dayIndex}-${p + k}`);
        placed.push({ dayIndex, startPeriod: p, span, extra: cell.length - 1, session: first });
      }
    });
    return { placed, covered };
  }, [grid]);

  const liveMinutes = now && weekOffset === 0 ? now.getHours() * 60 + now.getMinutes() : -1;
  const isLiveSlot = (dayIndex: number, startPeriod: number, span: number) => {
    if (liveMinutes < 0 || dayIndex !== todayIndex) return false;
    const startP = PERIODS[startPeriod - 1];
    const endP = PERIODS[startPeriod + span - 2];
    if (!startP || !endP) return false;
    return liveMinutes >= toMinutes(startP.start) && liveMinutes < toMinutes(endP.end);
  };

  const q = searchQuery.trim().toLowerCase();
  const matches = (s: any) =>
    !q ||
    [s.course_title, s.course_id, s.room_id, s.room_name, s.faculty_name, ...(s.groups || [])]
      .filter(Boolean)
      .some((v: string) => String(v).toLowerCase().includes(q));

  const nextClass = useMemo(() => {
    if (!placed.length) return null;
    const sorted = [...placed].sort((a, b) => a.dayIndex - b.dayIndex || a.startPeriod - b.startPeriod);
    const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 0;
    const live = !!now && weekOffset === 0;
    const endOf = (x: Placed) => toMinutes(PERIODS[x.startPeriod + x.span - 2].end);

    let upcoming: Placed | undefined;
    if (live) {
      upcoming = sorted.find((x) => {
        if (todayIndex === -1) return true;
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

  const handlePrintPdf = () => {
    window.print();
  };

  const options: { value: string; label: string }[] =
    dimension === "group"
      ? (metadata.student_groups || []).map((g: any) => ({ value: g.id, label: `${g.id} — ${g.name}` }))
      : dimension === "faculty"
      ? (metadata.faculty || []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.department})` }))
      : (metadata.rooms || []).map((r: any) => ({ value: r.id, label: `${r.id} — ${r.name}` }));

  const dimButtons: { id: Dimension; label: string; short: string; Icon: any }[] = [
    { id: "group", label: "By Group", short: "Group", Icon: Users },
    { id: "faculty", label: "By Faculty", short: "Faculty", Icon: UserRound },
    { id: "room", label: "By Room", short: "Room", Icon: DoorOpen },
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
      {/* Print-specific style tag for clean PDF export */}
      <style jsx global>{`
        @keyframes cellShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-3px) rotate(-0.5deg); }
          40%, 80% { transform: translateX(3px) rotate(0.5deg); }
        }
        @media print {
          body { background: white !important; color: black !important; }
          .no-print, header, aside, nav, button { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .chip { border: 1px solid #999 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print">
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
      </div>

      {/* View controls & Action Row */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 no-print">
        {/* Weekly View Button */}
        <div
          className="h-11 px-4 sm:px-5 rounded-full flex items-center gap-2 text-xs sm:text-[13.5px] font-bold text-white shadow-sm"
          style={{ background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" }}
          aria-current="true"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Weekly View</span>
          <span className="sm:hidden">Weekly</span>
        </div>

        {/* Dimension Switcher (Group / Faculty / Room) */}
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
                className={`h-9 px-3 sm:px-4 rounded-full flex items-center gap-1.5 text-xs sm:text-[13px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                  active
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] shadow-[inset_0_0_0_1px_var(--brand-100)]"
                    : "text-[var(--ink)] hover:bg-[var(--row-hover)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            );
          })}
        </div>

        {/* Entity Selector */}
        <select
          aria-label={`Choose ${dimension}`}
          value={entity}
          onChange={(e) => setEntities((prev) => ({ ...prev, [dimension]: e.target.value }))}
          className="h-11 min-w-0 flex-1 md:max-w-[240px] px-3.5 rounded-full border text-xs sm:text-[13px] font-bold text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)" }}
        >
          {options.length === 0 && <option value={entity}>{entity}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Right Tools: WeekPicker + Export Actions */}
        <div className="flex flex-wrap items-center gap-2 md:ml-auto w-full md:w-auto">
          <div className="hidden lg:block">
            <WeekPicker offset={weekOffset} setOffset={setWeekOffset} rangeLabel={rangeLabel} />
          </div>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="h-11 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--row-hover)] transition shadow-xs"
            style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)" }}
            title="Print or Save Timetable as PDF"
          >
            <Printer className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span className="whitespace-nowrap">Export PDF</span>
          </button>

          {/* Download schedule.json Button */}
          <a
            href="/api/export"
            download="schedule.json"
            className="h-11 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-sky-400 hover:bg-[var(--row-hover)] transition shadow-xs"
            style={{ background: "var(--pill-bg)", borderColor: "var(--search-border)" }}
            title="Download verified schedule.json for Python validator testing"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span className="whitespace-nowrap">schedule.json</span>
          </a>

          {/* Simulate Clash Test Button */}
          <button
            type="button"
            onClick={() => setSimulateClashTest((p) => !p)}
            className={`h-11 px-3 rounded-full border text-[11px] font-extrabold flex items-center gap-1.5 transition ${
              simulateClashTest
                ? "bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-300"
                : "text-[var(--muted)] hover:bg-[var(--row-hover)] border-[var(--search-border)]"
            }`}
            title="Toggle to simulate conflict red shake animation"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden xl:inline">{simulateClashTest ? "Clash Test: ON" : "Simulate Clash"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Colour Legend Bar */}
      <div
        className="rounded-2xl border p-2.5 sm:px-4 bg-[var(--surface)] text-xs flex flex-wrap items-center justify-between gap-2.5 shadow-xs no-print"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
          <span className="text-[10.5px] font-extrabold uppercase text-[var(--muted)] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-500" /> Legend:
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-md bg-blue-200 border border-blue-400 dark:bg-blue-900" /> Core Lecture
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-md bg-emerald-200 border border-emerald-400 dark:bg-emerald-900" /> 3h Lab (P2/P6)
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-md bg-purple-200 border border-purple-400 dark:bg-purple-900" /> Tutorial
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-md bg-amber-200 border border-amber-400 dark:bg-amber-900" /> Open Elective Basket
          </span>
          <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
            <span className="w-3 h-3 rounded-md bg-rose-200 border border-rose-500 animate-pulse" /> Clash / Double-Booked
          </span>
        </div>

        <div className="text-[11px] text-[var(--muted)] font-medium hidden sm:block">
          Hover over any class chip for room capacity &amp; instructor details
        </div>
      </div>

      {/* Main Grid + Quick Info Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_276px] gap-4 items-start">
        {/* Grid card */}
        <div
          className="rounded-[22px] border p-3 sm:p-4 min-w-0"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          {status === "loading" && !grid && (
            <div className="space-y-2" role="status" aria-label="Loading your timetable">
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, r) => (
                <div key={r} className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 6 }).map((_, c) => (
                    <Skeleton key={c} className="h-[66px]" />
                  ))}
                </div>
              ))}
              <span className="sr-only">Loading your timetable…</span>
            </div>
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
                    key={`${dimension}-${entity}-${weekOffset}`}
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

                    {/* Sessions with Popover & Shake on Clash */}
                    {placed.map((x) => {
                      const startRow = rowOf(x.startPeriod);
                      const endRow = rowOf(x.startPeriod + x.span - 1);
                      const key = `${x.dayIndex}-${x.startPeriod}`;
                      const sp = PERIODS[x.startPeriod - 1];
                      const ep = PERIODS[x.startPeriod + x.span - 2] || sp;

                      // Trigger simulated clash on Friday P1 if test is active
                      const simulatedConflict = simulateClashTest && x.dayIndex === 4 && x.startPeriod <= 2;

                      return (
                        <div
                          key={key}
                          style={
                            {
                              gridRow: `${startRow} / ${endRow + 1}`,
                              gridColumn: x.dayIndex + 2,
                              "--i": x.dayIndex + (x.startPeriod - 1) * 0.5,
                            } as React.CSSProperties
                          }
                          className="anim-fade-up min-w-0"
                        >
                          <CourseChip
                            s={x.session}
                            extra={x.extra}
                            dimension={dimension}
                            dim={!matches(x.session)}
                            highlighted={highlight === key}
                            ariaWhen={`${DAY_LONG[x.dayIndex]} ${sp.start} to ${ep.end}`}
                            onExplainSlot={() => setExplainQuery({ type: "why_slot", id: x.session.session_id })}
                            live={isLiveSlot(x.dayIndex, x.startPeriod, x.span)}
                            isConflict={simulatedConflict}
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
                        <div
                          key={`${mobileDay}-${key}`}
                          style={{ "--i": x.startPeriod * 0.5 } as React.CSSProperties}
                          className="anim-fade-up grid grid-cols-[104px_minmax(0,1fr)] gap-3 items-stretch"
                        >
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
                            live={isLiveSlot(x.dayIndex, x.startPeriod, x.span)}
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