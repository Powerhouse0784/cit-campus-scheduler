"use client";

import React, { useState } from "react";
import {
  ArrowLeftRight,
  AlertTriangle,
  Send,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Check,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";

interface ReschedulingStudioModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

interface Row {
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  changed?: boolean;
}

/** Illustrative sample rows from the design kit; not live schedule versions. */
const CURRENT: Row[] = [
  { day: "Mon, 27 Oct", time: "09:00 – 10:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1" },
  { day: "Mon, 27 Oct", time: "10:00 – 11:00", subject: "Physics", faculty: "Dr. Verma", room: "LH-2" },
  { day: "Mon, 27 Oct", time: "11:00 – 12:00", subject: "Chemistry", faculty: "Dr. Khan", room: "Lab-1" },
  { day: "Tue, 28 Oct", time: "09:00 – 10:00", subject: "Computer Science", faculty: "Dr. Patel", room: "CS-201" },
  { day: "Tue, 28 Oct", time: "10:00 – 11:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1" },
];

const PROPOSED: Row[] = [
  { day: "Mon, 27 Oct", time: "09:00 – 10:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1" },
  { day: "Mon, 27 Oct", time: "10:00 – 11:00", subject: "Chemistry", faculty: "Dr. Khan", room: "LH-2", changed: true },
  { day: "Mon, 27 Oct", time: "11:00 – 12:00", subject: "Physics", faculty: "Dr. Verma", room: "Lab-2", changed: true },
  { day: "Tue, 28 Oct", time: "09:00 – 10:00", subject: "Computer Science", faculty: "Dr. Patel", room: "CS-201" },
  { day: "Tue, 28 Oct", time: "10:00 – 11:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1" },
];

const STEPS = [
  { label: ["Request", "Submitted"], state: "done" },
  { label: ["Coordinator", "Review"], state: "active" },
  { label: ["Faculty", "Approval"], state: "todo" },
  { label: ["Final", "Update"], state: "todo" },
] as const;

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */
function TimetableTable({ rows, highlight }: { rows: Row[]; highlight: boolean }) {
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl">
        <table className="w-full text-[12.5px] text-left">
          <thead>
            <tr className="font-bold" style={{ background: "var(--search-bg)" }}>
              {["Day", "Time", "Subject", "Faculty", "Room"].map((h) => (
                <th key={h} className="px-2.5 py-2.5 first:rounded-l-lg last:rounded-r-lg">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const hl = highlight && r.changed;
              return (
                <tr
                  key={i}
                  className={`border-b last:border-b-0 transition-colors ${hl ? "" : "hover:bg-[var(--row-hover)]"}`}
                  style={{
                    borderColor: "var(--border)",
                    background: hl ? "rgba(37,99,235,.09)" : undefined,
                  }}
                >
                  <td className="px-2.5 py-2.5 font-medium whitespace-nowrap">{r.day}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">{r.time}</td>
                  <td className={`px-2.5 py-2.5 whitespace-nowrap font-semibold ${hl ? "text-blue-700 dark:text-sky-300" : ""}`}>
                    {r.subject}
                    {hl && <span className="sr-only"> (changed)</span>}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">{r.faculty}</td>
                  <td className={`px-2.5 py-2.5 font-semibold whitespace-nowrap ${hl ? "text-blue-700 dark:text-sky-300" : ""}`}>{r.room}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <ul className="sm:hidden space-y-2">
        {rows.map((r, i) => {
          const hl = highlight && r.changed;
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: hl ? "#93B4F5" : "var(--border)",
                background: hl ? "rgba(37,99,235,.09)" : "var(--surface)",
              }}
            >
              <span className="w-10 h-10 rounded-full bg-[#E4EDFF] dark:bg-[#14264B] flex items-center justify-center shrink-0">
                <BookOpen className="w-[18px] h-[18px] text-blue-600 dark:text-sky-300" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[12px] font-bold">{r.day} · {r.time}</span>
                <span className="block text-[13px] font-semibold truncate">
                  {r.subject} <span className="text-[var(--muted)] font-medium">· {r.faculty} · {r.room}</span>
                </span>
                {hl && <span className="block text-[11px] font-bold text-blue-700 dark:text-sky-300 mt-0.5">Changed</span>}
              </span>
              <ChevronRight className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */
export default function ReschedulingStudioModule({ isDark = false }: ReschedulingStudioModuleProps) {
  const [week, setWeek] = useState("This Week");
  const [compare, setCompare] = useState(true);
  const [details, setDetails] = useState(false);
  const [notice, setNotice] = useState("");

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)" : "var(--shadow-card)",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-[22px] text-white min-h-[210px] md:min-h-[150px] lg:min-h-[158px] flex items-start md:items-center"
        style={{
          background: isDark
            ? "linear-gradient(100deg,#030B1F 0%,#07153A 45%,#0B1F58 100%)"
            : "linear-gradient(100deg,#0A2570 0%,#123C9C 38%,#2160CF 64%,#4B93EE 100%)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(56,130,255,.55), 0 14px 40px rgba(0,60,200,.28)"
            : "0 14px 40px rgba(18,58,130,.28)",
        }}
      >
        <div
          className="hero-img absolute bottom-0 right-0 h-[42%] w-full md:h-full md:w-[62%] bg-cover bg-[position:72%_100%] md:bg-[position:center_62%]"
          style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
          role="img"
          aria-label="CIT campus"
        />
        <div className="relative z-10 px-5 pt-5 pb-4 sm:px-8 md:py-0 max-w-[600px]">
          <h1 className="font-serif-heading font-bold tracking-tight text-[28px] sm:text-[38px] leading-[1.05]">
            Rescheduling Studio
          </h1>
          <p className="mt-2 text-[13px] sm:text-[15px] font-medium text-white/95 leading-snug">
            Compare Timetables. Get Approvals. Keep Campus in Sync.
          </p>
          <button
            onClick={() => document.getElementById("resched-workspace")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-bold text-white border border-sky-300/70 bg-[#0B2A78]/80 hover:bg-[#12389A] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            style={{ boxShadow: "0 0 16px rgba(80,160,255,.45)" }}
          >
            Start Rescheduling <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 -rotate-6 text-right z-10 pointer-events-none">
          <div className="font-serif-heading italic font-semibold text-[30px] leading-[1.02] [text-shadow:0_2px_10px_rgba(0,15,70,.95)]">
            Smart
            <br />
            Planning!
          </div>
          <svg viewBox="0 0 150 10" className="ml-auto mt-1 w-28 h-2.5" aria-hidden="true">
            <path d="M3 7C40 2 100 2 147 5" stroke="#F5B731" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </section>

      <p className="text-[11.5px] text-[var(--muted)] font-medium -mb-2" role="note">
        Prototype preview · both timetables contain illustrative sample rows and are not live schedule versions.
      </p>

      {/* COMPARISON WORKSPACE */}
      <div id="resched-workspace" className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-start gap-4 scroll-mt-4">
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="cur-h">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 id="cur-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[17px]">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.2} />
              Current Timetable
            </h2>
            <div className="relative">
              <select
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                aria-label="Select week"
                className="appearance-none h-8 pl-3.5 pr-7 rounded-full text-[12px] font-bold border focus:outline-none cursor-pointer text-blue-700 dark:text-sky-300"
                style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
              >
                <option>This Week</option>
                <option>Next Week</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700 dark:text-sky-300" />
            </div>
          </div>
          <TimetableTable rows={CURRENT} highlight={false} />
        </section>

        {/* Swap / compare connector */}
        <div className="flex lg:self-center justify-center">
          <button
            onClick={() => setCompare((c) => !c)}
            aria-pressed={compare}
            aria-label={compare ? "Hide changed rows" : "Compare changes"}
            title={compare ? "Hide highlighted changes" : "Compare changes"}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            style={{
              background: "linear-gradient(135deg,#155BFF,#2F7BF5)",
              boxShadow: compare ? "0 0 0 6px rgba(47,123,245,.18), 0 10px 26px rgba(21,91,255,.45)" : "0 8px 20px rgba(21,91,255,.3)",
            }}
          >
            <ArrowLeftRight className="w-6 h-6" strokeWidth={2.4} />
          </button>
        </div>

        <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="prop-h">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 id="prop-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[17px]">
              <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.2} />
              Proposed Timetable
            </h2>
            <span className="inline-flex items-center gap-1 h-8 px-3.5 rounded-full text-[12px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
              Optimized <ArrowRight className="w-3 h-3" strokeWidth={2.6} />
            </span>
          </div>
          <TimetableTable rows={PROPOSED} highlight={compare} />
        </section>
      </div>

      {/* LOWER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.25fr_1fr] gap-4 sm:gap-5 items-stretch">
        {/* Conflict alert */}
        <section
          className="relative overflow-hidden rounded-[20px] border p-4 sm:p-5 flex flex-col"
          style={{
            background: isDark ? "linear-gradient(135deg,#3A1226 0%,#1B1238 100%)" : "linear-gradient(135deg,#FFE5EA 0%,#FFF2F4 100%)",
            borderColor: isDark ? "#7A2646" : "#FBC8D2",
            boxShadow: isDark ? "0 0 22px rgba(220,50,90,.18)" : "var(--shadow-card)",
          }}
          aria-labelledby="ca-h"
        >
          <h2 id="ca-h" className="flex items-center gap-2 font-heading font-extrabold text-[15px]">
            <AlertTriangle className="w-5 h-5 text-red-500 fill-red-500/15" strokeWidth={2.3} />
            Conflict Alert
          </h2>
          <div className="mt-2 font-heading font-extrabold text-[22px] text-red-600 dark:text-rose-300 leading-tight">
            1 Conflict Detected
          </div>
          <p className="mt-1 text-[12px] font-medium max-w-[230px]">Physics &amp; Lab-1 are occupied at the same time.</p>
          <AlertTriangle className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-red-500/80" strokeWidth={1.6} aria-hidden="true" />
          <button
            onClick={() => setDetails((d) => !d)}
            aria-expanded={details}
            className="mt-auto self-start translate-y-0 pt-3"
          >
            <span className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-[12px] font-bold border bg-[var(--surface)] text-blue-700 dark:text-sky-300 hover:bg-[var(--row-hover)] transition" style={{ borderColor: "var(--search-border)" }}>
              {details ? "Hide Details" : "View Details"} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </span>
          </button>
          {details && (
            <dl className="mt-3 rounded-xl border p-3 text-[12px] space-y-1.5 bg-[var(--surface)]" style={{ borderColor: "var(--border)" }}>
              <div><dt className="inline font-bold">Type: </dt><dd className="inline">Room overlap</dd></div>
              <div><dt className="inline font-bold">When: </dt><dd className="inline">Mon, 27 Oct · 11:00 – 12:00</dd></div>
              <div><dt className="inline font-bold">Why invalid: </dt><dd className="inline">Lab-1 can host only one session at a time.</dd></div>
              <div><dt className="inline font-bold">Suggested: </dt><dd className="inline">Use Lab-2, which is free in this slot.</dd></div>
              <p className="text-[11px] text-[var(--muted)]">Sample data. No solver result is attached to this preview.</p>
            </dl>
          )}
        </section>

        {/* Approval workflow */}
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="aw-h">
          <h2 id="aw-h" className="font-heading font-extrabold text-[15px] mb-4">Approval Workflow</h2>
          <ol className="relative grid grid-cols-4 text-center">
            <div className="absolute left-[12.5%] right-[12.5%] top-[14px] h-0.5 bg-[var(--border)]" aria-hidden="true" />
            <div className="absolute left-[12.5%] w-[25%] top-[14px] h-0.5 bg-emerald-500" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <li key={i} className="relative flex flex-col items-center">
                <span
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    s.state === "done"
                      ? "bg-emerald-500 text-white"
                      : s.state === "active"
                      ? "bg-blue-600 text-white ring-4 ring-blue-500/25"
                      : "bg-[var(--surface)] border text-[var(--muted)]"
                  }`}
                  style={s.state === "todo" ? { borderColor: "var(--border)" } : undefined}
                >
                  {s.state === "done" ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={`mt-2 text-[11.5px] font-bold leading-tight ${s.state === "todo" ? "text-[var(--muted)]" : ""}`}>
                  {s.label[0]}
                  <br />
                  {s.label[1]}
                </span>
                <span className="sr-only">{s.state === "done" ? "completed" : s.state === "active" ? "current step" : "upcoming"}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Submit */}
        <section
          className="relative overflow-hidden rounded-[20px] p-4 sm:p-5 text-white flex flex-col justify-center min-h-[128px]"
          style={{
            background: "linear-gradient(120deg,#1747D6 0%,#2563EB 55%,#3B82F6 100%)",
            boxShadow: isDark ? "0 0 0 1px rgba(80,150,255,.5), 0 12px 30px rgba(0,60,200,.3)" : "0 14px 30px rgba(21,91,255,.32)",
          }}
        >
          <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-16 h-16 text-white/30" strokeWidth={1.4} aria-hidden="true" />
          <div className="relative pl-[72px]">
            <button
              onClick={() => setNotice("Submission isn't connected in this prototype. Nothing was sent.")}
              className="flex items-center gap-2 font-heading font-extrabold text-[17px] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
            >
              Submit for Approval <ArrowRight className="w-4 h-4" strokeWidth={2.6} />
            </button>
            <p className="mt-1.5 text-[12px] text-white/90 leading-snug max-w-[220px]">
              Your changes will be reviewed by the coordinator.
            </p>
          </div>
          {notice && (
            <p role="status" className="relative mt-3 rounded-lg bg-white/15 px-3 py-2 text-[11.5px] font-semibold flex items-start justify-between gap-2">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss" className="shrink-0"><X className="w-3.5 h-3.5" /></button>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
