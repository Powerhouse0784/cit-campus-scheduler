"use client";

import React, { useState } from "react";
import {
  Download,
  Clock,
  Calendar,
  CheckCircle2,
  IdCard,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ExamsModule() {
  const [selectedSemester, setSelectedSemester] = useState("Semester 5");
  const [selectedDateFilter, setSelectedDateFilter] = useState("Tue Nov 04");

  // Real CIT midsem exam schedule rows mapped with halved room capacity allocations
  const examSchedule = [
    {
      date: "04 Nov 2026",
      dayKey: "Tue Nov 04",
      time: "09:00 – 12:00",
      subject: "Data Structures",
      courseCode: "CS301",
      room: "LH-2",
      seat: "B14",
    },
    {
      date: "06 Nov 2026",
      dayKey: "Thu Nov 06",
      time: "09:00 – 12:00",
      subject: "Database Systems",
      courseCode: "CS302",
      room: "Lab-1",
      seat: "A08",
    },
    {
      date: "09 Nov 2026",
      dayKey: "Sun Nov 09",
      time: "14:00 – 17:00",
      subject: "Computer Networks",
      courseCode: "CS303",
      room: "LH-1",
      seat: "C21",
    },
    {
      date: "11 Nov 2026",
      dayKey: "Tue Nov 11",
      time: "09:00 – 12:00",
      subject: "Operating Systems",
      courseCode: "CS304",
      room: "LH-3",
      seat: "B09",
    },
    {
      date: "13 Nov 2026",
      dayKey: "Thu Nov 13",
      time: "09:00 – 12:00",
      subject: "Calculus & Linear Algebra",
      courseCode: "MA101",
      room: "AUD, LH-1",
      seat: "D12",
    },
  ];

  const datePills = [
    { id: "Mon Nov 02", label: "Mon", date: "Nov 02" },
    { id: "Tue Nov 04", label: "Tue", date: "Nov 04" },
    { id: "Thu Nov 06", label: "Thu", date: "Nov 06" },
    { id: "Sun Nov 09", label: "Sun", date: "Nov 09" },
    { id: "Tue Nov 11", label: "Tue", date: "Nov 11" },
  ];

  const handleDownload = () => {
    alert("Downloading official Mid-Semester Examination Timetable 2026 (PDF)...");
  };

  return (
    <div className="space-y-6">
      {/* 1. WIDESCREEN HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1E4E] via-[#1546AF] to-[#2563EB] text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Mid-Semester Exams
          </h1>
          <p className="text-sm font-semibold text-blue-200 mb-4">
            Your exam plan, clearly organized.
          </p>
          <button
            onClick={() => setSelectedDateFilter("Tue Nov 04")}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md flex items-center gap-2 group"
          >
            View My Schedule
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Neon Handwritten Callout ("Good Luck!") */}
        <div className="relative z-10 text-right hidden sm:block">
          <div className="text-3xl lg:text-4xl font-extrabold italic font-serif-heading text-white drop-shadow-[0_2px_12px_rgba(37,99,235,0.7)] tracking-wide">
            Good
            <br />
            Luck!
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full ml-auto mt-2" />
        </div>

        {/* Soft glowing ambient lighting */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-blue-400/20 to-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. CONTROLS & KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[auto_auto_auto_1fr] gap-3 items-center">
        {/* KPI: First Exam */}
        <div className="p-3.5 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
              First Exam In
            </div>
            <div className="text-base font-black font-heading leading-tight">6 days</div>
          </div>
          <Clock className="w-4 h-4 text-[var(--muted)] ml-auto" />
        </div>

        {/* Semester Selector */}
        <div className="relative">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs font-extrabold text-[var(--ink)] focus:outline-none cursor-pointer shadow-xs"
          >
            <option value="Semester 1">Semester 1 (Year 1)</option>
            <option value="Semester 3">Semester 3 (Year 2)</option>
            <option value="Semester 5">Semester 5 (Year 3)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Date Range Selector */}
        <div className="p-3.5 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs font-extrabold text-[var(--ink)] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>04 – 11 Nov 2026</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
        </div>

        {/* Download Timetable Primary Button */}
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Timetable
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: SCHEDULE TABLE + ESSENTIALS SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-5 items-start">
        {/* Left Column: Exam Schedule Table */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          {/* Header & Date Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold font-heading uppercase tracking-wider">
                Exam Schedule
              </h3>
            </div>

            <button
              onClick={() => setSelectedDateFilter("all")}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              View Calendar →
            </button>
          </div>

          {/* Date Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {datePills.map((pill) => {
              const isActive = selectedDateFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedDateFilter(pill.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 text-center ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <div className="text-[10px] leading-none opacity-85">{pill.label}</div>
                  <div className="text-xs font-black mt-0.5">{pill.date}</div>
                </button>
              );
            })}
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--brand-50)] dark:bg-slate-800 text-[var(--muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Course Code</th>
                  <th className="p-3">Room</th>
                  <th className="p-3 text-right">Seat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {examSchedule.map((row) => {
                  const isHighlighted = selectedDateFilter === row.dayKey;
                  return (
                    <tr
                      key={row.courseCode}
                      className={`transition ${
                        isHighlighted
                          ? "bg-blue-50/50 dark:bg-blue-950/30"
                          : "hover:bg-blue-50/20 dark:hover:bg-slate-800/20"
                      }`}
                    >
                      <td className="p-3 font-extrabold whitespace-nowrap">{row.date}</td>
                      <td className="p-3 whitespace-nowrap text-[var(--muted)]">{row.time}</td>
                      <td className="p-3 font-bold text-[var(--ink)]">{row.subject}</td>
                      <td className="p-3 font-semibold text-[var(--muted)]">{row.courseCode}</td>
                      <td className="p-3 font-extrabold text-blue-600 dark:text-blue-400">
                        {row.room}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {row.seat}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              All exam venues seat at 50% capacity according to official CIT regulations.
            </span>
          </div>
        </div>

        {/* Right Column: Exam Essentials & Important Notices */}
        <aside className="space-y-4">
          {/* Exam Essentials */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider font-heading">
                Exam Essentials
              </h4>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">Admit Card Ready</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2.5">
                <IdCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold">Bring College ID</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold">Reporting 30 min Early</span>
              </div>
            </div>
          </div>

          {/* Important Notices Alert Box (matching pink/red notice from mockup) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Important notices</span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
              No electronic devices allowed in exam hall. Violations lead to immediate disqualification.
            </p>
            <button className="text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:underline block pt-1">
              View All →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}