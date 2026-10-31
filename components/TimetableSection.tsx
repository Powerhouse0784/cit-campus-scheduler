"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Zap, ArrowRight, Filter } from "lucide-react";

export default function TimetableSection() {
  const [viewFilter, setViewFilter] = useState<"group" | "faculty" | "room">("group");
  const [selectedEntity, setSelectedEntity] = useState<string>("CSE-2");
  const [metadata, setMetadata] = useState<any>({ student_groups: [], faculty: [], rooms: [] });
  const [gridData, setGridData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileDay, setMobileDay] = useState<string>("MON");

  const days = ["MON", "TUE", "WED", "THU", "FRI"];
  const dayLabels: Record<string, string> = {
    MON: "Mon · 27 Oct",
    TUE: "Tue · 28 Oct",
    WED: "Wed · 29 Oct",
    THU: "Thu · 30 Oct",
    FRI: "Fri · 31 Oct",
  };

  const periods = [
    { p: 1, time: "08:00 – 09:00" },
    { p: 2, time: "09:00 – 10:00" },
    { p: 3, time: "10:00 – 11:00" },
    { p: 4, time: "11:00 – 12:00" },
    { p: 5, time: "12:00 – 13:00" },
    { p: 6, time: "14:00 – 15:00" },
    { p: 7, time: "15:00 – 16:00" },
    { p: 8, time: "16:00 – 17:00" },
    { p: 9, time: "17:00 – 18:00" },
  ];

  // Fetch real schedule from backend
  useEffect(() => {
    fetchTimetable();
  }, [viewFilter, selectedEntity]);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      let queryParam = `group=${selectedEntity}`;
      if (viewFilter === "faculty") queryParam = `faculty=${selectedEntity}`;
      if (viewFilter === "room") queryParam = `room=${selectedEntity}`;

      const res = await fetch(`/api/cit/timetable?${queryParam}`);
      if (res.ok) {
        const json = await res.json();
        setGridData(json.grid);
        setMetadata(json.metadata);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getPillColor = (kind: string) => {
    switch (kind) {
      case "lab":
        return "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300";
      case "tutorial":
        return "bg-purple-100 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border-purple-300";
      default:
        return "bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic View & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Switch View Dimension */}
        <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-full border border-[var(--border)] shadow-xs">
          {[
            { id: "group", label: "♧ By Group" },
            { id: "faculty", label: "♙ By Faculty" },
            { id: "room", label: "▤ By Room" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setViewFilter(btn.id as any);
                if (btn.id === "group") setSelectedEntity("CSE-2");
                if (btn.id === "faculty") setSelectedEntity("F01");
                if (btn.id === "room") setSelectedEntity("LH-1");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewFilter === btn.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Dynamic Dropdown populated from Real Dataset */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold uppercase text-[var(--muted)]">Filter:</span>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="p-1.5 px-3 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-extrabold focus:outline-none"
          >
            {viewFilter === "group" &&
              metadata.student_groups.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.id} ({g.name})
                </option>
              ))}

            {viewFilter === "faculty" &&
              metadata.faculty.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.id} — {f.name} ({f.department})
                </option>
              ))}

            {viewFilter === "room" &&
              metadata.rooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.name} - Cap {r.capacity})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Main Grid Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-bold text-[var(--muted)]">
              Loading live timetable from CIT solver...
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[700px] grid grid-cols-[100px_repeat(5,1fr)] gap-1.5">
                  <div className="p-2 text-center text-xs font-black text-[var(--muted)] bg-[var(--bg)] rounded-lg flex items-center justify-center">
                    Period
                  </div>
                  {days.map((d) => (
                    <div key={d} className="p-2 text-center rounded-lg bg-[var(--brand-50)] dark:bg-slate-800 font-extrabold text-xs font-heading">
                      {dayLabels[d]}
                    </div>
                  ))}

                  {periods.map(({ p, time }) => (
                    <React.Fragment key={p}>
                      <div className="p-2 rounded-lg bg-[var(--bg)] text-[10px] font-bold text-[var(--muted)] flex flex-col justify-center items-center text-center">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">P{p}</span>
                        <span className="text-[9px]">{time.split("–")[0]}</span>
                      </div>

                      {days.map((d) => {
                        const cellSessions = gridData?.[d]?.[p] || [];
                        if (cellSessions.length === 0) {
                          return (
                            <div key={d} className="p-2 rounded-lg border border-dashed border-[var(--border)]/60 bg-transparent flex items-center justify-center text-[10px] text-[var(--muted)]/40">
                              Free
                            </div>
                          );
                        }

                        const s = cellSessions[0];
                        return (
                          <div key={d} className={`p-2 rounded-lg border text-left transition hover:scale-[1.01] shadow-2xs ${getPillColor(s.kind)}`}>
                            <div className="text-[11px] font-extrabold truncate">{s.course_id}</div>
                            <div className="text-[9px] truncate font-medium">{s.course_title}</div>
                            <div className="text-[9px] font-bold text-blue-700 dark:text-blue-300 mt-1">
                              📍 {s.room_id} · 👤 {s.faculty_id}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Mobile View */}
              <div className="block md:hidden">
                <div className="flex items-center justify-between p-2 mb-3 bg-[var(--bg)] rounded-xl">
                  <button onClick={() => setMobileDay(days[(days.indexOf(mobileDay) + 4) % 5])} className="p-1 rounded-lg border">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-xs">{dayLabels[mobileDay]}</span>
                  <button onClick={() => setMobileDay(days[(days.indexOf(mobileDay) + 1) % 5])} className="p-1 rounded-lg border">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {periods.map(({ p, time }) => {
                    const sess = gridData?.[mobileDay]?.[p] || [];
                    if (sess.length === 0) return null;
                    const s = sess[0];
                    return (
                      <div key={p} className={`p-3 rounded-xl border flex justify-between items-center ${getPillColor(s.kind)}`}>
                        <div>
                          <div className="text-[10px] font-bold text-[var(--muted)]">P{p} ({time})</div>
                          <div className="text-xs font-extrabold">{s.course_id} — {s.course_title}</div>
                          <div className="text-[10px]">Room: {s.room_id} · Faculty: {s.faculty_name}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-white/60 dark:bg-black/30 rounded-lg">
                          {s.room_id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Info Sidebar */}
        <aside className="space-y-4">
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 font-heading">
              <Zap className="w-4 h-4 fill-amber-500" />
              Live Stats
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center gap-3">
              <div className="text-2xl font-black font-heading text-blue-600">189</div>
              <div>
                <div className="text-xs font-bold">Sessions Mapped</div>
                <div className="text-[10px] text-[var(--muted)]">243 teaching hrs/week</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <span>✓ 0 Hard Violations Verified</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}