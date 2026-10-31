"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  CheckCircle2,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Building2,
  Layers,
  Search,
} from "lucide-react";

interface DashboardModuleProps {
  onNavigateTab: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

export default function DashboardModule({
  onNavigateTab,
  userRole = "admin",
  isDark = false,
}: DashboardModuleProps) {
  const [greeting, setGreeting] = useState("Good Morning, Ritik! 👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 16 || hour < 4) {
      setGreeting("Good Evening, Ritik! 👋");
    } else if (hour >= 12) {
      setGreeting("Good Afternoon, Ritik! 👋");
    } else {
      setGreeting("Good Morning, Ritik! 👋");
    }
  }, []);

  // 4 Top KPI Cards matching screenshot
  const kpis = [
    {
      id: "sessions",
      label: "THIS WEEK",
      value: "28",
      sub: "Sessions",
      icon: Calendar,
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      stroke: "#2563EB",
    },
    {
      id: "rooms",
      label: "ROOMS IN USE",
      value: "42 / 60",
      sub: "70% Capacity",
      icon: Building2,
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
      stroke: "#9333EA",
      showProgress: true,
    },
    {
      id: "approvals",
      label: "PENDING APPROVALS",
      value: "12",
      sub: "View Details →",
      subAction: () => onNavigateTab("spectra"),
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      isClickable: true,
    },
    {
      id: "spectra",
      label: "SPECTRA WEEK",
      value: "In 7 Days",
      sub: "Event readiness",
      icon: Star,
      iconBg: "bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400",
      stroke: "#F59E0B",
    },
  ];

  // Your Timetable rows matching screenshot
  const timetableRows = [
    {
      date: "Mon, 27 Oct",
      period: "P1",
      periodColor: "border-blue-500 text-blue-600 dark:text-blue-400",
      title: "Math Lecture – 316",
    },
    {
      date: "Mon, 27 Oct",
      period: "P2",
      periodColor: "border-purple-500 text-purple-600 dark:text-purple-400",
      title: "DSA Tutorial – 201",
    },
    {
      date: "Mon, 27 Oct",
      period: "P4",
      periodColor: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
      title: "Physics Lab – Lab 1",
    },
    {
      date: "Mon, 27 Oct",
      period: "P6",
      periodColor: "border-amber-500 text-amber-600 dark:text-amber-400",
      title: "Web Dev – 405",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. PHOTOREALISTIC CAMPUS HERO BANNER (DAY / NIGHT AWARE) */}
      <section
        className={`relative overflow-hidden rounded-2xl text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-r from-[#071330] via-[#0E2872] to-[#16439E]"
            : "bg-gradient-to-r from-[#102A63] via-[#1D4ED8] to-[#2563EB]"
        }`}
      >
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight mb-2">
            {greeting}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-blue-100 mb-1">
            Welcome to CIT Campus Scheduler
          </p>
          <div className="relative inline-block mt-1">
            <span className="text-xs sm:text-sm text-blue-200 font-medium">
              Smart Scheduling. A Better Campus.
            </span>
            {/* Signature Golden Swoosh Curve from reference image */}
            <svg
              className="absolute -bottom-2 left-0 w-36 h-3 text-amber-400"
              viewBox="0 0 140 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 7C40 2 95 2 138 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Right Campus Architecture Artwork / 3D Building Graphic */}
        <div className="relative z-10 hidden sm:flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-white/20 shadow-lg">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-blue-500/20 border border-white/30 flex items-center justify-center text-3xl shadow-sm">
            🏛️
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              Chilika Institute of Technology
            </div>
            <div className="text-sm font-extrabold text-white">Main Campus Green</div>
            <div className="text-[10px] text-blue-200">Admin Block • Lecture Complex</div>
          </div>
        </div>

        {/* Soft Ambient Glow */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. 4 SUMMARY KPI CARDS (MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.subAction}
              className={`p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between hover:shadow-card transition ${
                card.isClickable ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-[var(--muted)] tracking-wider">
                  {card.label}
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
                  {card.value}
                </div>

                {card.subAction ? (
                  <button
                    onClick={card.subAction}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    <span>{card.sub}</span>
                  </button>
                ) : (
                  <div className="text-xs text-[var(--muted)] font-medium mt-0.5">
                    {card.sub}
                  </div>
                )}
              </div>

              {/* Progress bar or Sparkline */}
              {card.showProgress ? (
                <div className="w-full bg-[var(--border)] h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-purple-600 h-full rounded-full w-[70%]" />
                </div>
              ) : card.stroke ? (
                <div className="w-full h-5 mt-2">
                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path
                      d="M0,15 Q25,2 50,12 T100,5"
                      fill="none"
                      stroke={card.stroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* 3. LOWER SECTION: YOUR TIMETABLE + QUICK ACTIONS (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        {/* Left Column: Your Timetable Preview */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-extrabold text-sm font-heading">
                Your Timetable
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("timetable")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {timetableRows.map((row, i) => (
              <div
                key={i}
                className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[var(--brand-50)]/40 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--muted)] min-w-[75px]">
                    {row.date}
                  </span>
                  {/* Period Pill with colored bar */}
                  <span
                    className={`pl-2 border-l-2 font-black text-xs ${row.periodColor}`}
                  >
                    {row.period}
                  </span>
                  <span className="font-bold text-[var(--ink)]">
                    {row.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Actions 5-Button Grid */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-600/10 text-blue-600 font-black text-xs">
              ⚡
            </span>
            <h2 className="font-extrabold text-sm font-heading">
              Quick Actions
            </h2>
          </div>

          {/* Upper Row: 3 Actions */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Book Venue */}
            <button
              onClick={() => onNavigateTab("venues")}
              className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 hover:border-blue-500 transition text-center flex flex-col items-center justify-center gap-2 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[var(--ink)] leading-tight">
                Book Venue
              </span>
            </button>

            {/* 2. Request Change */}
            <button
              onClick={() => onNavigateTab("changes")}
              className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 hover:border-amber-500 transition text-center flex flex-col items-center justify-center gap-2 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[var(--ink)] leading-tight">
                Request Change
              </span>
            </button>

            {/* 3. Ask AI Assistant */}
            <button
              onClick={() => onNavigateTab("ai")}
              className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 hover:border-purple-500 transition text-center flex flex-col items-center justify-center gap-2 group shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[var(--ink)] leading-tight">
                Ask AI Assistant
              </span>
            </button>
          </div>

          {/* Lower Row: 2 Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 4. View Timetable / Calendar */}
            <button
              onClick={() => onNavigateTab("timetable")}
              className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 hover:border-purple-500 transition flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-[var(--ink)]">
                View Timetable
              </span>
            </button>

            {/* 5. View Conflicts (Rose Alert) */}
            <button
              onClick={() => onNavigateTab("analytics")}
              className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:border-rose-500 transition flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                View Conflicts
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}