"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  ChevronDown,
  Download,
  ArrowRight,
  ShieldCheck,
  Check,
  IdCard,
  AlarmClock,
  Megaphone,
} from "lucide-react";

interface ExamsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

interface Exam {
  iso: string; // YYYY-MM-DD
  time: string;
  subject: string;
  code: string;
  room: string;
  seat: string;
}

/** Sample data from the design kit. Replace with validated live exam data. */
const EXAMS_BY_SEM: Record<number, Exam[]> = {
  5: [
    { iso: "2026-11-04", time: "09:00 – 12:00", subject: "Data Structures", code: "CS301", room: "LH-2", seat: "B14" },
    { iso: "2026-11-06", time: "09:00 – 12:00", subject: "Database Systems", code: "CS302", room: "Lab-1", seat: "A08" },
    { iso: "2026-11-09", time: "14:00 – 17:00", subject: "Computer Networks", code: "CS303", room: "LH-1", seat: "C21" },
    { iso: "2026-11-11", time: "09:00 – 12:00", subject: "Operating Systems", code: "CS304", room: "LH-3", seat: "B09" },
  ],
};

const toDate = (iso: string) => new Date(`${iso}T00:00:00`);
const fmtLong = (iso: string) =>
  toDate(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ");
const fmtChipTop = (iso: string) => toDate(iso).toLocaleDateString("en-GB", { weekday: "short" });
const fmtChipBottom = (iso: string) =>
  toDate(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });

