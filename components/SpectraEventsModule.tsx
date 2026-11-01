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
  X,
  Search,
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
  Grid,
  Columns,
  Info,
  type LucideIcon,
} from "lucide-react";
import ExplainModal from "@/components/ExplainModal";

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

// Priority Color Themes (Matching CIT Section 4 Priority Hierarchy)
const CATEGORY_STYLES: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  institute_event: {
    label: "Institute Event (Weight 10)",
    bg: "bg-purple-100 dark:bg-purple-950/70",
    text: "text-purple-900 dark:text-purple-200",
    border: "border-purple-300 dark:border-purple-800",
    dot: "bg-purple-600",
  },
  guest_lecture: {
    label: "Guest Lecture (Weight 8)",
    bg: "bg-blue-100 dark:bg-blue-950/70",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-blue-300 dark:border-blue-800",
    dot: "bg-blue-600",
  },
  department_event: {
    label: "Department Event (Weight 5)",
    bg: "bg-teal-100 dark:bg-teal-950/70",
    text: "text-teal-900 dark:text-teal-200",
    border: "border-teal-300 dark:border-teal-800",
    dot: "bg-teal-600",
  },
  club_event: {
    label: "Club Event (Weight 2)",
    bg: "bg-amber-100 dark:bg-amber-950/70",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-800",
    dot: "bg-amber-600",
  },
};

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

