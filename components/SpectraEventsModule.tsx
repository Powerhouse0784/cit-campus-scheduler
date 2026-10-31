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
  Leaf,
  type LucideIcon,
} from "lucide-react";

interface SpectraEventsModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
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

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  alternative_offered: "Alternative",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const AVATAR_TONES = ["from-[#F59E8B] to-[#C2410C]", "from-[#8FB4F5] to-[#1D4ED8]", "from-[#86D9B5] to-[#047857]"];

/** Priority label from the server's priority weight (never colour alone: text + icon). */
function priorityInfo(weight: number): { label: string; Icon: LucideIcon; cls: string } {
  if (weight >= 8)
    return { label: "High Priority", Icon: Flame, cls: "bg-[#FFE3E0] text-[#C2260F] dark:bg-[#4A1A16] dark:text-[#FF9A8A]" };
  if (weight >= 5)
    return { label: "Medium Priority", Icon: Leaf, cls: "bg-[#DDF5E3] text-[#1B7A3A] dark:bg-[#12402A] dark:text-[#6EE7A0]" };
  return { label: "Low Priority", Icon: Flame, cls: "bg-[#FFE8D2] text-[#B45309] dark:bg-[#4A3016] dark:text-[#FFC27A]" };
}

/** Artwork for a card, picked from the event title / category. */
function eventImage(ev: { title: string; category: string }): string {
  const t = ev.title.toLowerCase();
  if (/(game|gaming|esport|code|hack|sprint|quiz|robo|sport|tournament)/.test(t)) return "/images/spectra/gaming.jpg";
  if (/(cultur|dance|music|drama|night|concert|fashion|art)/.test(t)) return "/images/spectra/dance.jpg";
  if (ev.category === "club_event") return "/images/spectra/gaming.jpg";
  if (ev.category === "department_event") return "/images/spectra/dance.jpg";
  return "/images/spectra/crowd.jpg";
}

const ctaLabel = (status: string) =>
  status === "pending" ? "Request Approval" : status === "alternative_offered" ? "Review Alternative" : "View Details";

