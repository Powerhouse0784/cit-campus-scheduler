"use client";

import React from "react";

/** The CIT book-and-pillars mark. Uses currentColor so it follows the theme. */
export function CitMark({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* fanned pages / leaves */}
      <g fill="currentColor">
        <path d="M32 30C27 27 26 19 32 6C38 19 37 27 32 30Z" />
        <path d="M32 30C26 27 24 19 27 11C31 15 33 23 32 30Z" opacity=".9" />
        <path d="M32 30C38 27 40 19 37 11C33 15 31 23 32 30Z" opacity=".9" />
        <path d="M32 30C23 30 17 25 14 17C22 17 29 22 32 30Z" opacity=".8" />
        <path d="M32 30C41 30 47 25 50 17C42 17 35 22 32 30Z" opacity=".8" />
      </g>
      {/* open-book frame + pillars */}
      <g
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 34V53H56V34" />
        <path d="M8 53Q20 49 32 54Q44 49 56 53" />
        <path d="M16 39V48M22 39V48M42 39V48M48 39V48" />
        <path d="M32 33V57" />
      </g>
    </svg>
  );
}

interface CitLogoProps {
  /** compact = mark + "CIT" only (mobile top bar) */
  compact?: boolean;
  className?: string;
}

export default function CitLogo({ compact = false, className = "" }: CitLogoProps) {
  return (
    <div
      className={`flex items-center gap-2.5 text-[var(--logo-ink)] ${className}`}
      aria-label="CIT – Chilika Institute of Technology"
    >
      <CitMark className={compact ? "w-8 h-8" : "w-12 h-12"} />
      <div className="leading-none">
        <div
          className={`font-heading font-extrabold tracking-tight ${
            compact ? "text-2xl" : "text-[34px]"
          }`}
        >
          CIT
        </div>
        {!compact && (
          <div className="mt-1 text-[11px] font-semibold leading-[1.15] tracking-tight">
            Chilika Institute
            <br />
            of Technology
          </div>
        )}
      </div>
    </div>
  );
}
