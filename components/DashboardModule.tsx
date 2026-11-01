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
  ShieldCheck,
} from "lucide-react";
import CountUp from "@/components/ui/CountUp";
import Skeleton from "@/components/ui/Skeleton";

function renderNum(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? (
    <CountUp value={v} />
  ) : (
    <>{v === undefined || v === null ? "—" : String(v)}</>
  );
}

interface DashboardModuleProps {
  onNavigateTab: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

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
    <svg viewBox="0 0 200 60" preserveAspectRatio="none" className={`absolute pointer-events-none ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L200 60 L0 60 Z`} fill={`url(#spark-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
    </svg>
  );
}

export default function DashboardModule({ onNavigateTab, isDark = false }: DashboardModuleProps) {
  const [greeting, setGreeting] = useState("Welcome back");
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 16 || hour < 4) setGreeting("Good evening");
    else if (hour >= 12) setGreeting("Good afternoon");
    else setGreeting("Good morning");

    fetch("/api/cit/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Unable to load dashboard statistics");
        return r.json();
      })
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setStats(d);
      })
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Hero Banner */}
      <section
        className={`hero-sheen relative overflow-hidden rounded-[22px] text-white min-h-[210px] md:min-h-[230px] flex items-start md:items-center ${
          isDark
            ? "bg-gradient-to-r from-[#030B1F] via-[#07153A] to-[#0B1F58]"
            : "bg-gradient-to-r from-[#0A2570] via-[#123C9C] to-[#2160CF]"
        }`}
        style={{ boxShadow: isDark ? "0 14px 40px rgba(0,0,0,.45)" : "0 14px 40px rgba(18,58,130,.28)" }}
      >
        <div
          className="hero-img hero-kenburns absolute bottom-0 right-0 h-[58%] w-full md:h-full md:w-[72%] bg-cover bg-[position:72%_100%] md:bg-right transition-[background-image] duration-300"
          style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
          role="img"
          aria-label="CIT campus architecture"
        />
        <div className="relative z-10 px-6 pt-6 pb-4 sm:px-10 md:py-0 max-w-[560px] space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-extrabold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>0 Hard Clashes Certified &bull; Official Timetable</span>
          </div>

          <h1 className="anim-fade-up font-heading font-extrabold tracking-tight text-[28px] sm:text-[38px] leading-none flex items-center gap-2.5 text-white">
            <span>{greeting}</span>
            <span aria-hidden="true" className="inline-block origin-[70%_70%] animate-[wave_2.6s_ease-in-out_infinite]">
              👋
            </span>
          </h1>

          <p className="anim-fade-up text-sm sm:text-[17px] font-bold text-white/95 leading-snug">
            Welcome to CIT Campus Scheduler
          </p>

          <p className="anim-fade-up text-xs sm:text-[13px] font-medium text-sky-100/90 tracking-wide">
            Plan. Organize. Excel. &bull; A Well-Planned Campus
          </p>
        </div>
      </section>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Sessions Count */}
        <div className="kpi-card kpi-blue p-4 sm:p-5 sm:min-h-[145px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#DCE9FF] dark:bg-[#15366B] flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-300" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[14px] sm:text-[15px] font-bold leading-tight">This Week</div>
              <div className="mt-1 flex items-baseline gap-1.5 sm:block">
                <div className="text-[28px] sm:text-[34px] leading-none font-heading font-extrabold tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : stats ? renderNum(stats.sessionsCount) : "—"}
                </div>
                <div className="text-xs sm:mt-1.5 text-[var(--ink)]/80 font-semibold sm:font-medium">Total Sessions</div>
              </div>
            </div>
          </div>
          <Sparkline id="week" color="#3B82F6" variant="rise" className="right-0 bottom-0 w-[42%] sm:w-[62%] h-[44%] sm:h-[48%]" />
        </div>

        {/* Rooms In Use */}
        <div className="kpi-card kpi-violet p-4 sm:p-5 sm:min-h-[145px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#E4DCFF] dark:bg-[#2E2A6B] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-violet-600 dark:text-violet-300" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] sm:text-[15px] font-bold leading-tight">Rooms in Use</div>
              <div className="mt-1 text-[28px] sm:text-[34px] leading-none font-heading font-extrabold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-24" /> : stats ? <>{renderNum(stats.roomsInUse)} / {renderNum(stats.roomsTotal)}</> : "—"}
              </div>
              <div className="mt-2 sm:mt-1.5 flex items-center gap-3">
                <span className="text-xs font-medium text-[var(--ink)]/80 whitespace-nowrap">
                  {stats ? `${stats.capacityPercent}% Active` : "20.8% Utilized"}
                </span>
                <div className="sm:hidden flex-1 h-1.5 rounded-full bg-violet-200 dark:bg-violet-900/60 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${stats?.capacityPercent ?? 20}%` }} />
                </div>
              </div>
            </div>
          </div>
          <Sparkline id="rooms" color="#7C5CF0" variant="wave" className="hidden sm:block left-0 bottom-0 w-full h-[34%]" />
        </div>

        {/* Pending Approvals */}
        <div className="kpi-card kpi-green p-4 sm:p-5 sm:min-h-[145px] flex flex-col justify-between">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#D3F3E2] dark:bg-[#134B45] flex items-center justify-center shrink-0">
              <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-xs">
                <Check className="w-[18px] h-[18px] text-white" strokeWidth={3.4} />
              </span>
            </div>
            <div>
              <div className="text-[14px] sm:text-[15px] font-bold leading-tight">Pending Approvals</div>
              <div className="mt-1 text-[28px] sm:text-[34px] leading-none font-heading font-extrabold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-14" /> : stats ? renderNum(stats.pendingApprovals) : "—"}
              </div>
            </div>
          </div>

          <div className="pt-2 sm:pl-[70px]">
            <button
              onClick={() => onNavigateTab("spectra")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {/* Spectra Week */}
        <div className="kpi-card kpi-amber p-4 sm:p-5 sm:min-h-[145px]">
          <div className="relative z-10 flex items-center sm:items-start gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#FFE3C4] dark:bg-[#4A3320] flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] sm:text-[14px] font-bold leading-tight text-[var(--muted)]">Spectra Week</div>
              <div className="mt-1 text-[18px] sm:text-[20px] xl:text-[22px] leading-tight font-heading font-extrabold tracking-tight text-[var(--ink)]">
                Event Calendar
              </div>
              <div className="text-[11.5px] sm:mt-1 text-[var(--ink)]/80 font-semibold truncate">
                P10–P13 Evening Windows
              </div>
            </div>
          </div>
          <Sparkline id="spectra" color="#F59E0B" variant="climb" className="right-0 bottom-0 w-[70%] h-[40%] sm:h-[44%]" />
        </div>
      </div>

      {/* 3. Lower Content: Schedule Preview + Responsive Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 sm:gap-5 items-stretch">
        <section
          className="p-4 sm:p-6 rounded-[20px] border bg-[var(--surface)]"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex justify-between items-center gap-3 mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <CalendarDays className="w-5 h-5 text-[#15264F] dark:text-slate-100" strokeWidth={2} />
              <h2 className="font-heading font-extrabold text-[15px] sm:text-[17px]">Live Schedule Preview</h2>
            </div>
            <button
              onClick={() => onNavigateTab("timetable")}
              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          </div>

          <div>
            {isLoading && (
              <div className="space-y-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}
            {!isLoading && !stats && (
              <p className="py-5 text-sm text-[var(--muted)]">Live schedule preview unavailable.</p>
            )}
            {!isLoading && stats && (stats.previewRows || []).length === 0 && (
              <p className="py-5 text-sm text-[var(--muted)]">No schedule preview available.</p>
            )}
            {(stats?.previewRows || []).map((row: any, i: number) => (
              <div
                key={i}
                className="anim-fade-up grid grid-cols-[80px_1fr] sm:grid-cols-[140px_1fr] items-center py-3 border-t first:border-t-0 rounded-lg hover:bg-[var(--row-hover)] transition-colors text-xs sm:text-[13px]"
                style={{ borderColor: "var(--border)", "--i": i } as React.CSSProperties}
              >
                <span className="font-medium pl-1 text-[var(--muted)]">{row.date}</span>
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <span className={`w-[3px] h-4 sm:h-5 rounded-full shrink-0 ${row.bar}`} />
                  <span className={`font-heading font-extrabold w-6 shrink-0 ${row.color}`}>{row.period}</span>
                  <span className="truncate">
                    <span className="font-bold text-[var(--ink)]">{row.title}</span>
                    <span className="text-[var(--muted)] font-medium"> &ndash; {row.room}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions (Responsive Grid) */}
        <section
          className="p-4 sm:p-6 rounded-[20px] border bg-[var(--surface)] flex flex-col justify-between"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2.5 mb-3.5">
            <LayoutGrid className="w-5 h-5 text-[#15264F] dark:text-slate-100" strokeWidth={2} />
            <h2 className="font-heading font-extrabold text-[15px] sm:text-[17px]">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-3 max-[480px]:grid-cols-1 gap-2 sm:gap-3">
            <button
              onClick={() => onNavigateTab("venues")}
              className="qa-tile qa-blue min-h-[96px] p-2 flex flex-col items-center justify-center gap-1.5 transition"
            >
              <span className="w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-300" strokeWidth={2.1} />
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold text-center leading-tight">Book Venue</span>
            </button>

            <button
              onClick={() => onNavigateTab("changes")}
              className="qa-tile qa-peach min-h-[96px] p-2 flex flex-col items-center justify-center gap-1.5 transition"
            >
              <span className="w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-orange-500" strokeWidth={2.3} />
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold text-center leading-tight">Reschedule</span>
            </button>

            <button
              onClick={() => onNavigateTab("ai")}
              className="qa-tile qa-lilac min-h-[96px] p-2 flex flex-col items-center justify-center gap-1.5 transition"
            >
              <span className="w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-300" strokeWidth={2.1} />
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold text-center leading-tight">AI Copilot</span>
            </button>
          </div>

          <div className="grid grid-cols-2 max-[480px]:grid-cols-1 gap-2 sm:gap-3 mt-2.5">
            <button
              onClick={() => onNavigateTab("timetable")}
              className="qa-tile qa-lilac min-h-[84px] p-2 flex flex-col items-center justify-center gap-1.5 transition"
            >
              <span className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-violet-600 dark:text-violet-300" strokeWidth={2.1} />
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold text-center leading-tight">Full Schedule</span>
            </button>

            <button
              onClick={() => onNavigateTab("analytics")}
              className="qa-tile qa-rose min-h-[84px] p-2 flex flex-col items-center justify-center gap-1.5 transition"
            >
              <span className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={2.2} />
              </span>
              <span className="text-[11px] sm:text-[12px] font-bold text-center leading-tight">0 Conflicts Audit</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}