const ESSENTIALS = [
  { id: "admit", label: "Admit Card Ready", Icon: Check, tone: "#10B981" },
  { id: "id", label: "Bring College ID", Icon: IdCard, tone: "#2563EB" },
  { id: "early", label: "Reporting 30 min Early", Icon: AlarmClock, tone: "#F97316" },
];

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
function Hero({ isDark, onView }: { isDark: boolean; onView: () => void }) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px] text-white min-h-[200px] md:min-h-[150px] lg:min-h-[158px] flex items-start md:items-center"
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
        className="hero-img absolute bottom-0 right-0 h-[44%] w-full md:h-full md:w-[60%] bg-cover bg-[position:72%_100%] md:bg-[position:center_62%]"
        style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
        role="img"
        aria-label="CIT campus"
      />
      <div className="relative z-10 px-5 pt-5 pb-4 sm:px-8 md:py-0 max-w-[560px]">
        <h1 className="font-serif-heading font-bold tracking-tight text-[28px] sm:text-[40px] leading-[1.05]">
          Mid-Semester Exams
        </h1>
        <p className="mt-2 text-[13px] sm:text-[16px] font-medium text-white/95">Your exam plan, clearly organized.</p>
        <button
          onClick={onView}
          className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-bold text-white border border-sky-300/70 bg-[#0B2A78]/80 hover:bg-[#12389A] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          style={{ boxShadow: "0 0 16px rgba(80,160,255,.45)" }}
        >
          View My Schedule <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
      <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 -rotate-6 text-right z-10 pointer-events-none">
        <div className="font-serif-heading italic font-semibold text-[30px] leading-[1.02] [text-shadow:0_2px_10px_rgba(0,15,70,.95)]">
          Good
          <br />
          Luck!
        </div>
        <svg viewBox="0 0 150 10" className="ml-auto mt-1 w-24 h-2.5" aria-hidden="true">
          <path d="M3 7C40 2 100 2 147 5" stroke="#F5B731" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */
export default function ExamsModule({ onNavigateTab, isDark = false }: ExamsModuleProps) {
  const [semester, setSemester] = useState(5);
  const [day, setDay] = useState<string>("all");
  const [checked, setChecked] = useState<string[]>(["admit"]);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => setToday(new Date()), []);

  const exams = useMemo(() => EXAMS_BY_SEM[semester] ?? [], [semester]);
  const dates = useMemo(() => Array.from(new Set(exams.map((e) => e.iso))), [exams]);
  const visible = day === "all" ? exams : exams.filter((e) => e.iso === day);

  // Reset a stale date filter when the semester changes
  useEffect(() => setDay("all"), [semester]);

  const countdown = useMemo(() => {
    if (!today || exams.length === 0) return null;
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const upcoming = exams.map((e) => Math.round((toDate(e.iso).getTime() - t0) / 86400000)).filter((d) => d >= 0);
    return upcoming.length ? Math.min(...upcoming) : -1;
  }, [today, exams]);

  const range = exams.length
    ? `${toDate(exams[0].iso).toLocaleDateString("en-GB", { day: "2-digit" })} – ${fmtLong(exams[exams.length - 1].iso)}`
    : "No dates yet";

  const downloadCsv = () => {
    const rows = [
      "Date,Time,Subject,Course Code,Room,Seat",
      ...exams.map((e) => `${fmtLong(e.iso)},${e.time},${e.subject},${e.code},${e.room},${e.seat}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-timetable-sem${semester}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)" : "var(--shadow-card)",
  };
  const pill = "h-12 rounded-2xl border flex items-center gap-3 px-4 font-heading font-extrabold text-[15px]";
  const pillStyle: React.CSSProperties = {
    background: "var(--surface)",
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 14px rgba(30,100,220,.18)" : "0 4px 14px rgba(25,55,115,.06)",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Hero isDark={isDark} onView={() => document.getElementById("exam-schedule")?.scrollIntoView({ behavior: "smooth" })} />

      {/* Summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1.2fr_auto] gap-3 sm:gap-4 items-center">
        <div className={`${pill} !h-[60px]`} style={pillStyle}>
          <span className="w-10 h-10 rounded-xl bg-[#DCE9FF] dark:bg-[#15366B] flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-300" strokeWidth={2.2} />
          </span>
          <span className="leading-tight flex-1">
            <span className="block text-[12.5px] font-semibold font-sans">First exam in</span>
            <span className="block text-[19px]">
              {countdown === null ? "—" : countdown < 0 ? "Completed" : countdown === 0 ? "Today" : `${countdown} day${countdown === 1 ? "" : "s"}`}
            </span>
          </span>
          <Clock className="w-7 h-7 text-blue-300 dark:text-sky-400/70" strokeWidth={1.8} />
        </div>

        <label className={`${pill} relative !h-[60px] cursor-pointer`} style={pillStyle}>
          <GraduationCap className="w-5 h-5 text-blue-600 dark:text-sky-300" strokeWidth={2.2} />
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            aria-label="Semester"
            className="appearance-none bg-transparent flex-1 font-heading font-extrabold focus:outline-none cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 pointer-events-none" />
        </label>

        <div className={`${pill} !h-[60px]`} style={pillStyle}>
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-300" strokeWidth={2.2} />
          <span className="flex-1">{range}</span>
          <ChevronDown className="w-4 h-4" />
        </div>

        <button
          onClick={downloadCsv}
          disabled={exams.length === 0}
          className="h-[60px] px-6 rounded-2xl text-white font-heading font-extrabold text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-50 transition hover:-translate-y-0.5"
          style={{ background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 10px 22px rgba(21,91,255,.35)" }}
        >
          <Download className="w-5 h-5" strokeWidth={2.4} />
          Download Timetable
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 sm:gap-5 items-start">
        {/* Schedule */}
        <section id="exam-schedule" className={`${panel} p-4 sm:p-5 scroll-mt-4`} style={panelStyle} aria-labelledby="ex-h">
          <h2 id="ex-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[18px] mb-3.5">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.3} />
            Exam Schedule
          </h2>

          {exams.length > 0 && (
            <div className="flex items-stretch gap-2 sm:gap-2.5 overflow-x-auto pb-1 mb-4">
              {[{ iso: "all" }, ...dates.map((iso) => ({ iso }))].map((d) => {
                const active = day === d.iso;
                return (
                  <button
                    key={d.iso}
                    onClick={() => setDay(d.iso)}
                    aria-pressed={active}
                    className={`shrink-0 min-w-[78px] h-12 px-3 rounded-xl border text-[12.5px] font-bold leading-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                      active ? "text-white border-transparent" : "hover:bg-[var(--row-hover)]"
                    }`}
                    style={
                      active
                        ? { background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 8px 18px rgba(21,91,255,.4)" }
                        : { borderColor: "var(--border)", background: "var(--surface)" }
                    }
                  >
                    {d.iso === "all" ? (
                      "All Exams"
                    ) : (
                      <>
                        {fmtChipTop(d.iso)}
                        <br />
                        {fmtChipBottom(d.iso)}
                      </>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => onNavigateTab?.("timetable")}
                className="ml-auto shrink-0 self-center text-[12.5px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                View Calendar <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </button>
            </div>
          )}

          {exams.length === 0 ? (
            <p className="py-10 text-center text-[13.5px] text-[var(--muted)] font-medium">
              No exams scheduled yet. Your upcoming exams will appear here.
            </p>
          ) : (
            <div role="table" aria-label="Exam schedule" className="text-[13.5px]">
              <div
                role="row"
                className="hidden sm:grid grid-cols-[1.15fr_1.15fr_1.5fr_1fr_.8fr_.6fr] gap-3 px-3 py-2.5 rounded-lg font-bold text-[12.5px]"
                style={{ background: "var(--search-bg)" }}
              >
                {["Date", "Time", "Subject", "Course Code", "Room", "Seat"].map((h) => (
                  <span key={h} role="columnheader">{h}</span>
                ))}
              </div>
              {visible.map((e) => (
                <div
                  key={e.code}
                  role="row"
                  className="grid grid-cols-2 sm:grid-cols-[1.15fr_1.15fr_1.5fr_1fr_.8fr_.6fr] gap-x-3 gap-y-1 px-3 py-3 border-b last:border-b-0 hover:bg-[var(--row-hover)] transition-colors rounded-lg font-medium"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span role="cell" className="font-bold sm:font-medium col-span-2 sm:col-span-1">{fmtLong(e.iso)}</span>
                  <span role="cell">{e.time}</span>
                  <span role="cell" className="font-bold sm:font-medium">{e.subject}</span>
                  <span role="cell" className="text-[var(--muted)] sm:text-[var(--ink)]">{e.code}</span>
                  <span role="cell">
                    <span className="sm:hidden text-[var(--muted)]">Room </span>{e.room}
                  </span>
                  <span role="cell">
                    <span className="sm:hidden text-[var(--muted)]">Seat </span>{e.seat}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Side cards */}
        <aside className="space-y-4 sm:space-y-5">
          <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="es-h">
            <h2 id="es-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[17px] mb-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500 fill-emerald-500/15" strokeWidth={2.2} />
              Exam essentials
            </h2>
            <ul className="space-y-1">
              {ESSENTIALS.map((it) => {
                const on = checked.includes(it.id);
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => setChecked((c) => (on ? c.filter((x) => x !== it.id) : [...c, it.id]))}
                      aria-pressed={on}
                      className="w-full flex items-center gap-3 py-2 rounded-lg text-left text-[14px] font-semibold hover:bg-[var(--row-hover)] transition px-1"
                    >
                      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: it.tone }}>
                        <it.Icon className="w-4 h-4 text-white" strokeWidth={2.6} />
                      </span>
                      <span className="flex-1">{it.label}</span>
                      {on && <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} aria-label="Done" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            className="rounded-[20px] border p-4 sm:p-5"
            style={{
              background: isDark ? "linear-gradient(135deg,#3A1330 0%,#1E1445 100%)" : "linear-gradient(135deg,#FFE9ED 0%,#FFF1F3 100%)",
              borderColor: isDark ? "#5A2A66" : "#FBD0D8",
              boxShadow: isDark ? "0 0 20px rgba(170,50,140,.18)" : "var(--shadow-card)",
            }}
            aria-labelledby="in-h"
          >
            <h2 id="in-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[15px]">
              <Megaphone className="w-5 h-5 text-red-500" strokeWidth={2.2} />
              Important notices
            </h2>
            <p className="mt-2 text-[12.5px] font-medium text-[var(--ink)]/85 max-w-[200px] leading-snug">
              No electronic devices allowed in exam hall.
            </p>
            <button className="mt-2 ml-auto flex items-center gap-1 text-[12.5px] font-bold text-blue-600 dark:text-sky-400 hover:underline">
              View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
