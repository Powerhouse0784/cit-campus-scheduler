"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Users,
  AlertTriangle,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Zap,
  Lightbulb,
  Sparkles,
  ChevronDown,
  Download,
  LayoutGrid,
  FlaskConical,
  UserRound,
  type LucideIcon,
} from "lucide-react";

interface AnalyticsConflictsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

type Severity = "High" | "Medium" | "Low";
type ConflictType = "Room Clash" | "Faculty Clash" | "Time Clash";

interface Conflict {
  id: string;
  type: ConflictType;
  severity: Severity;
  when: string;
  detail: string;
  Icon: LucideIcon;
}

const CONFLICTS: Conflict[] = [
  { id: "c1", type: "Room Clash", severity: "High", when: "Mon, 27 Oct • 10:00 – 11:00", detail: "LH-1 vs LH-2", Icon: LayoutGrid },
  { id: "c2", type: "Faculty Clash", severity: "Medium", when: "Mon, 27 Oct • 11:00 – 12:00", detail: "Dr. Sharma vs Dr. Khan", Icon: UserRound },
  { id: "c3", type: "Time Clash", severity: "Low", when: "Tue, 28 Oct • 09:00 – 10:00", detail: "Physics vs Chemistry", Icon: FlaskConical },
];

const SEVERITY_STYLE: Record<Severity, string> = {
  High: "bg-[#FFE1E4] text-[#DC2626] dark:bg-[#4A1224] dark:text-[#FF7A8C]",
  Medium: "bg-[#FFEBC2] text-[#B76A00] dark:bg-[#4A3512] dark:text-[#FFC24D]",
  Low: "bg-[#DCE9FF] text-[#2563EB] dark:bg-[#12306B] dark:text-[#7FB0FF]",
};

const TILE_STYLE: Record<ConflictType, string> = {
  "Room Clash": "bg-[#E4EDFF] text-[#2563EB] dark:bg-[#14264B] dark:text-[#7FB0FF]",
  "Faculty Clash": "bg-[#FFEADD] text-[#2563EB] dark:bg-[#2D2229] dark:text-[#FFB066]",
  "Time Clash": "bg-[#E4EDFF] text-[#2563EB] dark:bg-[#14264B] dark:text-[#7FB0FF]",
};

const DONUT_COLOR: Record<ConflictType, string> = {
  "Room Clash": "#EF4444",
  "Time Clash": "#F59E0B",
  "Faculty Clash": "#8B45FF",
};

const INSIGHTS = [
  "Room LH-1 is heavily booked (95% utilization). Consider alternatives.",
  "Tuesday 09:00 – 10:00 has 3 free labs. Moving Physics here clears the Time Clash.",
  "Dr. Sharma teaches 5 consecutive periods on Monday. Consider a break slot.",
];

type Range = "7d" | "30d" | "semester";
const RANGE_LABEL: Record<Range, string> = { "7d": "Last 7 Days", "30d": "Last 30 Days", semester: "This Semester" };
const SERIES: Record<Range, { label: string; value: number }[]> = {
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({ label, value: [45, 54, 62, 76, 80, 78, 92][i] })),
  "30d": ["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((label, i) => ({ label, value: [62, 70, 78, 87][i] })),
  semester: ["Aug", "Sep", "Oct", "Nov"].map((label, i) => ({ label, value: [55, 68, 80, 87][i] })),
};

