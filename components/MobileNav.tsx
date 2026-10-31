"use client";

import React, { useState } from "react";
import { Home, CalendarDays, Building2, MoreHorizontal, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/Sidebar";

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const PRIMARY = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
  { id: "venues", label: "Booking", icon: Building2 },
];

/** Bottom tab bar shown below the md breakpoint (matches the mobile reference). */
export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryIds = PRIMARY.map((p) => p.id);
  const moreActive = !primaryIds.includes(activeTab);
  const moreItems = NAV_ITEMS.filter((n) => !primaryIds.includes(n.id));

  const go = (id: string) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="absolute left-3 right-3 bottom-24 rounded-3xl border bg-[var(--surface)] p-4"
            style={{ borderColor: "var(--border)", boxShadow: "0 18px 48px rgba(15,35,85,.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-extrabold font-heading">More</span>
              <button aria-label="Close" onClick={() => setMoreOpen(false)} className="p-1 text-[var(--muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-bold transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-[var(--brand-50)] text-[var(--nav-ink)] hover:bg-[var(--brand-100)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] grid grid-cols-4"
        style={{
          background: "var(--surface)",
          borderColor: "var(--sidebar-border)",
          boxShadow: "0 -8px 26px rgba(25,55,115,.08)",
        }}
      >
        {PRIMARY.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-1.5 text-[11px] font-bold transition ${
                active ? "text-blue-600 dark:text-blue-400" : "text-[var(--muted)]"
              }`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 1.9} />
              {item.label}
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className={`flex flex-col items-center gap-1 py-1.5 text-[11px] font-bold transition ${
            moreActive || moreOpen ? "text-blue-600 dark:text-blue-400" : "text-[var(--muted)]"
          }`}
        >
          <MoreHorizontal className="w-[22px] h-[22px]" />
          More
        </button>
      </nav>
    </>
  );
}
