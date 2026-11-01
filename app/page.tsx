"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Moon,
  Sun,
  ShieldCheck,
  Crown,
  Building,
  GraduationCap,
  Users,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Sidebar, { NAV_ITEMS } from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import MobileNav from "@/components/MobileNav";
import DashboardModule from "@/components/DashboardModule";
import TimetableSection from "@/components/TimetableSection";
import VenueBookingSection from "@/components/VenueBookingSection";
import SpectraEventsModule from "@/components/SpectraEventsModule";
import ReschedulingStudioModule from "@/components/ReschedulingStudioModule";
import ExamsModule from "@/components/ExamsModule";
import AiAssistantModule from "@/components/AiAssistantModule";
import AnalyticsConflictsModule from "@/components/AnalyticsConflictsModule";
import SettingsRolesModule from "@/components/SettingsRolesModule";
import CommandPalette, { type PaletteItem } from "@/components/ui/CommandPalette";
import GuidedTour from "@/components/ui/GuidedTour";
import { useToast } from "@/components/ui/Toast";
import CitLogo from "@/components/CitLogo";
import { DEMO_PRESETS } from "@/components/LoginModal";

const TOUR_KEY = "cit-tour-seen";

const NAV_KEYWORDS: Record<string, string> = {
  dashboard: "home overview stats kpi pending approvals",
  timetable: "schedule classes group faculty room weekly view",
  venues: "book booking room hall auditorium request availability",
  exams: "midsem exam schedule invigilation",
  spectra: "fest events decisions priority approve reject alternative",
  changes: "reschedule leave closure disruption move approve",
  ai: "assistant chat prompt hinglish natural language",
  analytics: "conflicts utilisation penalty report",
  settings: "roles dataset export schedule json accounts",
};