/* ------------------------------------------------------------------ */
/* Small sparkline                                                     */
/* ------------------------------------------------------------------ */
const SPARKS = {
  up: "M0 30 C10 28 16 22 26 24 S42 14 52 16 S68 6 80 4",
  down: "M0 6 C10 8 16 14 26 12 S42 22 52 20 S68 26 80 28",
  wave: "M0 28 C10 26 14 14 26 18 S42 26 52 14 S68 10 80 4",
};
function Spark({ color, kind, id }: { color: string; kind: keyof typeof SPARKS; id: string }) {
  return (
    <svg viewBox="0 0 80 34" className="w-[72px] h-8 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${SPARKS[kind]} L80 34 L0 34 Z`} fill={`url(#sp-${id})`} />
      <path d={SPARKS[kind]} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
function Hero({ isDark, onExplore }: { isDark: boolean; onExplore: () => void }) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px] min-h-[190px] md:min-h-[150px] lg:min-h-[158px] flex items-start md:items-center border"
      style={{
        background: isDark
          ? "linear-gradient(100deg,#040A26 0%,#07123A 50%,#0B1F58 100%)"
          : "linear-gradient(100deg,#F4F8FF 0%,#E8F0FF 45%,#CFE0FF 100%)",
        borderColor: isDark ? "rgba(56,130,255,.55)" : "#D6E3FA",
        boxShadow: isDark ? "0 0 30px rgba(0,80,255,.25)" : "0 12px 32px rgba(25,55,115,.10)",
      }}
    >
      <div
        className="hero-img absolute bottom-0 right-0 h-[44%] w-full md:h-full md:w-[58%] bg-cover bg-[position:72%_100%] md:bg-[position:center_62%]"
        style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
        role="img"
        aria-label="CIT campus"
      />

      <div className="relative z-10 px-5 pt-5 pb-4 sm:px-8 md:py-0 max-w-[620px]">
        <h1
          className={`font-serif-heading font-bold tracking-tight text-[30px] sm:text-[40px] leading-[1.05] ${
            isDark ? "text-white" : "text-[#0F2A6B]"
          }`}
        >
          Analytics &amp;{" "}
          <span className={isDark ? "text-[#7FA8FF]" : "text-[#2563EB]"}>Conflicts</span>
        </h1>
        <p className={`mt-2 text-[13px] sm:text-[15px] font-medium ${isDark ? "text-white/90" : "text-[#15264F]"}`}>
          Deep insights. Smart decisions. A conflict-free campus.
        </p>
        <button
          onClick={onExplore}
          className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{
            background: "linear-gradient(110deg,#155BFF,#2F7BF5)",
            boxShadow: isDark ? "0 0 18px rgba(60,140,255,.55)" : "0 8px 18px rgba(21,91,255,.32)",
          }}
        >
          Explore Insights <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Utilization line chart                                              */
