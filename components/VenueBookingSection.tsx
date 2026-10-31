"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Bot,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  Building,
  Check,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sliders,
  Send,
  ShieldCheck,
} from "lucide-react";

interface VenueItem {
  id: string;
  name: string;
  type: string;
  capacity: number;
  features: string[];
  accessible: boolean;
  allowed_uses: string[];
}

interface BookingHistoryItem {
  request_id: string;
  title: string;
  requester: string;
  role: string;
  category: string;
  attendance: number;
  day: string;
  start_period: number;
  end_period: number;
  room_id: string | null;
  room_name: string;
  status: "approved" | "rejected" | "alternative_offered" | "cancelled" | "pending";
  reason: string;
  submitted_at: string;
  is_user_created?: boolean;
}

interface AlternativeOption {
  room_id: string;
  room_name: string;
  day: string;
  start_period: number;
  end_period: number;
  capacity: number;
  features: string[];
  reason: string;
}

const PERIOD_LABELS: Record<number, string> = {
  1: "P1 (08:00 - 09:00)",
  2: "P2 (09:00 - 10:00)",
  3: "P3 (10:00 - 11:00)",
  4: "P4 (11:00 - 12:00)",
  5: "P5 (12:00 - 13:00)",
  6: "P6 (14:00 - 15:00)",
  7: "P7 (15:00 - 16:00)",
  8: "P8 (16:00 - 17:00)",
  9: "P9 (17:00 - 18:00)",
  10: "P10 (18:00 - 19:00) [Event Window]",
  11: "P11 (19:00 - 20:00) [Event Window]",
  12: "P12 (20:00 - 21:00) [Event Window]",
  13: "P13 (21:00 - 22:00) [Curfew Limit]",
};

interface VenueBookingSectionProps {
  userRole?: string;
  currentUser?: string;
}

