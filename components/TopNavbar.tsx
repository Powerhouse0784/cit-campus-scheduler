"use client";

import React from "react";
import { Search, Bell, Moon, Sun, ChevronDown } from "lucide-react";

interface TopNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  role: string;
}

export default function TopNavbar({ isDark, toggleTheme, role }: TopNavbarProps) {
  const getRoleDisplayName = (r: string) => {
    switch (r) {
      case "admin": return "Dean / Admin";
      case "department_coordinator": return "ECE Coordinator";
      case "faculty": return "Dr. Amit Behera";
      case "club": return "Club Lead";
      default: return "Campus User";
    }
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[var(--border)]">
      {/* Search Input matching reference design */}
      <div className="relative w-full sm:w-80 md:w-96">
        <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search subjects, faculty, rooms..."
          className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
        />
      </div>

      {/* Action Badges & Profile */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--brand-50)] text-[var(--muted)] transition-colors shadow-sm"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            aria-label="Notifications"
            className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--brand-50)] text-[var(--muted)] shadow-sm"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            3
          </span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-500/20">
            R
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-bold">Ritik</div>
            <div className="text-[10px] text-[var(--muted)]">{getRoleDisplayName(role)}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
        </div>
      </div>
    </header>
  );
}