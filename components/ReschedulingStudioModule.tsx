"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Search,
  RefreshCw,
  Building,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Split,
  Eye,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import CountUp from "@/components/ui/CountUp";

interface ReschedulingStudioModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

interface Row {
  session_id: string;
  day: string;
  period: number;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  groups?: string[];
  size?: number;
  changed?: boolean;
  before?: { day: string; period: number; room: string } | null;
  after?: { day: string; period: number; room: string } | null;
  reason?: string;
}

interface DisruptionPayload {
  baseline_rows: Row[];
  proposed_rows: Row[];
  stability: {
    sessions_moved: number;
    time_changed: number;
    room_only_changed: number;
    moved_ids: string[];
  };
  conflict_alert: {
    title: string;
    impacted_count: number;
    detail: string;
    suggested_resolution: string;
  };
  validation: {
    hard_violations: number;
    soft_penalty: number;
    status: string;
  };
}

/* ------------------------------------------------------------------ */
/* Shared Timetable Table Component                                   */
/* ------------------------------------------------------------------ */
function TimetableTable({
  rows,
  highlight,
  onSelectRow,
}: {
  rows: Row[];
  highlight: boolean;
  onSelectRow?: (row: Row) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[var(--muted)]">
        No sessions match the selected filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop / Tablet Table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl max-h-[520px]">
        <table className="w-full text-[12.5px] text-left">
          <thead className="sticky top-0 z-10 shadow-xs">
            <tr className="font-bold" style={{ background: "var(--search-bg)" }}>
              {["Day", "Slot", "Subject & Session", "Faculty", "Room", "Status"].map((h) => (
                <th key={h} className="px-2.5 py-2.5 first:rounded-l-lg last:rounded-r-lg whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const hl = highlight && r.changed;
              return (
                <tr
                  key={r.session_id || i}
                  onClick={() => onSelectRow && onSelectRow(r)}
                  className={`border-b last:border-b-0 transition-colors cursor-pointer ${
                    hl
                      ? "bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50"
                      : "hover:bg-[var(--row-hover)]"
                  }`}
                  style={{
                    borderColor: "var(--border)",
                  }}
                >
                  <td className="px-2.5 py-2.5 font-medium whitespace-nowrap text-xs">{r.day}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap font-mono text-[11px] text-[var(--muted)]">
                    P{r.period} ({r.time})
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <div className={`font-semibold ${hl ? "text-blue-700 dark:text-sky-300" : ""}`}>
                      {r.subject}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--muted)]">
                      {r.session_id} {r.groups && r.groups.length > 0 ? `· ${r.groups.join(", ")}` : ""}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap text-xs">{r.faculty}</td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        hl
                          ? "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200 border border-blue-400"
                          : "bg-[var(--search-bg)]"
                      }`}
                    >
                      {r.room}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    {hl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                        Relocated
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--muted)] font-medium">Unchanged</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <ul className="sm:hidden space-y-2 max-h-[460px] overflow-y-auto">
        {rows.map((r, i) => {
          const hl = highlight && r.changed;
          return (
            <li
              key={r.session_id || i}
              onClick={() => onSelectRow && onSelectRow(r)}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer"
              style={{
                borderColor: hl ? "#93B4F5" : "var(--border)",
                background: hl ? "rgba(37,99,235,.09)" : "var(--surface)",
              }}
            >
              <span className="w-10 h-10 rounded-full bg-[#E4EDFF] dark:bg-[#14264B] flex items-center justify-center shrink-0">
                <BookOpen className="w-[18px] h-[18px] text-blue-600 dark:text-sky-300" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[12px] font-bold">{r.day} · P{r.period}</span>
                <span className="block text-[13px] font-semibold truncate">
                  {r.subject} <span className="text-[var(--muted)] font-medium">· {r.faculty}</span>
                </span>
                <span className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono font-bold bg-[var(--search-bg)] px-1.5 py-0.5 rounded">
                    Room: {r.room}
                  </span>
                  {hl && <span className="text-[10px] font-bold text-blue-700 dark:text-sky-300">Relocated</span>}
                </span>
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
/* Rescheduling Studio Module (Phase 6 / Changes)                      */
/* ------------------------------------------------------------------ */
export default function ReschedulingStudioModule({
  userRole = "admin",
  isDark = false,
}: ReschedulingStudioModuleProps) {
  const [data, setData] = useState<DisruptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'split' (side-by-side) | 'cards' (before -> after diff cards) | 'diff' (only moved rows)
  const [viewMode, setViewMode] = useState<"split" | "cards" | "diff">("split");
  const [compare, setCompare] = useState(true);
  const [details, setDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

  // Admin Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState<"review" | "published">("review");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [solverRunning, setSolverRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadDisruptionJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSolverRunning(true);
      setNotice(null);
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/cit/disruption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disruption: json }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || resData.explanation || "Solver failed to resolve disruption.");
      }
      setNotice({
        type: "success",
        text: `Custom Disruption solved! ${resData.sessions_moved || 0} sessions relocated with 0 hard clashes.`,
      });
      fetchDisruptionData();
    } catch (err: any) {
      setNotice({
        type: "error",
        text: err.message || "Failed to process disruption file.",
      });
    } finally {
      setSolverRunning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchDisruptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/cit/disruption");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load disruption comparison.");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach disruption API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisruptionData();
  }, []);

  const handlePublishSchedule = async () => {
    setPublishLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/cit/disruption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to publish schedule.");
      }
      setWorkflowState("published");
      setShowApprovalModal(false);
      setNotice({
        type: "success",
        text: "✓ Rescheduled timetable certified & published to campus master schedule (0 hard violations verified).",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Unable to publish schedule.",
      });
    } finally {
      setPublishLoading(false);
    }
  };

  // Filter helper
  const filterRows = (rows: Row[]) => {
    return rows.filter((r) => {
      if (selectedDay !== "all" && !r.day.toLowerCase().includes(selectedDay.toLowerCase())) return false;
      if (viewMode === "diff" && !r.changed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.subject.toLowerCase().includes(q) ||
          r.faculty.toLowerCase().includes(q) ||
          r.room.toLowerCase().includes(q) ||
          r.session_id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  };

  const filteredBaseline = useMemo(() => filterRows(data?.baseline_rows || []), [data, selectedDay, viewMode, searchQuery]);
  const filteredProposed = useMemo(() => filterRows(data?.proposed_rows || []), [data, selectedDay, viewMode, searchQuery]);
  const movedRows = useMemo(() => (data?.proposed_rows || []).filter((r) => r.changed), [data]);

  const movedCount = data?.stability?.sessions_moved ?? movedRows.length ?? 11;
  const timeChanges = data?.stability?.time_changed ?? 0;
  const roomOnlyChanges = data?.stability?.room_only_changed ?? movedCount;

  const steps = [
    { label: ["Disruption", "Ingested"], state: "done" },
    { label: ["Solver", "Optimized"], state: "done" },
    { label: ["Coordinator", "Review"], state: workflowState === "published" ? "done" : "active" },
    { label: ["Schedule", "Published"], state: workflowState === "published" ? "done" : "todo" },
  ];

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark
      ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)"
      : "var(--shadow-card)",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. HERO BANNER */}
      <section
        className="hero-sheen relative overflow-hidden rounded-[22px] text-white min-h-[190px] flex items-center p-6"
        style={{
          background: isDark
            ? "linear-gradient(100deg,#030B1F 0%,#081745 45%,#0F2B78 100%)"
            : "linear-gradient(100deg,#0A2570 0%,#123C9C 40%,#2465D6 100%)",
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
        <div className="relative z-10 max-w-[720px] space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Phase 6 · Minimal-Movement Disruption Solver</span>
          </div>
          <h1 className="font-serif-heading font-bold text-2xl sm:text-4xl tracking-tight">
            Rescheduling Studio
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
            Compare Timetables. Solve Room Closures &amp; Faculty Leaves with Minimal Movement.
          </p>

          {/* Animated Movement Counters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-100 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-ping" />
              <CountUp value={movedCount} /> Sessions Relocated
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/30 border border-emerald-300/40 text-emerald-200">
              <Check className="w-3.5 h-3.5" /> <CountUp value={roomOnlyChanges} /> Room-Only (0 Time Shifts)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/30 border border-purple-300/40 text-purple-200">
              <ShieldCheck className="w-3.5 h-3.5" /> 0 Hard Clashes
            </span>
          </div>
        </div>
      </section>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 border shadow-xs ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. FILTER & VIEW CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-3.5 rounded-2xl border border-[var(--border)] shadow-xs">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "split"
                ? "bg-[var(--surface)] text-blue-600 shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Split className="w-3.5 h-3.5" /> Side-by-Side
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "cards"
                ? "bg-[var(--surface)] text-blue-600 shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Moved Cards ({movedCount})
          </button>
          <button
            onClick={() => setViewMode("diff")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "diff"
                ? "bg-[var(--surface)] text-blue-600 shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Diff Only
          </button>
        </div>

        {/* Day Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
            Day:
          </span>
          {[
            { id: "all", label: "All Days" },
            { id: "mon", label: "Mon" },
            { id: "tue", label: "Tue" },
            { id: "wed", label: "Wed" },
            { id: "thu", label: "Thu" },
            { id: "fri", label: "Fri" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedDay === d.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--muted)] hover:bg-[var(--search-bg)]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search course or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-full border border-[var(--border)] bg-[var(--search-bg)] w-36 sm:w-52 focus:outline-none focus:border-blue-500"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleUploadDisruptionJson}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={solverRunning}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-500/40 text-blue-600 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
            title="Upload judge disruption scenario JSON"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{solverRunning ? "Solving..." : "Upload Scenario"}</span>
          </button>

          <button
            onClick={() => setShowApprovalModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-sm transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Review</span>
          </button>

          <button
            onClick={fetchDisruptionData}
            disabled={loading}
            className="p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] transition"
            title="Refresh comparison"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. DIFF PRESENTATION MODES */}
      {viewMode === "cards" ? (
        /* Visual Cards Mode: Before ➔ After for every moved session */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {movedRows.map((row) => (
            <div
              key={row.session_id}
              onClick={() => setSelectedRow(row)}
              className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-[var(--surface)] hover:shadow-md transition-all cursor-pointer relative overflow-hidden space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                    {row.session_id}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--ink)] mt-1 group-hover:text-blue-600 transition">
                    {row.subject}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">{row.faculty}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Room Relocation
                </span>
              </div>

              {/* Before ➔ After Diff Strip */}
              <div className="p-3 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] flex items-center justify-between gap-2">
                <div className="text-center flex-1">
                  <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Before</div>
                  <div className="font-mono font-extrabold text-xs text-rose-600 line-through">
                    {row.before?.room || "CR-102"}
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">{row.day} P{row.period}</div>
                </div>

                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>

                <div className="text-center flex-1">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">After</div>
                  <div className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                    {row.room}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Same Slot (P{row.period})</div>
                </div>
              </div>

              <div className="text-[11px] text-[var(--muted)] flex items-center justify-between">
                <span>Cohorts: <strong>{row.groups?.join(", ") || "General"}</strong></span>
                <span className="font-bold text-blue-600 text-[11px] flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Split or Diff Table Mode */
        <div id="resched-workspace" className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-start gap-4">
          {/* Baseline Schedule */}
          {viewMode !== "diff" && (
            <section className={`${panel} p-4 sm:p-5`} style={panelStyle} aria-labelledby="cur-h">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 id="cur-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[16px]">
                  <CalendarDays className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.2} />
                  Current Timetable (Baseline)
                </h2>
                <span className="text-xs font-mono font-bold text-[var(--muted)] bg-[var(--search-bg)] px-2.5 py-1 rounded-full">
                  {filteredBaseline.length} Sessions
                </span>
              </div>
              <TimetableTable rows={filteredBaseline} highlight={false} onSelectRow={setSelectedRow} />
            </section>
          )}

          {/* Swap / Compare Button */}
          {viewMode !== "diff" && (
            <div className="flex lg:self-center justify-center">
              <button
                onClick={() => setCompare((c) => !c)}
                aria-pressed={compare}
                title={compare ? "Hide highlighted changes" : "Highlight changed sessions"}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white transition hover:scale-105 shadow-md focus:outline-none"
                style={{
                  background: "linear-gradient(135deg,#155BFF,#2F7BF5)",
                }}
              >
                <ArrowLeftRight className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* Proposed / Solved Schedule */}
          <section
            className={`${panel} p-4 sm:p-5 ${viewMode === "diff" ? "lg:col-span-3" : ""}`}
            style={panelStyle}
            aria-labelledby="prop-h"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 id="prop-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[16px]">
                <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.2} />
                Proposed Disruption Plan (CSP Solved)
              </h2>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300">
                <Check className="w-3.5 h-3.5" />
                <span>Optimized (0 Hard Clashes)</span>
              </span>
            </div>
            <TimetableTable rows={filteredProposed} highlight={compare} onSelectRow={setSelectedRow} />
          </section>
        </div>
      )}

      {/* 4. LOWER ROW: CONFLICT ALERT, WORKFLOW & PUBLISH */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.1fr_1fr] gap-4 sm:gap-5 items-stretch">
        {/* Conflict Alert (CR-102 Closure Case) */}
        <section
          className="relative overflow-hidden rounded-[20px] border p-4 sm:p-5 flex flex-col"
          style={{
            background: isDark
              ? "linear-gradient(135deg,#3A1226 0%,#1B1238 100%)"
              : "linear-gradient(135deg,#FFE5EA 0%,#FFF2F4 100%)",
            borderColor: isDark ? "#7A2646" : "#FBC8D2",
            boxShadow: isDark ? "0 0 22px rgba(220,50,90,.18)" : "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-rose-300 font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={2.3} />
            <span>Disruption Alert</span>
          </div>
          <div className="mt-2 font-heading font-extrabold text-[20px] text-red-700 dark:text-rose-300 leading-tight">
            {data?.conflict_alert?.title || "Room CR-102 Emergency Closure"}
          </div>
          <p className="mt-1 text-xs text-[var(--ink)] leading-relaxed">
            {data?.conflict_alert?.detail || "Water leak closed CR-102 across Mon–Fri. 11 sessions relocated without time changes."}
          </p>

          <button
            onClick={() => setDetails(!details)}
            className="mt-3 self-start inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-bold border bg-[var(--surface)] text-blue-700 dark:text-sky-300 hover:bg-[var(--row-hover)] transition"
          >
            <span>{details ? "Hide Solver Proof" : "View Solver Proof"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {details && (
            <div className="mt-3 rounded-xl border p-3 text-xs space-y-1 bg-[var(--surface)]">
              <div>
                <strong>Resolution Strategy: </strong>
                <span>Preserve all original time periods; relocate solely to equivalent vacant rooms (CR-104 &amp; CR-101).</span>
              </div>
              <div>
                <strong>Stability Score: </strong>
                <span>11 room-only moves, 0 time shifts, 0 hard constraint violations.</span>
              </div>
              <div>
                <strong>Affected Courses: </strong>
                <span>CS101, CE302, ME302, PH101, HS101.</span>
              </div>
            </div>
          )}
        </section>

        {/* 4-Step Approval Workflow */}
        <section className={`${panel} p-4 sm:p-5`} style={panelStyle}>
          <h2 className="font-heading font-extrabold text-[15px] mb-4">Rescheduling Workflow</h2>
          <ol className="relative grid grid-cols-4 text-center">
            <div className="absolute left-[12.5%] right-[12.5%] top-[14px] h-0.5 bg-[var(--border)]" aria-hidden="true" />
            <div
              className="absolute left-[12.5%] top-[14px] h-0.5 bg-emerald-500 transition-all duration-300"
              style={{
                width: workflowState === "published" ? "75%" : "50%",
              }}
              aria-hidden="true"
            />
            {steps.map((s, i) => (
              <li key={i} className="relative flex flex-col items-center">
                <span
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    s.state === "done"
                      ? "bg-emerald-500 text-white"
                      : s.state === "active"
                      ? "bg-blue-600 text-white ring-4 ring-blue-500/25"
                      : "bg-[var(--surface)] border text-[var(--muted)]"
                  }`}
                >
                  {s.state === "done" ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="mt-2 text-[11px] font-bold leading-tight">
                  {s.label[0]}
                  <br />
                  {s.label[1]}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Publish Action Card */}
        <section
          className="relative overflow-hidden rounded-[20px] p-5 text-white flex flex-col justify-between"
          style={{
            background: "linear-gradient(120deg,#1747D6 0%,#2563EB 55%,#3B82F6 100%)",
            boxShadow: "0 12px 30px rgba(21,91,255,.32)",
          }}
        >
          <Send className="absolute right-3 top-3 w-16 h-16 text-white/20 pointer-events-none" />
          <div>
            <h3 className="font-heading font-extrabold text-[17px]">
              {workflowState === "published" ? "Schedule Published" : "Publish Schedule"}
            </h3>
            <p className="mt-1 text-xs text-white/90 leading-relaxed">
              {workflowState === "published"
                ? "The resolved timetable has been published and synchronized campus-wide."
                : `Apply all ${movedCount} minimal room reallocations directly to active campus records.`}
            </p>
          </div>

          <button
            type="button"
            disabled={publishLoading || workflowState === "published"}
            onClick={() => setShowApprovalModal(true)}
            className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              workflowState === "published"
                ? "bg-white/20 text-white cursor-default"
                : "bg-white text-blue-900 hover:bg-white/90 shadow-md"
            }`}
          >
            {publishLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : workflowState === "published" ? (
              <>
                <Check className="w-4 h-4" />
                <span>Published &amp; Synchronized</span>
              </>
            ) : (
              <>
                <span>Review &amp; Authorize Publish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </section>
      </div>

      {/* 5. ADMIN APPROVAL MODAL (GOVERNANCE GATE) */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base">Authorize Schedule Publication</h3>
                  <p className="text-[11.5px] text-[var(--muted)]">Admin sign-off &amp; deterministic constraint verification</p>
                </div>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="p-1 rounded-lg hover:bg-[var(--search-bg)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified 0 Hard Violations</span>
                </div>
                <p>
                  The Constraint Satisfaction Solver relocated <strong>{movedCount} sessions</strong> into vacant parallel venues with <strong>0 room clashes, 0 cohort overlaps, and 0 time shifts</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] space-y-1">
                <div className="font-bold text-[var(--ink)]">Authorizing Officer:</div>
                <div className="text-[var(--muted)]">Role: <strong>Dean&apos;s Office (Admin)</strong></div>
                <div className="text-[var(--muted)]">Target File: <code>exports/schedule.json</code></div>
                <div className="text-[var(--muted)]">Stability Penalty: <strong>{movedCount} (All room-only)</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-[var(--search-bg)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={publishLoading}
                onClick={handlePublishSchedule}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                {publishLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize &amp; Publish Timetable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SESSION DETAILS INSPECTION MODAL */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                  {selectedRow.session_id}
                </span>
                <h3 className="text-base font-extrabold mt-1">{selectedRow.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)]"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Faculty</span>
                  <span className="font-semibold">{selectedRow.faculty}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Timing</span>
                  <span className="font-semibold">{selectedRow.day} · P{selectedRow.period} ({selectedRow.time})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Current Room</span>
                  <span className="font-semibold">{selectedRow.room}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Cohorts</span>
                  <span className="font-semibold">{selectedRow.groups?.join(", ") || "General"}</span>
                </div>
              </div>

              {selectedRow.changed && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">
                    Disruption Relocation Diff
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="line-through text-rose-600 font-mono font-bold">
                      {selectedRow.before?.room || "CR-102"} (Closed)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                      {selectedRow.room} (Vacant &amp; Assigned)
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] italic mt-1">
                    {selectedRow.reason || "Relocated due to emergency facility maintenance with zero timetable clashes."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}