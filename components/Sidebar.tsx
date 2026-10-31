"use client";

import React from "react";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Bot,
  BarChart3,
  Settings,
  RotateCcw,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
  setRole: (role: string) => void;
  onReset: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  role,
  setRole,
  onReset,
}: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "venues", label: "Venue Booking", icon: Building2 },
    { id: "exams", label: "Exams", icon: GraduationCap },
    { id: "spectra", label: "Spectra Events", icon: Sparkles },
    { id: "changes", label: "Changes", icon: RefreshCw },
    { id: "ai", label: "AI Assistant", icon: Bot },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-full md:w-60 bg-[var(--surface)] border-r border-[var(--border)] p-5 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-7 px-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-md">
            ◈
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight font-heading leading-tight">
              CIT
            </h1>
            <p className="text-[11px] text-[var(--muted)] font-medium leading-tight">
              Chilika Institute of Technology
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-[var(--muted)] hover:bg-[var(--brand-50)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[var(--muted)]"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Selection & Bottom Motto Graphic */}
      <div className="mt-6 pt-5 border-t border-[var(--border)] space-y-4">
        <div>
          <label className="text-[10px] font-bold text-[var(--muted)] tracking-wider block mb-1.5 uppercase">
            Acting Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="admin">Admin (Dean's Office)</option>
            <option value="department_coordinator">Dept. Coordinator (ECE)</option>
            <option value="faculty">Faculty (Dr. Amit Behera)</option>
            <option value="club">Club Rep (Dance Club)</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="w-full py-2 px-3 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>

        {/* Plan. Organize. Excel. illustration footer from design */}
        <div className="pt-2 text-center">
          <div className="text-[11px] font-bold italic tracking-wide text-blue-600 dark:text-blue-400 font-heading">
            Plan. Organize. Excel.
          </div>
          <div className="text-[9px] text-[var(--muted)]">CIT Campus Operations v1.0</div>
        </div>
      </div>
    </aside>
  );
}