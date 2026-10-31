"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Bell, Moon, Sun, ChevronDown, RotateCcw, ShieldCheck } from "lucide-react";
import CitLogo from "@/components/CitLogo";

interface TopNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  role: string;
  setRole: (role: string) => void;
  onReset: () => void;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin (Dean's Office)" },
  { value: "department_coordinator", label: "Dept. Coordinator (ECE)" },
  { value: "faculty", label: "Faculty (Dr. Amit Behera)" },
  { value: "club", label: "Club Rep (Dance Club)" },
];

export default function TopNavbar({ isDark, toggleTheme, role, setRole, onReset }: TopNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Close the profile menu on outside click / Escape
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
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
      {/* Mobile: brand */}
      <div className="md:hidden">
        <CitLogo compact />
      </div>

      {/* Desktop: search */}
      <div className="relative hidden md:block flex-1 max-w-[620px]">
        <Search className="w-[18px] h-[18px] text-[var(--brand-700)] absolute left-5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          aria-label="Search"
          placeholder="Search anything... (e.g. room 101, CS Lab)"
          className="w-full h-12 pl-12 pr-5 rounded-full border text-[13.5px] font-medium text-[var(--ink)] placeholder:text-[var(--nav-ink)]/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
        />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3 ml-auto">
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

        {/* Profile + menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
            className="flex items-center gap-2 rounded-full pl-0.5 pr-1.5 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2F7BF5] to-[#123A82] text-white font-extrabold text-base flex items-center justify-center ring-2 ring-white/70 dark:ring-white/10 shadow-md">
              R
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[var(--ink)] transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-72 rounded-2xl border bg-[var(--surface)] p-4 z-50 space-y-4"
              style={{ borderColor: "var(--border)", boxShadow: "0 18px 48px rgba(15, 35, 85, 0.22)" }}
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F7BF5] to-[#123A82] text-white font-extrabold flex items-center justify-center">
                  R
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold">Ritik</div>
                  <div className="text-xs text-[var(--muted)] font-medium">{getRoleDisplayName(role)}</div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="acting-role"
                  className="text-[10px] font-bold text-[var(--muted)] tracking-wider mb-1.5 uppercase flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3 h-3" /> Acting Role
                </label>
                <select
                  id="acting-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                role="menuitem"
                onClick={() => {
                  onReset();
                  setMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Data
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