export default function VenueBookingSection({ userRole = "admin", currentUser }: VenueBookingSectionProps) {
  const [metrics, setMetrics] = useState({
    total_venues: 27,
    upcoming_bookings: 17,
    pending_approvals: 1,
    curfew: "P13 (22:00)",
  });
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Natural Language Input
  const [naturalPrompt, setNaturalPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Editable Form Details (Task 80)
  const [title, setTitle] = useState("Technical Workshop");
  const [category, setCategory] = useState("club_event");
  const [day, setDay] = useState("THU");
  const [startPeriod, setStartPeriod] = useState(10);
  const [duration, setDuration] = useState(2);
  const [attendance, setAttendance] = useState(100);
  const [selectedRoom, setSelectedRoom] = useState("SH-1");
  const [needs, setNeeds] = useState<string[]>(["projector", "pa_system"]);

  // Availability & Submission State
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    available: boolean;
    explanation: string;
    conflicts: string[];
    reasons: string[];
    alternatives: AlternativeOption[];
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load live data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cit/bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setMetrics(data.metrics || metrics);
      setVenues(data.venues || []);
      setBookings(data.bookings || []);
    } catch {
      setStatusMessage({ type: "error", text: "Could not connect to live venue booking backend." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Natural language parsing handler (Tasks 73-79)
  const handleParsePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalPrompt.trim()) return;

    setIsParsing(true);
    setStatusMessage(null);
    setCheckResult(null);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: naturalPrompt.trim() }),
      });

      if (!res.ok) throw new Error("Failed to parse prompt");
      const parsed = await res.json();

      // Populate editable fields
      if (parsed.title) setTitle(parsed.title);
      if (parsed.attendance) setAttendance(parsed.attendance);
      if (parsed.duration_periods) setDuration(parsed.duration_periods);
      if (parsed.day) setDay(parsed.day);
      if (parsed.start_period) setStartPeriod(parsed.start_period);
      if (parsed.needs) setNeeds(parsed.needs);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.requested_room) setSelectedRoom(parsed.requested_room);

      setStatusMessage({
        type: "info",
        text: `Request parsed successfully! You can verify and edit the details below before checking real-time availability.`,
      });
    } catch {
      setStatusMessage({ type: "error", text: "Unable to parse request. You can manually adjust the fields below." });
    } finally {
      setIsParsing(false);
    }
  };

  // Check Real-Time Availability (Tasks 81-86, 92, 93)
  const handleCheckAvailability = async () => {
    setIsChecking(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/cit/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          title,
          category,
          day,
          start_period: startPeriod,
          duration_periods: duration,
          attendance,
          room_id: selectedRoom,
          needs,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Availability check failed");

      setCheckResult({
        available: data.available,
        explanation: data.explanation,
        conflicts: data.conflicts || [],
        reasons: data.reasons || [],
        alternatives: data.alternatives || [],
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to check availability." });
    } finally {
      setIsChecking(false);
    }
  };

  // Submit Booking Request (Tasks 87, 88)
  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const effectiveRequester = currentUser || (userRole === "admin" ? "Dean's Office" : userRole === "department_coordinator" ? "Department Coordinator" : "Campus Club Member");

    try {
      const res = await fetch("/api/cit/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          title,
          category,
          day,
          start_period: startPeriod,
          duration_periods: duration,
          attendance,
          room_id: selectedRoom,
          needs,
          role: userRole,
          requester: effectiveRequester,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setStatusMessage({
        type: data.status === "rejected" ? "error" : "success",
        text: data.message || "Booking processed.",
      });

      // Refresh bookings list
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to submit booking." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve Pending Booking (Admin / Coordinator only)
  const handleApproveBooking = async (requestId: string) => {
    try {
      const res = await fetch("/api/cit/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          request_id: requestId,
          role: userRole,
          requester: currentUser || (userRole === "admin" ? "Dean's Office" : "Department Coordinator"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setStatusMessage({ type: "success", text: data.message });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to approve booking." });
    }
  };

  // Cancel Booking (Task 89 - with strict identity verification)
  const handleCancelBooking = async (requestId: string) => {
    try {
      const effectiveRequester = currentUser || (userRole === "admin" ? "Dean's Office" : userRole === "department_coordinator" ? "Department Coordinator" : "Campus Club Member");
      const res = await fetch("/api/cit/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          request_id: requestId,
          role: userRole,
          requester: effectiveRequester,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      setStatusMessage({ type: "success", text: data.message });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to cancel booking." });
    }
  };

  // Select Alternative Option (Task 92)
  const applyAlternative = (alt: AlternativeOption) => {
    setSelectedRoom(alt.room_id);
    setDay(alt.day);
    setStartPeriod(alt.start_period);
    setCheckResult(null);
    setStatusMessage({
      type: "info",
      text: `Applied suggested alternative: ${alt.room_name} on ${alt.day} P${alt.start_period}–P${alt.end_period}. Checking fresh availability...`,
    });
  };

  const toggleNeed = (feat: string) => {
    setNeeds((prev) => (prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL VENUES", value: metrics.total_venues.toString(), sub: "Classrooms, labs & halls", color: "text-blue-600" },
          { label: "CONFIRMED EVENTS", value: metrics.upcoming_bookings.toString(), sub: "Verified active bookings", color: "text-indigo-600" },
          { label: "PENDING APPROVALS", value: metrics.pending_approvals.toString(), sub: "Alternative offers awaiting confirmation", color: "text-emerald-600" },
          { label: "CURFEW RESTRICTION", value: metrics.curfew, sub: "Strict campus cutoff", color: "text-amber-500" },
        ].map((card, i) => (
          <div key={i} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--muted)] tracking-wider">{card.label}</div>
            <div className={`text-2xl font-black my-1 font-heading ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-[var(--muted)]">{card.sub}</div>
          </div>
        ))}
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : statusMessage.type === "error"
              ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200"
              : "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Booking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
        {/* Left: Input & Editable Form */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="text-base font-extrabold font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Venue Booking Request
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400">
              <Bot className="w-3.5 h-3.5" />
              English & Hinglish Parser
            </div>
          </div>

          {/* Natural Language Prompt */}
          <form onSubmit={handleParsePrompt} className="space-y-2">
            <label htmlFor="venue-prompt" className="block text-xs font-bold text-[var(--ink)]">
              Describe your event in plain English or Hinglish:
            </label>
            <div className="relative">
              <textarea
                id="venue-prompt"
                rows={3}
                value={naturalPrompt}
                onChange={(e) => setNaturalPrompt(e.target.value)}
                placeholder='e.g. "Coding club hackathon on Thursday at 2 PM, 90 students in computer lab with computers" or "seminar hall kal shaam 6 baje, 100 log, mic aur projector chahiye"'
                className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isParsing || !naturalPrompt.trim()}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsing ? "Extracting Requirements..." : "✦ Parse Request Automatically"}
            </button>
          </form>

          {/* Editable Parameters (Task 80) */}
          <div className="border-t border-[var(--border)] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[var(--ink)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Review & Edit Booking Details
              </span>
              <span className="text-[11px] text-[var(--muted)]">Inspectable before check</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Event Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                >
                  <option value="club_event">Club Event</option>
                  <option value="department_event">Department Event</option>
                  <option value="guest_lecture">Guest Lecture</option>
                  <option value="institute_event">Institute Main Event</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Day of Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                >
                  <option value="MON">Monday</option>
                  <option value="TUE">Tuesday</option>
                  <option value="WED">Wednesday</option>
                  <option value="THU">Thursday</option>
                  <option value="FRI">Friday</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Expected Attendance</label>
                <input
                  type="number"
                  value={attendance}
                  onChange={(e) => setAttendance(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Start Period</label>
                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                >
                  {Object.entries(PERIOD_LABELS).map(([p, label]) => (
                    <option key={p} value={p}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Duration (Hours / Periods)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-medium"
                >
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Target Venue</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] font-bold text-blue-700 dark:text-blue-300"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.id}) — {v.capacity} seats · {v.type} {v.accessible ? "· Accessible" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Required Facilities Chips */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1.5">Required Facilities</label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: "projector", label: "Projector" },
                  { id: "pa_system", label: "PA System / Mic" },
                  { id: "stage", label: "Stage / Podium" },
                  { id: "computers", label: "Computers / Coding" },
                  { id: "accessible", label: "Wheelchair Accessible" },
                ].map((item) => {
                  const on = needs.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleNeed(item.id)}
                      className={`px-3 py-1 rounded-full border text-xs font-bold transition flex items-center gap-1.5 ${
                        on
                          ? "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--row-hover)]"
                      }`}
                    >
                      {on && <Check className="w-3 h-3 text-blue-600" />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleCheckAvailability}
                disabled={isChecking}
                className="flex-1 py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {isChecking ? "Checking Schedule..." : "1. Check Real-Time Availability"}
              </button>

              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "Submitting..." : "2. Submit Booking Request"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Conflict & Alternative Suggestions Panel */}
        <div className="space-y-4">
          {/* Availability Decision Card */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
            <h3 className="text-sm font-extrabold font-heading mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Real-Time Availability & Rules Engine
            </h3>

            {!checkResult ? (
              <div className="py-8 text-center text-xs text-[var(--muted)] space-y-1">
                <HelpCircle className="w-8 h-8 mx-auto text-[var(--muted)]/50 mb-2" />
                <p className="font-semibold">No availability query checked yet.</p>
                <p>Click &quot;Check Real-Time Availability&quot; to test timetable clashes, curfew and room rules.</p>
              </div>
            ) : checkResult.available ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Venue Available & Validated!</span>
                </div>
                <p>{checkResult.explanation}</p>
                {checkResult.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-800 dark:text-red-300">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Venue Unavailable / Conflict Detected</span>
                  </div>
                  <p className="text-[11.5px]">{checkResult.explanation}</p>
                  {checkResult.conflicts.map((c, i) => (
                    <div key={i} className="text-[11px] font-medium text-red-700 dark:text-red-400">
                      • {c}
                    </div>
                  ))}
                </div>

                {/* Alternative Suggestions (Task 92) */}
                {checkResult.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[var(--ink)]">
                      Suggested Valid Alternatives:
                    </div>
                    {checkResult.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[var(--ink)]">
                            {alt.room_name} · {alt.day} P{alt.start_period}–P{alt.end_period}
                          </div>
                          <div className="text-[10.5px] text-[var(--muted)]">
                            {alt.capacity} seats · {alt.reason}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyAlternative(alt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 border border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0"
                        >
                          Use This
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Info card */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)] space-y-1.5">
            <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              CIT Booking Rules & Curfew
            </div>
            <p>1. Academic periods (P1–P9) give top priority to regular classes and exams.</p>
            <p>2. Event periods (P10–P13, 18:00–22:00) are designated for student clubs and cultural events.</p>
            <p>3. Curfew is strictly enforced at 22:00 (end of P13). All campus events must conclude before 22:00.</p>
          </div>
        </div>
      </div>

      {/* Booking History & Status Table (Tasks 90, 91, 93) */}
      <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold font-heading">
            Booking Requests & Decisions History
          </h3>
          <span className="text-xs font-bold text-[var(--muted)]">
            {bookings.length} requests on record
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--muted)]">No booking requests recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] font-bold">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Event Title</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3">Slot & Day</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reason / Explanation</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bookings.map((b) => (
                  <tr key={b.request_id} className="hover:bg-[var(--row-hover)] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[11px]">{b.request_id}</td>
                    <td className="py-3 px-3 font-semibold text-[var(--ink)]">{b.title}</td>
                    <td className="py-3 px-3 font-medium text-blue-600 dark:text-blue-400">{b.room_name || b.room_id || "None"}</td>
                    <td className="py-3 px-3">
                      {b.day} P{b.start_period}–P{b.end_period}
                    </td>
                    <td className="py-3 px-3 font-semibold">{b.attendance}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-black uppercase ${
                          b.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : b.status === "rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            : b.status === "cancelled"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[280px] text-[11px] text-[var(--muted)] leading-tight">
                      {b.reason}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {b.status === "pending" && (userRole === "admin" || userRole === "department_coordinator") && (
                        <button
                          type="button"
                          onClick={() => handleApproveBooking(b.request_id)}
                          className="px-2 py-1 mr-1 rounded text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800"
                        >
                          Approve
                        </button>
                      )}
                      {(b.status === "approved" || b.status === "pending") && (b.is_user_created || userRole === "admin" || userRole === "department_coordinator") && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.request_id)}
                          className="px-2 py-1 rounded text-[10.5px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
