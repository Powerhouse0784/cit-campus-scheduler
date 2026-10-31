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
  RefreshCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

interface ExamsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

interface ScheduledExamItem {
  exam_id: string;
  course_ids: string[];
  course_title: string;
  groups: string[];
  size: number;
  day: string;
  date_iso: string;
  date_formatted: string;
  session: "AM" | "PM";
  start_time: string;
  end_time: string;
  rooms: string[];
  room_names: string[];
  capacity_allocated: number;
  effective_capacity: number;
  duration_hours: number;
  year: number;
}

interface ValidationStatus {
  valid: boolean;
  violations: Array<{ rule: string; detail: string }>;
  soft_penalty: number;
  scheduled_count: number;
  total_count: number;
}

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
        <p className="mt-2 text-[13px] sm:text-[16px] font-medium text-white/95">
          All 41 midsem exams dynamically scheduled with 50% capacity safety & 0 clashes.
        </p>
        <button
          onClick={onView}
          className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-bold text-white border border-sky-300/70 bg-[#0B2A78]/80 hover:bg-[#12389A] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          style={{ boxShadow: "0 0 16px rgba(80,160,255,.45)" }}
        >
          View Exam Schedule <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
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
/* Main Module                                                         */
/* ------------------------------------------------------------------ */
export default function ExamsModule({ onNavigateTab, userRole = "admin", isDark = false }: ExamsModuleProps) {
  const [exams, setExams] = useState<ScheduledExamItem[]>([]);
  const [validation, setValidation] = useState<ValidationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Filters
  const [yearFilter, setYearFilter] = useState<number>(0);
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [checked, setChecked] = useState<string[]>(["admit", "id"]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cit/exams");
      if (!res.ok) throw new Error("Failed to load exams");
      const data = await res.json();
      setExams(data.exams || []);
      setValidation(data.validation || null);
    } catch {
      setStatusMessage({ text: "Could not fetch exam dataset from server.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setStatusMessage(null);
      const res = await fetch("/api/cit/exams", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setValidation(data.validation || null);
        throw new Error(data.error || "Regeneration failed constraints check.");
      }
      setExams(data.exams || []);
      setValidation(data.validation || null);
      setStatusMessage({
        text: "Exam schedule successfully regenerated by dynamic solver and validated with 0 clashes!",
        isError: false,
      });
    } catch (err: any) {
      setStatusMessage({
        text: err.message || "Failed to regenerate schedule.",
        isError: true,
      });
    } finally {
      setRegenerating(false);
    }
  };

  const allGroups = useMemo(() => {
    const set = new Set<string>();
    exams.forEach((e) => e.groups.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [exams]);

  const visible = useMemo(() => {
    return exams.filter((e) => {
      if (yearFilter !== 0 && e.year !== yearFilter) return false;
      if (dayFilter !== "all" && e.day !== dayFilter) return false;
      if (groupFilter !== "all" && !e.groups.includes(groupFilter)) return false;
      return true;
    });
  }, [exams, yearFilter, dayFilter, groupFilter]);

  const availableDays = ["all", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Download CSV helper (supports either filtered view or all 41 exams)
  const downloadCsv = (exportAll = false) => {
    const listToExport = exportAll ? exams : visible;
    if (listToExport.length === 0) return;

    const headers = [
      "Exam ID",
      "Course Code",
      "Subject Title",
      "Cohort Year",
      "Weekday",
      "Actual Date",
      "Session",
      "Timing",
      "Student Cohorts",
      "Candidate Count",
      "Allocated Rooms",
      "Halved Capacity (Seats)",
    ];
    const rows = listToExport.map((e) => [
      e.exam_id,
      e.course_ids.join(";"),
      `"${e.course_title.replace(/"/g, '""')}"`,
      `Year ${e.year}`,
      e.day,
      e.date_formatted,
      e.session,
      `${e.start_time} - ${e.end_time}`,
      `"${e.groups.join(", ")}"`,
      e.size,
      `"${e.rooms.join(", ")}"`,
      e.effective_capacity,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cit-midsem-exam-schedule-${exportAll ? "all-41-exams" : "filtered"}.csv`;
    link.click();
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

      {/* Conflict & Validation Alerts Banner */}
      {validation && !validation.valid && validation.violations.length > 0 ? (
        <div className="rounded-2xl border p-4 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-900 dark:text-red-200 space-y-2">
          <div className="flex items-center gap-2 font-heading font-bold text-[15px]">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Examination Conflict Alert ({validation.violations.length} violations detected)</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1">
            {validation.violations.map((v, i) => (
              <li key={i}>
                <strong>[{v.rule}]</strong> {v.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          className="rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm font-medium"
          style={{
            background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
            borderColor: isDark ? "#065F46" : "#A7F3D0",
          }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-950 dark:text-emerald-200">
                Exam Constraint Engine Validated:
              </span>{" "}
              <span className="text-emerald-800 dark:text-emerald-300">
                All 41 midsems dynamically scheduled with 0 room clashes, 0 cohort clashes, and 50% capacity safety.
              </span>
            </div>
          </div>

          {(userRole === "admin" || userRole === "coordinator") && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Solving Constraints..." : "Regenerate Dynamic Schedule"}
            </button>
          )}
        </div>
      )}

      {statusMessage && (
        <div
          className={`rounded-xl border p-3.5 text-sm font-semibold ${
            statusMessage.isError
              ? "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/40"
              : "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Summary control bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
        {/* Total exams count */}
        <div className={`${pill} !h-[60px]`} style={pillStyle}>
          <span className="w-10 h-10 rounded-xl bg-[#DCE9FF] dark:bg-[#15366B] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-300" strokeWidth={2.2} />
          </span>
          <span className="leading-tight flex-1">
            <span className="block text-[12px] font-semibold text-[var(--muted)] font-sans">Scheduled Exams</span>
            <span className="block text-[19px]">{visible.length} of {exams.length}</span>
          </span>
          <Clock className="w-6 h-6 text-blue-300 dark:text-sky-400/70 shrink-0" strokeWidth={1.8} />
        </div>

        {/* Year filter */}
        <label className={`${pill} relative !h-[60px] cursor-pointer`} style={pillStyle}>
          <GraduationCap className="w-5 h-5 text-blue-600 dark:text-sky-300 shrink-0" strokeWidth={2.2} />
          <div className="flex-1">
            <span className="block text-[11px] font-semibold text-[var(--muted)] font-sans">Cohort Year</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              aria-label="Filter by Year"
              className="appearance-none bg-transparent w-full font-heading font-extrabold focus:outline-none cursor-pointer"
            >
              <option value={0}>All Years (1, 2, 3)</option>
              <option value={1}>Year 1 (Sections A–D)</option>
              <option value={2}>Year 2 (Branches)</option>
              <option value={3}>Year 3 (Branches)</option>
            </select>
          </div>
          <ChevronDown className="w-4 h-4 pointer-events-none text-[var(--muted)] shrink-0" />
        </label>

        {/* Group filter */}
        <label className={`${pill} relative !h-[60px] cursor-pointer`} style={pillStyle}>
          <Users className="w-5 h-5 text-blue-600 dark:text-sky-300 shrink-0" strokeWidth={2.2} />
          <div className="flex-1">
            <span className="block text-[11px] font-semibold text-[var(--muted)] font-sans">Student Group</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              aria-label="Filter by Student Group"
              className="appearance-none bg-transparent w-full font-heading font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="all">All Student Groups</option>
              {allGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-4 h-4 pointer-events-none text-[var(--muted)] shrink-0" />
        </label>

        {/* Export Button Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv(false)}
            disabled={visible.length === 0}
            className="flex-1 h-[60px] px-4 rounded-2xl text-white font-heading font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 10px 22px rgba(21,91,255,.35)" }}
            title="Download CSV for currently filtered exams"
          >
            <Download className="w-4 h-4" strokeWidth={2.4} />
            <span>Export View</span>
          </button>

          <button
            onClick={() => downloadCsv(true)}
            disabled={exams.length === 0}
            className="h-[60px] px-3.5 rounded-2xl border font-heading font-extrabold text-[12px] flex items-center justify-center gap-1.5 transition hover:bg-[var(--row-hover)]"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            title="Download complete timetable for all 41 midsem exams"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">All 41</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 sm:gap-5 items-start">
        {/* Schedule List */}
        <section id="exam-schedule" className={`${panel} p-4 sm:p-5 scroll-mt-4`} style={panelStyle} aria-labelledby="ex-h">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 id="ex-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[18px]">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.3} />
              Midsem Examination Timetable (Week 8)
            </h2>

            <span className="text-[12.5px] font-bold text-[var(--muted)]">
              Showing {visible.length} exams
            </span>
          </div>

          {/* Day Filter Pills */}
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2 mb-4">
            {availableDays.map((d) => {
              const active = dayFilter === d;
              return (
                <button
                  key={d}
                  onClick={() => setDayFilter(d)}
                  aria-pressed={active}
                  className={`shrink-0 min-w-[70px] h-10 px-3 rounded-xl border text-[12.5px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    active ? "text-white border-transparent" : "hover:bg-[var(--row-hover)]"
                  }`}
                  style={
                    active
                      ? { background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 8px 18px rgba(21,91,255,.4)" }
                      : { borderColor: "var(--border)", background: "var(--surface)" }
                  }
                >
                  {d === "all" ? "All Days" : d}
                </button>
              );
            })}

            <button
              onClick={() => onNavigateTab?.("timetable")}
              className="ml-auto shrink-0 self-center text-[12.5px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 whitespace-nowrap pl-2"
            >
              Class Timetable <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm font-semibold text-[var(--muted)]">
              Loading examination dataset...
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-[13.5px] text-[var(--muted)] font-medium">
              No exams found for the selected filter combination.
            </p>
          ) : (
            <div role="table" aria-label="Exam schedule" className="text-[13px]">
              <div
                role="row"
                className="hidden lg:grid grid-cols-[140px_110px_1fr_120px_140px_170px] gap-3 px-3 py-2.5 rounded-lg font-bold text-[12px] text-[var(--muted)]"
                style={{ background: "var(--search-bg)" }}
              >
                <span role="columnheader">Date & Slot</span>
                <span role="columnheader">Timing</span>
                <span role="columnheader">Course & Subject</span>
                <span role="columnheader">Cohorts</span>
                <span role="columnheader">Candidates</span>
                <span role="columnheader">Allocated Rooms (50% Cap)</span>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {visible.map((e) => {
                  return (
                    <div
                      key={e.exam_id}
                      role="row"
                      className="grid grid-cols-1 lg:grid-cols-[140px_110px_1fr_120px_140px_170px] gap-x-3 gap-y-1.5 px-3 py-3 hover:bg-[var(--row-hover)] transition-colors rounded-lg font-medium"
                    >
                      {/* Date & Slot */}
                      <div>
                        <div className="font-bold text-[var(--ink)] text-[12.5px]">{e.date_formatted}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex px-1.5 py-0.5 rounded font-extrabold text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                            {e.day} {e.session}
                          </span>
                        </div>
                      </div>

                      {/* Timing */}
                      <div className="text-[12.5px] text-[var(--ink)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                        <span>{e.start_time}–{e.end_time}</span>
                      </div>

                      {/* Title & Code */}
                      <div>
                        <div className="font-bold text-[var(--ink)]">{e.course_title}</div>
                        <div className="text-[11.5px] text-[var(--muted)]">
                          {e.course_ids.join(", ")} · {e.exam_id}
                        </div>
                      </div>

                      {/* Cohorts */}
                      <div>
                        <span className="lg:hidden text-[11px] font-bold text-[var(--muted)]">Cohorts: </span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[11.5px] font-semibold bg-gray-100 dark:bg-gray-800 text-[var(--ink)]">
                          {e.groups.join(", ")}
                        </span>
                      </div>

                      {/* Candidates */}
                      <div className="text-[12px]">
                        <span className="lg:hidden text-[11px] font-bold text-[var(--muted)]">Candidates: </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{e.size}</span> students
                      </div>

                      {/* Allocated Rooms */}
                      <div>
                        <div className="font-bold text-[12px] text-emerald-700 dark:text-emerald-400">
                          {e.rooms.join(" + ")}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {e.effective_capacity} seats ({Math.round((e.size / e.effective_capacity) * 100)}% load)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Side Cards */}
        <aside className="space-y-4 sm:space-y-5">
          {/* Rules Summary */}
          <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="rules-h">
            <h2 id="rules-h" className="flex items-center gap-2 font-heading font-extrabold text-[16px] mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" strokeWidth={2.2} />
              CIT Exam Rules
            </h2>
            <div className="space-y-2.5 text-[12.5px] text-[var(--ink)]/85">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>50% Room Capacity:</strong> Social distancing enforced across all halls.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>1 Exam / Group / Day:</strong> Zero multi-exam days for any student group.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Dedicated Multi-Room:</strong> AUD + LH-1 utilized for combined batches.</span>
              </div>
            </div>
          </section>

          {/* Student Essentials */}
          <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="es-h">
            <h2 id="es-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[16px] mb-3">
              <IdCard className="w-5 h-5 text-blue-500" strokeWidth={2.2} />
              Student Checklist
            </h2>
            <ul className="space-y-1">
              {ESSENTIALS.map((it) => {
                const on = checked.includes(it.id);
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => setChecked((c) => (on ? c.filter((x) => x !== it.id) : [...c, it.id]))}
                      aria-pressed={on}
                      className="w-full flex items-center gap-3 py-2 rounded-lg text-left text-[13.5px] font-semibold hover:bg-[var(--row-hover)] transition px-1"
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: it.tone }}>
                        <it.Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.6} />
                      </span>
                      <span className="flex-1">{it.label}</span>
                      {on && <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} aria-label="Done" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Important Notices */}
          <section
            className="rounded-[20px] border p-4 sm:p-5"
            style={{
              background: isDark ? "linear-gradient(135deg,#3A1330 0%,#1E1445 100%)" : "linear-gradient(135deg,#FFE9ED 0%,#FFF1F3 100%)",
              borderColor: isDark ? "#5A2A66" : "#FBD0D8",
              boxShadow: isDark ? "0 0 20px rgba(170,50,140,.18)" : "var(--shadow-card)",
            }}
            aria-labelledby="in-h"
          >
            <h2 id="in-h" className="flex items-center gap-2 font-heading font-extrabold text-[15px]">
              <Megaphone className="w-4 h-4 text-red-500" strokeWidth={2.2} />
              Official Examination Notice
            </h2>
            <p className="mt-2 text-[12px] font-medium text-[var(--ink)]/85 leading-snug">
              Mid-Semester Examinations run in Week 8 across 6 days (MON–SAT). AM session starts at 09:30 AM, PM session starts at 02:00 PM. No electronic devices permitted.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
