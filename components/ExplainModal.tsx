"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  ShieldAlert,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  Building,
  ArrowRight,
  Info,
} from "lucide-react";

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: { type: "booking_rejected" | "why_slot"; id: string } | null;
  isDark?: boolean;
}

export default function ExplainModal({
  isOpen,
  onClose,
  query,
  isDark = false,
}: ExplainModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !query) return;

    const fetchExplanation = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/cit/explain?type=${query.type}&id=${encodeURIComponent(query.id)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load explanation.");
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load decision explanation.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [isOpen, query]);

  if (!isOpen || !query) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-[540px] rounded-2xl border shadow-2xl p-6 overflow-hidden bg-[var(--surface)] text-[var(--ink)]"
        style={{
          borderColor: isDark ? "rgba(70,120,240,0.4)" : "var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              query.type === "booking_rejected"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-blue-500/10 text-blue-600 dark:text-sky-400"
            }`}>
              {query.type === "booking_rejected" ? <ShieldAlert className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-[16px]">
                {query.type === "booking_rejected" ? "Booking Decision Explanation" : "Scheduling Allocation Proof"}
              </h3>
              <p className="text-[11.5px] text-[var(--muted)] font-mono">Reference ID: {query.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--row-hover)] text-[var(--muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="py-10 text-center text-xs text-[var(--muted)] space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Analyzing constraint trees and decision logs...</p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-3.5 text-[12.5px]">
              {/* Highlight Banner */}
              <div
                className={`p-3.5 rounded-xl border ${
                  query.type === "booking_rejected"
                    ? "bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300"
                    : "bg-blue-500/10 border-blue-500/25 text-blue-900 dark:text-sky-200"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{query.type === "booking_rejected" ? "Rejection Justification" : "Certified Optimal Slot"}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-95">{data.explanation}</p>
              </div>

              {/* Constraint Details or Rule Triggered */}
              {data.constraints_satisfied && (
                <div>
                  <h4 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                    Verified Constraint Compliance (100% Passed)
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    {data.constraints_satisfied.map((c: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.suggested_action && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">Suggested Alternative:</span>
                  <span className="text-[var(--muted)]">{data.suggested_action}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t flex justify-end" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-sm"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
