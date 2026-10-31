"use client";

import React from "react";

interface HeroBannerProps {
  /** Pass nodes so the title can break onto two lines on small screens. */
  title: React.ReactNode;
  subtitle?: string;
  isDark?: boolean;
  /** Show the gold swoosh under the subtitle (used in the dark theme reference). */
  swoosh?: boolean;
}

/** Compact campus banner used at the top of the Timetable screen. */
export default function HeroBanner({ title, subtitle, isDark = false, swoosh = true }: HeroBannerProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[18px] text-white min-h-[112px] sm:min-h-[104px] flex items-center"
      style={{
        background: isDark
          ? "linear-gradient(100deg,#030B1F 0%,#07153A 45%,#0B1F58 100%)"
          : "linear-gradient(100deg,#0A2570 0%,#123C9C 38%,#2160CF 64%,#4B93EE 100%)",
        boxShadow: isDark ? "0 12px 32px rgba(0,0,0,.4)" : "0 12px 32px rgba(18,58,130,.22)",
      }}
    >
      <div
        className="hero-img absolute bottom-0 right-0 h-[62%] w-full sm:h-full sm:w-[68%] bg-cover bg-[position:72%_100%] sm:bg-right transition-[background-image] duration-300"
        style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
        role="img"
        aria-label="CIT campus building"
      />

      <div className="relative z-10 px-5 py-4 sm:px-8 max-w-[560px]">
        <h1 className="font-heading font-extrabold tracking-tight text-[19px] sm:text-[24px] md:text-[28px] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden sm:block mt-1.5 text-[13.5px] md:text-[15px] font-medium text-white/95">{subtitle}</p>
        )}
        {swoosh && (
          <svg viewBox="0 0 150 10" className="mt-1.5 w-24 sm:w-32 h-2" aria-hidden="true">
            <defs>
              <linearGradient id="tt-gold-swoosh" x1="0" x2="1">
                <stop offset="0" stopColor="#F59E0B" stopOpacity="0.2" />
                <stop offset="0.35" stopColor="#F5A623" />
                <stop offset="1" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
            <path d="M3 7C40 2 100 2 147 5" stroke="url(#tt-gold-swoosh)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
    </section>
  );
}
