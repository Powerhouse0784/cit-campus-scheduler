"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  CalendarClock,
  Building2,
  Check,
  Star,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";

interface DashboardModuleProps {
  onNavigateTab: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

/* ------------------------------------------------------------------ */
/* Small area sparkline used inside KPI cards                          */
/* ------------------------------------------------------------------ */
type SparkVariant = "rise" | "wave" | "climb";

const SPARK_PATHS: Record<SparkVariant, string> = {
  rise: "M0 58 C22 57 38 50 56 40 S84 30 104 38 S142 20 168 22 S190 12 200 6",
  wave: "M0 52 C24 46 44 30 74 34 S122 54 154 46 S186 36 200 40",
  climb: "M0 58 C36 58 70 54 104 48 S158 36 178 24 S194 14 200 10",
};

function Sparkline({
  color,
  variant,
  id,
  className = "",
}: {
  color: string;
  variant: SparkVariant;
  id: string;
  className?: string;
}) {
  const line = SPARK_PATHS[variant];
  return (
    <svg
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className={`absolute pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L200 60 L0 60 Z`} fill={`url(#spark-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.85"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Hero banner                                                         */
/* ------------------------------------------------------------------ */
function DashboardHero({ greeting, isDark }: { greeting: string; isDark: boolean }) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px] text-white min-h-[214px] md:min-h-[232px] flex items-start md:items-center"
      style={{
        background: isDark
          ? "linear-gradient(100deg,#030B1F 0%,#07153A 45%,#0B1F58 100%)"
          : "linear-gradient(100deg,#0A2570 0%,#123C9C 38%,#2160CF 64%,#4B93EE 100%)",
        boxShadow: isDark
          ? "0 14px 40px rgba(0,0,0,.45)"
          : "0 14px 40px rgba(18,58,130,.28)",
      }}
    >
      {/* Campus image (light = day, dark = night) */}
      <div
        className="hero-img absolute bottom-0 right-0 h-[58%] w-full md:h-full md:w-[72%] bg-cover bg-[position:72%_100%] md:bg-right transition-[background-image] duration-300"
        style={{
          backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)`,
        }}
        role="img"
        aria-label="CIT campus building"
      />

      {/* Text */}
      <div className="relative z-10 px-6 pt-6 pb-4 sm:px-10 md:py-0 max-w-[560px]">
        <h1 className="font-heading font-extrabold tracking-tight text-[26px] sm:text-[34px] leading-tight flex items-center gap-2.5">
          <span>{greeting}</span>
          <span aria-hidden="true" className="inline-block origin-[70%_70%] animate-[wave_2.6s_ease-in-out_infinite]">
            👋
          </span>
        </h1>
        <p className="mt-1.5 text-[15px] sm:text-xl font-bold leading-snug">
          Welcome to CIT Campus Scheduler
        </p>
        <p className="mt-2.5 text-[13px] sm:text-base italic font-medium text-white/90">
          Smart Scheduling. A Better Campus.
        </p>
        <svg viewBox="0 0 150 10" className="mt-2 w-32 sm:w-40 h-2.5" aria-hidden="true">
          <defs>
            <linearGradient id="gold-swoosh" x1="0" x2="1">
              <stop offset="0" stopColor="#F59E0B" stopOpacity="0.2" />
              <stop offset="0.35" stopColor="#F5A623" />
              <stop offset="1" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <path d="M3 7C40 2 100 2 147 5" stroke="url(#gold-swoosh)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */
export default function DashboardModule({
  onNavigateTab,
  userRole = "admin",
  isDark = false,
}: DashboardModuleProps) {
  const [greeting, setGreeting] = useState("Good Morning, Ritik!");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 16 || hour < 4) setGreeting("Good Evening, Ritik!");
    else if (hour >= 12) setGreeting("Good Afternoon, Ritik!");
    else setGreeting("Good Morning, Ritik!");
  }, []);

  const timetableRows = [
    { date: "Mon, 27 Oct", period: "P1", title: "Math Lecture", room: "316", color: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
    { date: "Mon, 27 Oct", period: "P2", title: "DSA Tutorial", room: "201", color: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
    { date: "Mon, 27 Oct", period: "P4", title: "Physics Lab", room: "Lab 1", color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
    { date: "Mon, 27 Oct", period: "P6", title: "Web Dev", room: "405", color: "text-amber-500 dark:text-amber-400", bar: "bg-amber-500" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardHero greeting={greeting} isDark={isDark} />

      {/* ---------------- KPI cards ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* This Week */}
        <div className="kpi-card kpi-blue p-4 sm:p-5 sm:min-h-[150px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#DCE9FF] dark:bg-[#15366B] flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-300" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight">This Week</div>
              <div className="mt-1 flex items-baseline gap-1.5 sm:block">
                <div className="text-[28px] sm:text-[36px] leading-none font-heading font-extrabold tracking-tight">28</div>
                <div className="text-[13px] sm:mt-1.5 text-[var(--ink)]/80 font-semibold sm:font-medium">Sessions</div>
              </div>
            </div>
          </div>
          <Sparkline id="week" color="#3B82F6" variant="rise" className="right-0 bottom-0 w-[42%] sm:w-[62%] h-[44%] sm:h-[48%]" />
        </div>

        {/* Rooms in Use */}
        <div className="kpi-card kpi-violet p-4 sm:p-5 sm:min-h-[150px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E4DCFF] dark:bg-[#2E2A6B] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-violet-600 dark:text-violet-300" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold leading-tight">Rooms in Use</div>
              <div className="mt-1 text-[28px] sm:text-[36px] leading-none font-heading font-extrabold tracking-tight">
                42 / 60
              </div>
              <div className="mt-2 sm:mt-1.5 flex items-center gap-3">
                <span className="text-[13px] font-medium text-[var(--ink)]/80 whitespace-nowrap">70% Capacity</span>
                <div className="sm:hidden flex-1 h-1.5 rounded-full bg-violet-200 dark:bg-violet-900/60 overflow-hidden">
                  <div className="h-full w-[70%] rounded-full bg-violet-600" />
                </div>
              </div>
            </div>
          </div>
          <Sparkline id="rooms" color="#7C5CF0" variant="wave" className="hidden sm:block left-0 bottom-0 w-full h-[34%]" />
        </div>

        {/* Pending Approvals */}
        <div className="kpi-card kpi-green p-4 sm:p-5 sm:min-h-[150px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#D3F3E2] dark:bg-[#134B45] flex items-center justify-center shrink-0">
              <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                <Check className="w-[18px] h-[18px] text-white" strokeWidth={3.4} />
              </span>
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight">Pending Approvals</div>
              <div className="mt-1 text-[28px] sm:text-[36px] leading-none font-heading font-extrabold tracking-tight">12</div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("spectra")}
            className="relative z-10 flex items-center gap-1.5 text-[13px] font-bold text-blue-600 dark:text-sky-400 hover:underline max-sm:absolute max-sm:right-4 max-sm:bottom-4 sm:mt-3 sm:ml-[72px]"
          >
            <span className="sm:hidden">View All</span>
            <span className="hidden sm:inline">View Details</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
          </button>
        </div>

        {/* Spectra Week */}
        <div className="kpi-card kpi-amber p-4 sm:p-5 sm:min-h-[150px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFE3C4] dark:bg-[#4A3320] flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[15px] font-bold leading-tight">Spectra Week</div>
              <div className="mt-1 text-[28px] sm:text-[36px] leading-none font-heading font-extrabold tracking-tight whitespace-nowrap">
                In 7 Days
              </div>
            </div>
          </div>
          <Sparkline id="spectra" color="#F59E0B" variant="climb" className="right-0 bottom-0 w-[70%] h-[40%] sm:h-[44%]" />
        </div>
      </div>

      {/* ---------------- Timetable + Quick actions ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 sm:gap-5 items-stretch">
        {/* Your Timetable */}
        <section
          className="p-5 sm:p-6 rounded-[20px] border bg-[var(--surface)]"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex justify-between items-center gap-3 mb-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-[22px] h-[22px] text-[#15264F] dark:text-slate-100" strokeWidth={2} />
              <h2 className="font-heading font-extrabold text-[17px]">Your Timetable</h2>
            </div>
            <button
              onClick={() => onNavigateTab("timetable")}
              className="text-[13px] sm:text-sm font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2.6} />
            </button>
          </div>

          <div>
            {timetableRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[104px_1fr] sm:grid-cols-[170px_1fr] items-center py-3.5 border-t first:border-t-0 sm:first:border-t rounded-lg hover:bg-[var(--row-hover)] transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-[13.5px] sm:text-[15px] font-medium pl-1">{row.date}</span>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className={`w-[3px] h-5 rounded-full shrink-0 ${row.bar}`} />
                  <span className={`font-heading font-extrabold text-[15px] w-6 shrink-0 ${row.color}`}>
                    {row.period}
                  </span>
                  <span className="text-[14px] sm:text-[15px] truncate">
                    <span className="font-bold">{row.title}</span>
                    <span className="text-[var(--muted)] font-medium"> – {row.room}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section
          className="p-5 sm:p-6 rounded-[20px] border bg-[var(--surface)]"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <LayoutGrid className="w-[22px] h-[22px] text-[#15264F] dark:text-slate-100" strokeWidth={2} />
            <h2 className="font-heading font-extrabold text-[17px]">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab("venues")}
              className="qa-tile qa-blue h-[108px] px-1 flex flex-col items-center justify-center gap-2.5"
            >
              <span className="w-12 h-12 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <CalendarDays className="w-[22px] h-[22px] text-blue-600 dark:text-blue-300" strokeWidth={2.1} />
              </span>
              <span className="text-[12px] font-bold leading-tight tracking-tight text-blue-700 dark:text-blue-200">Book Venue</span>
            </button>

            <button
              onClick={() => onNavigateTab("changes")}
              className="qa-tile qa-peach h-[108px] px-1 flex flex-col items-center justify-center gap-2.5"
            >
              <span className="w-12 h-12 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <ArrowLeftRight className="w-[22px] h-[22px] text-orange-500" strokeWidth={2.3} />
              </span>
              <span className="text-[12px] font-bold leading-tight tracking-tight">Request Change</span>
            </button>

            <button
              onClick={() => onNavigateTab("ai")}
              className="qa-tile qa-lilac h-[108px] px-1 flex flex-col items-center justify-center gap-2.5"
            >
              <span className="w-12 h-12 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <Sparkles className="w-[22px] h-[22px] text-violet-600 dark:text-violet-300" strokeWidth={2.1} />
              </span>
              <span className="text-[12px] font-bold leading-tight tracking-tight">Ask AI Assistant</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => onNavigateTab("timetable")}
              className="qa-tile qa-lilac h-[96px] px-2 flex flex-col items-center justify-center gap-2"
            >
              <span className="w-11 h-11 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-violet-600 dark:text-violet-300" strokeWidth={2.1} />
              </span>
              <span className="text-[12px] font-bold leading-tight tracking-tight">View Full Schedule</span>
            </button>

            <button
              onClick={() => onNavigateTab("analytics")}
              className="qa-tile qa-rose h-[96px] px-2 flex flex-col items-center justify-center gap-2"
            >
              <span className="w-11 h-11 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500 fill-red-500/15" strokeWidth={2.2} />
              </span>
              <span className="text-[12px] font-bold leading-tight tracking-tight">View Conflicts</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
