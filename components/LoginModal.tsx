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
  Building2,
  Sparkles,
} from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  onLoginSuccess: (session: any) => void;
  isDark?: boolean;
}

const DEMO_PRESETS = [
  {
    role: "admin",
    name: "Dean's Office (Admin)",
    email: "admin@cit.edu",
    password: "CITAdmin2024!",
    badge: "Full Authority",
    color: "from-blue-600 to-indigo-700",
    desc: "Generate schedules, publish disruptions, override sessions, manage fest.",
  },
  {
    role: "department_coordinator",
    name: "ECE Coordinator",
    email: "coordinator@cit.edu",
    password: "CITCoord2024!",
    badge: "Department Lead",
    color: "from-emerald-600 to-teal-700",
    desc: "Manage departmental rooms, review faculty availability, approve labs.",
  },
  {
    role: "faculty",
    name: "Dr. Amit Behera",
    email: "faculty@cit.edu",
    password: "CITFaculty2024!",
    badge: "Faculty (F01)",
    color: "from-purple-600 to-violet-700",
    desc: "Request class rescheduling, view teaching timetable, declare leaves.",
  },
  {
    role: "club",
    name: "Campus Club Rep",
    email: "clubrep@cit.edu",
    password: "CITClub2024!",
    badge: "Student Rep",
    color: "from-amber-600 to-orange-700",
    desc: "Submit Spectra fest requests, view booking status and alternative proposals.",
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

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

      setSuccessMsg(`Welcome, ${data.session.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.session);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = async (preset: typeof DEMO_PRESETS[0]) => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
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

      setSuccessMsg(`Authenticated as ${data.session.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.session);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Preset authentication failed.");
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-[560px] rounded-2xl border shadow-2xl p-6 overflow-hidden bg-[var(--surface)] text-[var(--ink)]"
        style={{
          borderColor: isDark ? "rgba(70,120,240,0.4)" : "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-[18px]">CIT Campus Portal Authentication</h3>
              <p className="text-[12px] text-[var(--muted)]">Cryptographically verified roles &amp; hackathon evaluation accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--row-hover)] text-[var(--muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Role Cards */}
        <div className="mt-4">
          <label className="text-[12px] font-bold text-[var(--muted)] flex items-center justify-between mb-2">
            <span>QUICK DEMO SIGN-IN (1-CLICK EVALUATION)</span>
            <span className="text-[11px] text-blue-600 dark:text-sky-400">Passwords Auto-Verified</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_PRESETS.map((p) => {
              const isActive = currentUserRole === p.role;
              return (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickPreset(p)}
                  disabled={loading}
                  className={`text-left p-3 rounded-xl border transition-all text-[12px] relative ${
                    isActive
                      ? "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/40"
                      : "hover:bg-[var(--row-hover)] border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[13px]">{p.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-sky-300">
                      {p.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono">{p.email}</div>
                  <div className="text-[10.5px] text-[var(--muted)] line-clamp-1 mt-0.5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Credentials Form */}
        <form onSubmit={handleManualLogin} className="mt-5 pt-4 border-t space-y-3.5" style={{ borderColor: "var(--border)" }}>
          <div className="text-[12px] font-bold text-[var(--muted)]">OR ENTER CREDENTIALS MANUALLY</div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[12px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12px] font-semibold">Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@cit.edu"
                className="w-full h-9 pl-9 pr-3 rounded-lg border text-[13px] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{ borderColor: "var(--search-border)" }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-semibold">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full h-9 pl-9 pr-9 rounded-lg border text-[13px] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
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

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="text-[12px] font-bold text-red-500 hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out (Guest Mode)
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg border text-[12px] font-semibold hover:bg-[var(--row-hover)]"
                style={{ borderColor: "var(--search-border)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-9 px-5 rounded-lg bg-blue-600 text-white text-[12.5px] font-bold hover:bg-blue-700 shadow-md flex items-center gap-2"
              >
                {loading ? "Verifying..." : "Sign In"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
