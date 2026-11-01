import React from "react";

/** Shimmering placeholder block. Size it with className (e.g. "h-12 w-full"). */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