export default function Home() {
  const [activeTab, setActiveTabRaw] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab);
    setSearchQuery("");
  };

  const toast = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [role, setRole] = useState("student");
  const [isDark, setIsDark] = useState(false);

  // Initial Landing Gateway State
  const [showLandingGateway, setShowLandingGateway] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState<string | null>(null);

  // Check session on mount: if unauthenticated & first visit, show the Landing Gateway!
  useEffect(() => {
    fetch("/api/cit/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.session && data.session.role !== "student") {
          setRole(data.session.role);
          setShowLandingGateway(false);
        } else {
          // If no authenticated session yet, show the Gateway on first visit!
          let dismissed = false;
          try {
            dismissed = sessionStorage.getItem("cit_gateway_dismissed") === "1";
          } catch {}
          if (!dismissed) {
            setShowLandingGateway(true);
          }
        }
      })
      .catch(() => {
        setShowLandingGateway(true);
      });
  }, []);

  const handleGatewayLogin = async (preset: typeof DEMO_PRESETS[0]) => {
    setGatewayLoading(preset.role);
    try {
      const res = await fetch("/api/cit/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: preset.email, password: preset.password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      try {
        sessionStorage.setItem("cit_gateway_dismissed", "1");
      } catch {}

      setRole(data.session.role);
      toast.show({
        type: "success",
        title: `Authenticated as ${data.session.name}!`,
        description: `Logged in with ${preset.badge} permissions.`,
      });

      setShowLandingGateway(false);
    } catch (err: any) {
      toast.show({
        type: "error",
        title: "Login failed",
        description: err.message || "Unable to sign in.",
      });
    } finally {
      setGatewayLoading(null);
    }
  };

  const dismissGatewayAsGuest = () => {
    try {
      sessionStorage.setItem("cit_gateway_dismissed", "1");
    } catch {}
    setShowLandingGateway(false);
    toast.show({
      type: "info",
      title: "Exploring as Guest Student",
      description: "You have read-only access. Tap the role pill in the header anytime to switch accounts.",
    });
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleResetData = () => {
    fetch("/api/cit/reset", { method: "POST" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || result?.success === false) {
          throw new Error(result?.error || "Unable to reset demo data.");
        }
        toast.show({
          type: "success",
          title: "Demo data reset",
          description: "Everything is back to the clean baseline dataset (0 hard clashes).",
        });
      })
      .catch((error) => {
        toast.show({
          type: "error",
          title: "Reset failed",
          description: error instanceof Error ? error.message : "Unable to reset demo data.",
        });
      });
  };

  const closeTour = useCallback(() => {
    setTourOpen(false);
    try {
      window.localStorage.setItem(TOUR_KEY, "1");
    } catch {}
  }, []);

  // Guided tour after gateway dismissal
  useEffect(() => {
    if (showLandingGateway) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(TOUR_KEY) === "1";
    } catch {}
    if (seen) return;
    const id = window.setTimeout(() => setTourOpen(true), 1200);
    return () => window.clearTimeout(id);
  }, [showLandingGateway]);

  // Ctrl / Cmd + K command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteItems: PaletteItem[] = useMemo(
    () => [
      ...NAV_ITEMS.map((n) => ({
        id: `go-${n.id}`,
        label: `Go to ${n.label}`,
        group: "Navigate",
        icon: n.icon,
        keywords: NAV_KEYWORDS[n.id],
        run: () => setActiveTab(n.id),
      })),
      { id: "act-book", label: "Book a venue", group: "Quick actions", icon: NAV_ITEMS[2].icon, hint: "Plain English or Hinglish", keywords: "request room hall auditorium", run: () => setActiveTab("venues") },
      { id: "act-change", label: "Request a timetable change", group: "Quick actions", icon: NAV_ITEMS[5].icon, hint: "Leave, closure, new session", keywords: "reschedule faculty leave room closed", run: () => setActiveTab("changes") },
      { id: "act-conflicts", label: "View current conflicts", group: "Quick actions", icon: NAV_ITEMS[7].icon, keywords: "clash analytics", run: () => setActiveTab("analytics") },
      { id: "act-ai", label: "Ask the AI assistant", group: "Quick actions", icon: NAV_ITEMS[6].icon, keywords: "prompt chat", run: () => setActiveTab("ai") },
      { id: "pref-theme", label: isDark ? "Switch to light mode" : "Switch to dark mode", group: "Preferences", icon: isDark ? Sun : Moon, run: toggleTheme },
      { id: "help-tour", label: "Take the guided tour", group: "Help", icon: Compass, hint: "60 seconds", keywords: "help walkthrough onboarding demo", run: () => setTourOpen(true) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark]
  );

  return (
    <div className="min-h-screen flex text-[var(--ink)] relative">
      {/* ---------------- INITIAL LANDING GATEWAY (FIRST IMPRESSION) ---------------- */}
      <AnimatePresence>
        {showLandingGateway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="relative w-full max-w-[820px] rounded-[28px] border shadow-2xl p-6 sm:p-8 bg-[var(--surface)] text-[var(--ink)] space-y-6 my-auto"
              style={{
                borderColor: isDark ? "rgba(70,120,240,0.5)" : "var(--border)",
                boxShadow: "0 24px 60px rgba(10,30,90,0.35)",
              }}
            >
              {/* Header Branding */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3.5">
                  <CitLogo />
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-300 text-[11px] font-extrabold tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      CRUNCH WEEK 2024 EVALUATION PORTAL
                    </div>
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
                      Select Demo Role to Begin Evaluation
                    </h2>
                    <p className="text-xs text-[var(--muted)]">
                      1-click instant login &bull; No password entry needed &bull; Pre-configured permissions
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold self-start sm:self-center">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Verified 0 Hard Clashes</span>
                </div>
              </div>

              {/* 4 Prominent Demo Role Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {DEMO_PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isThisLoading = gatewayLoading === p.role;

                  return (
                    <div
                      key={p.role}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 ${p.bg} ${p.border}`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="font-heading font-extrabold text-[15px] leading-tight text-[var(--ink)]">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-[var(--muted)] font-medium">
                                {p.subtitle}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/40 border border-current text-[var(--ink)] shrink-0">
                            {p.badge}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-[var(--muted)] leading-relaxed pt-1">
                          {p.desc}
                        </p>
                      </div>

                      {/* Scopes & 1-Click Launch Button */}
                      <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {p.scopes.slice(0, 2).map((sc) => (
                            <span key={sc} className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-[9.5px] font-semibold text-[var(--muted)]">
                              {sc}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={gatewayLoading !== null}
                          onClick={() => handleGatewayLogin(p)}
                          className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 bg-gradient-to-r ${p.gradient} hover:brightness-110 active:scale-95`}
                        >
                          {isThisLoading ? (
                            <span>Entering...</span>
                          ) : (
                            <>
                              <span>Enter as {p.name.split(" ")[0]}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Bypass Action */}
              <div className="pt-2 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]" style={{ borderColor: "var(--border)" }}>
                <span>Tip: Switch roles at any time using the profile pill in the top navbar.</span>
                <button
                  type="button"
                  onClick={dismissGatewayAsGuest}
                  className="font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Or explore as Guest Student (Read-Only)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation (desktop / tablet) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          isDark={isDark}
          toggleTheme={toggleTheme}
          role={role}
          setRole={setRole}
          onReset={handleResetData}
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenPalette={() => setPaletteOpen(true)}
          onStartTour={() => setTourOpen(true)}
        />

        {/* Route progress bar */}
        <motion.div
          key={`progress-${activeTab}`}
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[3px] z-[90] origin-left"
          style={{ background: "linear-gradient(90deg,#2563EB,#8B5CF6,#06B6D4)" }}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.75, ease: "easeOut", opacity: { delay: 0.45, duration: 0.3 } }}
        />

        <main className="flex-1 px-4 sm:px-6 pb-28 md:pb-10 max-w-[1600px] w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {activeTab === "dashboard" && (
                <DashboardModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                />
              )}

              {activeTab === "timetable" && (
                <TimetableSection
                  isDark={isDark}
                  searchQuery={searchQuery}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "venues" && (
                <VenueBookingSection
                  userRole={role}
                  isDark={isDark}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === "spectra" && (
                <SpectraEventsModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                />
              )}

              {activeTab === "changes" && (
                <ReschedulingStudioModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                />
              )}

              {activeTab === "exams" && (
                <ExamsModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                />
              )}

              {activeTab === "ai" && (
                <AiAssistantModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsConflictsModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                />
              )}

              {activeTab === "settings" && (
                <SettingsRolesModule
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  userRole={role}
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
      <GuidedTour open={tourOpen} onClose={closeTour} onNavigate={setActiveTab} />
    </div>
  );
}