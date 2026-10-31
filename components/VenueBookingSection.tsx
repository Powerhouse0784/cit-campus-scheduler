"use client";

import React, { useState } from "react";
import { ArrowRight, Bot, Sparkles, Send, CheckCircle2, Clock } from "lucide-react";

export default function VenueBookingSection() {
  const [bookingFlow, setBookingFlow] = useState<"quick" | "advanced" | "spectra">("quick");
  const [bookingPrompt, setBookingPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const popularVenues = [
    {
      id: "AUD",
      name: "Main Auditorium",
      capacity: 500,
      type: "Auditorium",
      tag: "High Demand",
      tagColor: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
      icon: "🏛️",
      features: "Stage, PA, Projector, AC",
    },
    {
      id: "SH-1",
      name: "Seminar Hall 1",
      capacity: 150,
      type: "Seminar Hall",
      tag: "Available",
      tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
      icon: "🎤",
      features: "Projector, PA System, AC",
    },
    {
      id: "CS-LAB-1",
      name: "Computing Lab 1",
      capacity: 90,
      type: "Computer Lab",
      tag: "Available",
      tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
      icon: "💻",
      features: "90 Computers, Projector, AC",
    },
  ];

  const handleBookingSubmit = () => {
    if (!bookingPrompt.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess("Your booking request has been parsed and queued for rule verification.");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards from Venue Booking mockup */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL VENUES", value: "27", sub: "Rooms & Event Spaces", color: "text-blue-600" },
          { label: "UPCOMING BOOKINGS", value: "18", sub: "Next 7 Days", color: "text-indigo-600" },
          { label: "PENDING APPROVALS", value: "5", sub: "Awaiting Review", color: "text-emerald-600" },
          { label: "SPECTRA BOOKINGS", value: "12", sub: "Approved Events", color: "text-amber-500" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--muted)] tracking-wider">{card.label}</div>
            <div className={`text-2xl font-black my-1 font-heading ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-[var(--muted)]">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Layout: Book a Venue Form + Popular Venues */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
        {/* Left Card: Book a Venue */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Book a Venue
              </h2>

              {/* Bot greeting tag */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <Bot className="w-3.5 h-3.5" />
                Just tell me what you need!
              </div>
            </div>

            {/* Booking Flow Tabs */}
            <div className="flex p-1 bg-[var(--bg)] rounded-full border border-[var(--border)] mb-4">
              {[
                { id: "quick", label: "Quick Request" },
                { id: "advanced", label: "Advanced Booking" },
                { id: "spectra", label: "Spectra Event" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBookingFlow(tab.id as any)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    bookingFlow === tab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Field input */}
            <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
              Describe what you need in English or Hinglish:
            </label>
            <textarea
              rows={3}
              value={bookingPrompt}
              onChange={(e) => setBookingPrompt(e.target.value)}
              placeholder='e.g. "Book auditorium for our tech event on 25th Oct, 2 PM" or "seminar hall kal shaam 6 baje, 100 log, mic chahiye"'
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {bookingFlow === "advanced" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Expected Attendance"
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs"
                />
                <input
                  type="text"
                  placeholder="Required Equipment (e.g. PA, Stage)"
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={handleBookingSubmit}
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white text-xs font-extrabold hover:opacity-95 transition shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Checking Availability..." : "✦ Find Availability →"}
            </button>

            {bookingSuccess && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {bookingSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Popular Venues */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold font-heading">Popular Venues</h2>
              <button className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {popularVenues.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-2xl mb-2">
                      {v.icon}
                    </div>
                    <div className="text-xs font-extrabold leading-tight">{v.name}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">{v.capacity} Capacity</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${v.tagColor}`}>
                      {v.tag}
                    </span>
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
              <strong className="text-[var(--ink)]">Need assistance?</strong> All venue conflicts and capacity constraints are validated before booking.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}