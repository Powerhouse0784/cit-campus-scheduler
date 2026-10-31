"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Bell, Moon, Sun, ChevronDown, RotateCcw, ShieldCheck, Lock, LogIn, CheckCircle2 } from "lucide-react";
import CitLogo from "@/components/CitLogo";
import ConfirmModal from "@/components/ConfirmModal";
import LoginModal from "@/components/LoginModal";

interface TopNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  role: string;
  setRole: (role: string) => void;
  onReset: () => void;
  activeTab?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function TopNavbar({
  isDark,
  toggleTheme,
  role,
  setRole,
  onReset,
  activeTab,
  searchQuery,
  onSearchChange,
}: TopNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case "admin": return "Dean / Admin";
      case "department_coordinator": return "ECE Coordinator";
      case "faculty": return "Dr. Amit Behera";
      case "club": return "Club Lead";
      default: return "Campus User";
    }
  };

  const syncSession = async () => {
    try {
      const res = await fetch("/api/cit/auth/session");
      const data = await res.json();
      if (data.success && data.session) {
        setCurrentSession(data.session);
        if (data.session.role && data.session.role !== role) {
          setRole(data.session.role);
        }
      }
    } catch {}
  };

  useEffect(() => {
    syncSession();
  }, []);

  const handleRoleChange = async (newRole: string) => {
    setRole(newRole);
    try {
      const res = await fetch("/api/cit/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setCurrentSession(data.session);
      }
    } catch {}
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const pillBtn =
    "relative w-11 h-11 rounded-full flex items-center justify-center text-[var(--ink)] transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";

  return (
    <>
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <div className="md:hidden">
          <CitLogo compact />
        </div>

        <div className="relative hidden md:block flex-1 max-w-[620px]">
          <Search className="w-[18px] h-[18px] text-[var(--brand-700)] absolute left-5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search across platform"
            {...(onSearchChange
              ? { value: searchQuery ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value) }
              : {})}
            placeholder={
              activeTab === "timetable"
                ? "Search subjects, faculty, rooms..."
                : activeTab === "settings"
                ? "Search settings, users, or permissions..."
                : activeTab === "analytics"
                ? "Search analytics, rooms, or events..."
                : activeTab === "exams"
                ? "Search exams, subjects, or courses..."
                : activeTab === "changes"
                ? "Search timetable, faculty, room..."
                : activeTab === "spectra"
                ? "Search events, clubs, or organizers..."
                : activeTab === "ai"
                ? 'Search anything... (e.g. "Show Monday exams")'
                : "Search anything... (e.g. room 101, CS Lab)"
            }
            className="w-full h-12 pl-12 pr-5 rounded-full border text-[13.5px] font-medium text-[var(--ink)] placeholder:text-[var(--nav-ink)]/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
          />
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          {/* Quick Sign In / Switch Role Pill */}
          <button
            onClick={() => setShowLoginModal(true)}
            aria-label="Authentication and credentials dialog"
            className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border text-[12px] font-bold text-blue-600 dark:text-sky-400 hover:bg-[var(--row-hover)] transition shadow-sm"
            style={{ borderColor: "var(--search-border)", background: "var(--surface)" }}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{currentSession?.name ? currentSession.name.split(" ")[0] : getRoleDisplayName(role)}</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-sky-300 uppercase">
              {role}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={pillBtn}
            style={{ background: "var(--pill-bg)", boxShadow: "var(--pill-shadow)" }}
          >
            {isDark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-[var(--nav-ink)]" />}
          </button>

          <button
            aria-label="Notifications (3 unread)"
            className={pillBtn}
            style={{ background: "var(--pill-bg)", boxShadow: "var(--pill-shadow)" }}
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[var(--pill-bg)]" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
              className="flex items-center gap-2 rounded-full pl-0.5 pr-1.5 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2F7BF5] to-[#123A82] text-white font-extrabold text-base flex items-center justify-center ring-2 ring-white/70 dark:ring-white/10 shadow-md">
                {role === "admin" ? "D" : role === "faculty" ? "F" : role === "department_coordinator" ? "C" : "U"}
              </span>
              <ChevronDown className={`w-4 h-4 text-[var(--ink)] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-72 rounded-2xl border bg-[var(--surface)] p-4 z-50 space-y-4"
                style={{ borderColor: "var(--border)", boxShadow: "0 18px 48px rgba(15, 35, 85, 0.22)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F7BF5] to-[#123A82] text-white font-extrabold flex items-center justify-center">
                    {role === "admin" ? "D" : role === "faculty" ? "F" : "U"}
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-extrabold">{currentSession?.name || getRoleDisplayName(role)}</div>
                    <div className="text-xs text-[var(--muted)] font-medium capitalize">{role.replace("_", " ")}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11.5px] flex items-center justify-between">
                  <span className="font-semibold text-blue-700 dark:text-sky-300">Signed Session:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In / Switch Account
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowResetConfirm(true);
                  }}
                  className="w-full py-2 px-3 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Demo Data
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Accessible Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Campus Demo State?"
        message="This action will restore all timetables, room maintenance closures, and Spectra booking decisions back to the pristine baseline dataset (cit_public.json)."
        confirmText="Yes, Reset Data"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowResetConfirm(false);
          onReset();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Login & Role Authentication Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUserRole={role}
        onLoginSuccess={(session) => {
          setCurrentSession(session);
          setRole(session.role);
        }}
        isDark={isDark}
      />
    </>
  );
}
