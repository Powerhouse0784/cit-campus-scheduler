"use client";

import React, { useState } from "react";
import { ArrowRight, Bot, Sparkles, AlertCircle } from "lucide-react";

export default function VenueBookingSection() {
  const [bookingFlow, setBookingFlow] = useState<"quick" | "advanced" | "spectra">("quick");
  const [bookingPrompt, setBookingPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [attendance, setAttendance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "info" | "error"; text: string } | null>(null);

  const popularVenues = [
    { id: "AUD", name: "Main Auditorium", capacity: 500, type: "Auditorium", tag: "High Demand", tagColor: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", icon: "🏛️" },
    { id: "SH-1", name: "Seminar Hall 1", capacity: 150, type: "Seminar Hall", tag: "Available", tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: "🎤" },
    { id: "CS-LAB-1", name: "Computing Lab 1", capacity: 90, type: "Computer Lab", tag: "Available", tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: "💻" },
  ];

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = bookingPrompt.trim() || `${title} for ${attendance} people`;
    if (!query.trim()) {
      setStatusMessage({ type: "error", text: "Please provide event requirements before finding availability." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) throw new Error("Verification failed");
      const parsed = await res.json();

      const intent = parsed?.data ?? parsed;
      setStatusMessage({
        type: "info",
        text: `Draft parsed for ${intent.duration_periods || 2} period(s) on ${intent.windows?.[0]?.day || "the selected day"}. Availability, capacity and timetable conflicts have not been validated, and no booking was submitted. Please review the details before proceeding.`,
      });
    } catch {
      setStatusMessage({ type: "error", text: "Unable to verify venue availability at this time." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--muted)]" role="note">Prototype preview · venue summary cards remain blank until live venue and booking inventory is connected.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL VENUES", value: "—", sub: "Live inventory not connected", color: "text-blue-600" },
          { label: "UPCOMING BOOKINGS", value: "—", sub: "Live booking feed not connected", color: "text-indigo-600" },
          { label: "PENDING APPROVALS", value: "—", sub: "Approval feed not connected", color: "text-emerald-600" },
          { label: "CURFEW RESTRICTION", value: "P13 (22:00)", sub: "Strict cutoff", color: "text-amber-500" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--muted)] tracking-wider">{card.label}</div>
            <div className={`text-2xl font-black my-1 font-heading ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-[var(--muted)]">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
        <form onSubmit={handleBookingSubmit} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Book a Venue
              </h2>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <Bot className="w-3.5 h-3.5" />
                Just tell me what you need!
              </div>
            </div>

            <div className="flex p-1 bg-[var(--bg)] rounded-full border border-[var(--border)] mb-4">
              {[
                { id: "quick", label: "Quick Request" },
                { id: "advanced", label: "Advanced Booking" },
                { id: "spectra", label: "Spectra Event" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBookingFlow(tab.id as "quick" | "advanced" | "spectra")}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    bookingFlow === tab.id ? "bg-blue-600 text-white shadow-xs" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label htmlFor="venue-prompt" className="block text-xs font-semibold text-[var(--muted)] mb-2">
              Describe what you need in English or Hinglish:
            </label>
            <textarea
              id="venue-prompt"
              rows={3}
              value={bookingPrompt}
              onChange={(e) => setBookingPrompt(e.target.value)}
              placeholder='e.g. "Book auditorium for our tech event on Friday at 2 PM, 400 people" or "seminar hall kal shaam 6 baje, 100 log, mic chahiye"'
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {bookingFlow === "advanced" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label htmlFor="event-title" className="sr-only">Event title</label>
                <input
                  id="event-title"
                  type="text"
                  placeholder="Event title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs"
                />
                <label htmlFor="event-attendance" className="sr-only">Expected attendance</label>
                <input
                  id="event-attendance"
                  type="number"
                  placeholder="Expected Attendance"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white text-xs font-extrabold hover:opacity-95 transition shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Parsing Request…" : "✦ Parse Request →"}
            </button>

            {statusMessage && (
              <div
                className={`mt-3 p-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-2 ${
                  statusMessage.type === "info"
                    ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                }`}
              >
                {statusMessage.type === "info" ? <Sparkles className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {statusMessage.text}
              </div>
            )}
          </div>
        </form>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold font-heading">Popular Venues</h2>
              <span className="text-xs font-bold text-blue-600">27 Rooms Total</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {popularVenues.map((v) => (
                <div key={v.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex flex-col justify-between">
                  <div>
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-2xl mb-2">
                      {v.icon}
                    </div>
                    <div className="text-xs font-extrabold leading-tight">{v.name}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">{v.capacity} Seats</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${v.tagColor}`}>{v.tag}</span>
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[var(--brand-50)] dark:bg-slate-800/60 border border-[var(--border)] flex items-center gap-3">
            <span className="text-xl">🤖</span>
            <div className="text-[11px] text-[var(--muted)]">
              <strong className="text-[var(--ink)]">Deterministic Verification:</strong> The assistant parses intent; strict application code checks capacity, priority, and clash rules.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}