"use client";

import React from "react";
import {
  Home,
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  Star,
  RefreshCcw,
  Sparkles,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import CitLogo from "@/components/CitLogo";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
  { id: "venues", label: "Venue Booking", icon: CalendarCheck },
  { id: "exams", label: "Exams", icon: ClipboardList },
  { id: "spectra", label: "Spectra Events", icon: Star },
  { id: "changes", label: "Changes", icon: RefreshCcw },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/** Pencil-sketch campus illustration shown at the bottom of the sidebar. */
function CampusSketch() {
  const wingWindows: { x: number; y: number }[] = [];
  [34, 46, 58, 70, 140, 152, 164, 176].forEach((x) => {
    [38, 48].forEach((y) => wingWindows.push({ x, y }));
  });
  return (
    <svg
      viewBox="0 0 230 78"
      className="w-full h-auto text-[#3B6FD8] dark:text-[#6EA0FF]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sweep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7FA8F5" stopOpacity="0.55" />
          <stop offset="1" stopColor="#B9D0FA" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* ground sweep */}
      <path d="M0 62C50 52 120 52 230 56V70C150 62 70 66 0 74Z" fill="url(#sweep)" />

      {/* trees */}
      <g fill="currentColor" opacity=".35">
        <circle cx="18" cy="48" r="9" />
        <circle cx="28" cy="52" r="7" />
        <circle cx="204" cy="48" r="9" />
        <circle cx="194" cy="52" r="7" />
      </g>

      <g stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="rgba(255,255,255,.35)">
        {/* wings */}
        <rect x="30" y="32" width="64" height="26" />
        <rect x="136" y="32" width="64" height="26" />
        {/* tower */}
        <rect x="94" y="18" width="42" height="40" />
        <path d="M90 20L115 4L140 20Z" />
        <path d="M105 18V12H125V18" fill="none" />
        {/* door */}
        <rect x="109" y="44" width="12" height="14" />
      </g>

      {/* windows */}
      <g fill="currentColor" opacity=".55">
        {wingWindows.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width="5" height="6" />
        ))}
        {[100, 112, 124].map((x) =>
          [24, 34].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="6" />)
        )}
      </g>
    </svg>
  );
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside
      className="hidden md:flex md:w-60 lg:w-[264px] shrink-0 flex-col justify-between sticky top-0 h-screen select-none border-r px-5 pt-7 pb-5"
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
    >
      <div>
        <CitLogo className="mb-8 px-1" />

        <nav className="space-y-1.5" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3.5 pl-5 pr-4 h-11 rounded-full text-[14.5px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                  isActive ? "text-white" : "text-[var(--nav-ink)] hover:bg-[var(--nav-hover)]"
                }`}
                style={
                  isActive
                    ? { background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" }
                    : undefined
                }
              >
                <Icon
                  className="w-[18px] h-[18px] shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Motto illustration */}
      <div className="pt-6">
        <CampusSketch />
        <div className="relative -mt-1 text-center">
          <div className="font-serif-heading italic font-semibold text-[19px] text-[#14264F] dark:text-[#E4ECFF] -rotate-3 tracking-tight">
            Plan. Organize. Excel.
          </div>
          <svg viewBox="0 0 120 8" className="mx-auto -mt-0.5 w-28 h-2 text-[#2F63D6]" aria-hidden="true">
            <path d="M2 6C30 1 80 1 118 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
