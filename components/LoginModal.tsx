"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  KeyRound,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  GraduationCap,
  Users,
  Building,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  onLoginSuccess: (session: any) => void;
  isDark?: boolean;
}

export const DEMO_PRESETS = [
  {
    role: "admin",
    name: "Dean's Office",
    subtitle: "Academic Administrator",
    email: "admin@cit.edu",
    password: "CITAdmin2024!",
    badge: "Full Authority",
    icon: Crown,
    gradient: "from-blue-600 via-indigo-600 to-blue-800",
    glow: "rgba(37,99,235,0.35)",
    border: "border-blue-300 dark:border-blue-700",
    bg: "bg-blue-50/70 dark:bg-blue-950/40",
    desc: "Generate master timetables, publish disruptions, override sessions, and manage festival governance.",
    scopes: ["Master Timetable", "Publish Schedule", "Approve All Bookings", "Reset Baseline"],
  },
  {
    role: "department_coordinator",
    name: "ECE Coordinator",
    subtitle: "Department Coordinator",
    email: "coordinator@cit.edu",
    password: "CITCoord2024!",
    badge: "Dept Lead",
    icon: Building,
    gradient: "from-emerald-600 via-teal-600 to-emerald-800",
    glow: "rgba(16,185,129,0.35)",
    border: "border-emerald-300 dark:border-emerald-700",
    bg: "bg-emerald-50/70 dark:bg-emerald-950/40",
    desc: "Manage departmental rooms, review faculty availability, schedule laboratories, and resolve local room clashes.",
    scopes: ["Dept Venues", "Lab Scheduling", "Approve Dept Events", "Review Faculty"],
  },
  {
    role: "faculty",
    name: "Dr. Amit Behera",
    subtitle: "Faculty (ID: F01)",
    email: "faculty@cit.edu",
    password: "CITFaculty2024!",
    badge: "Teaching Faculty",
    icon: GraduationCap,
    gradient: "from-purple-600 via-violet-600 to-purple-800",
    glow: "rgba(139,92,246,0.35)",
    border: "border-purple-300 dark:border-purple-700",
    bg: "bg-purple-50/70 dark:bg-purple-950/40",
    desc: "Request class rescheduling in natural language, declare medical leave, and access personal teaching schedules.",
    scopes: ["Personal Timetable", "Declare Leave", "AI Reschedule", "Course Slots"],
  },
  {
    role: "club",
    name: "Aarav Sharma",
    subtitle: "Campus Club Lead",
    email: "clubrep@cit.edu",
    password: "CITClub2024!",
    badge: "Student Lead",
    icon: Users,
    gradient: "from-amber-600 via-orange-600 to-amber-800",
    glow: "rgba(245,158,11,0.35)",
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50/70 dark:bg-amber-950/40",
    desc: "Submit Spectra fest requests in plain English/Hinglish, view real-time venue availability and alternative slots.",
    scopes: ["Spectra Requests", "Hinglish Booking", "Alternative Slots", "Curfew (P13)"],
  },
];

export default function LoginModal({
  isOpen,
  onClose,
  currentUserRole,
  onLoginSuccess,
  isDark = false,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isOpen) return null;

  const handleQuickPreset = async (preset: typeof DEMO_PRESETS[0]) => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoadingRole(preset.role);
    setEmail(preset.email);
    setPassword(preset.password);

    try {
      const res = await fetch("/api/cit/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: preset.email, password: preset.password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to switch role.");
      }

      try {
        sessionStorage.setItem("cit_gateway_dismissed", "1");
      } catch {}

      setSuccessMsg(`✓ Authenticated as ${data.session.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.session);
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "Preset authentication failed.");
    } finally {
      setLoadingRole(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoadingRole("manual");

    try {
      const res = await fetch("/api/cit/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password.");
      }

      try {
        sessionStorage.setItem("cit_gateway_dismissed", "1");
      } catch {}

      setSuccessMsg(`✓ Welcome, ${data.session.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.session);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed.");
    } finally {
      setLoadingRole(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/cit/auth/session", { method: "DELETE" });
      onLoginSuccess({ role: "student", name: "Guest Student", email: "student.guest@cit.edu" });
      onClose();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-[680px] rounded-3xl border shadow-2xl p-6 sm:p-7 overflow-hidden bg-[var(--surface)] text-[var(--ink)] max-h-[92vh] overflow-y-auto"
        style={{
          borderColor: isDark ? "rgba(70,120,240,0.4)" : "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-300 text-[10.5px] font-bold">
                <Sparkles className="w-3 h-3" /> Hackathon Evaluation Accounts
              </div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[var(--ink)]">
                Campus Portal Role Gateway
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--row-hover)] text-[var(--muted)] hover:text-[var(--ink)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1-Click Evaluation Presets */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              1-Click Demo Logins (No Password Needed)
            </label>
            <span className="text-[11px] text-blue-600 dark:text-sky-400 font-semibold">Instant Session Grant</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PRESETS.map((p) => {
              const Icon = p.icon;
              const isActive = currentUserRole === p.role;
              const isThisLoading = loadingRole === p.role;

              return (
                <div
                  key={p.role}
                  className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between space-y-2.5 ${p.bg} ${p.border} ${
                    isActive ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${p.gradient} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="font-heading font-extrabold text-[13.5px] leading-tight text-[var(--ink)]">
                            {p.name}
                          </div>
                          <div className="text-[10.5px] text-[var(--muted)] font-medium">
                            {p.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/30 border border-current text-[var(--ink)] shrink-0">
                        {p.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--muted)] leading-snug pt-1">
                      {p.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] text-[var(--muted)] truncate">
                      {p.email}
                    </span>
                    <button
                      type="button"
                      disabled={loadingRole !== null}
                      onClick={() => handleQuickPreset(p)}
                      className={`px-3 py-1.5 rounded-xl text-white text-[11.5px] font-bold flex items-center gap-1.5 transition shadow-xs shrink-0 ${
                        isActive
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : `bg-gradient-to-r ${p.gradient} hover:brightness-110`
                      }`}
                    >
                      {isThisLoading ? (
                        <span>Logging in...</span>
                      ) : isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Role</span>
                        </>
                      ) : (
                        <>
                          <span>Login as {p.name.split(" ")[0]}</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Manual Credentials Form */}
        <div className="mt-5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full text-center text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center justify-center gap-1.5"
          >
            <span>{showManualForm ? "Hide Manual Form" : "Or enter custom email & password manually"}</span>
          </button>

          {showManualForm && (
            <form onSubmit={handleManualLogin} className="mt-3 space-y-3 p-4 rounded-2xl bg-[var(--search-bg)] border border-[var(--border)]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)]">Email Address</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@cit.edu"
                    className="w-full h-9 pl-9 pr-3 rounded-xl border text-xs bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{ borderColor: "var(--search-border)" }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)]">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full h-9 pl-9 pr-9 rounded-xl border text-xs bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                    style={{ borderColor: "var(--search-border)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={loadingRole !== null}
                  className="h-8 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  {loadingRole === "manual" ? "Verifying..." : "Sign In"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[11.5px] font-bold text-red-500 hover:underline flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out (Guest Student Mode)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-[var(--row-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}