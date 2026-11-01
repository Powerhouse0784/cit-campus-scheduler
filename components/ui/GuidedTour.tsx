"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Home,
  RefreshCw,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";

interface TourStep {
  tab?: string;
  title: string;
  body: string;
  icon: LucideIcon;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to CIT Campus Scheduler",
    body: "A 60-second tour of the clash-free timetable, plain-language venue booking, Spectra decisions and safe rescheduling. Skip any time.",
    icon: Sparkles,
  },
  {
    tab: "dashboard",
    title: "Dashboard",
    body: "Live sessions, rooms in use and pending approvals, all computed from the real schedule. Quick actions jump straight to the work.",
    icon: Home,
  },
  {
    tab: "timetable",
    title: "Timetables for every view",
    body: "Switch between student group, faculty and room. Tap the ? on any class to see why it was placed in that slot.",
    icon: CalendarDays,
  },
  {
    tab: "venues",
    title: "Book in plain English or Hinglish",
    body: "Type what you need. We extract the details, you review them, and our own code checks every clash before anything is submitted.",
    icon: Building2,
  },
  {
    tab: "spectra",
    title: "Spectra week decisions",
    body: "Each request is approved, rejected or given an alternative using the priority rules, with a reason for every decision.",
    icon: Star,
  },
  {
    tab: "exams",
    title: "Midsem exam schedule",
    body: "Exams for the following week, placed with halved room capacity and no student or room clashes.",
    icon: ClipboardList,
  },
  {
    tab: "changes",
    title: "Rescheduling Studio",
    body: "Faculty on leave or a closed room? See the smallest set of moves, review exactly what changed, and apply only after Admin approval.",
    icon: RefreshCw,
  },
  {
    tab: "ai",
    title: "AI assistant, validated by code",
    body: "The AI reads requests and explains outcomes. It never decides validity, because every proposal passes the hard-constraint checks first.",
    icon: Sparkles,
  },
  {
    tab: "analytics",
    title: "Conflicts and utilisation",
    body: "Track open conflicts, room utilisation and soft-constraint penalties at a glance. That's the tour. Press Ctrl / ⌘ + K any time for quick actions.",
    icon: BarChart3,
  },
];

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function GuidedTour({ open, onClose, onNavigate }: GuidedTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const tab = STEPS[step]?.tab;
    if (tab) onNavigate(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-x-0 bottom-24 md:bottom-8 z-[110] flex justify-center px-3 pointer-events-none">
        <motion.div
          className="w-full max-w-[520px] pointer-events-auto"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          role="dialog"
          aria-label="Guided tour"
        >
          <div className="tour-border rounded-[22px] p-[2px] shadow-2xl">
            <div className="rounded-[20px] bg-[var(--surface)] p-5">
              <div className="flex items-start gap-4">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={step}
                    initial={{ opacity: 0, rotate: -20, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.25 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.span>
                </AnimatePresence>

                <div className="min-w-0 flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--brand-700)]">
                        {step === 0 ? "Quick tour" : `Step ${step} of ${STEPS.length - 1}`}
                      </div>
                      <h2 className="font-heading font-extrabold text-[18px] leading-tight mt-0.5">{current.title}</h2>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted)] font-medium">{current.body}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close tour"
                  className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === step ? "w-6 bg-[var(--brand-600)]" : i < step ? "w-1.5 bg-[var(--brand-500)]/60" : "w-1.5 bg-[var(--border)]"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      className="h-9 px-3.5 rounded-full text-[12.5px] font-bold text-[var(--muted)] hover:bg-[var(--row-hover)]"
                    >
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-9 px-3.5 rounded-full text-[12.5px] font-bold text-[var(--muted)] hover:bg-[var(--row-hover)]"
                    >
                      Skip
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (last ? onClose() : setStep((s) => s + 1))}
                    className="h-9 px-4 rounded-full text-white text-[12.5px] font-bold inline-flex items-center gap-1.5"
                    style={{ background: "var(--nav-active-bg)", boxShadow: "var(--nav-active-shadow)" }}
                  >
                    {last ? "Finish" : step === 0 ? "Start tour" : "Next"}
                    {!last && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