/* ------------------------------------------------------------------ */
function UtilChart({ data, isDark }: { data: { label: string; value: number }[]; isDark: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 440, H = 220, L = 42, R = 14, T = 42, B = 30;
  const n = data.length;
  const x = (i: number) => L + (i * (W - L - R)) / (n - 1);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const active = hover ?? n - 1;
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  // smooth path (catmull-rom -> bezier)
  const path = pts
    .map((p, i) => {
      if (i === 0) return `M${p[0]} ${p[1]}`;
      const p0 = pts[i - 2] ?? pts[i - 1], p1 = pts[i - 1], p2 = p, p3 = pts[i + 1] ?? p;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      return `C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
    })
    .join(" ");
  const stroke = isDark ? "#27D3FF" : "#2F6BFF";
  const grid = isDark ? "rgba(120,160,230,.18)" : "#E3EBF8";
  const txt = isDark ? "#E4ECFF" : "#15264F";
  const tipX = Math.min(Math.max(pts[active][0], L + 24), W - R - 24);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Room utilization from ${data[0].value}% on ${data[0].label} to ${data[n - 1].value}% on ${data[n - 1].label}`}
    >
      <defs>
        <linearGradient id="util-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity={isDark ? 0.28 : 0.22} />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={grid} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="12.5" fill={txt}>{t}%</text>
        </g>
      ))}
      <path d={`${path} L${pts[n - 1][0]} ${y(0)} L${pts[0][0]} ${y(0)} Z`} fill="url(#util-fill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" style={isDark ? { filter: "drop-shadow(0 0 5px rgba(39,211,255,.7))" } : undefined} />
      <line x1={pts[active][0]} x2={pts[active][0]} y1={T} y2={y(0)} stroke={stroke} strokeOpacity=".35" strokeDasharray="3 3" />
      {data.map((d, i) => (
        <g key={d.label}>
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="12.5" fill={txt}>{d.label}</text>
          <circle cx={pts[i][0]} cy={pts[i][1]} r={i === active ? 6 : 4} fill={i === active ? (isDark ? "#06122F" : "#fff") : stroke} stroke={stroke} strokeWidth="2.5" />
          <rect
            x={pts[i][0] - (W - L - R) / (n - 1) / 2}
            y={T}
            width={(W - L - R) / (n - 1)}
            height={H - T - B}
            fill="transparent"
            tabIndex={0}
            aria-label={`${d.label}: ${d.value}%`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="outline-none"
          />
        </g>
      ))}
      <g transform={`translate(${tipX},${pts[active][1] - 34})`} pointerEvents="none">
        <rect x="-24" y="-13" width="48" height="26" rx="8" fill={isDark ? "#27B7E8" : "#0F3FB8"} />
        <path d="M-5 12 L0 18 L5 12Z" fill={isDark ? "#27B7E8" : "#0F3FB8"} />
        <text textAnchor="middle" y="4" fontSize="13.5" fontWeight="700" fill={isDark ? "#04122E" : "#fff"}>{data[active].value}%</text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */
function Donut({ counts }: { counts: Record<ConflictType, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative w-[132px] h-[132px] shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90" role="img" aria-label={`${total} conflicts`}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="16" />
        {total > 0 &&
          (Object.keys(counts) as ConflictType[]).map((k) => {
            const len = (counts[k] / total) * C;
            const el = (
              <circle
                key={k}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={DONUT_COLOR[k]}
                strokeWidth="16"
                strokeDasharray={`${Math.max(len - 3, 0)} ${C - Math.max(len - 3, 0)}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="font-heading font-extrabold text-[30px]">{total}</span>
        <span className="text-[13px] font-semibold">Conflicts</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Robot                                                               */
/* ------------------------------------------------------------------ */
function Robot() {
  return (
    <svg viewBox="0 0 110 120" className="w-[104px] h-[112px]" aria-hidden="true">
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
      <text x="55" y="91.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">CIT</text>
      <path d="M30 80 C14 86 8 98 14 106" stroke="#C9D8F5" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M80 78 C94 72 100 64 98 56" stroke="#C9D8F5" strokeWidth="9" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */
export default function AnalyticsConflictsModule({ onNavigateTab, isDark = false }: AnalyticsConflictsModuleProps) {
  const [range, setRange] = useState<Range>("7d");
  const [severity, setSeverity] = useState<"All" | Severity>("All");
  const [insightIdx, setInsightIdx] = useState(0);
  const [resolved, setResolved] = useState<string[]>([]);

  const active = useMemo(() => CONFLICTS.filter((c) => !resolved.includes(c.id)), [resolved]);
  const visible = active.filter((c) => severity === "All" || c.severity === severity);
  const counts = useMemo(() => {
    const base: Record<ConflictType, number> = { "Room Clash": 0, "Time Clash": 0, "Faculty Clash": 0 };
    active.forEach((c) => (base[c.type] += 1));
    return base;
  }, [active]);
  const total = active.length;
  const series = SERIES[range];

  const exportCsv = () => {
    const rows = ["label,utilization_percent", ...series.map((d) => `${d.label},${d.value}`)].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-utilization-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)" : "var(--shadow-card)",
  };

  const kpis = [
    { label: "Total Classes", value: "—", delta: "Sample data", up: true, good: true, Icon: CalendarDays, tint: "bg-[#DCE9FF] text-[#2563EB] dark:bg-[#15366B] dark:text-[#7FB0FF]", color: "#10B981", spark: "up" as const, bg: "kpi-blue" },
    { label: "Room Utilization", value: "—", delta: "Sample data", up: true, good: true, Icon: Users, tint: "bg-[#E4DCFF] text-[#7C3AED] dark:bg-[#2E2A6B] dark:text-[#B79BFF]", color: "#8B45FF", spark: "wave" as const, bg: "kpi-violet" },
    { label: "Conflicts Detected", value: String(total), delta: "50%", up: false, good: true, Icon: AlertTriangle, tint: "bg-[#FFE1E4] text-[#EF4444] dark:bg-[#4A1224] dark:text-[#FF7A8C]", color: "#EF4444", spark: "wave" as const, bg: "kpi-rose" },
    { label: "Schedule Health", value: "—", delta: "Not validated", up: true, good: true, Icon: Check, tint: "bg-[#D3F3E2] text-[#059669] dark:bg-[#134B45] dark:text-[#4ADE80]", color: "#10B981", spark: "up" as const, bg: "kpi-green" },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5 sm:gap-6 items-start">
      <p className="xl:col-span-2 text-xs text-[var(--muted)]" role="note">Prototype preview · several analytics series are illustrative and are not certified live performance metrics.</p>
      {/* ---------------- Main column ---------------- */}
      <div className="space-y-5 sm:space-y-6 min-w-0">
        <Hero isDark={isDark} onExplore={() => document.getElementById("analytics-charts")?.scrollIntoView({ behavior: "smooth" })} />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`kpi-card ${k.bg} p-3.5 sm:p-4`}>
              <div className="relative z-10 flex items-center gap-3">
                <span className={`w-10 h-10 lg:w-10 lg:h-10 xl:w-11 xl:h-11 rounded-full flex items-center justify-center shrink-0 ${k.tint}`}>
                  <k.Icon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] sm:text-[13px] font-bold leading-tight">{k.label}</div>
                  <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-heading font-extrabold text-[26px] sm:text-[30px] leading-none">{k.value}</span>
                    <span className={`inline-flex items-center text-[11.5px] font-bold ${k.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {k.up ? <ArrowUp className="w-3 h-3" strokeWidth={3} /> : <ArrowDown className="w-3 h-3" strokeWidth={3} />}
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

        {/* Charts */}
        <div id="analytics-charts" className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-4 sm:gap-5 scroll-mt-4">
          <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="util-h">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 id="util-h" className="flex items-center gap-2 font-heading font-extrabold text-[16px]">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.4} />
                Room Utilization Trend
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value as Range)}
                    aria-label="Date range"
                    className="appearance-none h-8 pl-3 pr-7 rounded-lg border text-[12px] font-semibold bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{ borderColor: "var(--search-border)" }}
                  >
                    {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                      <option key={r} value={r}>{RANGE_LABEL[r]}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button onClick={exportCsv} aria-label="Export report" title="Export Report" className="w-8 h-8 rounded-lg border flex items-center justify-center text-blue-600 dark:text-sky-400 hover:bg-[var(--row-hover)]" style={{ borderColor: "var(--search-border)" }}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <UtilChart data={series} isDark={isDark} />
          </section>

          <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="co-h">
            <h2 id="co-h" className="flex items-center gap-2 font-heading font-extrabold text-[16px] mb-3">
              <Zap className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.4} />
              Conflict Overview
            </h2>
            <div className="flex items-center justify-between gap-3 sm:gap-4 py-2">
              <Donut counts={counts} />
              <ul className="flex-1 space-y-3.5 text-[14px] font-medium">
                {(Object.keys(counts) as ConflictType[]).map((k) => (
                  <li key={k} className="flex items-center gap-2.5 whitespace-nowrap">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: DONUT_COLOR[k] }} />
                    <span className="flex-1">{k}</span>
                    <span className="font-bold">{counts[k]}</span>
                  </li>
                ))}
              </ul>
            </div>
            {total === 0 && <p className="text-[12.5px] text-[var(--muted)] font-medium">No conflicts detected. Your schedule looks clear.</p>}
          </section>
        </div>
      </div>

      {/* ---------------- Right rail ---------------- */}
      <aside className="space-y-5 sm:space-y-6 min-w-0">
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="ac-h">
          <div className="flex items-center justify-between mb-2">
            <h2 id="ac-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[16px] whitespace-nowrap">
              <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={2.3} />
              Active Conflicts
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => onNavigateTab?.("changes")} className="text-[12.5px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 whitespace-nowrap">
                View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mb-1 text-[11.5px] font-semibold text-[var(--muted)]">
            Severity
            <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as "All" | Severity)}
                aria-label="Filter by severity"
                className="h-7 rounded-md border text-[11.5px] font-semibold bg-[var(--surface)] px-1.5 focus:outline-none"
                style={{ borderColor: "var(--search-border)" }}
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
          </div>
          <ul>
            {visible.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${TILE_STYLE[c.type]}`}>
                  <c.Icon className="w-5 h-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="font-bold text-[13.5px]">{c.type}</div>
                  <div className="text-[11.5px] font-medium text-[var(--ink)]/85">{c.when}</div>
                  <div className="text-[11.5px] text-[var(--muted)] font-medium">{c.detail}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-3 py-0.5 rounded-full text-[11.5px] font-bold ${SEVERITY_STYLE[c.severity]}`}>{c.severity}</span>
                  <button onClick={() => setResolved((r) => [...r, c.id])} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {visible.length === 0 && (
            <p className="py-5 text-center text-[13px] text-[var(--muted)] font-medium">
              {total === 0 ? "No conflicts detected for this period. Your schedule looks clear." : "No conflicts match this filter."}
            </p>
          )}
        </section>

        <section
          className="relative overflow-hidden rounded-[20px] border p-4 sm:p-5"
          style={{
            background: isDark ? "linear-gradient(135deg,#141B55 0%,#1A1F6E 100%)" : "linear-gradient(135deg,#EEE9FF 0%,#E3DBFF 100%)",
            borderColor: isDark ? "#3A3FA0" : "#DCD3FA",
            boxShadow: isDark ? "0 0 24px rgba(90,70,255,.2)" : "var(--shadow-card)",
          }}
          aria-labelledby="ai-h"
        >
          <div className="flex items-center justify-between">
            <h2 id="ai-h" className="flex items-center gap-2 font-heading font-extrabold text-[16px]">
              <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-300" strokeWidth={2.2} />
              AI Insights
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-300" />
            </h2>
            <button
              onClick={() => setInsightIdx((i) => (i + 1) % INSIGHTS.length)}
              className="text-[12px] font-bold text-violet-700 dark:text-violet-300 hover:underline flex items-center gap-1"
            >
              View Details <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          </div>
          <p className="mt-3 text-[13px] font-medium leading-snug max-w-[200px] min-h-[72px]" aria-live="polite">
            {INSIGHTS[insightIdx]}
          </p>
          <div className="absolute right-1 bottom-0">
            <Robot />
          </div>
          <div className="h-12" />
        </section>
      </aside>
    </div>
  );
}
