"use client";

import {
  ArrowLeftRight,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function ReschedulingStudioModule() {

  // Timetable records matching the exact comparison table from the showcase
  const currentSchedule = [
    { day: "Mon, 27 Oct", time: "09:00 – 10:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1" },
    { day: "Mon, 27 Oct", time: "10:00 – 11:00", subject: "Physics", faculty: "Dr. Verma", room: "LH-2" },
    { day: "Mon, 27 Oct", time: "11:00 – 12:00", subject: "Chemistry", faculty: "Dr. Khan", room: "Lab-1" },
    { day: "Tue, 28 Oct", time: "09:00 – 10:00", subject: "Computer Science", faculty: "Dr. Patel", room: "CS-201" },
    { day: "Tue, 28 Oct", time: "10:00 – 11:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1" },
  ];

  const proposedSchedule = [
    { day: "Mon, 27 Oct", time: "09:00 – 10:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1", changed: false },
    { day: "Mon, 27 Oct", time: "10:00 – 11:00", subject: "Chemistry", faculty: "Dr. Khan", room: "LH-2", changed: true },
    { day: "Mon, 27 Oct", time: "11:00 – 12:00", subject: "Physics", faculty: "Dr. Verma", room: "Lab-2", changed: true },
    { day: "Tue, 28 Oct", time: "09:00 – 10:00", subject: "Computer Science", faculty: "Dr. Patel", room: "CS-201", changed: false },
    { day: "Tue, 28 Oct", time: "10:00 – 11:00", subject: "Mathematics", faculty: "Dr. Sharma", room: "LH-1", changed: false },
  ];

  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--muted)]" role="note">Prototype preview · both timetable columns contain illustrative sample rows and are not live schedule versions.</p>
      {/* 1. WIDESCREEN HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1E4E] via-[#10308A] to-[#1E57D8] text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Rescheduling Studio
          </h1>
          <p className="text-sm font-semibold text-blue-200 mb-4">
            Compare Timetables. Get Approvals. Keep Campus in Sync.
          </p>
          <button
            type="button"
            disabled
            title="Rescheduling solver workflow is not connected"
            className="px-5 py-2.5 rounded-full bg-blue-600/70 text-white text-xs font-bold cursor-not-allowed flex items-center gap-2 opacity-80"
          >
            Rescheduling preview only
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Neon Handwritten Callout ("Smart Planning!") */}
        <div className="relative z-10 text-right hidden sm:block">
          <div className="text-3xl lg:text-4xl font-extrabold italic font-serif-heading text-white drop-shadow-[0_2px_12px_rgba(37,99,235,0.7)] tracking-wide">
            Smart
            <br />
            Planning!
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full ml-auto mt-2" />
        </div>

        {/* Ambient lighting */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-blue-400/20 to-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. SIDE-BY-SIDE TIMETABLE COMPARISON WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Current Timetable */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
                Current Timetable
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-900">
              <span>This Week</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--brand-50)] dark:bg-slate-800 text-[var(--muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="p-2.5">Day</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5">Faculty</th>
                  <th className="p-2.5">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {currentSchedule.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/20">
                    <td className="p-2.5 font-bold whitespace-nowrap">{row.day}</td>
                    <td className="p-2.5 text-[var(--muted)] whitespace-nowrap">{row.time}</td>
                    <td className="p-2.5 font-extrabold text-[var(--ink)]">{row.subject}</td>
                    <td className="p-2.5 text-[var(--muted)]">{row.faculty}</td>
                    <td className="p-2.5 font-bold text-blue-600">{row.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Center: Glowing Swap Connector Button */}
        <div className="flex justify-center my-2 lg:my-0">
          <span className="p-3.5 rounded-full bg-slate-300 text-slate-600" title="Comparison preview only" aria-label="Comparison preview only">
            <ArrowLeftRight className="w-5 h-5" />
          </span>
        </div>

        {/* Right: Proposed Timetable (with Highlighted Changes) */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
                Proposed Timetable
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              Sample preview
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--brand-50)] dark:bg-slate-800 text-[var(--muted)] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="p-2.5">Day</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5">Faculty</th>
                  <th className="p-2.5">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {proposedSchedule.map((row, i) => (
                  <tr
                    key={i}
                    className={`transition ${
                      row.changed
                        ? "bg-blue-50/70 dark:bg-blue-950/50"
                        : "hover:bg-blue-50/20 dark:hover:bg-slate-800/20"
                    }`}
                  >
                    <td className="p-2.5 font-bold whitespace-nowrap">{row.day}</td>
                    <td className="p-2.5 text-[var(--muted)] whitespace-nowrap">{row.time}</td>
                    <td
                      className={`p-2.5 font-extrabold ${
                        row.changed ? "text-blue-700 dark:text-blue-300 underline" : ""
                      }`}
                    >
                      {row.subject}
                    </td>
                    <td className="p-2.5 text-[var(--muted)]">{row.faculty}</td>
                    <td
                      className={`p-2.5 font-bold ${
                        row.changed ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600"
                      }`}
                    >
                      {row.room}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. LOWER ROW: CONFLICT ALERT, APPROVAL WORKFLOW, & SUBMIT ACTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Card 1: Conflict Alert */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Conflict Alert</span>
            </div>
            <div className="text-sm font-black text-rose-900 dark:text-rose-200 mt-1">
              Conflict status unavailable
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
              No live conflict analysis has been run for this preview.
            </p>
          </div>
          <p className="mt-3 text-[11px] text-rose-700 dark:text-rose-300">
            Live conflict details are unavailable: this panel is illustrative sample data and no solver result is attached.
          </p>
        </div>

        {/* Card 2: Approval Workflow Stepper */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-extrabold font-heading uppercase tracking-wider text-[var(--muted)] mb-3">
            Approval Workflow
          </div>

          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-6 right-6 top-3.5 h-0.5 bg-[var(--border)] -z-0" />

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ✓
              </div>
              <span className="text-[10px] font-bold text-[var(--ink)] mt-1.5 leading-tight">
                Request<br />Submitted
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center z-10">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-blue-500/20 shadow-xs">
                2
              </div>
              <span className="text-[10px] font-bold text-blue-600 mt-1.5 leading-tight">
                Coordinator<br />Review
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center z-10">
              <div className="w-7 h-7 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-[10px] font-bold text-[var(--muted)] mt-1.5 leading-tight">
                Faculty<br />Approval
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center z-10">
              <div className="w-7 h-7 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)] flex items-center justify-center text-xs font-bold">
                4
              </div>
              <span className="text-[10px] font-bold text-[var(--muted)] mt-1.5 leading-tight">
                Final<br />Update
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Submit for Approval Action */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Send className="w-4 h-4" />
              <h4 className="font-extrabold text-sm">Submit for Approval</h4>
            </div>
            <p className="text-[11px] text-blue-100 leading-relaxed">
              This sample proposal has not been validated or submitted. The approval workflow is not connected to a backend yet.
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Rescheduling submission API is not connected"
            className="mt-4 w-full py-2.5 rounded-xl bg-white/70 text-blue-700 text-xs font-extrabold cursor-not-allowed opacity-80"
          >
            Submission unavailable in demo
          </button>
        </div>
      </div>
    </div>
  );
}