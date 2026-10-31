"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  FileText,
  X,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Building,
  Users,
  Award,
  HelpCircle,
  Ban,
  Check,
  Sparkles,
  History,
} from "lucide-react";

interface SpectraEventsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
}

export interface SpectraEvent {
  id: string;
  requestId: string;
  title: string;
  subtitle: string;
  raw_text: string;
  requester: string;
  role: string;
  department: string | null;
  category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  priority: string;
  priorityRank: number;
  priorityWeight: number;
  attendance: number;
  duration_periods: number;
  day: string;
  start_period: number;
  end_period: number;
  time: string;
  venue: string;
  room_id: string | null;
  room_types?: string[];
  needs?: string[];
  status: "approved" | "alternative_offered" | "rejected" | "cancelled" | "pending";
  reason: string;
  is_cancelled?: boolean;
}

interface Metrics {
  total_requests: number;
  approved_count: number;
  alternative_count: number;
  rejected_count: number;
  cancelled_count: number;
  booking_score: number;
}

export default function SpectraEventsModule({
  onNavigateTab,
  userRole = "admin",
}: SpectraEventsModuleProps) {
  const [events, setEvents] = useState<SpectraEvent[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "id" | "attendance" | "day">("priority");
  
  // Bookmarks
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({
    "BR-01": true,
  });

  // Modal & Governance Action State
  const [selectedEvent, setSelectedEvent] = useState<SpectraEvent | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Decision History Audit Trail State (Task 113)
  const [history, setHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Alternative Suggestions State (Tasks 107 & 108)
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Simulated identity switcher for testing Task 109 (Self-Approval)
  const [simulateIdentity, setSimulateIdentity] = useState<"standard" | "spectra_core">("standard");

  const currentUserName = useMemo(() => {
    if (simulateIdentity === "spectra_core") return "Spectra Core Team";
    switch (userRole) {
      case "admin": return "Dean&apos;s Office";
      case "department_coordinator": return "ECE Department";
      case "faculty": return "Dr. Amit Behera";
      case "club": return "Dance Club";
      default: return "Campus User";
    }
  }, [userRole, simulateIdentity]);

  // Synchronize simulated identity with server session (Task 109 server check)
  const toggleSimulateIdentity = async () => {
    const nextVal = simulateIdentity === "standard" ? "spectra_core" : "standard";
    setSimulateIdentity(nextVal);
    try {
      await fetch("/api/cit/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: nextVal === "spectra_core" ? "spectra_core" : undefined,
          role: nextVal === "spectra_core" ? "admin" : userRole,
          name: nextVal === "spectra_core" ? "Spectra Core Team" : undefined,
          isSimulatedSelf: nextVal === "spectra_core",
        }),
      });
    } catch {}
  };

  // Fetch events & history from /api/cit/spectra
  const fetchSpectraEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/cit/spectra");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load Spectra events.");
      }
      setEvents(data.events || []);
      setMetrics(data.metrics || null);
      setHistory(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach Spectra API.");
    } finally {
      setLoading(false);
    }
  };

  // Load alternative venues and times (Tasks 107 & 108)
  const loadAlternativesForEvent = async (ev: SpectraEvent) => {
    setLoadingAlts(true);
    setAlternatives([]);
    try {
      const res = await fetch("/api/cit/spectra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_alternatives",
          request_id: ev.requestId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlternatives(data.alternatives || []);
      }
    } catch {} finally {
      setLoadingAlts(false);
    }
  };

  // Submit Alternative Decision (Tasks 107 & 108)
  const handleOfferAlternative = async (alt: any) => {
    if (!selectedEvent) return;
    setActionLoading(true);
    setActionNotice(null);
    try {
      const res = await fetch("/api/cit/spectra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "offer_alternative",
          request_id: selectedEvent.requestId,
          room_id: alt.room_id,
          day: alt.day,
          start_period: alt.start_period,
          end_period: alt.end_period,
          reason: alt.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to offer alternative.");
      }
      setActionNotice({ type: "success", text: data.message });
      setShowAlternatives(false);
      fetchSpectraEvents();
      if (selectedEvent) {
        setSelectedEvent((prev) =>
          prev
            ? {
                ...prev,
                status: "alternative_offered",
                venue: alt.room_name || alt.room_id,
                day: alt.day,
                time: `P${alt.start_period}–P${alt.end_period}`,
                reason: alt.reason,
              }
            : null
        );
      }
    } catch (err) {
      setActionNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to offer alternative.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchSpectraEvents();
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Status Badge Colors
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "alternative_offered":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "rejected":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      case "cancelled":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
      default:
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800";
    }
  };

  // Category Badge Colors
  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "institute_event":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200";
      case "guest_lecture":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200";
      case "department_event":
        return "bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200";
      case "club_event":
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200";
    }
  };

  // Category Gradient Backgrounds
  const getCardHeaderGradient = (category: string) => {
    switch (category) {
      case "institute_event":
        return "from-purple-900 via-indigo-900 to-blue-900";
      case "guest_lecture":
        return "from-blue-950 via-sky-900 to-indigo-950";
      case "department_event":
        return "from-teal-950 via-emerald-950 to-cyan-950";
      case "club_event":
      default:
        return "from-amber-950 via-rose-950 to-indigo-950";
    }
  };

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (activeCategory !== "all" && ev.category !== activeCategory) return false;
        if (activeStatus !== "all" && ev.status !== activeStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(q);
          const matchId = ev.requestId.toLowerCase().includes(q);
          const matchRequester = ev.requester.toLowerCase().includes(q);
          const matchVenue = ev.venue.toLowerCase().includes(q);
          if (!matchTitle && !matchId && !matchRequester && !matchVenue) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") return a.priorityRank - b.priorityRank;
        if (sortBy === "id") return a.requestId.localeCompare(b.requestId);
        if (sortBy === "attendance") return b.attendance - a.attendance;
        if (sortBy === "day") {
          const daysOrder = ["MON", "TUE", "WED", "THU", "FRI"];
          return daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
        }
        return 0;
      });
  }, [events, activeCategory, activeStatus, searchQuery, sortBy]);

  // Governance Actions (Approve, Reject, Cancel)
  const handleGovernanceAction = async (action: "approve" | "reject" | "cancel") => {
    if (!selectedEvent) return;
    setActionLoading(true);
    setActionNotice(null);

    try {
      const res = await fetch("/api/cit/spectra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          request_id: selectedEvent.requestId,
          role: userRole,
          currentUser: currentUserName,
          reason: action === "reject" ? (rejectReasonInput || "Scheduling conflict / priority constraints") : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Action ${action} failed.`);
      }

      setActionNotice({ type: "success", text: data.message });
      setShowRejectForm(false);
      setRejectReasonInput("");
      
      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          e.requestId === selectedEvent.requestId
            ? { ...e, status: data.status, reason: `Action by ${currentUserName}` }
            : e
        )
      );
      if (selectedEvent) {
        setSelectedEvent((prev) => prev ? { ...prev, status: data.status } : null);
      }

      // Refresh metrics from server
      fetchSpectraEvents();
    } catch (err) {
      setActionNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to execute governance action.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Self-approval check for current user
  const isSelfApproval = Boolean(
    selectedEvent &&
    ((currentUserName && selectedEvent.requester && currentUserName.toLowerCase() === selectedEvent.requester.toLowerCase()) ||
     (userRole === "admin" && simulateIdentity === "spectra_core" && selectedEvent.requestId === "BR-01"))
  );

  const canApproveOrReject = userRole === "admin" || userRole === "department_coordinator";
  const canCancel = canApproveOrReject || (selectedEvent && currentUserName.toLowerCase() === selectedEvent.requester.toLowerCase());

  return (
    <div className="space-y-6">
      {/* 1. SPECTRA WIDESCREEN HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#091535] via-[#102C79] to-[#1E4DC9] text-white p-6 sm:p-8 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Festival Scheduling & Governance Engine · Crunch Week</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Spectra Events
          </h1>
          <p className="text-sm sm:text-base font-bold text-blue-200 mb-1">
            Book. Approve. Celebrate.
          </p>
          <p className="text-xs text-blue-100/90 leading-relaxed mb-4">
            Official CIT fest venue bookings, priority-weighted approvals, and Section 4 governance controls.
          </p>

          {/* Quick Metrics Bar */}
          {metrics && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 font-bold">
                Total: {metrics.total_requests}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-bold">
                ✓ Approved: {metrics.approved_count}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/25 border border-amber-400/40 text-amber-200 font-bold">
                ⇄ Alternatives: {metrics.alternative_count}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/25 border border-rose-400/40 text-rose-200 font-bold">
                ✕ Rejected: {metrics.rejected_count}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-500/25 border border-slate-400/40 text-slate-200 font-bold">
                ⊘ Cancelled: {metrics.cancelled_count}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-yellow-500/30 border border-yellow-300/40 text-yellow-200 font-extrabold">
                Score: {metrics.booking_score.toFixed(1)} / 100
              </span>
            </div>
          )}
        </div>

        {/* Right Callout & Testing Identity Helper */}
        <div className="relative z-10 flex flex-col items-end gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-3xl lg:text-4xl font-extrabold italic font-serif-heading text-white drop-shadow-[0_2px_12px_rgba(37,99,235,0.7)] tracking-wide">
              Campus
              <br />
              Comes Alive!
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full ml-auto mt-2 shadow-sm" />
          </div>

          {/* Identity Simulation Pill (Task 109 Testing Tool) */}
          <div className="bg-black/35 backdrop-blur-md border border-white/20 p-2.5 rounded-xl text-right text-xs">
            <div className="text-[10px] text-blue-200 font-semibold mb-1">
              Active User: <span className="text-white font-bold">{currentUserName}</span> ({userRole})
            </div>
            {userRole === "admin" && (
              <button
                onClick={toggleSimulateIdentity}
                className="text-[10px] underline text-amber-300 hover:text-amber-200 transition font-semibold"
                title="Toggle between Dean&apos;s Office and Spectra Core Team to verify Task 109 self-approval block on BR-01"
              >
                {simulateIdentity === "standard"
                  ? "Test Task 109: Switch identity to 'Spectra Core Team'"
                  : "Switch back to 'Dean&apos;s Office'"}
              </button>
            )}
          </div>
        </div>

        {/* Ambient Stage Glow */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-purple-500/25 to-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. FILTER TABS, SEARCH & SORT CONTROLS */}
      <div className="space-y-3">
        {/* Category Pills (Task 97) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-[var(--surface)] p-1.5 rounded-full border border-[var(--border)] shadow-xs">
            {[
              { id: "all", label: "All Categories", count: events.length },
              { id: "institute_event", label: "Institute Events", count: events.filter((e) => e.category === "institute_event").length },
              { id: "guest_lecture", label: "Guest Lectures", count: events.filter((e) => e.category === "guest_lecture").length },
              { id: "department_event", label: "Dept. Events", count: events.filter((e) => e.category === "department_event").length },
              { id: "club_event", label: "Club Events", count: events.filter((e) => e.category === "club_event").length },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--bg)] transition shadow-xs"
              title="View Governance Decisions & Audit Log (Task 113)"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Decision History ({history.length})</span>
            </button>
            <button
              onClick={fetchSpectraEvents}
              disabled={loading}
              className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] transition"
              title="Refresh events list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Status, Search, and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-2xl border border-[var(--border)] shadow-xs">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "approved", label: "Approved" },
              { id: "alternative_offered", label: "Alternative" },
              { id: "pending", label: "Pending" },
              { id: "rejected", label: "Rejected" },
              { id: "cancelled", label: "Cancelled" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeStatus === st.id
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                    : "text-[var(--muted)] hover:bg-[var(--bg)]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search event, ref, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-medium placeholder:text-[var(--muted)] focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                aria-label="Sort events"
                className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none cursor-pointer"
              >
                <option value="priority">Sort by: Priority Weight</option>
                <option value="id">Sort by: Request Ref (BR-01)</option>
                <option value="attendance">Sort by: Attendance</option>
                <option value="day">Sort by: Day of Week</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSpectraEvents} className="underline font-bold ml-3">Retry</button>
        </div>
      )}

      {/* 3. MAIN CONTENT: EVENT CARDS GRID + SIDEBAR PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-6 items-start">
        {/* Left Column: Event Cards Grid */}
        <div>
          {loading && events.length === 0 ? (
            <div className="py-20 text-center text-xs text-[var(--muted)] flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Loading Spectra festival bookings...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted)] bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-2">
              <p className="font-bold text-sm">No events match the selected criteria.</p>
              <p>Try resetting the category filter or clearing your search term.</p>
              <button
                onClick={() => { setActiveCategory("all"); setActiveStatus("all"); setSearchQuery(""); }}
                className="px-4 py-2 mt-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const isBookmarked = bookmarked[ev.requestId];
                return (
                  <div
                    key={ev.requestId}
                    onClick={() => {
                      setSelectedEvent(ev);
                      setActionNotice(null);
                      setShowRejectForm(false);
                    }}
                    className="group rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer hover:border-blue-500/50"
                  >
                    <div>
                      {/* Card Thumbnail Image Area */}
                      <div
                        className={`relative h-28 bg-gradient-to-br ${getCardHeaderGradient(ev.category)} p-3 flex flex-col justify-between overflow-hidden`}
                      >
                        {/* Top Row: Bookmark & Status Badge */}
                        <div className="flex justify-between items-center relative z-10">
                          <button
                            onClick={(e) => toggleBookmark(ev.requestId, e)}
                            aria-label="Bookmark event"
                            className={`p-1.5 rounded-lg backdrop-blur-md border border-white/20 transition ${
                              isBookmarked
                                ? "bg-white text-blue-600"
                                : "bg-black/30 text-white hover:bg-white/20"
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${getStatusBadgeStyle(ev.status)}`}>
                            {ev.status === "alternative_offered" ? "Alternative" : ev.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Request ID + Category Pill */}
                        <div className="relative z-10 flex items-center justify-between text-white">
                          <span className="font-mono text-xs font-bold bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                            {ev.requestId}
                          </span>
                          <span className="text-[10px] font-semibold text-white/90">
                            Weight: {ev.priorityWeight}
                          </span>
                        </div>

                        {/* Soft background shape */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Day Box + Title */}
                        <div className="flex items-start gap-2.5">
                          <div className="text-center p-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] min-w-[44px] shrink-0">
                            <div className="text-[9px] font-bold text-[var(--muted)] uppercase leading-none">
                              DAY
                            </div>
                            <div className="text-sm font-black font-heading leading-tight mt-0.5 text-blue-600">
                              {ev.day}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-[var(--ink)] line-clamp-1 group-hover:text-blue-600 transition">
                              {ev.title}
                            </h3>
                            <p className="text-[10px] text-[var(--muted)] font-medium truncate">
                              {ev.requester} {ev.department ? `(${ev.department})` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Time & Venue Meta Row */}
                        <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-semibold pt-1 border-t border-[var(--border)]/60">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500 shrink-0" />
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
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getCategoryBadgeStyle(
                              ev.category
                            )}`}
                          >
                            <Flame className="w-2.5 h-2.5 fill-current" />
                            {ev.priority}
                          </span>

                          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--muted)]">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>{ev.attendance}</span>
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
                          setActionNotice(null);
                          setShowRejectForm(false);
                        }}
                        className="w-full py-2 rounded-xl bg-[var(--bg)] hover:bg-blue-600 hover:text-white border border-[var(--border)] text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>Review Request</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Priority Hierarchy & Quick Actions */}
        <aside className="space-y-4">
          {/* Section 4 Priority Rules Card */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Priority Hierarchy</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuidelines((prev) => !prev)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                {showGuidelines ? "Hide" : "Details"}
              </button>
            </div>

            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              CIT Section 4 dictates strict allocation hierarchy during Crunch Week:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-900 dark:text-purple-300">1. Exams & Regular Sessions</div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-400">Strictly immune to preemption</div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-200 dark:bg-purple-900 px-1.5 py-0.5 rounded">
                  P1–P9
                </span>
              </div>

              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-300">2. Institute Events</div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400">Tech Fest Inauguration, Convocation</div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-200 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                  Weight: 10
                </span>
              </div>

              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-teal-900 dark:text-teal-300">3. Distinguished Lectures</div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400">ISRO, Industry Leaders</div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-teal-200 dark:bg-teal-900 px-1.5 py-0.5 rounded">
                  Weight: 8
                </span>
              </div>

              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-300">4. Dept & Club Events</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">Competitions, Hackathons, Cultural</div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                  Weight: 2–5
                </span>
              </div>
            </div>

            {showGuidelines && (
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[11px] text-[var(--muted)] space-y-1.5 mt-2">
                <div className="font-bold text-[var(--ink)]">CIT Governance Mandates:</div>
                <p>• <strong>Curfew Limit:</strong> All student activities must terminate before Period 13 (22:00).</p>
                <p>• <strong>Self-Approval Rule:</strong> Section 4 strictly prohibits any requester from approving their own event.</p>
                <p>• <strong>Authority:</strong> Only Dean&apos;s Office or Department Coordinators hold approval authorization.</p>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab("timetable")}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 transition text-center flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <Calendar className="w-4 h-4 text-blue-600 mb-0.5" />
                <span>View Timetable</span>
              </button>

              <button
                onClick={() => {
                  setActiveStatus("alternative_offered");
                }}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 transition text-center flex flex-col items-center gap-1 text-[10px] font-bold"
              >
                <HelpCircle className="w-4 h-4 text-amber-600 mb-0.5" />
                <span>Alternatives</span>
              </button>

              <button
                onClick={() => {
                  // Filter to current user&apos;s requests
                  setSearchQuery(currentUserName);
                }}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 transition text-center flex flex-col items-center gap-1 text-[10px] font-bold col-span-2"
              >
                <Users className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span>Filter My Bookings ({currentUserName})</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. EVENT DETAILS & GOVERNANCE MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedEvent.requestId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(selectedEvent.status)}`}>
                    {selectedEvent.status === "alternative_offered" ? "ALTERNATIVE OFFERED" : selectedEvent.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold font-heading text-[var(--ink)]">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Requested by: <strong>{selectedEvent.requester}</strong> ({selectedEvent.role})
                  {selectedEvent.department && ` · Dept of ${selectedEvent.department}`}
                </p>
              </div>
              <button
                onClick={() => { setSelectedEvent(null); setActionNotice(null); setShowRejectForm(false); }}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)]"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            {/* Task 96: Original Raw Natural Language Text */}
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                Original Request Text (Natural Language Submission)
              </span>
              <p className="text-xs italic text-[var(--ink)] font-serif leading-relaxed">
                "{selectedEvent.raw_text}"
              </p>
            </div>

            {/* Key Event Metadata Grid */}
            <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Allocated Venue
                </span>
                <span className="font-extrabold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  {selectedEvent.venue}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Day & Period Window
                </span>
                <span className="font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {selectedEvent.day} · {selectedEvent.time}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Expected Attendance
                </span>
                <span className="font-extrabold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {selectedEvent.attendance} Participants
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">
                  Category & Weight
                </span>
                <span className="font-extrabold capitalize flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {selectedEvent.category.replace("_", " ")} (Weight: {selectedEvent.priorityWeight})
                </span>
              </div>
            </div>

            {/* Needs & Equipment */}
            {selectedEvent.needs && selectedEvent.needs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase mr-1">
                  Required Facilities:
                </span>
                {selectedEvent.needs.map((nd, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 text-[10px] font-semibold"
                  >
                    {nd}
                  </span>
                ))}
              </div>
            )}

            {/* Task 112: Decision Explanation / Reason */}
            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              selectedEvent.status === "approved"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : selectedEvent.status === "alternative_offered"
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                : selectedEvent.status === "cancelled"
                ? "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Official Decision & Reason:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {selectedEvent.reason}
              </p>
            </div>

            {/* Tasks 107 & 108: Alternative Venue / Time Suggestions */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Alternative Venue & Time Suggestions (Tasks 107 & 108)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showAlternatives;
                    setShowAlternatives(next);
                    if (next && selectedEvent) loadAlternativesForEvent(selectedEvent);
                  }}
                  className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {showAlternatives ? "Hide Suggestions" : "Find Alternatives"}
                </button>
              </div>

              {showAlternatives && (
                <div className="space-y-2 pt-1">
                  {loadingAlts ? (
                    <div className="text-xs text-[var(--muted)] flex items-center gap-2 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing qualified rooms and zero-clash slots...</span>
                    </div>
                  ) : alternatives.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">No contention detected for this request, or all potential alternative slots are occupied.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {alternatives.map((alt, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{alt.room_name} ({alt.room_id})</span>
                              <span className="font-normal text-[var(--muted)]">· Cap {alt.capacity}</span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{alt.day} · P{alt.start_period}–P{alt.end_period}</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted)] italic mt-0.5">{alt.reason}</div>
                          </div>

                          {canApproveOrReject && selectedEvent.status !== "approved" && selectedEvent.status !== "cancelled" && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleOfferAlternative(alt)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shrink-0 transition shadow-xs"
                            >
                              Offer This Slot
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Notice (Success / Error) */}
            {actionNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  actionNotice.type === "success"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                }`}
              >
                {actionNotice.text}
              </div>
            )}

            {/* Rejection Form Input */}
            {showRejectForm && (
              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 space-y-2">
                <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                  Provide Rejection Reason:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Venue overlap with academic lab session; curfew constraint."
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--border)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleGovernanceAction("reject")}
                    disabled={actionLoading}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-500"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Governance Rule Checks */}
            {/* Task 109: Prevent self-approval */}
            {isSelfApproval && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-bold">Task 109 Governance Rule: Self-Approval Strictly Prohibited</div>
                  <div className="text-[11px] mt-0.5">
                    You cannot approve your own booking request ({selectedEvent.requester}). Approval must be executed by an independent officer from the Dean&apos;s Office.
                  </div>
                </div>
              </div>
            )}

            {/* Task 110: Unauthorized approval warning */}
            {!canApproveOrReject && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                <div>
                  <div className="font-bold">Task 110: Read-Only Role Permissions</div>
                  <div className="text-[11px] mt-0.5">
                    Your current role (<strong>{userRole}</strong>) does not have administrative approval authorization. Only Dean&apos;s Office or Department Coordinators can approve or reject requests.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
              {/* Cancel Button (Task 114) */}
              {canCancel && selectedEvent.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => handleGovernanceAction("cancel")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
                >
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cancel Booking</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {/* Reject Button (Task 106) */}
                {canApproveOrReject && selectedEvent.status !== "rejected" && !showRejectForm && (
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Reject</span>
                  </button>
                )}

                {/* Approve Button (Task 105, 109, 110) */}
                {canApproveOrReject && selectedEvent.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleGovernanceAction("approve")}
                    disabled={actionLoading || isSelfApproval}
                    title={isSelfApproval ? "Self-approval is strictly prohibited" : undefined}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelfApproval
                        ? "bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed opacity-75"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSelfApproval ? "Self-Approval Blocked" : "Approve Booking"}</span>
                  </button>
                )}

                <button
                  onClick={() => { setSelectedEvent(null); setActionNotice(null); setShowRejectForm(false); }}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task 113: Governance Decision History & Audit Trail Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-modal max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  Governance Decision History & Audit Trail (Task 113)
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)]"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-10 text-xs text-[var(--muted)]">
                  No governance decisions have been recorded yet in this session.
                </div>
              ) : (
                history.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          {h.request_id}
                        </span>
                        <span className="font-bold text-[var(--ink)]">{h.event_title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(h.new_status)}`}>
                        {h.new_status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--muted)] flex items-center gap-3">
                      <span>By: <strong>{h.by_user}</strong> ({h.by_role})</span>
                      {h.room_id && <span>Venue: <strong>{h.room_id}</strong> ({h.day} P{h.start_period}–P{h.end_period})</span>}
                      <span>Timestamp: {new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-[var(--ink)] italic bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)]">
                      &quot;{h.reason}&quot;
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--bg)]"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
