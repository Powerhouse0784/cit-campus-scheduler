"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import HeroBanner from "@/components/HeroBanner";
import TimetableSection from "@/components/TimetableSection";
import VenueBookingSection from "@/components/VenueBookingSection";
import { Sparkles, Calendar, Clock, RefreshCw, Send, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [isDark, setIsDark] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);

  // AI parser state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Disruption state
  const [disruptionApplied, setDisruptionApplied] = useState(false);
  const [disruptionSummary, setDisruptionSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setScheduleData(data))
      .catch((e) => console.error("Error fetching schedule:", e));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleResetData = () => {
    setDisruptionApplied(false);
    setDisruptionSummary(null);
    setAiResult(null);
    setAiPrompt("");
    alert("Reset completed: Timetable and demo states restored to clean baseline.");
  };

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyDisruption = async () => {
    try {
      const res = await fetch("/api/disruption", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setDisruptionApplied(true);
        setDisruptionSummary(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg)] text-[var(--ink)]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        onReset={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 p-5 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 overflow-y-auto">
        {/* Top Navbar */}
        <TopNavbar isDark={isDark} toggleTheme={toggleTheme} role={role} />

        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <HeroBanner
              title="Good Morning, Ritik! 👋"
              subtitle="Welcome to CIT Campus Scheduler · Smart Scheduling. A Better Campus."
              eyebrow="Week 07 · Semester Overview"
              badge="0 Hard Conflicts"
              type="dashboard"
            />

            {/* Dashboard 4 Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "SESSIONS THIS WEEK", value: "28", sub: "Across all groups", color: "text-blue-600" },
                { label: "ROOMS IN USE", value: "42 / 60", sub: "70% Capacity utilized", color: "text-emerald-600" },
                { label: "PENDING APPROVALS", value: "12", sub: "Requests awaiting review", color: "text-amber-500" },
                { label: "SPECTRA WEEK", value: "In 7 Days", sub: "Event readiness active", color: "text-indigo-600" },
              ].map((card, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
                  <div className="text-[11px] font-bold text-[var(--muted)] tracking-wider uppercase">{card.label}</div>
                  <div className={`text-2xl font-black my-2 font-heading ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-[var(--muted)] font-medium">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Timetable Preview + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-extrabold text-sm font-heading">
                    Your Timetable <span className="text-[var(--muted)] font-normal">· Preview</span>
                  </h2>
                  <button onClick={() => setActiveTab("timetable")} className="text-xs font-bold text-blue-600">
                    View Full Schedule →
                  </button>
                </div>
                <div className="divide-y divide-[var(--border)] text-xs">
                  {[
                    { slot: "Mon · P1", title: "Mathematics Lecture", room: "Room 316", badge: "bg-blue-50 text-blue-700" },
                    { slot: "Mon · P2", title: "DSA Tutorial", room: "Room 201", badge: "bg-purple-50 text-purple-700" },
                    { slot: "Mon · P4", title: "Physics Lab", room: "Lab 1", badge: "bg-emerald-50 text-emerald-700" },
                    { slot: "Mon · P6", title: "Web Development", room: "Room 405", badge: "bg-amber-50 text-amber-700" },
                  ].map((row, i) => (
                    <div key={i} className="py-2.5 flex justify-between items-center">
                      <span className="font-semibold">{row.slot} · {row.title}</span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                        {row.room}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions 4 Grid */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
                <h2 className="font-extrabold text-sm font-heading mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => setActiveTab("venues")} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 font-bold text-xs flex flex-col items-center text-center gap-1 transition">
                    <span className="text-xl">▣</span> Book Venue
                  </button>
                  <button onClick={() => setActiveTab("changes")} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-amber-500 font-bold text-xs flex flex-col items-center text-center gap-1 transition">
                    <span className="text-xl">↻</span> Request Change
                  </button>
                  <button onClick={() => setActiveTab("ai")} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-indigo-500 font-bold text-xs flex flex-col items-center text-center gap-1 transition">
                    <span className="text-xl">✦</span> Ask AI
                  </button>
                  <button onClick={() => setActiveTab("timetable")} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-red-500 font-bold text-xs flex flex-col items-center text-center gap-1 transition">
                    <span className="text-xl">⚠</span> View Conflicts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-6">
            <HeroBanner
              title="Smart Timetable. A Well-Planned Campus."
              subtitle="No clashes. No confusion. Just a perfect schedule!"
              eyebrow="CIT Campus Scheduler"
              badge="No Hard Violations"
              type="timetable"
            />
            <TimetableSection scheduleData={scheduleData} />
          </div>
        )}

        {/* 3. VENUES TAB */}
        {activeTab === "venues" && (
          <div className="space-y-6">
            <HeroBanner
              title="Venue Booking"
              subtitle="Book. Manage. Celebrate. From classrooms to the auditorium — all in one place."
              eyebrow="Smart Campus · Smart Bookings"
              badge="24+ Venues Available"
              type="venue"
            />
            <VenueBookingSection />
          </div>
        )}

        {/* 4. AI ASSISTANT TAB */}
        {activeTab === "ai" && (
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
            <h2 className="text-lg font-black font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Scheduling & Hinglish Booking Assistant
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Type naturally in English or Hinglish. Deterministic rules check all constraints before submission.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder='e.g. "seminar hall kal shaam 6 baje, 2 ghante, 100 log, mic chahiye"'
                className="flex-1 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAiParse}
                disabled={aiLoading}
                className="px-6 py-3.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2"
              >
                {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Process
              </button>
            </div>

            {aiResult && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600 uppercase">Structured Booking Extracted</span>
                  <button className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
                    Submit Booking
                  </button>
                </div>
                {aiResult.accessibility_warning && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs font-medium border border-amber-200">
                    ⚠️ {aiResult.accessibility_warning}
                  </div>
                )}
                <pre className="text-xs p-3 bg-white dark:bg-slate-900 rounded-lg overflow-x-auto border border-blue-100 dark:border-slate-800">
                  {JSON.stringify(aiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 5. DISRUPTION TAB */}
        {activeTab === "changes" && (
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
            <h2 className="text-lg font-black font-heading">Semester Disruption Manager</h2>
            <p className="text-xs text-[var(--muted)]">
              Apply change files (`sample_disruption.json`) and review minimum session displacements.
            </p>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
              <strong>Pending Changes:</strong> F07 Monday travel, CR-102 maintenance closure, and addition of tutorial CS202-T2.
            </div>

            {!disruptionApplied ? (
              <button
                onClick={handleApplyDisruption}
                className="px-6 py-3 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition"
              >
                Simulate Disruption & Repair Timetable
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Disruption repaired with 0 hard violations. {disruptionSummary?.sessions_moved} sessions moved.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}