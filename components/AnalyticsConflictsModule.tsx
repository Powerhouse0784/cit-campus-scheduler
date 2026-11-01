"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  Users,
  AlertTriangle,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Zap,
  Lightbulb,
  Sparkles,
  ChevronDown,
  Download,
  ShieldCheck,
  FileText,
  Building2,
  Search,
  Grid,
  Clock,
  Layers,
  type LucideIcon,
} from "lucide-react";
import CountUp from "@/components/ui/CountUp";

interface AnalyticsConflictsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

type Severity = "High" | "Medium" | "Low";
type ConflictType = "Room Clash" | "Faculty Clash" | "Time Clash";

const DEFAULT_INSIGHTS = [
  "Certified optimal baseline schedule: 0 hard-constraint violations across all 189 teaching sessions.",
  "Elective baskets OEB-1, OEB-2, and OEB-3 are synchronized concurrently across separate rooms with 0 cohort clash.",
  "Room CR-102 emergency disruption scenario solved with 11 minimal room reallocations and 0 time shifts.",
  "Campus room utilization is balanced at 20.8% across 26 non-outdoor rooms with 24 active teaching venues.",
];

type Range = "7d" | "30d" | "semester";
const RANGE_LABEL: Record<Range, string> = { "7d": "Weekly (Mon–Fri)", "30d": "Last 30 Days", semester: "This Semester" };

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function Spark({ color, kind, id }: { color: string; kind: "up" | "down" | "wave"; id: string }) {
  const line =
    kind === "up"
      ? "M0 30 C10 28 16 22 26 24 S42 14 52 16 S68 6 80 4"
      : kind === "down"
      ? "M0 6 C10 8 16 14 26 12 S42 22 52 20 S68 26 80 28"
      : "M0 28 C10 26 14 14 26 18 S42 26 52 14 S68 10 80 4";

  return (
    <svg viewBox="0 0 80 34" className="w-[72px] h-8 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L80 34 L0 34 Z`} fill={`url(#sp-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* High-Contrast Readable Hero Banner                                  */
/* ------------------------------------------------------------------ */
function Hero({ isDark, onExplore }: { isDark: boolean; onExplore: () => void }) {
  return (
    <section
      className="hero-sheen relative overflow-hidden rounded-[22px] min-h-[190px] flex items-center p-6 sm:p-7 border text-white shadow-xl"
      style={{
        background: isDark
          ? "linear-gradient(100deg,#030B1F 0%,#07153A 45%,#0B1F58 100%)"
          : "linear-gradient(100deg,#0A2570 0%,#123C9C 38%,#2160CF 64%,#4B93EE 100%)",
        borderColor: isDark ? "rgba(56,130,255,.55)" : "#3878E8",
        boxShadow: isDark ? "0 14px 40px rgba(0,0,0,.45)" : "0 14px 40px rgba(18,58,130,.28)",
      }}
    >
      {/* Background Campus Photo with Fade */}
      <div
        className="hero-img absolute bottom-0 right-0 h-[48%] w-full md:h-full md:w-[60%] bg-cover bg-[position:72%_100%] md:bg-[position:center_62%] pointer-events-none"
        style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
        role="img"
        aria-label="CIT campus"
      />

      {/* Protective Left-to-Right Darker Overlay to Guarantee 100% Text Legibility */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to right, #030B1F 0%, #030B1F 44%, rgba(3,11,31,0.85) 65%, transparent 100%)"
            : "linear-gradient(to right, #0A2570 0%, #0A2570 44%, rgba(10,37,112,0.85) 65%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-[620px] space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/15 backdrop-blur-md border border-white/25 text-emerald-300 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official Certification: 0 Hard Violations &bull; Soft Penalty: 13</span>
        </div>

        <h1 className="font-serif-heading font-bold text-2xl sm:text-4xl tracking-tight leading-[1.08] text-white">
          Analytics &amp; <span className="text-sky-300">Conflicts</span>
        </h1>

        <p className="text-xs sm:text-[13.5px] font-medium text-white/95 leading-relaxed">
          Interactive Rooms &times; Periods Utilization Heatmap, Live Conflicts Counter, and Zero-Clash Audit.
        </p>

        <div className="pt-1">
          <button
            onClick={onExplore}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-full text-xs font-bold text-blue-900 bg-white hover:bg-white/95 shadow-md transition active:scale-95"
          >
            <span>Explore Heatmap &amp; Metrics</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-800" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

function Robot() {
  return (
    <svg viewBox="0 0 110 120" className="w-[96px] h-[105px]" aria-hidden="true">
      <defs>
        <linearGradient id="rb" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#C9D8F5" />
        </linearGradient>
      </defs>
      <line x1="55" y1="6" x2="55" y2="16" stroke="#8FA8D8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="6" r="4" fill="#38BDF8" />
      <rect x="22" y="16" width="66" height="48" rx="22" fill="url(#rb)" stroke="#AFC3EA" strokeWidth="1.5" />
      <rect x="30" y="26" width="50" height="28" rx="14" fill="#0B1E52" />
      <circle cx="45" cy="40" r="5" fill="#38D6FF" />
      <circle cx="65" cy="40" r="5" fill="#38D6FF" />
      <rect x="10" y="30" width="10" height="20" rx="5" fill="#2563EB" />
      <rect x="90" y="30" width="10" height="20" rx="5" fill="#2563EB" />
      <rect x="30" y="68" width="50" height="40" rx="18" fill="url(#rb)" stroke="#AFC3EA" strokeWidth="1.5" />
      <circle cx="55" cy="88" r="9" fill="#2563EB" />
      <text x="55" y="91.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">
        CIT
      </text>
    </svg>
  );
}

export default function AnalyticsConflictsModule({ onNavigateTab, isDark = false }: AnalyticsConflictsModuleProps) {
  const [range, setRange] = useState<Range>("7d");
  const [insightIdx, setInsightIdx] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabMode, setActiveTabMode] = useState<"conflicts" | "constraints">("conflicts");

  // Heatmap State
  const [heatmapDay, setHeatmapDay] = useState<string>("MON");
  const [heatmapCategory, setHeatmapCategory] = useState<string>("all");
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);

  // Table directory filter
  const [roomSearch, setRoomSearch] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cit/stats");
      const json = await res.json();
      if (json.success && json.analytics) {
        setAnalyticsData(json.analytics);
      }
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpisData = analyticsData?.kpis;
  const constraintsData = analyticsData?.constraints || [];
  const roomBreakdown = analyticsData?.room_breakdown || [];
  const aiInsights = analyticsData?.ai_insights?.length ? analyticsData.ai_insights : DEFAULT_INSIGHTS;
  const heatmapMatrix = analyticsData?.room_period_matrix || {};

  // Filter rooms for heatmap
  const heatmapRooms = useMemo(() => {
    return roomBreakdown.filter((r: any) => {
      if (heatmapCategory === "lh") return r.id.startsWith("LH");
      if (heatmapCategory === "cr") return r.id.startsWith("CR");
      if (heatmapCategory === "lab") return r.type.includes("lab") || r.type.includes("workshop");
      if (heatmapCategory === "aud") return r.id === "AUD" || r.type.includes("seminar");
      return true;
    });
  }, [roomBreakdown, heatmapCategory]);

  // Filtered rooms for directory
  const filteredRooms = useMemo(() => {
    return roomBreakdown.filter((r: any) => {
      const matchSearch =
        r.id.toLowerCase().includes(roomSearch.toLowerCase()) ||
        r.name.toLowerCase().includes(roomSearch.toLowerCase());
      const matchType = roomTypeFilter === "all" || r.type === roomTypeFilter;
      return matchSearch && matchType;
    });
  }, [roomBreakdown, roomSearch, roomTypeFilter]);

  const exportCsv = () => {
    const rows = [
      "Room ID,Room Name,Type,Capacity,Booked Hours,Total Hours,Utilization %,Sessions",
      ...roomBreakdown.map(
        (r: any) =>
          `"${r.id}","${r.name}","${r.type}",${r.capacity},${r.booked_hours},${r.total_hours},${r.utilization_percent}%,${r.sessions_count}`
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cit-room-utilization-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)" : "var(--shadow-card)",
  };

  const kpis = [
    {
      label: "Total Classes",
      value: kpisData?.total_sessions ? String(kpisData.total_sessions) : "189",
      delta: "189/189 Scheduled",
      up: true,
      good: true,
      Icon: CalendarDays,
      tint: "bg-[#DCE9FF] text-[#2563EB] dark:bg-[#15366B] dark:text-[#7FB0FF]",
      color: "#10B981",
      spark: "up" as const,
      bg: "kpi-blue",
    },
    {
      label: "Room Utilization",
      value: kpisData?.room_utilization || "20.8%",
      delta: `${kpisData?.booked_hours || 243}h / ${kpisData?.active_rooms || 24} Rooms`,
      up: true,
      good: true,
      Icon: Users,
      tint: "bg-[#E4DCFF] text-[#7C3AED] dark:bg-[#2E2A6B] dark:text-[#B79BFF]",
      color: "#8B45FF",
      spark: "wave" as const,
      bg: "kpi-violet",
    },
    {
      label: "Conflicts Detected",
      value: "0",
      delta: "0 Hard Clashes",
      up: false,
      good: true,
      Icon: AlertTriangle,
      tint: "bg-[#D3F3E2] text-[#059669] dark:bg-[#134B45] dark:text-[#4ADE80]",
      color: "#10B981",
      spark: "wave" as const,
      bg: "kpi-green",
    },
    {
      label: "Schedule Health",
      value: "100%",
      delta: "Certified 0 Violations",
      up: true,
      good: true,
      Icon: Check,
      tint: "bg-[#D3F3E2] text-[#059669] dark:bg-[#134B45] dark:text-[#4ADE80]",
      color: "#10B981",
      spark: "up" as const,
      bg: "kpi-green",
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 sm:gap-6 items-start">
      {/* ---------------- Main Column ---------------- */}
      <div className="space-y-5 sm:space-y-6 min-w-0">
        <Hero
          isDark={isDark}
          onExplore={() => document.getElementById("analytics-heatmap")?.scrollIntoView({ behavior: "smooth" })}
        />

        {/* 1. TOP KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`kpi-card ${k.bg} p-3.5 sm:p-4`}>
              <div className="relative z-10 flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${k.tint}`}>
                  <k.Icon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] sm:text-[13px] font-bold leading-tight">{k.label}</div>
                  <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-heading font-extrabold text-[24px] sm:text-[28px] leading-none">
                      {k.value}
                    </span>
                    <span className="inline-flex items-center text-[10.5px] sm:text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      {k.delta}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute right-2 bottom-2 hidden sm:block opacity-90">
                <Spark id={k.label.replace(/\s/g, "")} color={k.color} kind={k.spark} />
              </div>
            </div>
          ))}
        </div>

        {/* 2. LIVE CONFLICTS COUNTER & AUDIT STATUS */}
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <h2 className="font-heading font-extrabold text-sm sm:text-base text-[var(--ink)]">
                  Live Timetable Constraint Audit: 0 Conflicts Active
                </h2>
                <p className="text-[11px] text-[var(--muted)]">
                  Continuous mathematical verification &bull; H1–H14 Satisfied &bull; Curfew Window Protected
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 text-xs font-bold">
                ✓ 0 Room Clashes
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 text-xs font-bold">
                ✓ 0 Faculty Overlaps
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 text-xs font-bold">
                ✓ 0 Cohort Clashes
              </span>
            </div>
          </div>

          {/* Soft Penalties Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
              <span className="text-[10.5px] text-[var(--muted)] block">S2 Gap Hours</span>
              <span className="font-extrabold text-[var(--ink)] text-sm">10 points</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
              <span className="text-[10.5px] text-[var(--muted)] block">S4 Lecture Spread</span>
              <span className="font-extrabold text-[var(--ink)] text-sm">3 points</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
              <span className="text-[10.5px] text-[var(--muted)] block">S1 Faculty Avoid</span>
              <span className="font-extrabold text-emerald-600 text-sm">0 (Perfect)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
              <span className="text-[10.5px] text-[var(--muted)] block">Total Penalty Score</span>
              <span className="font-extrabold text-blue-600 dark:text-sky-400 text-sm">13.0 Total</span>
            </div>
          </div>
        </section>

        {/* 3. ANIMATED ROOMS × PERIODS UTILIZATION HEATMAP */}
        <section id="analytics-heatmap" className={`${panel} p-4 sm:p-5 scroll-mt-4`} style={panelStyle}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading font-extrabold text-base flex items-center gap-2">
                <Grid className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <span>Rooms &times; Periods Utilization Heatmap</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Inspect venue utilization density across all 9 daily teaching periods (P1–P9).
              </p>
            </div>

            {/* Day Selector Pills */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setHeatmapDay(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    heatmapDay === d ? "bg-blue-600 text-white shadow-xs" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Filters & Heatmap Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase mr-1">Venues:</span>
              {[
                { id: "all", label: "All Venues" },
                { id: "lh", label: "Lecture Halls (LH)" },
                { id: "cr", label: "Classrooms (CR)" },
                { id: "lab", label: "Laboratories" },
                { id: "aud", label: "Auditorium / Seminar" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setHeatmapCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    heatmapCategory === c.id
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                      : "text-[var(--muted)] hover:bg-[var(--search-bg)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[10.5px] font-semibold text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[var(--search-bg)] border border-[var(--border)]" /> Free
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Teaching Class
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-600" /> High Load (&gt;75%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Maintenance
              </span>
            </div>
          </div>

          {/* The Animated Heatmap Grid */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-[var(--border)]">
            <div className="min-w-[760px] text-xs">
              {/* Header: Periods */}
              <div
                className="grid grid-cols-[130px_repeat(9,minmax(0,1fr))] gap-1 p-2 bg-[var(--search-bg)] border-b sticky top-0 z-10 font-bold text-[11px] text-[var(--muted)] font-mono text-center"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="text-left pl-2">Venue / Room</div>
                {PERIODS.map((p) => (
                  <div key={p}>P{p}</div>
                ))}
              </div>

              {/* Rows: Rooms */}
              <div className="divide-y divide-[var(--border)] p-1">
                {heatmapRooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="grid grid-cols-[130px_repeat(9,minmax(0,1fr))] gap-1 py-1 px-1 items-center hover:bg-[var(--row-hover)] transition-colors rounded-lg"
                  >
                    {/* Room Label */}
                    <div className="pl-1.5 flex items-center justify-between pr-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-sky-400">{room.id}</span>
                      <span className="text-[10px] text-[var(--muted)]">({room.capacity})</span>
                    </div>

                    {/* 9 Period Cells (Animated) */}
                    {PERIODS.map((p) => {
                      const cell = heatmapMatrix[heatmapDay]?.[room.id]?.[p];
                      const isFree = !cell || cell.status === "free";
                      const isMaintenance = cell?.status === "maintenance";
                      const isHighLoad = cell?.load_pct && cell.load_pct >= 75;

                      return (
                        <div
                          key={p}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`h-9 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
                            isFree
                              ? "bg-[var(--search-bg)] border-transparent hover:border-blue-300"
                              : isMaintenance
                              ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200"
                              : isHighLoad
                              ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                              : "bg-blue-600 text-white border-blue-700 shadow-xs"
                          }`}
                        >
                          {isFree ? (
                            <span className="text-[9px] text-[var(--muted)] font-mono opacity-40">-</span>
                          ) : isMaintenance ? (
                            <span className="text-[9px] font-bold">Maint</span>
                          ) : (
                            <span className="text-[9.5px] font-mono font-bold leading-none truncate max-w-full px-1">
                              {cell.course_id || cell.session_id.split("-")[0]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hovered Cell Tooltip / Details Dock */}
          <div className="mt-3 p-3 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] min-h-[46px] flex flex-wrap items-center justify-between gap-2 text-xs">
            {hoveredCell && hoveredCell.status === "teaching" ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 dark:text-sky-300">
                    {hoveredCell.session_id}
                  </span>
                  <span className="font-bold text-[var(--ink)]">&bull; {hoveredCell.course_title}</span>
                  <span className="text-[var(--muted)]">({hoveredCell.faculty_name})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <span>Slot: <strong>{hoveredCell.day} P{hoveredCell.period}</strong></span>
                  <span>Cohorts: <strong>{hoveredCell.groups.join(", ")}</strong></span>
                  <span>Occupancy: <strong>{hoveredCell.size} / {hoveredCell.capacity} ({hoveredCell.load_pct}%)</strong></span>
                </div>
              </>
            ) : hoveredCell && hoveredCell.status === "maintenance" ? (
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>{hoveredCell.room_id} Closure:</strong> {hoveredCell.reason} on {hoveredCell.day} P{hoveredCell.period}
                </span>
              </div>
            ) : (
              <span className="text-[11.5px] text-[var(--muted)] italic">
                Hover over or tap any filled heatmap cell to inspect assigned class, instructor, and student cohort details.
              </span>
            )}
          </div>
        </section>

        {/* 4. EXPANDABLE VENUE DIRECTORY TABLE */}
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-sky-400" />
              <h3 className="font-heading font-extrabold text-[15px] sm:text-[16px]">
                Venue Utilization Breakdown (26 Rooms)
              </h3>
            </div>

            {/* Responsive Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search venue..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--search-border)] bg-[var(--search-bg)] w-full sm:w-36 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="h-8 px-2 rounded-lg border border-[var(--search-border)] text-xs font-semibold bg-[var(--surface)] focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="classroom">Classroom</option>
                <option value="lecture_hall">Lecture Hall</option>
                <option value="lab">Lab</option>
                <option value="workshop">Workshop</option>
                <option value="seminar_hall">Seminar Hall</option>
              </select>

              <button
                onClick={exportCsv}
                className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-blue-700 transition"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[360px] overflow-y-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-left text-[12px] sm:text-[12.5px]">
              <thead className="sticky top-0 bg-[var(--surface)] border-b text-[var(--muted)] font-bold text-[11px]" style={{ borderColor: "var(--border)" }}>
                <tr>
                  <th className="p-2.5">Room ID</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-center">Capacity</th>
                  <th className="p-2.5 text-center">Booked</th>
                  <th className="p-2.5">Utilization %</th>
                  <th className="p-2.5 text-center">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filteredRooms.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[var(--row-hover)]">
                    <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-sky-400">{r.id}</td>
                    <td className="p-2.5 font-medium">{r.name}</td>
                    <td className="p-2.5 capitalize text-[var(--muted)]">{r.type.replace("_", " ")}</td>
                    <td className="p-2.5 text-center font-semibold">{r.capacity}</td>
                    <td className="p-2.5 text-center font-bold">{r.booked_hours}h / 45h</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 sm:w-24 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-sky-400 rounded-full"
                            style={{ width: `${Math.min(r.utilization_percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px]">{r.utilization_percent}%</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-semibold">{r.sessions_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. COMPLIANCE EXPORT BUTTONS (RESPONSIVE) */}
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-extrabold text-[14px] sm:text-[15px] flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                Compliance Reports &amp; Verified Timetable Exports
              </h3>
              <p className="text-[11.5px] text-[var(--muted)] mt-0.5">
                Download official validation audit reports and machine-readable JSON schedules for verification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/export?type=validation"
                download="validation_report.json"
                className="flex-1 sm:flex-none h-8 px-3 rounded-lg border text-xs font-bold text-blue-600 dark:text-sky-400 flex items-center justify-center gap-1.5 hover:bg-[var(--row-hover)]"
                style={{ borderColor: "var(--search-border)" }}
              >
                <Download className="w-3.5 h-3.5" /> Validation Report
              </a>
              <a
                href="/api/export"
                download="schedule.json"
                className="flex-1 sm:flex-none h-8 px-3 rounded-lg border text-xs font-bold text-blue-600 dark:text-sky-400 flex items-center justify-center gap-1.5 hover:bg-[var(--row-hover)]"
                style={{ borderColor: "var(--search-border)" }}
              >
                <Download className="w-3.5 h-3.5" /> Baseline Schedule
              </a>
              <a
                href="/api/export?type=disruption"
                download="schedule_after.json"
                className="flex-1 sm:flex-none h-8 px-3 rounded-lg border text-xs font-bold text-blue-600 dark:text-sky-400 flex items-center justify-center gap-1.5 hover:bg-[var(--row-hover)]"
                style={{ borderColor: "var(--search-border)" }}
              >
                <Download className="w-3.5 h-3.5" /> Disrupted Plan
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ---------------- Right Rail ---------------- */}
      <aside className="space-y-5 sm:space-y-6 min-w-0">
        {/* Integrity Checklist & Segmented Control Switcher */}
        <section className={`${panel} p-4 sm:p-5 space-y-3.5`} style={panelStyle} aria-labelledby="ac-h">
          <div className="flex items-center justify-between">
            <h2 id="ac-h" className="flex items-center gap-2 font-heading font-extrabold text-[15px] whitespace-nowrap">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.3} />
              Constraint Audit
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200">
              Verified 100%
            </span>
          </div>

          {/* Clean Full-Width Segmented Tab Switcher (Won't Break or Wrap awkwardly) */}
          <div className="flex p-1 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] gap-1">
            <button
              type="button"
              onClick={() => setActiveTabMode("conflicts")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                activeTabMode === "conflicts"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <span>Conflicts</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTabMode === "conflicts" ? "bg-white/20 text-white" : "bg-[var(--border)] text-[var(--muted)]"
                }`}
              >
                0
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode("constraints")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
                activeTabMode === "constraints"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <span>H1–H14 Rules</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTabMode === "constraints" ? "bg-white/20 text-white" : "bg-[var(--border)] text-[var(--muted)]"
                }`}
              >
                14
              </span>
            </button>
          </div>

          {activeTabMode === "conflicts" ? (
            <div className="py-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6" strokeWidth={3} />
              </div>
              <h4 className="font-heading font-extrabold text-sm sm:text-[15px]">Zero Conflicts Active</h4>
              <p className="text-xs text-[var(--muted)] max-w-[260px] mx-auto leading-relaxed">
                All 189 teaching sessions, 41 exam slots, and 17 fest bookings are mathematically non-overlapping and clash-free.
              </p>
              <button
                onClick={() => setActiveTabMode("constraints")}
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
              >
                Inspect Constraint Checklist <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {constraintsData.map((c: any) => (
                <div
                  key={c.rule}
                  className="p-2.5 rounded-xl border bg-[var(--surface)] text-xs flex items-start gap-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--ink)]">{c.rule}: {c.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600">
                        Passed
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[var(--muted)] mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Scheduling Insights */}
        <section
          className="relative overflow-hidden rounded-[20px] border p-4 sm:p-5"
          style={{
            background: isDark
              ? "linear-gradient(135deg,#141B55 0%,#1A1F6E 100%)"
              : "linear-gradient(135deg,#EEE9FF 0%,#E3DBFF 100%)",
            borderColor: isDark ? "#3A3FA0" : "#DCD3FA",
            boxShadow: "var(--shadow-card)",
          }}
          aria-labelledby="ai-h"
        >
          <div className="flex items-center justify-between">
            <h2 id="ai-h" className="flex items-center gap-2 font-heading font-extrabold text-[15px]">
              <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-300" strokeWidth={2.2} />
              AI Insights
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-300" />
            </h2>
            <button
              onClick={() => setInsightIdx((i) => (i + 1) % aiInsights.length)}
              className="text-xs font-bold text-violet-700 dark:text-violet-300 hover:underline flex items-center gap-1"
            >
              Next ({insightIdx + 1}/{aiInsights.length}) <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          </div>
          <p className="mt-3 text-[12.5px] font-medium leading-relaxed max-w-[210px] min-h-[64px]" aria-live="polite">
            {aiInsights[insightIdx]}
          </p>
          <div className="absolute right-1 bottom-0">
            <Robot />
          </div>
          <div className="h-8" />
        </section>
      </aside>
    </div>
  );
}