function priorityInfo(weight: number): { label: string; Icon: LucideIcon; cls: string } {
  if (weight >= 8)
    return { label: "High Priority", Icon: Flame, cls: "bg-[#FFE3E0] text-[#C2260F] dark:bg-[#4A1A16] dark:text-[#FF9A8A]" };
  if (weight >= 5)
    return { label: "Medium Priority", Icon: Leaf, cls: "bg-[#DDF5E3] text-[#1B7A3A] dark:bg-[#12402A] dark:text-[#6EE7A0]" };
  return { label: "Low Priority", Icon: Flame, cls: "bg-[#FFE8D2] text-[#B45309] dark:bg-[#4A3016] dark:text-[#FFC27A]" };
}

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

  // View Mode: 'timeline' (Day-wise Venue Timeline) vs 'cards' (All Event Cards)
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");
  const [selectedVenue, setSelectedVenue] = useState<string>("AUD");

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
  const [explainQuery, setExplainQuery] = useState<{ type: "booking_rejected" | "why_slot"; id: string } | null>(null);

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

  const myBookings = useMemo(() => {
    const mine = events.filter((e) => e.requester.toLowerCase() === currentUserName.toLowerCase());
    return (mine.length ? mine : events).slice(0, 3);
  }, [events, currentUserName]);

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

      setEvents((prev) =>
        prev.map((e) =>
          e.requestId === selectedEvent.requestId
            ? { ...e, status: data.status, reason: `Action by ${currentUserName}` }
            : e
        )
      );
      if (selectedEvent) {
        setSelectedEvent((prev) => (prev ? { ...prev, status: data.status } : null));
      }

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

  const isSelfApproval = Boolean(
    selectedEvent &&
      ((currentUserName && selectedEvent.requester && currentUserName.toLowerCase() === selectedEvent.requester.toLowerCase()) ||
        (userRole === "admin" && simulateIdentity === "spectra_core" && selectedEvent.requestId === "BR-01"))
  );

  const canApproveOrReject = userRole === "admin" || userRole === "department_coordinator";
  const canCancel =
    canApproveOrReject || (selectedEvent && currentUserName.toLowerCase() === selectedEvent.requester.toLowerCase());

  return (
    <div className="space-y-6">
      {/* 1. HERO */}
      <section
        className="relative overflow-hidden rounded-[22px] text-white min-h-[200px] flex items-center p-6"
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
        <div className="relative z-10 max-w-[620px] space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Week 7 Tech Fest &bull; Spectra &apos;27 Governance Hub</span>
          </div>
          <h1 className="font-serif-heading font-bold text-3xl sm:text-4xl tracking-tight">
            Spectra Festival Bookings
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Day-Wise Auditorium &amp; Venue Timelines, Priority Color Coding, and Transparent Decision Reasons.
          </p>

          {/* Priority Color Legend Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/25 border border-purple-300/30 text-purple-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Institute Event (10)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/25 border border-blue-300/30 text-blue-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Guest Lecture (8)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/25 border border-teal-300/30 text-teal-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Department Event (5)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/25 border border-amber-300/30 text-amber-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Club Event (2)
            </span>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
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
                Score: {metrics.booking_score.toFixed(1)} / 70.0
              </span>
            </>
          )}
          <span className="ml-auto text-[11px] text-[var(--muted)] font-semibold">
            Active session: <span className="text-[var(--ink)] font-bold">{currentUserName}</span> ({userRole})
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

      {/* 2. CONTROLS, VIEW TOGGLE & TIMELINE VENUE SWITCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-3.5 rounded-2xl border border-[var(--border)] shadow-xs">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--search-bg)] border border-[var(--border)]">
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "timeline" ? "bg-[var(--surface)] text-blue-600 shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Columns className="w-3.5 h-3.5" /> Venue Timeline (P1–P13)
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "cards" ? "bg-[var(--surface)] text-blue-600 shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Event Cards
          </button>
        </div>

        {/* Venue Selector for Timeline */}
        {viewMode === "timeline" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--muted)]">Venue:</span>
            {["AUD", "OAT", "SH-1", "SH-2", "CS-LAB-1"].map((v) => (
              <button
                key={v}
                onClick={() => setSelectedVenue(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedVenue === v
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-[var(--muted)] hover:bg-[var(--search-bg)]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search events, clubs, or organizers..."
            aria-label="Search events"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-60 h-8 pl-8 pr-7 rounded-full border text-[12px] font-medium placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. DAY-WISE VENUE TIMELINE (P1–P13) */}
      {viewMode === "timeline" && (
        <section
          className="rounded-[22px] border bg-[var(--surface)] p-4 sm:p-5 space-y-4 shadow-xs"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="font-heading font-extrabold text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{selectedVenue} Day-Wise Festival Timeline</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                P1–P9 (08:00–18:00 Teaching Hours) • P10–P13 (18:00–22:00 Evening Event Window &amp; Curfew Cutoff)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="h-8 px-3 rounded-lg border text-xs font-bold text-blue-600 dark:text-sky-400 hover:bg-[var(--row-hover)] flex items-center gap-1.5"
                style={{ borderColor: "var(--border)" }}
              >
                <History className="w-3.5 h-3.5" /> Decision History ({history.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px] space-y-3">
              {/* Period Header */}
              <div className="flex items-center gap-3">
                <div className="w-14 text-center font-bold text-xs text-[var(--muted)] shrink-0">DAY</div>
                <div className="flex-1 grid grid-cols-13 gap-1 px-1.5 text-[10px] font-bold text-[var(--muted)] font-mono text-center">
                  {PERIODS.map((p) => (
                    <div key={p} className={`${p >= 10 ? "text-amber-600 dark:text-amber-400 font-extrabold" : ""}`}>
                      P{p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Rows */}
              {DAYS.map((d) => {
                const dayEvents = events.filter(
                  (e) =>
                    e.day === d &&
                    (e.room_id === selectedVenue || e.venue.includes(selectedVenue)) &&
                    e.status === "approved"
                );

                return (
                  <div key={d} className="flex items-center gap-3">
                    <div className="w-14 font-heading font-extrabold text-xs text-[var(--muted)] shrink-0">{d}</div>
                    <div className="flex-1 grid grid-cols-13 gap-1 bg-[var(--search-bg)] p-1.5 rounded-xl border border-[var(--border)] relative h-16">
                      {PERIODS.map((p) => {
                        const occupying = dayEvents.find((e) => p >= e.start_period && p <= e.end_period);
                        const isStart = occupying && occupying.start_period === p;
                        const colSpan = occupying ? occupying.end_period - occupying.start_period + 1 : 1;
                        const catStyle = occupying ? CATEGORY_STYLES[occupying.category] : null;

                        if (occupying && !isStart) return null;

                        return occupying && catStyle ? (
                          <div
                            key={p}
                            style={{ gridColumn: `span ${colSpan}` }}
                            onClick={() => setSelectedEvent(occupying)}
                            className={`p-1.5 rounded-lg border ${catStyle.border} ${catStyle.bg} ${catStyle.text} flex flex-col justify-center cursor-pointer hover:brightness-95 transition shadow-xs overflow-hidden`}
                          >
                            <div className="font-extrabold text-[11px] truncate flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                              <span>{occupying.title}</span>
                            </div>
                            <div className="text-[9.5px] opacity-85 truncate">
                              P{occupying.start_period}–P{occupying.end_period} &bull; {occupying.requester}
                            </div>
                          </div>
                        ) : (
                          <div
                            key={p}
                            className={`rounded border border-dashed flex items-center justify-center text-[9px] font-mono opacity-40 ${
                              p >= 10 ? "border-amber-300 text-amber-700" : "border-[var(--border)] text-[var(--muted)]"
                            }`}
                          >
                            P{p}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. EVENT CARDS GRID WITH EXPLICIT REASON CHIPS */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
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
                onClick={() => {
                  setActiveCategory("all");
                  setActiveStatus("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 mt-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 min-[1440px]:grid-cols-3 gap-4">
              {filteredEvents.map((ev) => {
                const isBookmarked = bookmarked[ev.requestId];
                const pr = priorityInfo(ev.priorityWeight);
                const catStyle = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.club_event;
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
                      boxShadow: isDark
                        ? "0 0 0 1px rgba(30,100,220,.15), 0 10px 26px rgba(0,60,200,.14)"
                        : "var(--shadow-card)",
                    }}
                  >
                    <div
                      className="relative h-[110px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${eventImage(ev)})` }}
                      role="img"
                      aria-label={`${ev.title} artwork`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
                      <button
                        onClick={(e) => toggleBookmark(ev.requestId, e)}
                        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
                        aria-pressed={!!isBookmarked}
                        className={`absolute left-3 top-3 w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/40 transition ${
                          isBookmarked ? "bg-white text-blue-600" : "bg-black/30 text-white hover:bg-white/25"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <span
                        className={`absolute right-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border shadow-md ${getStatusBadgeStyle(
                          ev.status
                        )}`}
                      >
                        <Calendar className="w-3 h-3" />
                        {STATUS_LABEL[ev.status] ?? ev.status}
                      </span>
                    </div>

                    <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-10 shrink-0 text-center leading-none pt-0.5">
                            <div className="text-[9.5px] font-bold text-[var(--muted)]">DAY</div>
                            <div className="mt-1 font-heading font-extrabold text-[17px]">{ev.day}</div>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-heading font-extrabold text-[14px] leading-tight line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition">
                              {ev.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-[var(--muted)] font-medium truncate">
                              {ev.requestId} &bull; {ev.requester}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11.5px] font-semibold text-[var(--ink)]">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                            <span>{ev.time}</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                            <span className="truncate">{ev.venue}</span>
                          </div>
                        </div>

                        {/* Priority Hierarchy Tag */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${catStyle.border} ${catStyle.bg} ${catStyle.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                            <span>{catStyle.label}</span>
                          </span>
                        </div>

                        {/* Explicit Reason Chip (Mandatory Requirement) */}
                        <div
                          className={`p-2.5 rounded-xl border text-[11px] space-y-0.5 ${
                            ev.status === "approved"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : ev.status === "rejected"
                              ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                              : ev.status === "alternative_offered"
                              ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              : "bg-[var(--search-bg)] border-[var(--border)] text-[var(--ink)]"
                          }`}
                        >
                          <div className="font-extrabold text-[10.5px] flex items-center gap-1">
                            {ev.status === "approved" ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : ev.status === "rejected" ? (
                              <Ban className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Info className="w-3 h-3 text-amber-600" />
                            )}
                            <span>Decision Reason:</span>
                          </div>
                          <p className="italic text-[10px] line-clamp-2">&quot;{ev.reason}&quot;</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
                        <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                          <Users className="w-3 h-3" />
                          <span>{ev.attendance} attendees</span>
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            open();
                          }}
                          className="h-8 px-3 rounded-lg text-white text-[11.5px] font-bold flex items-center gap-1 transition hover:brightness-110"
                          style={{ background: "linear-gradient(110deg,#155BFF,#2F7BF5)" }}
                        >
                          {ctaLabel(ev.status)} <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Rail */}
        <aside className="space-y-4 min-w-0">
          {/* My Bookings */}
          <section
            className="rounded-[18px] border bg-[var(--surface)] p-4"
            style={{
              borderColor: isDark ? "#1B4F9C" : "var(--border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-heading font-extrabold text-[14px]">My Bookings</h2>
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setActiveStatus("all");
                  setSearchQuery(currentUserName);
                }}
                className="text-[11.5px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" strokeWidth={2.6} />
              </button>
            </div>
            <ul className="space-y-1">
              {myBookings.map((ev) => (
                <li key={ev.requestId} className="border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => {
                      setSelectedEvent(ev);
                      setActionNotice(null);
                      setShowRejectForm(false);
                    }}
                    className="w-full flex items-center gap-2.5 py-2 text-left hover:bg-[var(--row-hover)] rounded-lg transition"
                  >
                    <span
                      className="w-9 h-9 rounded-lg bg-cover bg-center shrink-0 border"
                      style={{ backgroundImage: `url(${eventImage(ev)})`, borderColor: "var(--border)" }}
                    />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block font-bold text-[12px] truncate">{ev.title}</span>
                      <span className="block text-[10.5px] text-[var(--muted)]">
                        {ev.day} &bull; {ev.time}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(
                        ev.status
                      )}`}
                    >
                      {STATUS_LABEL[ev.status] ?? ev.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Guidelines */}
          <section
            className="rounded-[18px] border bg-[var(--surface)] p-4 space-y-2.5 text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-1.5 font-bold font-heading text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Priority Guidelines</span>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Academic classes &amp; exams are strictly immune to displacement. Institute &amp; distinguished lectures outrank club activities.
            </p>
            <div className="p-2.5 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] text-[10.5px] space-y-1">
              <div>&bull; <strong>Curfew Limit:</strong> All events terminate before P13 (22:00).</div>
              <div>&bull; <strong>Self-Approval:</strong> Requesters cannot approve their own events.</div>
              <div>&bull; <strong>Validation Gate:</strong> Approvals verified against full class schedule.</div>
            </div>
          </section>
        </aside>
      </div>

      {/* 5. EVENT DETAILS & GOVERNANCE MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200">
                    {selectedEvent.requestId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(
                      selectedEvent.status
                    )}`}
                  >
                    {selectedEvent.status === "alternative_offered"
                      ? "ALTERNATIVE OFFERED"
                      : selectedEvent.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold font-heading text-[var(--ink)]">{selectedEvent.title}</h3>
                <p className="text-xs text-[var(--muted)]">
                  Requested by: <strong>{selectedEvent.requester}</strong> ({selectedEvent.role})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setActionNotice(null);
                  setShowRejectForm(false);
                }}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--search-bg)]"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            {/* Original Raw Text */}
            <div className="p-3 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                Original Natural Language Prompt (NLP Submission)
              </span>
              <p className="text-xs italic font-serif leading-relaxed text-[var(--ink)]">&quot;{selectedEvent.raw_text}&quot;</p>
            </div>

            {/* Metadata Grid */}
            <div className="p-3 rounded-xl bg-[var(--search-bg)] border border-[var(--border)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">Allocated Venue</span>
                <span className="font-extrabold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  {selectedEvent.venue}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">Day &amp; Period Window</span>
                <span className="font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {selectedEvent.day} &bull; {selectedEvent.time}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">Expected Attendance</span>
                <span className="font-extrabold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {selectedEvent.attendance} Participants
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted)] font-bold block uppercase">Category &amp; Priority</span>
                <span className="font-extrabold capitalize flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {selectedEvent.category.replace("_", " ")} (Weight: {selectedEvent.priorityWeight})
                </span>
              </div>
            </div>

            {/* Explicit Reason & Justification */}
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                selectedEvent.status === "approved"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                  : selectedEvent.status === "alternative_offered"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200"
                  : selectedEvent.status === "cancelled"
                  ? "bg-slate-100 dark:bg-slate-800/50 border-slate-300 text-slate-800 dark:text-slate-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Official Decision Justification:</span>
              </div>
              <p className="text-[11.5px] leading-relaxed">{selectedEvent.reason}</p>
            </div>

            {/* Alternative Suggestions */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Alternative Venue &amp; Time Suggestions</span>
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
                      <span>Checking zero-clash slots across campus...</span>
                    </div>
                  ) : alternatives.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">No conflicts detected or all slots currently occupied.</p>
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
                              <span className="font-normal text-[var(--muted)]">&bull; Cap {alt.capacity}</span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{alt.day} &bull; P{alt.start_period}–P{alt.end_period}</span>
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

            {/* Action Notice */}
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

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 space-y-2">
                <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                  Provide Rejection Reason:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Venue overlap with academic class; curfew constraint."
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

            {/* Self-Approval Warning */}
            {isSelfApproval && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-bold">Task 109 Governance Rule: Self-Approval Blocked</div>
                  <div className="text-[11px] mt-0.5">
                    You cannot approve your own booking request ({selectedEvent.requester}). Approval must be executed by an independent officer from the Dean&apos;s Office.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
              {canCancel && selectedEvent.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => handleGovernanceAction("cancel")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
                >
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cancel Booking</span>
                </button>
              )}

              {selectedEvent.status === "rejected" && (
                <button
                  type="button"
                  onClick={() => setExplainQuery({ type: "booking_rejected", id: selectedEvent.id })}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Explain Rejection</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {canApproveOrReject && selectedEvent.status !== "rejected" && !showRejectForm && (
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 text-xs font-bold transition"
                  >
                    Reject
                  </button>
                )}

                {canApproveOrReject && selectedEvent.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleGovernanceAction("approve")}
                    disabled={actionLoading || isSelfApproval}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelfApproval
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-75"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSelfApproval ? "Self-Approval Blocked" : "Approve Booking"}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setActionNotice(null);
                    setShowRejectForm(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--search-bg)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision History Audit Log Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-[var(--ink)]">
                  Governance Decision History &amp; Audit Trail (Task 113)
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--search-bg)]"
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
                    className="p-3 rounded-xl border border-[var(--border)] bg-[var(--search-bg)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 px-1.5 py-0.5 rounded">
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
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--search-bg)]"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Explanation Modal */}
      <ExplainModal
        isOpen={!!explainQuery}
        onClose={() => setExplainQuery(null)}
        query={explainQuery}
        isDark={isDark}
      />
    </div>
  );
}