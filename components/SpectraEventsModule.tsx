"use client";

import React, { useState } from "react";
import {
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  Flame,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Ticket,
  X,
  AlertTriangle,
} from "lucide-react";

type EventFilter = "all" | "upcoming" | "ongoing" | "past" | "my";
type EventSort = "latest" | "earliest" | "priority";

interface EventCard {
  id: string; requestId: string; title: string; subtitle: string; dateDay: string; dateMonth: string;
  time: string; venue: string; priority: string; priorityType: "high" | "medium" | "low";
  status: "Upcoming" | "Ongoing" | "Past"; attendees: number; avatars: string[]; ctaText: string;
  category: string; organizer: string; bgGradient: string; imageType: string;
}

interface SpectraEventsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
}

export default function SpectraEventsModule({ onNavigateTab }: SpectraEventsModuleProps) {
  const [activeFilter, setActiveFilter] = useState<EventFilter>("all");
  const [sortBy, setSortBy] = useState<EventSort>("latest");
  const [selectedEvent, setSelectedEvent] = useState<EventCard | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({
    "tech-fest": true,
  });

  // Events matching the exact visual cards from your latest showcase
  const events: EventCard[] = [
    {
      id: "tech-fest",
      requestId: "BR-01",
      title: "Tech Fest 2026",
      subtitle: "Innovation • Creativity • Technology",
      dateDay: "15",
      dateMonth: "NOV",
      time: "09:00 AM",
      venue: "Main Auditorium",
      priority: "High Priority",
      priorityType: "high",
      status: "Upcoming",
      attendees: 450,
      avatars: ["👨‍💻", "👩‍💼", "👨‍🎓"],
      ctaText: "Request Approval →",
      category: "institute_event",
      organizer: "Spectra Core Team (Admin)",
      bgGradient: "from-purple-900 via-indigo-900 to-blue-900",
      imageType: "concert",
    },
    {
      id: "gaming-arena",
      requestId: "BR-09",
      title: "Gaming Arena",
      subtitle: "Play. Compete. Win.",
      dateDay: "20",
      dateMonth: "NOV",
      time: "10:00 AM",
      venue: "Sports Complex / OAT",
      priority: "Medium Priority",
      priorityType: "medium",
      status: "Upcoming",
      attendees: 120,
      avatars: ["🎮", "🕹️", "🎧"],
      ctaText: "Book Event →",
      category: "club_event",
      organizer: "Gaming Society",
      bgGradient: "from-blue-950 via-indigo-950 to-purple-950",
      imageType: "controller",
    },
    {
      id: "cultural-night",
      requestId: "BR-05a",
      title: "Cultural Night",
      subtitle: "Dance • Drama • Music",
      dateDay: "25",
      dateMonth: "NOV",
      time: "06:00 PM",
      venue: "Main Auditorium",
      priority: "Low Priority",
      priorityType: "low",
      status: "Upcoming",
      attendees: 180,
      avatars: ["💃", "🎭", "🎵"],
      ctaText: "View Details →",
      category: "club_event",
      organizer: "Dance & Dramatics Club",
      bgGradient: "from-amber-950 via-purple-950 to-indigo-950",
      imageType: "dance",
    },
  ];

  // Bookings list for the right panel
  const myBookings = [
    {
      id: "b1",
      title: "Tech Fest 2026",
      date: "Nov 15, 2026",
      status: "Approved",
      icon: "🎉",
    },
    {
      id: "b2",
      title: "Cultural Night",
      date: "Nov 25, 2026",
      status: "Pending",
      icon: "💃",
    },
    {
      id: "b3",
      title: "Gaming Arena",
      date: "Nov 20, 2026",
      status: "Pending",
      icon: "🎮",
    },
  ];

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getPriorityBadgeStyle = (type: string) => {
    switch (type) {
      case "high":
        return "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900/60";
      case "medium":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60";
      case "low":
      default:
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900/60";
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-[var(--muted)]" role="note">Sample event showcase · dates, attendee counts and statuses are illustrative dataset values, not live bookings.</p>
      <p className="text-xs text-[var(--muted)]" role="note">Prototype preview · event cards and booking history shown here are sample data, not live booking records.</p>
      {/* 1. SPECTRA WIDESCREEN HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#091535] via-[#102C79] to-[#1E4DC9] text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Spectra Events
          </h1>
          <p className="text-sm sm:text-base font-bold text-blue-200 mb-1">
            Book. Approve. Celebrate.
          </p>
          <p className="text-xs text-blue-100/90 leading-relaxed mb-4">
            From college fests to club events — all in one place.
          </p>
          <button
            onClick={() => setSelectedEvent(events[0])}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md flex items-center gap-2 group"
          >
            Explore Events
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Neon Handwritten Callout ("Campus Comes Alive!") */}
        <div className="relative z-10 text-right hidden sm:block">
          <div className="text-3xl lg:text-4xl font-extrabold italic font-serif-heading text-white drop-shadow-[0_2px_12px_rgba(37,99,235,0.7)] tracking-wide">
            Campus
            <br />
            Comes Alive!
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full ml-auto mt-2 shadow-sm" />
        </div>

        {/* Ambient Festival Concert Stage Glow */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-purple-500/25 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. FILTER TABS & SORT ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left Filter Pills with Counts */}
        <div className="flex flex-wrap items-center gap-2 bg-[var(--surface)] p-1.5 rounded-full border border-[var(--border)] shadow-xs">
          {[
            { id: "all", label: "All Events", count: events.length },
            { id: "upcoming", label: "Upcoming", count: events.filter((event) => event.status === "Upcoming").length },
            { id: "ongoing", label: "Ongoing", count: events.filter((event) => event.status === "Ongoing").length },
            { id: "past", label: "Past", count: events.filter((event) => event.status === "Past").length },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as EventFilter)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as EventSort)}
              aria-label="Sort events"
              className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none cursor-pointer"
            >
              <option value="latest">Sort by: Latest First</option>
              <option value="earliest">Sort by: Earliest First</option>
              <option value="priority">Sort by: Priority Level</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: 3-CARD GRID + MY BOOKINGS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-5 items-start">
        {/* Left Column: 3 Event Cards (matching Tech Fest, Gaming Arena, Cultural Night) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map((ev) => {
            const isBookmarked = bookmarked[ev.id];
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="group rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer hover:border-blue-500/50"
              >
                <div>
                  {/* Card Thumbnail Image Area */}
                  <div
                    className={`relative h-36 bg-gradient-to-br ${ev.bgGradient} p-3 flex flex-col justify-between overflow-hidden`}
                  >
                    {/* Top Row: Bookmark & Status */}
                    <div className="flex justify-between items-center relative z-10">
                      <button
                        onClick={(e) => toggleBookmark(ev.id, e)}
                        aria-label="Bookmark event"
                        className={`p-1.5 rounded-lg backdrop-blur-md border border-white/20 transition ${
                          isBookmarked
                            ? "bg-white text-blue-600"
                            : "bg-black/30 text-white hover:bg-white/20"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white">
                        <Calendar className="w-3 h-3" />
                        {ev.status}
                      </span>
                    </div>

                    {/* Graphic Elements matching thumbnails */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none">
                      {ev.imageType === "concert" && (
                        <div className="text-4xl filter drop-shadow-md">🎉</div>
                      )}
                      {ev.imageType === "controller" && (
                        <div className="text-5xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                          🎮
                        </div>
                      )}
                      {ev.imageType === "dance" && (
                        <div className="text-4xl filter drop-shadow-md">💃</div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5">
                    {/* Date Block + Title */}
                    <div className="flex items-start gap-3">
                      <div className="text-center p-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] min-w-[42px] shrink-0">
                        <div className="text-[9px] font-bold text-[var(--muted)] uppercase leading-none">
                          {ev.dateMonth}
                        </div>
                        <div className="text-base font-black font-heading leading-tight mt-0.5">
                          {ev.dateDay}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-[var(--ink)] truncate group-hover:text-blue-600 transition">
                          {ev.title}
                        </h3>
                        <p className="text-[10px] text-[var(--muted)] font-medium truncate">
                          {ev.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Time & Venue Meta Row */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-semibold pt-1 border-t border-[var(--border)]/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span>{ev.time}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate max-w-[130px]">
                        <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{ev.venue}</span>
                      </div>
                    </div>

                    {/* Priority Badge + Attendees */}
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeStyle(
                          ev.priorityType
                        )}`}
                      >
                        <Flame className="w-3 h-3 fill-current" />
                        {ev.priority}
                      </span>

                      {/* Attendee Avatars */}
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {ev.avatars.map((av, i) => (
                            <span
                              key={i}
                              className="inline-block w-5 h-5 rounded-full bg-[var(--bg)] text-xs flex items-center justify-center border border-[var(--surface)]"
                            >
                              {av}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-extrabold text-blue-600">
                          +{ev.attendees}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="p-3 pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(ev);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                  >
                    {ev.ctaText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: My Bookings & Quick Actions Panels */}
        <aside className="space-y-4">
          {/* My Bookings Card */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
                My Bookings
              </h3>
              <button
                onClick={() => setActiveFilter("my")}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {myBookings.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-sm shrink-0">
                      {b.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{b.title}</div>
                      <div className="text-[10px] text-[var(--muted)]">{b.date}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      b.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel (3 Clean Cards from Mockup) */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
              Quick Actions
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab("timetable")}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 transition text-center flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <Calendar className="w-4 h-4 text-blue-600 mb-0.5" />
                <span>View Timetable</span>
              </button>

              <button
                onClick={() => setActiveFilter("my")}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 transition text-center flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span>My Requests</span>
              </button>

              <button
                type="button"
                aria-expanded={showGuidelines}
                onClick={() => setShowGuidelines((value) => !value)}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 transition text-center flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <Ticket className="w-4 h-4 text-indigo-600 mb-0.5" />
                <span>Event Guidelines</span>
              </button>
            </div>
            {showGuidelines && (
              <p role="status" className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--muted)]">
                Scheduling policy details are not connected to a policy service in this prototype. Verify event priority and period restrictions with the institute administrator before approving a request.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* 4. EVENT DETAILS & BOOKING APPROVAL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Request Ref: {selectedEvent.requestId}
                </span>
                <h3 className="text-xl font-extrabold font-heading text-[var(--ink)]">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-[var(--muted)]">{selectedEvent.subtitle}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)]"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Requested Venue
                </span>
                <span className="font-extrabold">{selectedEvent.venue}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Scheduled Time
                </span>
                <span className="font-extrabold">
                  {selectedEvent.dateMonth} {selectedEvent.dateDay} · {selectedEvent.time}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Expected Attendance
                </span>
                <span className="font-extrabold">{selectedEvent.attendees} Students</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Organizer & Category
                </span>
                <span className="font-extrabold capitalize">
                  {selectedEvent.category.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Prototype limitation: no live booking validator is called here. */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Validation not performed
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-200">
                This is sample event data. Venue capacity, timetable overlap and exam priority have not been checked by a live booking validator.
              </p>
            </div>

            {/* Role-Aware Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled
                title="Approval API is not connected in this prototype"
                className="flex-1 py-2.5 rounded-xl bg-slate-400 text-white text-xs font-bold cursor-not-allowed opacity-80"
              >
                Approval unavailable in demo
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
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