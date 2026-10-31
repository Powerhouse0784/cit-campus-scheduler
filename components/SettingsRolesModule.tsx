"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Users,
  GraduationCap,
  Trophy,
  Crown,
  Bell,
  Sparkles,
  RefreshCw,
  Lock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  X,
  Edit2,
  MoreVertical,
  ShieldCheck,
} from "lucide-react";

interface SettingsRolesModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export default function SettingsRolesModule({
  onNavigateTab,
  userRole = "admin",
  isDark = false,
  toggleTheme,
}: SettingsRolesModuleProps) {
  // Quick Settings toggle states
  const [quickSettings, setQuickSettings] = useState({
    aiAssistant: true,
    scheduleChanges: true,
    notifications: true,
    autoConflictCheck: true,
  });

  const [themePreference, setThemePreference] = useState<"system" | "light" | "dark">("light");
  const [isSaved, setIsSaved] = useState(false);
  const [selectedRoleModal, setSelectedRoleModal] = useState<any | null>(null);

  // 4 Main Role Cards matching the showcase screenshot
  const roleCards = [
    {
      id: "admin",
      title: "Admin",
      count: "2",
      members: "12 Members",
      description: "Full Access (All Features)",
      sub: "Full system access & management control",
      icon: Crown,
      iconEmoji: "👑",
      accentColor: "#247BFF",
      cardBg: "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60",
      pillColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
      permissions: [
        "Manage all 27 campus rooms & lab allocations",
        "Override timetable and publish changes",
        "Approve festival booking requests & resolve ties",
        "Access system-wide analytics & audit logs",
      ],
    },
    {
      id: "coordinator",
      title: "Coordinator",
      count: "6",
      members: "28 Members",
      description: "Manage Events & Resources",
      sub: "Manage departments, events & schedules",
      icon: Users,
      iconEmoji: "👥",
      accentColor: "#8B45FF",
      cardBg: "bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60",
      pillColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
      btnColor: "bg-purple-600 hover:bg-purple-700 text-white",
      permissions: [
        "Manage department sessions & labs",
        "Submit department event requests",
        "Review reschedule requests before admin approval",
        "Access department room utilisation reports",
      ],
    },
    {
      id: "faculty",
      title: "Faculty",
      count: "48",
      members: "124 Members",
      description: "View, Plan & Manage Classes",
      sub: "Access classes, exams & academic tools",
      icon: GraduationCap,
      iconEmoji: "🎓",
      accentColor: "#10B981",
      cardBg: "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60",
      pillColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
      permissions: [
        "View personal weekly timetable & exam halls",
        "Declare leave unavailability windows (H7)",
        "Request alternative class periods using AI",
        "Set soft schedule avoid preferences (S1)",
      ],
    },
    {
      id: "club",
      title: "Club Representative",
      count: "12",
      members: "36 Members",
      description: "Manage Club Activities",
      sub: "Manage club events & activities",
      icon: Trophy,
      iconEmoji: "🏆",
      accentColor: "#F97316",
      cardBg: "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60",
      pillColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
      btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
      permissions: [
        "Submit Spectra week venue booking requests",
        "Track approval status & alternative offers",
        "Cancel requests prior to confirmation",
        "View public campus calendar & event guidelines",
      ],
    },
  ];

  // Recent Activity audit trail from reference mockup
  const recentActivity = [
    {
      id: "a-1",
      title: "New faculty added",
      sub: "Dr. Priya Sharma (ME Dept)",
      time: "2m ago",
      icon: "⚙️",
      iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    },
    {
      id: "a-2",
      title: "Role updated",
      sub: "Club Representative (Dance Club)",
      time: "5m ago",
      icon: "👥",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    },
    {
      id: "a-3",
      title: "Timetable published",
      sub: "Sem – ODD 2026 (Verified 0 clashes)",
      time: "12m ago",
      icon: "📅",
      iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
    },
    {
      id: "a-4",
      title: "New event created",
      sub: "Tech Fest 2026 (Main Auditorium)",
      time: "20m ago",
      icon: "🎉",
      iconBg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300",
    },
  ];

  // User Management List (Expanded View from screenshot)
  const usersList = [
    {
      name: "Priya Sharma",
      email: "priya@cit.edu",
      role: "Faculty",
      roleBadge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      department: "Computer Science",
      status: "Active",
      lastLogin: "2 min ago",
    },
    {
      name: "Rahul Verma",
      email: "rahul@cit.edu",
      role: "Coordinator",
      roleBadge: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
      department: "Information Tech",
      status: "Active",
      lastLogin: "12 min ago",
    },
    {
      name: "Sneha Patel",
      email: "sneha@cit.edu",
      role: "Club Rep",
      roleBadge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      department: "Cultural Club",
      status: "Active",
      lastLogin: "1 hour ago",
    },
  ];

  const handleToggle = (key: keyof typeof quickSettings) => {
    setQuickSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. CAMPUS ADMINISTRATION WIDESCREEN HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071330] via-[#0E2872] to-[#1C51C6] text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Settings &amp; Role Management
          </h1>
          <p className="text-sm sm:text-base font-semibold text-blue-200 mb-4">
            Manage users, roles and system preferences with ease.
          </p>

          {/* 3 Value Chips matching Mockup */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Secure Access
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-200 backdrop-blur-md">
              <Users className="w-3.5 h-3.5" />
              Flexible Roles
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 backdrop-blur-md">
              <Lock className="w-3.5 h-3.5" />
              Granular Permissions
            </span>
          </div>
        </div>

        {/* Center 3D Glowing Gear & Right Neon Script ("Together for a Smarter Campus!") */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="hidden sm:flex w-20 h-20 rounded-3xl bg-cyan-400/20 border border-cyan-400/40 p-3 items-center justify-center text-4xl shadow-[0_0_28px_rgba(0,212,255,0.4)] animate-spin-slow">
            ⚙️
          </div>

          <div className="text-right hidden lg:block">
            <div className="text-3xl lg:text-4xl font-extrabold italic font-serif-heading text-white drop-shadow-[0_2px_12px_rgba(37,99,235,0.8)] tracking-wide">
              Together
              <br />
              for a Smarter
              <br />
              Campus!
            </div>
            <div className="h-1 w-28 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full ml-auto mt-2" />
          </div>
        </div>

        {/* Ambient lighting effect */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. USER ROLES OVERVIEW (4 GLOWING CARDS ACROSS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white font-black text-xs">👥</span>
            <h2 className="font-extrabold text-sm font-heading uppercase tracking-wider">
              User Roles Overview
            </h2>
          </div>
          <button
            onClick={() => setSelectedRoleModal(roleCards[0])}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View All →
          </button>
        </div>

        {/* 4 Role Cards Grid matching reference image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleCards.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className={`p-5 rounded-2xl border shadow-xs hover:shadow-card transition flex flex-col justify-between ${r.cardBg}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{r.iconEmoji}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${r.pillColor}`}
                    >
                      {r.count} Active
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base font-heading">{r.title}</h3>
                  <div className="text-3xl font-black font-heading mt-1 mb-2 leading-none">
                    {r.count}
                  </div>
                  <p className="text-xs font-semibold text-[var(--muted)] leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedRoleModal(r)}
                  className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 ${r.btnColor}`}
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. MIDDLE WORKSPACE: QUICK SETTINGS + RECENT ACTIVITY + SECURITY */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 items-start">
        {/* Left Column: Quick Settings Panel */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              Quick Settings
            </h3>
            {isSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          <div className="divide-y divide-[var(--border)]">
            {/* Toggle 1: AI Assistant */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Enable AI Assistant</div>
                  <div className="text-[10px] text-[var(--muted)]">Hinglish &amp; NLP Booking parser</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={quickSettings.aiAssistant}
                aria-label="Toggle AI Assistant"
                onClick={() => handleToggle("aiAssistant")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  quickSettings.aiAssistant ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    quickSettings.aiAssistant ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Schedule Changes */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Allow Schedule Changes</div>
                  <div className="text-[10px] text-[var(--muted)]">Permit Rescheduling Studio proposals</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={quickSettings.scheduleChanges}
                aria-label="Toggle Schedule Changes"
                onClick={() => handleToggle("scheduleChanges")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  quickSettings.scheduleChanges ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    quickSettings.scheduleChanges ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Send Notifications */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Send Notifications</div>
                  <div className="text-[10px] text-[var(--muted)]">Alert faculty on room changes</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={quickSettings.notifications}
                aria-label="Toggle Notifications"
                onClick={() => handleToggle("notifications")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  quickSettings.notifications ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    quickSettings.notifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle 4: Auto Conflict Check */}
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Auto Conflict Check</div>
                  <div className="text-[10px] text-[var(--muted)]">Run H1–H14 checks on every change</div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={quickSettings.autoConflictCheck}
                aria-label="Toggle Auto Conflict Check"
                onClick={() => handleToggle("autoConflictCheck")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  quickSettings.autoConflictCheck ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    quickSettings.autoConflictCheck ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Theme Preference Segmented Control */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-bold">Theme Preference</span>
            <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-full border border-[var(--border)]">
              <button
                onClick={() => {
                  setThemePreference("light");
                  if (isDark && toggleTheme) toggleTheme();
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                  !isDark ? "bg-blue-600 text-white shadow-xs" : "text-[var(--muted)]"
                }`}
              >
                <Sun className="w-3 h-3 text-amber-400" /> Light
              </button>
              <button
                onClick={() => {
                  setThemePreference("dark");
                  if (!isDark && toggleTheme) toggleTheme();
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition ${
                  isDark ? "bg-blue-600 text-white shadow-xs" : "text-[var(--muted)]"
                }`}
              >
                <Moon className="w-3 h-3 text-cyan-300" /> Dark
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Save Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Column: Recent Activity & Security Banner */}
        <div className="space-y-4">
          {/* Recent Activity Card */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
                Recent Activity
              </h3>
              <button
                onClick={() => alert("All 14 audit log transactions recorded in system.")}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {recentActivity.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${act.iconBg}`}
                    >
                      {act.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{act.title}</div>
                      <div className="text-[10px] text-[var(--muted)] truncate">{act.sub}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--muted)] shrink-0">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* "Your Data is Secure!" Enterprise Banner matching screenshot */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs leading-tight">Your data is secure!</h4>
                <p className="text-[10px] text-blue-200 mt-0.5">
                  Powered by enterprise-grade role-based access control.
                </p>
              </div>
            </div>
            <span className="text-emerald-400 font-bold text-lg">✓</span>
          </div>
        </div>
      </div>

      {/* 4. USER MANAGEMENT TABLE (EXPANDED FOOTER PREVIEW) */}
      <section className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider font-heading">
              User Management
            </h3>
          </div>
          <button
            onClick={() => alert("Showing all 40 faculty and active student coordinators.")}
            className="text-[11px] font-bold text-blue-600 hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--brand-50)] dark:bg-slate-800 text-[var(--muted)] font-bold border-b border-[var(--border)]">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {usersList.map((u, i) => (
                <tr key={i} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/20">
                  <td className="p-3">
                    <div className="font-extrabold text-[var(--ink)]">{u.name}</div>
                    <div className="text-[10px] text-[var(--muted)]">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${u.roleBadge}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-[var(--muted)]">{u.department}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--muted)]">{u.lastLogin}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Editing permissions for ${u.name}...`)}
                      aria-label={`Edit ${u.name}`}
                      className="p-1 rounded-md hover:bg-[var(--bg)] text-[var(--muted)]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. ROLE PERMISSION MODAL */}
      {selectedRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{selectedRoleModal.iconEmoji}</span>
                <div>
                  <h4 className="text-base font-extrabold font-heading text-[var(--ink)]">
                    {selectedRoleModal.title} Permissions
                  </h4>
                  <p className="text-xs text-[var(--muted)]">{selectedRoleModal.sub}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoleModal(null)}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg)]"
              >
                <X className="w-4 h-4 text-[var(--muted)]" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Authoritative Scope
              </span>
              <div className="space-y-1.5">
                {selectedRoleModal.permissions.map((p: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedRoleModal(null)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}