export default function SpectraEventsModule({
  onNavigateTab,
  userRole = "admin",
  isDark = false,
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
      case "admin": return "Dean's Office";
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

  // "My Bookings": the signed-in user's own requests (falls back to the first three)
  const myBookings = useMemo(() => {
    const mine = events.filter((e) => e.requester.toLowerCase() === currentUserName.toLowerCase());
    return (mine.length ? mine : events).slice(0, 3);
  }, [events, currentUserName]);

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
      {/* 1. HERO */}
      <section
        className="relative overflow-hidden rounded-[22px] text-white min-h-[210px] md:min-h-[170px] lg:min-h-[176px] flex items-start md:items-center"
        style={{
          background: isDark
            ? "linear-gradient(100deg,#040A2A 0%,#0A1566 45%,#2E2AA8 100%)"
            : "linear-gradient(100deg,#0B1655 0%,#1B2D9E 42%,#4B3CD8 100%)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(90,110,255,.55), 0 14px 40px rgba(60,60,255,.28)"
            : "0 14px 40px rgba(40,50,160,.30)",
        }}
      >
        <div
          className="hero-img hero-img-both absolute bottom-0 right-0 h-[46%] w-full md:h-full md:w-[56%] lg:right-[12%] lg:w-[58%] bg-cover bg-[position:60%_100%] md:bg-right"
          style={{ backgroundImage: `url(/images/spectra/hero-${isDark ? "dark" : "light"}.jpg)` }}
          role="img"
          aria-label="Festival crowd in front of the CIT campus"
        />
        <div className="relative z-10 px-5 pt-5 pb-4 sm:px-8 md:py-0 max-w-[560px]">
          <h1 className="font-serif-heading font-bold tracking-tight text-[30px] sm:text-[40px] leading-[1.05]">
            Spectra Events
          </h1>
          <p className="mt-1.5 font-heading font-extrabold text-[15px] sm:text-[19px]">Book. Approve. Celebrate.</p>
          <p className="mt-1 text-[12.5px] sm:text-[14px] font-medium text-white/90">
            From college fests to club events — all in one place.
          </p>
          <button
            onClick={() => document.getElementById("spectra-events-grid")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-bold text-white border border-sky-300/70 bg-[#0B2A9A]/80 hover:bg-[#1239B8] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            style={{ boxShadow: "0 0 16px rgba(110,130,255,.5)" }}
          >
            Explore Events <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 -rotate-6 text-right z-10 pointer-events-none">
          <div className="font-serif-heading italic font-semibold text-[30px] leading-[1.02] [text-shadow:0_2px_10px_rgba(0,10,70,.95)]">
            Campus
            <br />
            Comes Alive!
          </div>
          <svg viewBox="0 0 150 10" className="ml-auto mt-1 w-28 h-2.5" aria-hidden="true">
            <path d="M3 7C40 2 100 2 147 5" stroke="#F5B731" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </section>

      {/* Metrics + governance tools (kept from the working module) */}
      {(metrics || userRole === "admin") && (
        <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
          {metrics && (
            <>
              <span className="px-2.5 py-1 rounded-full border bg-[var(--surface)] font-bold" style={{ borderColor: "var(--border)" }}>
                Total: {metrics.total_requests}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                ✓ Approved: {metrics.approved_count}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                ⇄ Alternatives: {metrics.alternative_count}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                ✕ Rejected: {metrics.rejected_count}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
                ⊘ Cancelled: {metrics.cancelled_count}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 font-extrabold">
                Score: {metrics.booking_score.toFixed(1)} / 100
              </span>
            </>
          )}
          <span className="ml-auto text-[11px] text-[var(--muted)] font-semibold">
            Active user: <span className="text-[var(--ink)] font-bold">{currentUserName}</span> ({userRole})
            {userRole === "admin" && (
              <button
                onClick={toggleSimulateIdentity}
                className="ml-2 underline text-blue-600 dark:text-sky-400 hover:opacity-80 transition font-semibold"
                title="Toggle between Dean's Office and Spectra Core Team to verify Task 109 self-approval block on BR-01"
              >
                {simulateIdentity === "standard" ? "Test self-approval block (Task 109)" : "Switch back to Dean's Office"}
              </button>
            )}
          </span>
        </div>
      )}

      {/* 2. TABS, SORT, STATUS + SEARCH */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1" role="tablist" aria-label="Event categories">
            {[
              { id: "all", label: "All Events", count: events.length },
              { id: "institute_event", label: "Institute Events", count: events.filter((e) => e.category === "institute_event").length },
              { id: "guest_lecture", label: "Guest Lectures", count: events.filter((e) => e.category === "guest_lecture").length },
              { id: "department_event", label: "Dept. Events", count: events.filter((e) => e.category === "department_event").length },
              { id: "club_event", label: "Club Events", count: events.filter((e) => e.category === "club_event").length },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full border text-[12.5px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    isActive ? "text-white border-transparent" : "hover:bg-[var(--row-hover)]"
                  }`}
                  style={
                    isActive
                      ? { background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 8px 18px rgba(21,91,255,.38)" }
                      : { background: "var(--surface)", borderColor: "var(--border)" }
                  }
                >
                  {tab.label}
                  <span className={`text-[11px] px-1.5 rounded-full ${isActive ? "bg-white/25" : "bg-[var(--search-bg)] text-[var(--muted)]"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                aria-label="Sort events"
                className="appearance-none h-9 pl-4 pr-9 rounded-full border bg-[var(--surface)] text-[12.5px] font-bold focus:outline-none cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="priority">Sort by: Priority</option>
                <option value="id">Sort by: Request Ref</option>
                <option value="attendance">Sort by: Attendance</option>
                <option value="day">Sort by: Day of Week</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full border bg-[var(--surface)] text-[12.5px] font-bold hover:bg-[var(--row-hover)] transition"
              style={{ borderColor: "var(--border)" }}
              title="View Governance Decisions & Audit Log (Task 113)"
            >
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Decision History</span> ({history.length})
            </button>
            <button
              onClick={fetchSpectraEvents}
              disabled={loading}
              aria-label="Refresh events list"
              className="w-9 h-9 rounded-full border bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition"
              style={{ borderColor: "var(--border)" }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">Status</span>
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
                aria-pressed={activeStatus === st.id}
                className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold transition ${
                  activeStatus === st.id
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                    : "text-[var(--muted)] hover:bg-[var(--row-hover)] border border-transparent"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events, clubs, or organizers..."
              aria-label="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-full border text-[12.5px] font-medium placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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

      {/* 3. EVENT CARDS + RIGHT RAIL */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_272px] gap-5 sm:gap-6 items-start">
        <div id="spectra-events-grid" className="scroll-mt-4 min-w-0">
          {loading && events.length === 0 ? (
            <div className="py-20 text-center text-xs text-[var(--muted)] flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Loading Spectra festival bookings...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--muted)] bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 space-y-2">
              <p className="font-bold text-sm">No events found</p>
              <p>Try changing your filters or search terms.</p>
              <button
                onClick={() => { setActiveCategory("all"); setActiveStatus("all"); setSearchQuery(""); }}
                className="px-4 py-2 mt-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 min-[1420px]:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const isBookmarked = bookmarked[ev.requestId];
                const pr = priorityInfo(ev.priorityWeight);
                const open = () => {
                  setSelectedEvent(ev);
                  setActionNotice(null);
                  setShowRejectForm(false);
                };
                const initials = ev.requester
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((w) => w[0]?.toUpperCase());
                return (
                  <article
                    key={ev.requestId}
                    onClick={open}
                    className="group rounded-[18px] bg-[var(--surface)] border overflow-hidden flex flex-col cursor-pointer transition hover:-translate-y-0.5"
                    style={{
                      borderColor: isDark ? "#1B4F9C" : "var(--border)",
                      boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.15), 0 10px 26px rgba(0,60,200,.14)" : "var(--shadow-card)",
                    }}
                  >
                    <div
                      className="relative h-[112px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${eventImage(ev)})` }}
                      role="img"
                      aria-label={`${ev.title} artwork`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
                      <button
                        onClick={(e) => toggleBookmark(ev.requestId, e)}
                        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
                        aria-pressed={!!isBookmarked}
                        className={`absolute left-3 top-3 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/40 transition ${
                          isBookmarked ? "bg-white text-blue-600" : "bg-black/30 text-white hover:bg-white/25"
                        }`}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                      <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-md ${getStatusBadgeStyle(ev.status)}`}>
                        <Calendar className="w-3 h-3" />
                        {STATUS_LABEL[ev.status] ?? ev.status}
                      </span>
                    </div>

                    <div className="p-3.5 flex flex-col gap-2.5 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-11 shrink-0 text-center leading-none pt-0.5">
                          <div className="text-[10px] font-bold text-[var(--muted)] tracking-wider">DAY</div>
                          <div className="mt-1 font-heading font-extrabold text-[19px]">{ev.day}</div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading font-extrabold text-[15px] leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                            {ev.title}
                          </h3>
                          <p className="mt-0.5 text-[11.5px] text-[var(--muted)] font-medium truncate">
                            {ev.requestId} • {ev.requester}
                            {ev.department ? ` • ${ev.department}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[12px] font-semibold">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{ev.time}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-auto pt-0.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold ${pr.cls}`}>
                          <pr.Icon className="w-3.5 h-3.5 fill-current" />
                          {pr.label}
                        </span>
                        <span className="flex items-center gap-1.5" aria-label={`${ev.attendance} expected attendees`}>
                          <span className="flex -space-x-2">
                            {AVATAR_TONES.map((tone, i) => (
                              <span
                                key={i}
                                className={`w-6 h-6 rounded-full ring-2 ring-[var(--surface)] bg-gradient-to-br ${tone} text-white text-[10px] font-extrabold flex items-center justify-center`}
                              >
                                {initials[i] ?? "•"}
                              </span>
                            ))}
                          </span>
                          <span className="text-[12px] font-extrabold text-blue-600 dark:text-sky-400">+{ev.attendance}</span>
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          open();
                        }}
                        className="w-full h-10 rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition hover:brightness-110"
                        style={{ background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 8px 18px rgba(21,91,255,.3)" }}
                      >
                        {ctaLabel(ev.status)} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 sm:gap-5 min-w-0">
          {/* My Bookings */}
          <section
            className="rounded-[18px] border bg-[var(--surface)] p-4"
            style={{
              borderColor: isDark ? "#1B4F9C" : "var(--border)",
              boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.15)" : "var(--shadow-card)",
            }}
            aria-labelledby="mb-h"
          >
            <div className="flex items-center justify-between mb-2.5">
              <h2 id="mb-h" className="font-heading font-extrabold text-[15px]">My Bookings</h2>
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setActiveStatus("all");
                  setSearchQuery(currentUserName);
                }}
                className="text-[12px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </button>
            </div>
            <ul>
              {myBookings.map((ev) => (
                <li key={ev.requestId} className="border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => {
                      setSelectedEvent(ev);
                      setActionNotice(null);
                      setShowRejectForm(false);
                    }}
                    className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-[var(--row-hover)] rounded-lg transition"
                  >
                    <span
                      className="w-11 h-11 rounded-lg bg-cover bg-center shrink-0 border"
                      style={{ backgroundImage: `url(${eventImage(ev)})`, borderColor: "var(--border)" }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block font-bold text-[12.5px] truncate">{ev.title}</span>
                      <span className="block text-[11px] text-[var(--muted)] font-medium">
                        {ev.day} • {ev.time}
                      </span>
                    </span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${getStatusBadgeStyle(ev.status)}`}>
                      {STATUS_LABEL[ev.status] ?? ev.status}
                    </span>
                  </button>
                </li>
              ))}
              {myBookings.length === 0 && (
                <li className="py-4 text-center text-[12px] text-[var(--muted)] font-medium">
                  No bookings yet. Your event requests will appear here.
                </li>
              )}
            </ul>
          </section>

          {/* Quick Actions */}
          <section
            className="rounded-[18px] border bg-[var(--surface)] p-4"
            style={{
              borderColor: isDark ? "#1B4F9C" : "var(--border)",
              boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.15)" : "var(--shadow-card)",
            }}
            aria-labelledby="qa-sp-h"
          >
            <h2 id="qa-sp-h" className="font-heading font-extrabold text-[15px] mb-2.5">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "View Timetable", Icon: Calendar, run: () => onNavigateTab && onNavigateTab("timetable") },
                { label: "My Requests", Icon: CheckCircle2, run: () => setSearchQuery(currentUserName) },
                { label: "Event Guidelines", Icon: FileText, run: () => setShowGuidelines((p) => !p) },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.run}
                  className="qa-tile qa-blue min-h-[84px] px-1.5 py-2.5 flex flex-col items-center justify-center gap-1.5 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                >
                  <a.Icon className="w-5 h-5 text-blue-600 dark:text-sky-300" strokeWidth={2.1} />
                  <span className="text-[11px] font-bold leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Event Guidelines (Section 4 priority hierarchy) */}
          {showGuidelines && (
            <section className="rounded-[18px] border bg-[var(--surface)] p-4 space-y-3 md:col-span-2 xl:col-span-1" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-[15px] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Event Guidelines
                </h2>
                <button type="button" onClick={() => setShowGuidelines(false)} className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline">
                  Hide
                </button>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                CIT Section 4 dictates strict allocation hierarchy during Crunch Week:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-purple-900 dark:text-purple-300">1. Exams &amp; Regular Sessions</div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-400">Strictly immune to preemption</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-200 dark:bg-purple-900 px-1.5 py-0.5 rounded">P1–P9</span>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-blue-900 dark:text-blue-300">2. Institute Events</div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-400">Tech Fest Inauguration, Convocation</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-200 dark:bg-blue-900 px-1.5 py-0.5 rounded">Weight: 10</span>
                </div>
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-teal-900 dark:text-teal-300">3. Distinguished Lectures</div>
                    <div className="text-[10px] text-teal-700 dark:text-teal-400">ISRO, Industry Leaders</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-teal-200 dark:bg-teal-900 px-1.5 py-0.5 rounded">Weight: 8</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-300">4. Dept &amp; Club Events</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">Competitions, Hackathons, Cultural</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">Weight: 2–5</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[11px] text-[var(--muted)] space-y-1.5">
                <div className="font-bold text-[var(--ink)]">CIT Governance Mandates:</div>
                <p>• <strong>Curfew Limit:</strong> All student activities must terminate before Period 13 (22:00).</p>
                <p>• <strong>Self-Approval Rule:</strong> Section 4 strictly prohibits any requester from approving their own event.</p>
                <p>• <strong>Authority:</strong> Only Dean&apos;s Office or Department Coordinators hold approval authorization.</p>
              </div>
            </section>
          )}
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
