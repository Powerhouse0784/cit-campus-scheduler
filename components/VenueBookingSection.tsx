"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import CountUp from "@/components/ui/CountUp";
import Skeleton from "@/components/ui/Skeleton";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type Flow = "quick" | "advanced" | "spectra";

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

interface CheckResult {
  available: boolean;
  explanation: string;
  conflicts: string[];
  reasons: string[];
  alternatives: AlternativeOption[];
}

interface ParsedIntent {
  title?: string;
  category?: string;
  attendance?: number;
  duration_periods?: number;
  day?: string;
  start_period?: number;
  needs?: string[];
  room_types?: string[];
  requested_room?: string | null;
  accessibility_warning?: string | null;
  follow_up?: string | null;
}

interface FormValues {
  title: string;
  category: string;
  day: string;
  startPeriod: number;
  duration: number;
  attendance: number;
  room: string;
  needs: string[];
}

interface Metrics {
  total_venues: number;
  upcoming_bookings: number;
  pending_approvals: number;
  curfew: string;
}

interface StatusMessage {
  type: "success" | "error" | "info";
  text: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const DAY_NAMES: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

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

const FACILITIES = [
  { id: "projector", label: "Projector" },
  { id: "pa_system", label: "PA System / Mic" },
  { id: "stage", label: "Stage / Podium" },
  { id: "computers", label: "Computers / Coding" },
  { id: "accessible", label: "Wheelchair Accessible" },
];

const PLACEHOLDERS: Record<Flow, string> = {
  quick: "e.g. Book auditorium for our tech event on 25th Oct, 2 PM",
  advanced: "Optional: describe the event and tap “Fill details from text”",
  spectra: "Optional: describe your Spectra event and tap “Fill details from text”",
};

/** P1 = 08:00, lunch 13:00-14:00, P6 = 14:00, P10 = 18:00. */
const hourOf = (p: number) => (p <= 5 ? p + 7 : p + 8);
const hhmm = (h: number) => `${String(h).padStart(2, "0")}:00`;
const slotLabel = (day: string, start: number, duration: number) =>
  `${DAY_NAMES[day] || day} · ${hhmm(hourOf(start))} – ${hhmm(hourOf(start + duration - 1) + 1)}`;

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

/* ------------------------------------------------------------------ */
/* Illustrations (inline SVG so the screen works with no photo files)  */
/* Drop real photos at /public/images/venues/<ROOM-ID>.jpg to use them */
/* ------------------------------------------------------------------ */
function VenueArt({ type }: { type: string }) {
  if (type === "auditorium" || type === "lecture_hall") {
    const rows = [0, 1, 2, 3, 4];
    return (
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="aud-bg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#C9A27A" />
            <stop offset="1" stopColor="#6B4426" />
          </linearGradient>
        </defs>
        <rect width="200" height="120" fill="url(#aud-bg)" />
        <g fill="#FFF3D6" opacity=".9">
          <rect x="30" y="8" width="140" height="3" rx="1.5" />
          <rect x="45" y="17" width="110" height="2.5" rx="1.25" />
        </g>
        <rect x="62" y="26" width="76" height="24" rx="2" fill="#1B2A55" />
        <rect x="66" y="29" width="68" height="18" rx="1" fill="#3A5BB5" opacity=".8" />
        <rect x="40" y="52" width="120" height="6" fill="#8A5B34" />
        {rows.map((r) => {
          const y = 62 + r * 11;
          const n = 9 + r * 2;
          const w = 10 + r * 1.6;
          const x0 = 100 - (n * (w + 2)) / 2;
          return (
            <g key={r} fill={r % 2 ? "#7A4A2B" : "#8E5A35"}>
              {Array.from({ length: n }).map((_, i) => (
                <rect key={i} x={x0 + i * (w + 2)} y={y} width={w} height={8 + r} rx="2.5" />
              ))}
            </g>
          );
        })}
      </svg>
    );
  }

  if (type === "lab_cs" || type === "lab_elec") {
    const desks = [0, 1, 2];
    return (
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="w-full h-full" aria-hidden="true">
        <rect width="200" height="120" fill="#E9EEF5" />
        <rect y="0" width="200" height="36" fill="#F6F8FC" />
        <rect x="150" y="10" width="40" height="24" rx="2" fill="#2F7D5B" />
        <rect x="12" y="10" width="60" height="3" rx="1.5" fill="#CBD5E4" />
        {desks.map((r) => {
          const y = 44 + r * 24;
          return (
            <g key={r}>
              <rect x="8" y={y + 12} width="184" height="7" rx="2" fill="#B58B5E" />
              {[0, 1, 2, 3, 4].map((i) => {
                const x = 16 + i * 36;
                return (
                  <g key={i}>
                    <rect x={x} y={y - 4} width="24" height="15" rx="2" fill="#0F1B3D" />
                    <rect x={x + 2} y={y - 2} width="20" height="11" rx="1" fill="#4C8DFF" opacity=".85" />
                    <rect x={x + 9} y={y + 11} width="6" height="2" fill="#0F1B3D" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  }

  // seminar hall / classroom / default
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="w-full h-full" aria-hidden="true">
      <rect width="200" height="120" fill="#EDF1F7" />
      <rect y="0" width="200" height="30" fill="#F8FAFD" />
      <rect x="40" y="12" width="120" height="32" rx="2" fill="#1F3A73" />
      <rect x="44" y="15" width="112" height="26" rx="1" fill="#456FC4" opacity=".75" />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {[0, 1, 2].map((c) => {
            const x = 14 + c * 62;
            const y = 56 + r * 21;
            return (
              <g key={c}>
                <rect x={x} y={y} width="50" height="9" rx="2" fill="#C09A6B" />
                <rect x={x + 4} y={y + 10} width="10" height="7" rx="2" fill="#3B6FD8" />
                <rect x={x + 20} y={y + 10} width="10" height="7" rx="2" fill="#3B6FD8" />
                <rect x={x + 36} y={y + 10} width="10" height="7" rx="2" fill="#3B6FD8" />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function VenuePhoto({ id, type }: { id: string; type: string }) {
  const [hasPhoto, setHasPhoto] = useState(true);
  return (
    <div className="relative w-full h-full">
      <VenueArt type={type} />
      {hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/venues/${id}.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setHasPhoto(false)}
        />
      )}
    </div>
  );
}

function RobotMascot() {
  return (
    <svg viewBox="0 0 170 200" className="w-full h-auto" aria-hidden="true">
      <defs>
        <radialGradient id="bot-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#BFD8FF" stopOpacity=".9" />
          <stop offset="1" stopColor="#BFD8FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bot-shell" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCE6F8" />
        </linearGradient>
      </defs>
      <circle cx="92" cy="110" r="78" fill="url(#bot-halo)" />
      <ellipse cx="88" cy="184" rx="66" ry="14" fill="#DCE8FF" opacity=".9" />
      <ellipse cx="60" cy="182" rx="30" ry="11" fill="#F2F7FF" />
      <ellipse cx="118" cy="182" rx="30" ry="11" fill="#F2F7FF" />

      {/* body */}
      <rect x="58" y="116" width="62" height="58" rx="26" fill="url(#bot-shell)" stroke="#C4D3EE" />
      <rect x="80" y="134" width="18" height="16" rx="5" fill="#2F6BFF" />
      <path d="M85 142h8M89 138v8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />

      {/* pointing arm (left) and resting arm (right) */}
      <path d="M62 132C46 128 34 118 24 104" fill="none" stroke="#DCE6F8" strokeWidth="13" strokeLinecap="round" />
      <path d="M62 132C46 128 34 118 24 104" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <circle cx="21" cy="100" r="8" fill="#2F6BFF" />
      <ellipse cx="124" cy="146" rx="9" ry="14" fill="url(#bot-shell)" stroke="#C4D3EE" />

      {/* head */}
      <rect x="40" y="38" width="98" height="76" rx="36" fill="url(#bot-shell)" stroke="#C4D3EE" />
      <rect x="50" y="52" width="78" height="48" rx="23" fill="#0B1B4A" />
      <ellipse cx="73" cy="73" rx="7" ry="9" fill="#38D5FF" />
      <ellipse cx="105" cy="73" rx="7" ry="9" fill="#38D5FF" />
      <path d="M81 88q8 6 16 0" fill="none" stroke="#38D5FF" strokeWidth="3" strokeLinecap="round" />

      {/* headphones */}
      <path d="M44 72C42 36 136 36 134 72" fill="none" stroke="#2F6BFF" strokeWidth="6" strokeLinecap="round" />
      <rect x="30" y="64" width="16" height="30" rx="8" fill="#2F6BFF" />
      <rect x="132" y="64" width="16" height="30" rx="8" fill="#2F6BFF" />

      {/* antenna */}
      <path d="M89 38V26" stroke="#C4D3EE" strokeWidth="3" strokeLinecap="round" />
      <circle cx="89" cy="23" r="5" fill="#38D5FF" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */
const SPARKS = [
  "M0 38 C20 36 34 30 54 24 S84 22 104 14 S130 10 150 4",
  "M0 36 C22 38 40 26 62 28 S98 30 120 16 S140 8 150 6",
  "M0 34 C18 30 36 34 58 24 S92 20 112 14 S136 12 150 8",
  "M0 40 C26 40 42 32 66 30 S104 20 124 12 S142 8 150 6",
];

function StatCard({
  index,
  tone,
  label,
  shortLabel,
  value,
  icon,
  iconBg,
  stroke,
  hideOnMobile,
}: {
  index: number;
  tone: "blue" | "violet" | "green" | "amber";
  label: string;
  shortLabel: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  stroke: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={`kpi-card kpi-${tone} p-3 sm:p-4 min-h-[76px] sm:min-h-[92px] items-center gap-3 sm:gap-4 ${
        hideOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      <svg
        viewBox="0 0 150 44"
        preserveAspectRatio="none"
        className="absolute right-0 bottom-0 w-[55%] h-[55%] pointer-events-none opacity-80"
        aria-hidden="true"
      >
        <path d={`${SPARKS[index]} L150 44 L0 44 Z`} fill={stroke} opacity=".10" />
        <path d={SPARKS[index]} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className={`relative w-10 h-10 sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </span>
      <div className="relative leading-tight min-w-0">
        <div className="hidden sm:block text-[14px] font-semibold text-[var(--ink)]/90">{label}</div>
        <div className="font-heading font-extrabold text-[22px] sm:text-[30px] leading-none sm:mt-1">{typeof value === "number" ? <CountUp value={value} /> : value}</div>
        <div className="sm:hidden text-[12px] font-medium text-[var(--muted)] mt-0.5">{shortLabel}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
interface VenueBookingSectionProps {
  userRole?: string;
  currentUser?: string;
  isDark?: boolean;
  onNavigateTab?: (tab: string) => void;
}

const POPULAR_IDS = ["AUD", "SH-1", "CS-LAB-1"];

export default function VenueBookingSection({
  userRole = "admin",
  currentUser,
  isDark = false,
  onNavigateTab,
}: VenueBookingSectionProps) {
  const [flow, setFlow] = useState<Flow>("quick");
  const [metrics, setMetrics] = useState<Metrics>({
    total_venues: 27,
    upcoming_bookings: 17,
    pending_approvals: 0,
    curfew: "P13 (22:00)",
  });
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Request text + editable details
  const [naturalPrompt, setNaturalPrompt] = useState("");
  const [title, setTitle] = useState("Technical Workshop");
  const [category, setCategory] = useState("club_event");
  const [day, setDay] = useState("THU");
  const [startPeriod, setStartPeriod] = useState(10);
  const [duration, setDuration] = useState(2);
  const [attendance, setAttendance] = useState(100);
  const [selectedRoom, setSelectedRoom] = useState("SH-1");
  const [needs, setNeeds] = useState<string[]>(["projector", "pa_system"]);

  // Request state
  const [isParsing, setIsParsing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const requester =
    currentUser ||
    (userRole === "admin" ? "Dean's Office" : userRole === "department_coordinator" ? "Department Coordinator" : "Campus Club Member");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/cit/bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
      setVenues(data.venues || []);
      setBookings(data.bookings || []);
    } catch {
      setStatusMessage({ type: "error", text: "Could not connect to live venue booking backend." });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentValues = (): FormValues => ({
    title,
    category,
    day,
    startPeriod,
    duration,
    attendance,
    room: selectedRoom,
    needs,
  });

  const applyValues = (v: FormValues) => {
    setTitle(v.title);
    setCategory(v.category);
    setDay(v.day);
    setStartPeriod(v.startPeriod);
    setDuration(v.duration);
    setAttendance(v.attendance);
    setSelectedRoom(v.room);
    setNeeds(v.needs);
  };

  /** Turn the natural-language request into editable details. */
  const parsePrompt = async (): Promise<FormValues> => {
    const res = await fetch("/api/ai/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: naturalPrompt.trim() }),
    });
    if (!res.ok) throw new Error("Unable to parse request. You can fill in the details manually.");
    const parsed: ParsedIntent = await res.json();

    const next = currentValues();
    if (parsed.title) next.title = parsed.title;
    if (parsed.category) next.category = parsed.category;
    if (parsed.attendance) next.attendance = parsed.attendance;
    if (parsed.duration_periods) next.duration = parsed.duration_periods;
    if (parsed.day) next.day = parsed.day;
    if (parsed.start_period) next.startPeriod = parsed.start_period;
    if (parsed.needs) next.needs = parsed.needs;

    // Venue: a named venue in the text wins, then the parser's pick, then the smallest event venue of the right type that fits.
    const lower = naturalPrompt.toLowerCase();
    const named = venues.find((v) => lower.includes(v.name.toLowerCase()) || lower.includes(v.id.toLowerCase()));
    if (named) {
      next.room = named.id;
    } else if (parsed.requested_room) {
      next.room = parsed.requested_room;
    } else if (parsed.room_types && parsed.room_types.length > 0) {
      const fit = venues
        .filter((v) => parsed.room_types?.includes(v.type) && v.allowed_uses.includes("event") && v.capacity >= next.attendance)
        .sort((a, b) => a.capacity - b.capacity)[0];
      if (fit) next.room = fit.id;
    }
    return next;
  };

  const runCheck = async (v: FormValues) => {
    const res = await fetch("/api/cit/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "check",
        title: v.title,
        category: v.category,
        day: v.day,
        start_period: v.startPeriod,
        duration_periods: v.duration,
        attendance: v.attendance,
        room_id: v.room,
        needs: v.needs,
      }),
    });
    const data: CheckResult & ApiError = await res.json();
    if (!res.ok) throw new Error(data.error || "We couldn't check availability. Please retry or use the manual form.");
    setCheckResult({
      available: data.available,
      explanation: data.explanation,
      conflicts: data.conflicts || [],
      reasons: data.reasons || [],
      alternatives: data.alternatives || [],
    });
  };

  const handleFind = async () => {
    setStatusMessage(null);
    setCheckResult(null);

    if (flow === "quick" && !naturalPrompt.trim()) {
      setStatusMessage({ type: "error", text: "Tell us what you need first, for example the event, date and time." });
      promptRef.current?.focus();
      return;
    }

    setIsChecking(true);
    try {
      let values = currentValues();
      if (flow === "quick") {
        setIsParsing(true);
        values = await parsePrompt();
        applyValues(values);
        setIsParsing(false);
      }
      await runCheck(values);
    } catch (err) {
      setStatusMessage({ type: "error", text: messageOf(err, "We couldn't check availability. Please retry or use the manual form.") });
    } finally {
      setIsParsing(false);
      setIsChecking(false);
    }
  };

  const handleFillFromText = async () => {
    if (!naturalPrompt.trim()) return;
    setIsParsing(true);
    setStatusMessage(null);
    setCheckResult(null);
    try {
      applyValues(await parsePrompt());
      setStatusMessage({ type: "info", text: "Review the extracted details before submitting." });
    } catch (err) {
      setStatusMessage({ type: "error", text: messageOf(err, "Unable to parse request. You can fill in the details manually.") });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
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
          requester,
        }),
      });
      const data: ApiError & { status?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatusMessage({
        type: data.status === "rejected" ? "error" : "success",
        text: data.message || "Booking request submitted for approval.",
      });
      setCheckResult(null);
      loadData();
    } catch (err) {
      setStatusMessage({ type: "error", text: messageOf(err, "Failed to submit booking.") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookingAction = async (action: "approve" | "cancel", requestId: string) => {
    try {
      const res = await fetch("/api/cit/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, request_id: requestId, role: userRole, requester }),
      });
      const data: ApiError = await res.json();
      if (!res.ok) throw new Error(data.error || `${action === "approve" ? "Approval" : "Cancellation"} failed`);
      setStatusMessage({ type: "success", text: data.message || "Done." });
      loadData();
    } catch (err) {
      setStatusMessage({ type: "error", text: messageOf(err, `Failed to ${action} booking.`) });
    }
  };

  const applyAlternative = async (alt: AlternativeOption) => {
    const next = { ...currentValues(), room: alt.room_id, day: alt.day, startPeriod: alt.start_period };
    applyValues(next);
    setCheckResult(null);
    setStatusMessage({
      type: "info",
      text: `Applied suggested alternative: ${alt.room_name} on ${DAY_NAMES[alt.day] || alt.day} P${alt.start_period}–P${alt.end_period}. Checking venue availability…`,
    });
    setIsChecking(true);
    try {
      await runCheck(next);
    } catch (err) {
      setStatusMessage({ type: "error", text: messageOf(err, "We couldn't check availability. Please retry or use the manual form.") });
    } finally {
      setIsChecking(false);
    }
  };

  const startFromVenue = (v: VenueItem) => {
    setSelectedRoom(v.id);
    setCheckResult(null);
    setStatusMessage(null);
    setNaturalPrompt(`Book ${v.name} for `);
    setTimeout(() => {
      promptRef.current?.focus();
      promptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const toggleNeed = (feat: string) =>
    setNeeds((prev) => (prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]));

  /* ---- derived numbers ---- */
  const pendingCount = bookings.filter((b) => b.status === "pending" || b.status === "alternative_offered").length;
  const spectraCount = bookings.filter((b) => !b.is_user_created && b.status === "approved").length;
  const demand = new Map<string, number>();
  bookings.forEach((b) => {
    if (b.room_id && (b.status === "approved" || b.status === "pending")) demand.set(b.room_id, (demand.get(b.room_id) || 0) + 1);
  });
  const popular = POPULAR_IDS.map((id) => venues.find((v) => v.id === id)).filter((v): v is VenueItem => !!v);
  const shownVenues = showAll ? venues : popular;

  const field =
    "w-full h-10 px-3 rounded-xl border text-[13px] font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500/40";
  const fieldStyle = { background: "var(--search-bg)", borderColor: "var(--search-border)" };
  const labelCls = "block text-[12px] font-semibold text-[var(--muted)] mb-1";
  const canApprove = userRole === "admin" || userRole === "department_coordinator";
  const busy = isChecking || isParsing;

  const statusStyles: Record<StatusMessage["type"], string> = {
    success:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200",
    error: "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };

  return (
    <div className="space-y-4">
      {/* ---------------- Hero ---------------- */}
      <section
        className="hero-sheen relative overflow-hidden rounded-[20px] text-white min-h-[150px] sm:min-h-[168px] flex items-center"
        style={{
          background: isDark
            ? "linear-gradient(100deg,#030B1F 0%,#07153A 45%,#0B1F58 100%)"
            : "linear-gradient(100deg,#0A2570 0%,#123C9C 38%,#2160CF 64%,#4B93EE 100%)",
          boxShadow: isDark ? "0 14px 40px rgba(0,0,0,.45)" : "0 14px 40px rgba(18,58,130,.26)",
        }}
      >
        <div
          className="hero-img hero-kenburns absolute bottom-0 right-0 h-[60%] w-full sm:h-full sm:w-[74%] bg-cover bg-[position:72%_100%] sm:bg-right transition-[background-image] duration-300"
          style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
          role="img"
          aria-label="CIT campus building"
        />

        <div className="relative z-10 px-5 py-5 sm:px-9 max-w-[620px]">
          <span className="anim-fade-up hidden sm:inline-block px-3 py-1 rounded-full border border-white/35 bg-white/10 backdrop-blur-sm text-[11.5px] font-semibold text-white/95">
            Smart Campus · Smart Bookings
          </span>
          <h1 style={{ "--i": 1 } as React.CSSProperties} className="anim-fade-up font-serif-heading font-bold tracking-tight text-[30px] sm:text-[46px] leading-[1.05] sm:mt-2.5">
            Venue Booking
          </h1>
          <p style={{ "--i": 2 } as React.CSSProperties} className="anim-fade-up font-heading font-extrabold text-[14px] sm:text-[22px] mt-1.5">Book. Manage. Celebrate.</p>
          <p style={{ "--i": 3 } as React.CSSProperties} className="anim-fade-up hidden sm:block mt-1 text-[13.5px] font-medium text-white/90">
            From classrooms to the auditorium — all in one place.
          </p>
          <svg viewBox="0 0 150 10" className="mt-1.5 w-24 sm:w-36 h-2" aria-hidden="true">
            <defs>
              <linearGradient id="vb-gold-swoosh" x1="0" x2="1">
                <stop offset="0" stopColor="#F59E0B" stopOpacity="0.2" />
                <stop offset="0.35" stopColor="#F5A623" />
                <stop offset="1" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
            <path d="M3 7C40 2 100 2 147 5" stroke="url(#vb-gold-swoosh)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </section>

      {/* ---------------- Stat cards ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          index={0}
          tone="blue"
          label="Total Venues"
          shortLabel="Venues"
          value={metrics.total_venues}
          icon={<CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-300" />}
          iconBg="bg-blue-100 dark:bg-blue-500/20"
          stroke="#3B82F6"
        />
        <StatCard
          index={1}
          tone="violet"
          label="Upcoming Bookings"
          shortLabel="Bookings"
          value={metrics.upcoming_bookings}
          icon={<CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-300" />}
          iconBg="bg-violet-100 dark:bg-violet-500/20"
          stroke="#8B5CF6"
        />
        <StatCard
          index={2}
          tone="green"
          label="Pending Approvals"
          shortLabel="Pending"
          value={loaded ? pendingCount : metrics.pending_approvals}
          icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-300" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          stroke="#10B981"
          hideOnMobile
        />
        <StatCard
          index={3}
          tone="amber"
          label="Spectra Bookings"
          shortLabel="Spectra"
          value={spectraCount}
          icon={<Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500" />}
          iconBg="bg-orange-100 dark:bg-orange-500/20"
          stroke="#F59E0B"
          hideOnMobile
        />
      </div>

      {/* ---------------- Book a venue + popular venues ---------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.12fr_1fr] gap-4 items-start">
        {/* Book a Venue */}
        <section
          className="relative overflow-hidden rounded-[22px] border p-4 sm:p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="flex items-center gap-2 font-heading font-extrabold text-[18px]">
            <Sparkles className="w-[18px] h-[18px] text-amber-500 fill-amber-400" />
            Book a Venue
          </h2>

          <div className="mt-3 sm:flex sm:gap-3">
            <div className="flex-1 min-w-0">
              {/* Flow tabs */}
              <div
                role="tablist"
                aria-label="Booking type"
                className="flex rounded-full border p-1 gap-0.5"
                style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
              >
                {(
                  [
                    { id: "quick", label: "Quick Request", short: "Quick" },
                    { id: "advanced", label: "Advanced Booking", short: "Advanced" },
                    { id: "spectra", label: "Spectra Event", short: "Spectra" },
                  ] as { id: Flow; label: string; short: string }[]
                ).map((t) => {
                  const active = flow === t.id;
                  return (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setFlow(t.id);
                        setCheckResult(null);
                        setStatusMessage(null);
                      }}
                      className={`flex-1 h-9 rounded-full text-[12.5px] sm:text-[13px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                        active ? "text-white" : "text-[var(--ink)] hover:bg-[var(--row-hover)]"
                      }`}
                      style={active ? { background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" } : undefined}
                    >
                      <span className="hidden sm:inline">{t.label}</span>
                      <span className="sm:hidden">{t.short}</span>
                    </button>
                  );
                })}
              </div>

              {/* Request box */}
              <div className="mt-3.5 flex items-start gap-3 rounded-2xl border p-3" style={fieldStyle}>
                <MessageCircle className="w-5 h-5 mt-1 shrink-0 text-[var(--brand-700)]" />
                <textarea
                  ref={promptRef}
                  rows={2}
                  value={naturalPrompt}
                  onChange={(e) => setNaturalPrompt(e.target.value)}
                  aria-label="Describe what you need in English or Hinglish"
                  placeholder={PLACEHOLDERS[flow]}
                  className="w-full resize-none bg-transparent text-[13.5px] font-medium text-[var(--ink)] placeholder:text-[var(--nav-ink)]/70 focus:outline-none"
                />
              </div>

              {flow !== "quick" && (
                <>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    {flow === "spectra" ? (
                      <p className="text-[12.5px] font-medium text-[var(--muted)]">
                        Spectra requests follow fest-week priority.{" "}
                        <button
                          type="button"
                          onClick={() => onNavigateTab?.("spectra")}
                          className="font-bold text-[var(--brand-700)] hover:underline"
                        >
                          See Spectra bookings
                        </button>
                      </p>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={handleFillFromText}
                      disabled={isParsing || !naturalPrompt.trim()}
                      className="shrink-0 text-[12.5px] font-bold text-[var(--brand-700)] hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      {isParsing ? "Extracting details…" : "Fill details from text"}
                    </button>
                  </div>

                  {/* Editable details */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="vb-title">Event title</label>
                      <input id="vb-title" className={field} style={fieldStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="vb-cat">Event category</label>
                      <select id="vb-cat" className={field} style={fieldStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="club_event">Club Event</option>
                        <option value="department_event">Department Event</option>
                        <option value="guest_lecture">Guest Lecture</option>
                        <option value="institute_event">Institute Main Event</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="vb-day">Day of week</label>
                      <select id="vb-day" className={field} style={fieldStyle} value={day} onChange={(e) => setDay(e.target.value)}>
                        <option value="MON">Monday</option>
                        <option value="TUE">Tuesday</option>
                        <option value="WED">Wednesday</option>
                        <option value="THU">Thursday</option>
                        <option value="FRI">Friday</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="vb-att">Expected attendance</label>
                      <input
                        id="vb-att"
                        type="number"
                        min={1}
                        className={field}
                        style={fieldStyle}
                        value={attendance}
                        onChange={(e) => setAttendance(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="vb-start">Start period</label>
                      <select
                        id="vb-start"
                        className={field}
                        style={fieldStyle}
                        value={startPeriod}
                        onChange={(e) => setStartPeriod(parseInt(e.target.value, 10))}
                      >
                        {Object.entries(PERIOD_LABELS).map(([p, label]) => (
                          <option key={p} value={p}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="vb-dur">Duration</label>
                      <select
                        id="vb-dur"
                        className={field}
                        style={fieldStyle}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      >
                        {[1, 2, 3, 4, 5, 6].map((h) => (
                          <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls} htmlFor="vb-room">Venue</label>
                      <select id="vb-room" className={`${field} font-bold`} style={fieldStyle} value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                        {venues.length === 0 && <option value={selectedRoom}>{selectedRoom}</option>}
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.id}) — {v.capacity} seats{v.accessible ? " · Accessible" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className={labelCls}>Required equipment and accessibility</span>
                    <div className="flex flex-wrap gap-2">
                      {FACILITIES.map((item) => {
                        const on = needs.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleNeed(item.id)}
                            className={`px-3 py-1 rounded-full border text-[12.5px] font-bold transition flex items-center gap-1.5 ${
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
                </>
              )}

              <button
                type="button"
                onClick={handleFind}
                disabled={busy}
                className="mt-3.5 w-full h-12 rounded-full text-white text-[14.5px] font-bold flex items-center justify-center gap-2 transition hover:brightness-110 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                style={{ background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" }}
              >
                {busy ? (
                  "Checking venue availability…"
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Find Availability
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Mascot */}
            <div className="hidden sm:block relative w-[168px] shrink-0 -mb-3 -mr-1" aria-hidden="true">
              <div
                className="anim-pop absolute top-0 right-2 z-10 max-w-[150px] rounded-2xl px-3 py-1.5 text-[11.5px] font-semibold italic leading-snug"
                style={{
                  background: isDark ? "#10234A" : "#DCE9FF",
                  color: isDark ? "#CFE0FF" : "#1E4FC4",
                  border: isDark ? "1px solid #2A4A8C" : "1px solid #C2D7FB",
                }}
              >
                Just tell me what you need!
              </div>
              <div className="pt-8 anim-float">
                <RobotMascot />
              </div>
            </div>
          </div>

          {/* Status + availability result */}
          <div className="mt-3 space-y-3" aria-live="polite">
            {statusMessage && (
              <div className={`anim-pop p-3 rounded-xl border text-[13px] font-semibold flex items-start gap-2 ${statusStyles[statusMessage.type]}`}>
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-px text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {checkResult && (
              <div className="anim-pop rounded-2xl border p-3.5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--muted)]">Review the extracted details before submitting.</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[slotLabel(day, startPeriod, duration), `${attendance} people`, venues.find((v) => v.id === selectedRoom)?.name || selectedRoom].map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {checkResult.available ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2 text-[12.5px]">
                    <div className="flex items-center gap-2 font-bold text-[14px] text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      Available
                    </div>
                    <p>{checkResult.explanation}</p>
                    {checkResult.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[12px] text-emerald-700 dark:text-emerald-300">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleSubmitBooking}
                      disabled={isSubmitting}
                      className="mt-1 h-10 px-5 rounded-full text-white text-[13px] font-bold inline-flex items-center gap-2 disabled:opacity-60"
                      style={{ background: "var(--nav-active-bg)" }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? "Submitting…" : "Submit booking request"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 space-y-1.5 text-[12.5px]">
                      <div className="flex items-center gap-2 font-bold text-[14px] text-red-800 dark:text-red-300">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        Unavailable at selected time
                      </div>
                      <p>{checkResult.explanation}</p>
                      {checkResult.conflicts.map((c, i) => (
                        <div key={i} className="text-[12px] font-medium text-red-700 dark:text-red-400">• {c}</div>
                      ))}
                    </div>

                    {checkResult.alternatives.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[12.5px] font-bold">Alternative suggested</div>
                        {checkResult.alternatives.map((alt, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl border flex items-center justify-between gap-3"
                            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                          >
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold truncate">
                                {alt.room_name} · {DAY_NAMES[alt.day] || alt.day} P{alt.start_period}–P{alt.end_period}
                              </div>
                              <div className="text-[11.5px] text-[var(--muted)]">
                                {alt.capacity} seats · {alt.reason}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => applyAlternative(alt)}
                              disabled={isChecking}
                              className="shrink-0 h-8 px-3 rounded-full text-[12px] font-bold text-[var(--brand-700)] border border-blue-400 hover:bg-[var(--brand-50)] disabled:opacity-60"
                            >
                              Use this
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted)] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Availability is checked against the official schedule and existing approved bookings.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Popular Venues */}
        <section
          className="rounded-[22px] border p-4 sm:p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-heading font-extrabold text-[18px]">
              <Building2 className="w-[18px] h-[18px] text-[var(--brand-700)] hidden sm:block" />
              {showAll ? "All Venues" : "Popular Venues"}
            </h2>
            <button
              type="button"
              onClick={() => setShowAll((s) => !s)}
              className="inline-flex items-center gap-1 text-[13px] font-bold text-[var(--brand-700)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
            >
              {showAll ? "Show popular" : "View All"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!loaded && (
            <div className="mt-3.5 grid grid-cols-3 gap-3" role="status" aria-label="Checking venue availability">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[170px]" />
              ))}
              <span className="sr-only">Checking venue availability…</span>
            </div>
          )}
          {loaded && shownVenues.length === 0 && (
            <p className="py-10 text-center text-[13px] font-semibold text-[var(--muted)]">
              No venues match those filters. Try another date or venue type.
            </p>
          )}

          <div
            className={
              showAll
                ? "mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1"
                : "mt-3.5 flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible snap-x -mx-1 px-1 pb-1"
            }
          >
            {shownVenues.map((v) => {
              const high = (demand.get(v.id) || 0) >= 2;
              return (
                <article
                  key={v.id}
                  className={`rounded-2xl border p-2 flex flex-col transition-transform duration-200 hover:-translate-y-1 ${showAll ? "" : "min-w-[78%] sm:min-w-0 snap-start"}`}
                  style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 6px 18px rgba(25,55,115,.06)" }}
                >
                  <div className="h-[82px] rounded-xl overflow-hidden">
                    <VenuePhoto id={v.id} type={v.type} />
                  </div>
                  <div className="px-1 pt-2 pb-0.5 flex-1 flex flex-col">
                    <h3 className="text-[14px] font-extrabold leading-tight">{v.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
                      <Users className="w-3.5 h-3.5" />
                      {v.capacity} Capacity
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          high
                            ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        }`}
                      >
                        {high ? "High Demand" : "Available"}
                      </span>
                      <button
                        type="button"
                        onClick={() => startFromVenue(v)}
                        aria-label={`Book ${v.name}`}
                        className="w-7 h-7 rounded-full bg-[var(--brand-600)] text-white flex items-center justify-center transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* ---------------- Booking history ---------------- */}
      <section
        className="rounded-[22px] border p-4 sm:p-5 space-y-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading font-extrabold text-[18px]">Booking Requests &amp; Decisions</h2>
          <span className="text-[12.5px] font-bold text-[var(--muted)]">{bookings.length} on record</span>
        </div>

        {bookings.length === 0 ? (
          <div className="py-10 text-center text-[13px] font-semibold text-[var(--muted)]">No booking requests recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] font-bold">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Event title</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3">Slot &amp; day</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bookings.map((b) => (
                  <tr key={b.request_id} className="hover:bg-[var(--row-hover)] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[11px]">{b.request_id}</td>
                    <td className="py-3 px-3 font-semibold">{b.title}</td>
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
                    <td className="py-3 px-3 max-w-[280px] text-[11px] text-[var(--muted)] leading-tight">{b.reason}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {b.status === "pending" && canApprove && (
                        <button
                          type="button"
                          onClick={() => bookingAction("approve", b.request_id)}
                          className="px-2 py-1 mr-1 rounded text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800"
                        >
                          Approve
                        </button>
                      )}
                      {(b.status === "approved" || b.status === "pending") && (b.is_user_created || canApprove) && (
                        <button
                          type="button"
                          onClick={() => bookingAction("cancel", b.request_id)}
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
      </section>
    </div>
  );
}
