"use client";

import React, { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface TimetableSectionProps {
  scheduleData: any;
}

export default function TimetableSection({ scheduleData }: TimetableSectionProps) {
  const [viewFilter, setViewFilter] = useState<"weekly" | "faculty" | "room" | "group">("weekly");
  const [selectedGroup, setSelectedGroup] = useState<string>("CSE-2");
  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState(0);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dates = ["27 Oct", "28 Oct", "29 Oct", "30 Oct", "31 Oct"];
  const periods = [
    { p: "P1", time: "08:00 – 09:00" },
    { p: "P2", time: "09:00 – 10:00" },
    { p: "P3", time: "10:00 – 11:00" },
    { p: "P4", time: "11:00 – 12:00" },
    { p: "P5", time: "12:00 – 13:00" },
    { p: "P6", time: "14:00 – 15:00" },
    { p: "P7", time: "15:00 – 16:00" },
    { p: "P8", time: "16:00 – 17:00" },
  ];

  // Authentic sessions matrix mapped to CIT courses
  const mockScheduleTable: Record<string, { title: string; code: string; room: string; color: string }[]> = {
    Mon: [
      { title: "Data Structures", code: "CS201", room: "LH-1", color: "var(--course-blue)" },
      { title: "DBMS Lecture", code: "CS302", room: "LH-1", color: "var(--course-violet)" },
      { title: "Calculus & Linear", code: "MA101", room: "LH-2", color: "var(--course-green)" },
      { title: "Physics Lab", code: "PH191", room: "PHY-LAB", color: "var(--course-amber)" },
      { title: "Communicative Eng", code: "HS101", room: "CR-101", color: "var(--course-rose)" },
      { title: "Discrete Math", code: "CS202", room: "LH-3", color: "var(--course-blue)" },
      { title: "Digital Logic", code: "CS203", room: "LH-3", color: "var(--course-violet)" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
    ],
    Tue: [
      { title: "Operating Systems", code: "CS301", room: "LH-1", color: "var(--course-blue)" },
      { title: "Linear Algebra", code: "MA101", room: "LH-2", color: "var(--course-green)" },
      { title: "Computer Networks", code: "CS303", room: "LH-3", color: "var(--course-violet)" },
      { title: "Electronics Lab", code: "EC291", room: "ELEC-LAB-1", color: "var(--course-amber)" },
      { title: "AI & ML Seminar", code: "CS204", room: "LH-1", color: "var(--course-blue)" },
      { title: "Data Structures Lab", code: "CS291", room: "CS-LAB-1", color: "var(--course-cyan)" },
      { title: "Data Structures Lab", code: "CS291", room: "CS-LAB-1", color: "var(--course-cyan)" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
    ],
    Wed: [
      { title: "Data Structures", code: "CS201", room: "LH-1", color: "var(--course-blue)" },
      { title: "OOP in Java", code: "CS204", room: "LH-2", color: "var(--course-violet)" },
      { title: "Open Elective (Finance)", code: "OE301", room: "LH-3", color: "var(--course-green)" },
      { title: "Web Tech Lab", code: "CS391", room: "CS-LAB-2", color: "var(--course-cyan)" },
      { title: "Database Systems", code: "CS302", room: "LH-1", color: "var(--course-blue)" },
      { title: "Digital Logic Lab", code: "CS292", room: "ELEC-LAB-2", color: "var(--course-amber)" },
      { title: "Digital Logic Lab", code: "CS292", room: "ELEC-LAB-2", color: "var(--course-amber)" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
    ],
    Thu: [
      { title: "Computer Networks", code: "CS303", room: "LH-3", color: "var(--course-violet)" },
      { title: "Discrete Math", code: "CS202", room: "LH-2", color: "var(--course-green)" },
      { title: "Operating Systems", code: "CS301", room: "LH-1", color: "var(--course-blue)" },
      { title: "Circuit Analysis", code: "EE201", room: "LH-4", color: "var(--course-amber)" },
      { title: "Economics", code: "HS201", room: "LH-1", color: "var(--course-rose)" },
      { title: "Tutorial Session", code: "CS202-T1", room: "CR-101", color: "var(--course-blue)" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
    ],
    Fri: [
      { title: "Discrete Math", code: "CS202", room: "LH-2", color: "var(--course-green)" },
      { title: "Digital Logic", code: "CS203", room: "LH-2", color: "var(--course-violet)" },
      { title: "Calculus", code: "MA101", room: "LH-2", color: "var(--course-green)" },
      { title: "Systems Lab", code: "CS391", room: "CS-LAB-1", color: "var(--course-cyan)" },
      { title: "Computer Networks", code: "CS303", room: "LH-3", color: "var(--course-blue)" },
      { title: "Research Seminar", code: "CS301", room: "LH-1", color: "var(--course-violet)" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
      { title: "Free Period", code: "—", room: "—", color: "transparent" },
    ],
  };

  return (
    <div className="space-y-4">
      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-full border border-[var(--border)] shadow-sm">
          {[
            { id: "weekly", label: "▦ Weekly View" },
            { id: "faculty", label: "♙ By Faculty" },
            { id: "room", label: "▤ By Room" },
            { id: "group", label: "♧ By Group" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setViewFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewFilter === btn.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--muted)]">GROUP:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="p-1.5 px-3 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-bold focus:outline-none"
          >
            {["Y1-A", "Y1-B", "Y1-C", "Y1-D", "CSE-2", "ECE-2", "EE-2", "ME-2", "CE-2", "CSE-3", "ECE-3", "EE-3", "ME-3", "CE-3"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--muted)]">
            Week 07 ▾
          </span>
        </div>
      </div>

      {/* Main Timetable Grid & Quick Info Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        {/* Timetable Table Card */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card overflow-hidden">
          {/* Desktop Matrix View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[650px] grid grid-cols-[110px_repeat(5,1fr)] gap-1.5">
              {/* Header row */}
              <div className="p-2 text-center text-xs font-extrabold text-[var(--muted)] bg-[var(--bg)] rounded-lg flex items-center justify-center">
                Time / Day
              </div>
              {days.map((day, i) => (
                <div
                  key={day}
                  className="p-2 text-center rounded-lg bg-[var(--brand-50)] dark:bg-slate-800/60 font-heading font-extrabold text-xs"
                >
                  <div>{day}</div>
                  <div className="text-[10px] text-[var(--muted)] font-normal">{dates[i]}</div>
                </div>
              ))}

              {/* Rows P1 to P8 */}
              {periods.map((per, pIdx) => (
                <React.Fragment key={per.p}>
                  {/* Period label */}
                  <div className="p-2 rounded-lg bg-[var(--bg)] text-[10px] font-bold text-[var(--muted)] flex flex-col justify-center items-center text-center leading-tight">
                    <span>{per.time}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">({per.p})</span>
                  </div>

                  {/* Day Slots */}
                  {days.map((day) => {
                    const item = mockScheduleTable[day]?.[pIdx];
                    if (!item || item.title === "Free Period") {
                      return (
                        <div
                          key={day}
                          className="p-2 rounded-lg border border-dashed border-[var(--border)]/70 bg-transparent flex items-center justify-center text-[10px] text-[var(--muted)]/50 font-medium"
                        >
                          Free
                        </div>
                      );
                    }

                    return (
                      <div
                        key={day}
                        style={{ backgroundColor: item.color }}
                        className="p-2 rounded-lg border border-[var(--border)]/60 text-left transition-transform hover:scale-[1.01] shadow-xs"
                      >
                        <div className="text-[11px] font-extrabold leading-tight text-[var(--ink)] truncate">
                          {item.title}
                        </div>
                        <div className="text-[9px] text-[var(--muted)] font-semibold mt-0.5">
                          ({item.code}) · <span className="font-bold text-blue-700 dark:text-blue-300">{item.room}</span>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile Day-by-Day View (matches reference mobile mockup) */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between p-2 mb-3 bg-[var(--bg)] rounded-xl">
              <button
                onClick={() => setActiveMobileDayIndex((prev) => (prev > 0 ? prev - 1 : 4))}
                aria-label="Previous day"
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-extrabold text-sm font-heading">
                {days[activeMobileDayIndex]}, {dates[activeMobileDayIndex]}
              </div>
              <button
                onClick={() => setActiveMobileDayIndex((prev) => (prev < 4 ? prev + 1 : 0))}
                aria-label="Next day"
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {periods.map((per, idx) => {
                const item = mockScheduleTable[days[activeMobileDayIndex]]?.[idx];
                if (!item || item.title === "Free Period") return null;

                return (
                  <div
                    key={idx}
                    style={{ backgroundColor: item.color }}
                    className="p-3 rounded-xl border border-[var(--border)] flex justify-between items-center"
                  >
                    <div>
                      <div className="text-[10px] text-[var(--muted)] font-bold">{per.time} ({per.p})</div>
                      <div className="text-xs font-extrabold text-[var(--ink)]">{item.title}</div>
                      <div className="text-[10px] text-[var(--muted)]">{item.code} · {item.room}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-white/60 dark:bg-black/30 rounded-lg">
                      {item.room}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Info Sidebar */}
        <aside className="space-y-4">
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-500 font-heading">
              <Zap className="w-4 h-4 fill-amber-500" />
              Quick Info
            </div>

            {/* Next Class item */}
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] relative flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Next Class</div>
                <div className="text-xs font-extrabold mt-0.5">Data Structures</div>
                <div className="text-[10px] text-[var(--muted)]">08:00 – 09:00 · LH-1</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Midsem Exams item */}
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] relative flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-[var(--muted)] uppercase">Midsem Exams</div>
                <div className="text-xs font-extrabold mt-0.5">Next Week</div>
                <div className="text-[10px] text-[var(--muted)]">41 Exams · 6 Days</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Room Utilisation Circular Gauge (78% from mockup) */}
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--border)]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray="78, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black font-heading">78%</span>
              </div>
              <div>
                <div className="text-xs font-extrabold flex items-center gap-1">
                  78% <span className="text-emerald-500 text-[10px]">↑ 2%</span>
                </div>
                <div className="text-[10px] text-[var(--muted)]">Rooms in Use (21/27)</div>
              </div>
            </div>

            {/* Spectra 2K26 Glowing Event Banner Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-900 p-4 text-white shadow-md">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 mb-1">
                ★ Spectra 2K26
              </div>
              <div className="text-xs font-bold">Tech Fest · Book Your Venue</div>
              <button className="mt-3 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-[10px] font-black text-white flex items-center gap-1 transition-all">
                View Details →
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}