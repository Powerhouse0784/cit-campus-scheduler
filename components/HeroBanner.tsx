"use client";

import React from "react";

interface HeroBannerProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  badge?: string;
  type?: "dashboard" | "timetable" | "venue";
}

export default function HeroBanner({
  title,
  subtitle,
  eyebrow = "Smart Scheduling. A Better Campus.",
  badge,
  type = "dashboard",
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#102A63] via-[#1D4ED8] to-[#2563EB] text-white p-6 sm:p-8 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      {/* Text Container */}
      <div className="relative z-10 max-w-2xl">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-wider font-bold text-blue-200 mb-1.5 opacity-90">
            {eyebrow}
          </div>
        )}
        <h1
          className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${
            type === "venue" ? "font-serif-heading" : "font-heading"
          }`}
        >
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Decorative Badge or Accent */}
      {badge && (
        <div className="relative z-10 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {badge}
          </span>
        </div>
      )}

      {/* Soft gradient background glow effect */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}