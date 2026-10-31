"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Zap,
  Layers,
  FlaskConical,
  User,
  ShieldAlert,
} from "lucide-react";

interface AnalyticsConflictsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
}

export default function AnalyticsConflictsModule({
  onNavigateTab,
  userRole = "admin",
}: AnalyticsConflictsModuleProps) {
  const [timeRange, setTimeRange] = useState("Last 7 Days");
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  const [activeConflictDetail, setActiveConflictDetail] = useState<any | null>(null);

  // 4 KPI Cards matching the exact figures and sparklines from the screenshot
  const kpis = [
    {
      id: "classes",
      label: "Total Classes",
      value: "742",
      change: "↑ 8%",
      isPositive: true,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
      stroke: "#2563EB",
    },
    {
      id: "utilization",
      label: "Room Utilization",
      value: "87%",
      change: "↑ 5%",
      isPositive: true,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/60",
      stroke: "#9333EA",
    },
    {
      id: "conflicts",
      label: "Conflicts Detected",
      value: "3",
      change: "↓ 50%",
      isPositive: true, // Down is positive for conflicts!
      icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
      stroke: "#E11D48",
    },
    {
      id: "health",
      label: "Schedule Health",
      value: "96%",
      change: "↑ 2%",
      isPositive: true,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
      stroke: "#10B981",
    },
  ];

  // 3 Active Conflicts from the screenshot
  const activeConflicts = [
    {
      id: "c-1",
      title: "Room Clash",
      severity: "High",
      severityType: "high",
      date: "Mon, 27 Oct",
      time: "10:00 – 11:00",
      detail: "LH-1 vs LH-2",
      icon: Layers,
      iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
      pillStyle: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
      explanation: "Physics lecture PHY-101 and Guest Lecture BR-03 both allocated to LH-1 concurrently.",
      fix: "Relocate BR-03 to Main Auditorium which seats 500.",
    },
    {
      id: "c-2",
      title: "Faculty Clash",
      severity: "Medium",
      severityType: "medium",
      date: "Mon, 27 Oct",
      time: "11:00 – 12:00",
      detail: "Dr. Sharma vs Dr. Khan",
      icon: User,
      iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      pillStyle: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
      explanation: "Dr. Sharma assigned to consecutive tutorial without mandatory 10-minute transit buffer.",
      fix: "Swap period with Dr. Verma (LH-2).",
    },
    {
      id: "c-3",
      title: "Time Clash",
      severity: "Low",
      severityType: "low",
      date: "Tue, 28 Oct",
      time: "09:00 – 10:00",
      detail: "Physics vs Chemistry",
      icon: FlaskConical,
      iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      pillStyle: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
      explanation: "Year 1 Section A elective block shares common lab equipment benches.",
      fix: "Automatic slot shift to Period 3 approved.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. PANORAMIC CAMPUS INTELLIGENCE HERO */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071330] via-[#0E2872] to-[#1C51C6] text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Analytics & Conflicts
          </h1>
          <p className="text-sm sm:text-base font-semibold text-blue-200 mb-4">
            Deep insights. Smart decisions. A conflict-free campus.
          </p>
          <button
            onClick={() => setActiveConflictDetail(activeConflicts[0])}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md flex items-center gap-2 group"
          >
            Explore Insights
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Holographic Chart Showcase Representation */}
        <div className="relative z-10 hidden sm:flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
          <div className="w-14 h-14 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,212,255,0.4)]">
            📊
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-cyan-300">
              Campus Intelligence
            </div>
            <div className="text-sm font-extrabold text-white">Live Health Monitor</div>
            <div className="text-[10px] text-blue-200">100% Rules authoritatively checked</div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. 4 KPI METRIC CARDS WITH SPARKLINES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between gap-3 hover:shadow-card transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${kpi.bgColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[var(--muted)] leading-tight">
                    {kpi.label}
                  </div>
                  <div className="text-2xl font-black font-heading tracking-tight mt-0.5 leading-none">
                    {kpi.value}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                    <span>{kpi.change}</span>
                  </div>
                </div>
              </div>

              {/* Sparkline wave representation */}
              <div className="w-16 h-8 hidden sm:block shrink-0">
                <svg className="w-full h-full" viewBox="0 0 60 25" preserveAspectRatio="none">
                  <path
                    d="M0,20 Q15,5 30,15 T60,5"
                    fill="none"
                    stroke={kpi.stroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE: ROOM UTILIZATION CHART + CONFLICT OVERVIEW DONUT + RIGHT RAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Left Sub-Grid: Trend Chart + Donut Chart */}
        <div className="space-y-4">
          {/* Top: Room Utilization Trend Chart with 92% Tooltip Badge */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white font-black text-xs">📈</span>
                <h3 className="font-extrabold text-sm font-heading">
                  Room Utilization Trend
                </h3>
              </div>

              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-bold text-[var(--ink)] focus:outline-none cursor-pointer"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Semester">This Semester</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Interactive SVG Line Graph matching screenshot */}
            <div className="relative h-48 w-full pt-6">
              {/* Tooltip Badge over Friday (92%) */}
              <div className="absolute left-[63%] top-1 -translate-x-1/2 z-20">
                <div className="px-3 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md border border-blue-400">
                  92%
                </div>
                <div className="w-2 h-2 bg-blue-600 rotate-45 mx-auto -mt-1" />
              </div>

              {/* Grid Background Lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-[var(--muted)]/60 font-semibold pointer-events-none">
                <div className="border-b border-[var(--border)]/50 pb-1">100%</div>
                <div className="border-b border-[var(--border)]/50 pb-1">75%</div>
                <div className="border-b border-[var(--border)]/50 pb-1">50%</div>
                <div className="border-b border-[var(--border)]/50 pb-1">25%</div>
                <div className="border-b border-[var(--border)]/50 pb-1">0%</div>
              </div>

              {/* Smooth Curved Line */}
              <svg className="w-full h-full overflow-visible z-10 relative" viewBox="0 0 350 100" preserveAspectRatio="none">
                {/* Area Gradient */}
                <path
                  d="M0,55 C40,45 60,35 100,38 C140,42 160,25 210,22 C260,20 280,22 350,8 L350,100 L0,100 Z"
                  fill="url(#utilizationArea)"
                  opacity="0.25"
                />
                {/* Stroke Path */}
                <path
                  d="M0,55 C40,45 60,35 100,38 C140,42 160,25 210,22 C260,20 280,22 350,8"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {[
                  { cx: 0, cy: 55 },
                  { cx: 58, cy: 45 },
                  { cx: 116, cy: 38 },
                  { cx: 175, cy: 25 },
                  { cx: 233, cy: 22 }, // Friday 92%
                  { cx: 291, cy: 22 },
                  { cx: 350, cy: 8 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r={i === 4 ? "5.5" : "3.5"}
                    className={i === 4 ? "fill-white stroke-blue-600 stroke-[3.5]" : "fill-blue-500"}
                  />
                ))}

                <defs>
                  <linearGradient id="utilizationArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* X-Axis Days */}
            <div className="flex justify-between text-[11px] text-[var(--muted)] font-bold pt-2 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span className="text-blue-600 font-extrabold">Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Bottom: Conflict Overview Donut Breakdown Card */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="font-extrabold text-sm font-heading">Conflict Overview</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-1">
              {/* Donut Chart Ring matching mockup */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <path
                    className="text-[var(--border)]"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Segment 1: Red (Room Clash) */}
                  <path
                    className="text-rose-500"
                    strokeDasharray="33.3, 100"
                    strokeDashoffset="0"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Segment 2: Orange (Time Clash) */}
                  <path
                    className="text-amber-500"
                    strokeDasharray="33.3, 100"
                    strokeDashoffset="-33.3"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Segment 3: Purple (Faculty Clash) */}
                  <path
                    className="text-purple-500"
                    strokeDasharray="33.4, 100"
                    strokeDashoffset="-66.6"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-2xl font-black font-heading leading-tight">3</div>
                  <div className="text-[10px] text-[var(--muted)] font-bold">Conflicts</div>
                </div>
              </div>

              {/* Legend with Counts */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="font-bold">Room Clash</span>
                  </span>
                  <span className="font-extrabold text-[var(--muted)]">1</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-bold">Time Clash</span>
                  </span>
                  <span className="font-extrabold text-[var(--muted)]">1</span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-bold">Faculty Clash</span>
                  </span>
                  <span className="font-extrabold text-[var(--muted)]">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Active Conflicts List + AI Insights Card */}
        <aside className="space-y-4">
          {/* Active Conflicts Card */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-rose-600 font-heading">
                <AlertTriangle className="w-4 h-4 fill-rose-500 text-white" />
                <span>Active Conflicts</span>
              </div>
              <button
                onClick={() => setSelectedSeverity("all")}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {activeConflicts.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConflictDetail(c)}
                    className="py-3 flex items-start justify-between gap-2.5 cursor-pointer hover:bg-blue-50/20 dark:hover:bg-slate-800/20 p-2 rounded-xl transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${c.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{c.title}</div>
                        <div className="text-[10px] text-[var(--muted)]">
                          {c.date} • {c.time}
                        </div>
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                          {c.detail}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${c.pillStyle}`}>
                      {c.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights Card with Mascot Robot Representation */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900/60 shadow-card space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-700 dark:text-purple-300 font-heading">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <span>AI Insights ✦</span>
              </div>
              <button
                onClick={() =>
                  alert(
                    "AI Insight: Moving OE301 to LH-2 frees up LH-1, boosting overall campus balance by 14%."
                  )
                }
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                View Details →
              </button>
            </div>

            <p className="text-xs font-semibold text-purple-950 dark:text-purple-200 leading-relaxed">
              Room LH-1 is heavily booked (95% utilization). Consider moving elective tutorials to
              ground-floor CR-101.
            </p>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Optimization Proposed</span>
              </div>

              {/* Pointing Robot Avatar from Screenshot */}
              <div className="text-2xl animate-pulse">🤖</div>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. CONFLICT DETAILS MODAL */}
      {activeConflictDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold font-heading">
                    {activeConflictDetail.title} ({activeConflictDetail.severity})
                  </h4>
                  <p className="text-xs text-[var(--muted)]">
                    {activeConflictDetail.date} · {activeConflictDetail.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2 text-xs">
              <div>
                <span className="font-bold text-[var(--muted)] uppercase text-[10px] block">
                  Root Cause Explanation
                </span>
                <p className="font-semibold text-[var(--ink)] mt-0.5">
                  {activeConflictDetail.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] block">
                  Recommended Algorithmic Fix
                </span>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {activeConflictDetail.fix}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  alert("Proposed resolution applied to solver context with 0 violations!");
                  setActiveConflictDetail(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
              >
                Apply Recommended Fix
              </button>
              <button
                onClick={() => setActiveConflictDetail(null)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}