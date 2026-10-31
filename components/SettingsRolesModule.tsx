"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  Crown,
  ShieldCheck,
  Shield,
  CalendarDays,
  GraduationCap,
  Trophy,
  Users,
  ArrowRight,
  Pencil,
  MoreHorizontal,
  UserPlus,
  History,
  X,
  Upload,
  Download,
  Database,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface SettingsRolesModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
  toggleTheme?: () => void;
}

type RoleId = "admin" | "coordinator" | "faculty" | "club";

interface UserRow {
  name: string;
  email: string;
  role: RoleId;
  dept: string;
  status: "Active" | "Inactive";
  last: string;
  hue: string;
}

const ROLE_LABEL: Record<RoleId, string> = {
  admin: "Admin",
  coordinator: "Coordinator",
  faculty: "Faculty",
  club: "Club Rep",
};

/** Pill colours for the role badge in the table (light / dark friendly). */
const ROLE_PILL: Record<RoleId, string> = {
  admin: "bg-[#DCEAFF] text-[#1B5FD8] dark:bg-[#12306B] dark:text-[#8DB8FF]",
  coordinator: "bg-[#E8DCFF] text-[#6D31D6] dark:bg-[#34207A] dark:text-[#C4A6FF]",
  faculty: "bg-[#CFF3DF] text-[#0E7A4A] dark:bg-[#0E5A3E] dark:text-[#5BE3A4]",
  club: "bg-[#FFE0BF] text-[#C2570C] dark:bg-[#7A4310] dark:text-[#FFC27A]",
};

const INITIAL_USERS: UserRow[] = [
  { name: "Priya Sharma", email: "priya@cit.edu", role: "faculty", dept: "Computer Science", status: "Active", last: "2 min ago", hue: "from-[#F59E8B] to-[#C2410C]" },
  { name: "Rahul Verma", email: "rahul@cit.edu", role: "coordinator", dept: "Information Tech", status: "Active", last: "12 min ago", hue: "from-[#8FB4F5] to-[#1D4ED8]" },
  { name: "Sneha Patel", email: "sneha@cit.edu", role: "club", dept: "Cultural Club", status: "Active", last: "1 hour ago", hue: "from-[#F4B6C8] to-[#BE185D]" },
  { name: "Amit Behera", email: "amit@cit.edu", role: "faculty", dept: "Electronics & Comm.", status: "Active", last: "3 hours ago", hue: "from-[#86D9B5] to-[#047857]" },
  { name: "Neha Gupta", email: "neha@cit.edu", role: "coordinator", dept: "Mechanical", status: "Inactive", last: "2 days ago", hue: "from-[#C7B2F7] to-[#6D28D9]" },
  { name: "Karan Mehta", email: "karan@cit.edu", role: "club", dept: "Tech Club", status: "Active", last: "Yesterday", hue: "from-[#FCD38A] to-[#B45309]" },
  { name: "Dean's Office", email: "dean@cit.edu", role: "admin", dept: "Administration", status: "Active", last: "Just now", hue: "from-[#7FB0FF] to-[#0B3A9E]" },
];

const ROLE_CARDS: {
  id: RoleId;
  title: string;
  desc: string;
  members: number;
  gradient: string;
  glow: string;
  Icon: LucideIcon;
  Art: LucideIcon;
  artClass: string;
}[] = [
  {
    id: "admin",
    title: "Admin",
    desc: "Full system access & management control",
    members: 12,
    gradient: "linear-gradient(135deg,#1F6BFF 0%,#2C86FF 55%,#53A3FF 100%)",
    glow: "rgba(47,123,255,.55)",
    Icon: Crown,
    Art: ShieldCheck,
    artClass: "text-white/35",
  },
  {
    id: "coordinator",
    title: "Coordinator",
    desc: "Manage departments, events & schedules",
    members: 28,
    gradient: "linear-gradient(135deg,#6E2BE0 0%,#8A47F0 55%,#A878F7 100%)",
    glow: "rgba(139,69,255,.55)",
    Icon: Users,
    Art: CalendarDays,
    artClass: "text-white/30",
  },
  {
    id: "faculty",
    title: "Faculty",
    desc: "Access classes, exams & academic tools",
    members: 124,
    gradient: "linear-gradient(135deg,#0F9F6E 0%,#19B883 55%,#4DD1A5 100%)",
    glow: "rgba(16,185,129,.5)",
    Icon: GraduationCap,
    Art: GraduationCap,
    artClass: "text-[#062B33]/45",
  },
  {
    id: "club",
    title: "Club Representative",
    desc: "Manage club events & activities",
    members: 36,
    gradient: "linear-gradient(135deg,#E8600A 0%,#F5801C 55%,#FBA24A 100%)",
    glow: "rgba(249,115,22,.5)",
    Icon: Users,
    Art: Trophy,
    artClass: "text-[#FFD166]/90",
  },
];

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
function Hero({ isDark, onManage }: { isDark: boolean; onManage: () => void }) {
  return (
    <section
      className="relative overflow-hidden rounded-[22px] text-white min-h-[200px] md:min-h-[150px] lg:min-h-[168px] flex items-start md:items-center"
      style={{
        background: isDark
          ? "linear-gradient(100deg,#030B1F 0%,#07153A 45%,#0B1F58 100%)"
          : "linear-gradient(100deg,#0A2570 0%,#123C9C 38%,#2160CF 64%,#4B93EE 100%)",
        boxShadow: isDark
          ? "0 0 0 1px rgba(56,130,255,.55), 0 14px 40px rgba(0,60,200,.28)"
          : "0 14px 40px rgba(18,58,130,.28)",
      }}
    >
      <div
        className="hero-img absolute bottom-0 right-0 h-[44%] w-full md:h-full md:w-[66%] bg-cover bg-[position:72%_100%] md:bg-[position:center_62%]"
        style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
        role="img"
        aria-label="CIT campus"
      />

      <div className="relative z-10 flex items-start gap-4 sm:gap-5 px-5 pt-5 pb-4 sm:px-8 md:py-0 max-w-[560px]">
        <span
          className="hidden md:flex shrink-0 w-[62px] h-[62px] rounded-full items-center justify-center"
          style={{
            border: "2px solid rgba(120,190,255,.9)",
            boxShadow: "0 0 22px rgba(70,160,255,.55), inset 0 0 14px rgba(70,160,255,.35)",
            background: "rgba(10,40,120,.35)",
          }}
        >
          <SettingsIcon className="w-8 h-8 text-[#9FD0FF]" strokeWidth={1.8} />
        </span>
        <div>
          <span className="md:hidden mb-2 inline-flex w-10 h-10 rounded-full items-center justify-center border-2 border-sky-300/80 bg-blue-900/30">
            <SettingsIcon className="w-5 h-5 text-sky-200" strokeWidth={1.9} />
          </span>
          <h1 className="font-heading font-extrabold tracking-tight text-[24px] sm:text-[30px] leading-[1.12]">
            Settings &amp; <br className="md:hidden" />
            Role Management
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-[14px] font-medium text-white/90 leading-snug">
            Manage roles, permissions and preferences.
            <span className="hidden md:inline">
              <br />
              Build a smarter, more organized campus experience.
            </span>
          </p>
          <button
            onClick={onManage}
            className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-full text-[13px] font-bold text-white border border-sky-300/70 bg-[#0B2A78]/80 hover:bg-[#12389A] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            style={{ boxShadow: "0 0 16px rgba(80,160,255,.45)" }}
          >
            Manage Access <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-[58%] -rotate-6 text-right z-10 pointer-events-none">
        <div className="font-serif-heading italic font-semibold text-[27px] leading-[1.05] text-white [text-shadow:0_2px_10px_rgba(0,15,70,.95),0_0_2px_rgba(0,15,70,.8)]">
          Your Campus.
          <br />
          Your Control.
        </div>
        <svg viewBox="0 0 150 10" className="ml-auto mt-1 w-36 h-2.5" aria-hidden="true">
          <path d="M3 7C40 2 100 2 147 5" stroke="#F5B731" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Status sparkline                                                    */
/* ------------------------------------------------------------------ */
function StatusChart() {
  const line = "M0 44 C14 40 22 42 34 34 S54 30 66 32 S86 18 100 22 S122 8 140 12 S160 4 170 2";
  return (
    <svg viewBox="0 0 170 50" preserveAspectRatio="none" className="w-full h-[54px]" aria-hidden="true">
      <defs>
        <linearGradient id="status-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#10B981" stopOpacity=".28" />
          <stop offset="1" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L170 50 L0 50 Z`} fill="url(#status-fill)" />
      <path d={line} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Add-user modal                                                      */
/* ------------------------------------------------------------------ */
function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: UserRow) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("faculty");
  const [dept, setDept] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const field =
    "w-full h-11 px-3.5 rounded-xl border bg-[var(--bg)] text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Add new user">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <form
        className="relative w-full max-w-md rounded-3xl border bg-[var(--surface)] p-6 space-y-4"
        style={{ borderColor: "var(--border)", boxShadow: "0 24px 60px rgba(10,30,90,.35)" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !email.trim()) return;
          onAdd({
            name: name.trim(),
            email: email.trim(),
            role,
            dept: dept.trim() || "—",
            status: "Active",
            last: "Never",
            hue: "from-[#8FB4F5] to-[#1D4ED8]",
          });
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-lg">Add New User</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-[var(--muted)] hover:text-[var(--ink)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input ref={ref} className={field} style={{ borderColor: "var(--border)" }} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
        <input className={field} style={{ borderColor: "var(--border)" }} type="email" placeholder="Email (name@cit.edu)" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <div className="grid grid-cols-2 gap-3">
          <select className={field} style={{ borderColor: "var(--border)" }} value={role} onChange={(e) => setRole(e.target.value as RoleId)} aria-label="Role">
            {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
          <input className={field} style={{ borderColor: "var(--border)" }} placeholder="Department" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department" />
        </div>
        <button
          type="submit"
          className="w-full h-11 rounded-full text-white font-bold text-sm"
          style={{ background: "linear-gradient(110deg,#155BFF,#087EFF)", boxShadow: "0 8px 18px rgba(21,91,255,.32)" }}
        >
          Add User
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */
export default function SettingsRolesModule({
  onNavigateTab,
  isDark = false,
}: SettingsRolesModuleProps) {
  const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS);
  const [showAll, setShowAll] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleId | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const [updated, setUpdated] = useState("Oct 27, 2026 • 09:45 AM");
  const rolesRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLElement>(null);
  const datasetInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);

  const handleUploadDataset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDataset(true);
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/cit/dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset: json }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load custom dataset.");
      }
      setToast(data.message || "Custom dataset loaded & schedule generated!");
    } catch (err: any) {
      setToast(err.message || "Failed to load dataset.");
    } finally {
      setUploadingDataset(false);
      if (datasetInputRef.current) datasetInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const d = new Date();
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setUpdated(`${date} • ${time}`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    const base: Record<RoleId, number> = { admin: 12, coordinator: 28, faculty: 124, club: 36 };
    users.slice(INITIAL_USERS.length).forEach((u) => (base[u.role] += 1));
    return base;
  }, [users]);

  const visible = useMemo(() => {
    const list = roleFilter ? users.filter((u) => u.role === roleFilter) : users;
    return showAll || roleFilter ? list : list.slice(0, 3);
  }, [users, showAll, roleFilter]);

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const quick = [
    { label: "Add New User", icon: UserPlus, run: () => setAdding(true) },
    { label: "Manage Roles", icon: Shield, run: () => scrollTo(rolesRef.current) },
    { label: "View Activity Log", icon: History, run: () => setToast("Activity log: 4 privileged changes in the last 24 hours.") },
    { label: "System Settings", icon: SettingsIcon, run: () => setToast("System settings are managed by the Dean's Office.") },
  ];

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)" : "var(--shadow-card)",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Hero isDark={isDark} onManage={() => scrollTo(rolesRef.current)} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_272px] gap-5 sm:gap-6 items-start">
        {/* ---------------- Left column ---------------- */}
        <div className="space-y-5 sm:space-y-6 min-w-0">
          {/* Our Roles */}
          <section ref={rolesRef} aria-labelledby="roles-h" className="scroll-mt-4">
            <div className="flex items-center justify-between mb-3.5">
              <h2 id="roles-h" className="font-heading font-extrabold text-[21px]">Our Roles</h2>
              <button
                onClick={() => setRoleFilter(null)}
                className="md:hidden text-[13px] font-bold text-blue-600 dark:text-sky-400 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </button>
              {roleFilter && (
                <button
                  onClick={() => setRoleFilter(null)}
                  className="hidden md:inline-flex text-[12.5px] font-bold text-blue-600 dark:text-sky-400 items-center gap-1"
                >
                  Clear filter: {ROLE_LABEL[roleFilter]} <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {ROLE_CARDS.map((r) => {
                const active = roleFilter === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRoleFilter(active ? null : r.id);
                      scrollTo(tableRef.current);
                    }}
                    aria-pressed={active}
                    className="group relative overflow-hidden rounded-[18px] text-left text-white p-4 sm:p-[18px] min-h-[96px] lg:min-h-[148px] transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                    style={{
                      background: r.gradient,
                      boxShadow: active
                        ? `0 0 0 3px ${isDark ? "#fff" : "#102A63"}33, 0 14px 30px ${r.glow}`
                        : isDark
                        ? `0 0 0 1px ${r.glow}, 0 10px 26px ${r.glow.replace(/[\d.]+\)$/, ".28)")}`
                        : `0 10px 24px ${r.glow.replace(/[\d.]+\)$/, ".32)")}`,
                    }}
                  >
                    <r.Art
                      className={`absolute -right-2 -top-1 w-[92px] h-[92px] lg:w-[70px] lg:h-[70px] ${r.artClass}`}
                      strokeWidth={1.4}
                    />
                    <div className="relative z-10 flex lg:block items-center gap-3.5">
                      <span className="lg:hidden w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                        <r.Icon className="w-6 h-6" strokeWidth={2} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 font-heading font-extrabold text-[17px] leading-tight">
                          <r.Icon className="hidden lg:block w-[22px] h-[22px] text-white/95" strokeWidth={2.1} />
                          <span className="lg:hidden">{r.title}</span>
                        </div>
                        <div className="hidden lg:block font-heading font-extrabold text-[16px] leading-tight mt-1 whitespace-nowrap">
                          {r.title}
                        </div>
                        <p className="mt-1 lg:mt-1.5 text-[12px] leading-snug font-medium text-white/90 max-w-[150px]">
                          {r.desc}
                        </p>
                        <div className="mt-2 lg:mt-4 text-[13px] font-bold">{counts[r.id]} Members</div>
                      </div>
                    </div>
                    <span className="absolute right-3.5 bottom-3.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:translate-x-0.5 transition">
                      <ArrowRight className="w-4 h-4" style={{ color: "#1D4ED8" }} strokeWidth={2.6} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* User Management */}
          <section ref={tableRef} className={`${panel} p-4 sm:p-5 scroll-mt-4`} style={panelStyle} aria-labelledby="um-h">
            <div className="flex items-center justify-between mb-3">
              <h2 id="um-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[17px]">
                <Users className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.2} />
                User Management
              </h2>
              <button
                onClick={() => {
                  setRoleFilter(null);
                  setShowAll((s) => !s);
                }}
                className="text-[13px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1.5"
              >
                {showAll ? "Show Less" : "View All"} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
              </button>
            </div>

            <div role="table" aria-label="Users" className="text-[13px]">
              <div
                role="row"
                className="hidden sm:grid grid-cols-[1.5fr_1fr_1.25fr_.8fr_.9fr_.7fr] items-center gap-3 px-2 py-2.5 text-[12px] font-bold border-b"
                style={{ borderColor: "var(--border)" }}
              >
                {["Name", "Role", "Department", "Status", "Last Login", "Actions"].map((h) => (
                  <span key={h} role="columnheader" className={h === "Actions" ? "text-center" : ""}>{h}</span>
                ))}
              </div>

              {visible.map((u) => (
                <div
                  key={u.email}
                  role="row"
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.5fr_1fr_1.25fr_.8fr_.9fr_.7fr] items-center gap-x-3 gap-y-1 px-2 py-3 border-b last:border-b-0 rounded-lg hover:bg-[var(--row-hover)] transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div role="cell" className="flex items-center gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${u.hue} text-white font-extrabold text-[13px] flex items-center justify-center shrink-0 ring-2 ring-white/70 dark:ring-white/10`}>
                      {u.name[0]}
                    </span>
                    <div className="min-w-0 leading-tight">
                      <div className="font-bold truncate">{u.name}</div>
                      <div className="text-[11px] text-[var(--muted)] font-medium truncate">{u.email}</div>
                    </div>
                  </div>
                  <div role="cell" className="sm:order-none order-last col-span-2 sm:col-span-1 flex sm:block items-center gap-2 text-[12px] mt-1.5 sm:mt-0 pl-12 sm:pl-0">
                    <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold ${ROLE_PILL[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                    <span className="sm:hidden inline-flex items-center gap-1.5 font-medium text-[var(--muted)]">
                      · {u.dept}
                    </span>
                  </div>
                  <div role="cell" className="hidden sm:block font-medium truncate">{u.dept}</div>
                  <div role="cell" className="flex items-center gap-1.5 font-medium justify-self-end sm:justify-self-start row-start-1 col-start-2 sm:row-auto sm:col-auto">
                    <span className={`w-2 h-2 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                    <span>{u.status}</span>
                  </div>
                  <div role="cell" className="hidden sm:block font-medium text-[var(--ink)]/85">{u.last}</div>
                  <div role="cell" className="hidden sm:flex items-center justify-center gap-3">
                    <button aria-label={`Edit ${u.name}`} onClick={() => setToast(`Editing ${u.name} — review permissions before confirming.`)} className="text-blue-600 dark:text-sky-400 hover:scale-110 transition">
                      <Pencil className="w-4 h-4" strokeWidth={2.2} />
                    </button>
                    <button aria-label={`More actions for ${u.name}`} onClick={() => setToast(`More actions for ${u.name}`)} className="text-[var(--muted)] hover:text-[var(--ink)] transition">
                      <MoreHorizontal className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
              ))}
              {visible.length === 0 && (
                <p className="py-6 text-center text-[var(--muted)] font-medium">No users in this role yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* ---------------- Right column ---------------- */}
        <aside className="space-y-5 sm:space-y-6 min-w-0 xl:pt-[40px]">
          {/* Dataset Management & Exports */}
          <section className={`${panel} p-5 space-y-3.5`} style={panelStyle} aria-label="Dataset management">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-extrabold text-[15px] flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                Dataset &amp; Exports
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                0 Hard Clashes
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--muted)] leading-relaxed">
              Load custom competition datasets or download verified JSON schedules for official Python validator scoring.
            </p>

            <div className="space-y-2">
              <input
                ref={datasetInputRef}
                type="file"
                accept=".json"
                onChange={handleUploadDataset}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => datasetInputRef.current?.click()}
                disabled={uploadingDataset}
                className="w-full py-2.5 px-3 rounded-xl border border-blue-500/30 text-blue-600 dark:text-sky-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingDataset ? "Loading Dataset..." : "Load Custom Dataset (.json)"}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href="/api/export"
                  download="schedule.json"
                  className="py-2 px-2.5 rounded-xl border border-[var(--border)] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[var(--row-hover)] text-[var(--ink)] transition"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>schedule.json</span>
                </a>
                <a
                  href="/api/export?type=validation"
                  download="validation_report.json"
                  className="py-2 px-2.5 rounded-xl border border-[var(--border)] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[var(--row-hover)] text-[var(--ink)] transition"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Audit Report</span>
                </a>
              </div>
            </div>
          </section>

          {/* System Status */}
          <section className={`${panel} p-5`} style={panelStyle} aria-label="System status">
            <h2 className="font-heading font-extrabold text-[16px]">System Status</h2>
            <div className="mt-3 flex items-center gap-2 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.8)]" />
              All Systems Online
            </div>
            <div className="mt-3 text-[12px] font-bold">Last Updated</div>
            <div className="text-[11.5px] text-[var(--muted)] font-medium">{updated}</div>
            <div className="mt-2">
              <StatusChart />
            </div>
          </section>

          {/* Quick Actions */}
          <section className={`${panel} p-5`} style={panelStyle} aria-label="Quick actions">
            <h2 className="font-heading font-extrabold text-[16px] mb-3">Quick Actions</h2>
            <div className="space-y-2.5">
              {quick.map((q) => (
                <button
                  key={q.label}
                  onClick={q.run}
                  className="w-full h-11 px-4 rounded-full border flex items-center gap-3 text-[13px] font-bold transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  style={{
                    background: "var(--search-bg)",
                    borderColor: "var(--search-border)",
                    boxShadow: "0 3px 10px rgba(25,55,115,.06)",
                  }}
                >
                  <q.icon className="w-[18px] h-[18px] text-blue-600 dark:text-sky-400" strokeWidth={2.1} />
                  {q.label}
                </button>
              ))}
            </div>
          </section>

          {/* Promo (visible in dark theme, as in the reference) */}
          {isDark && (
            <section
              className="relative overflow-hidden rounded-[20px] p-5 text-white"
              style={{
                background: "linear-gradient(135deg,#0B2B86 0%,#1B3FC4 60%,#3B3FE0 100%)",
                boxShadow: "0 0 0 1px rgba(80,150,255,.5), 0 12px 30px rgba(0,60,200,.3)",
              }}
            >
              <Trophy className="absolute right-3 top-3 w-[72px] h-[72px] text-[#FFC94D]" strokeWidth={1.3} fill="rgba(255,201,77,.25)" />
              <div className="relative font-serif-heading font-semibold text-[22px] leading-[1.1]">
                Manage.
                <br />
                Organize.
                <br />
                Inspire.
              </div>
              <p className="relative mt-2 text-[11.5px] text-white/85 max-w-[130px] leading-snug">
                Empower your campus community with MIRAGE.
              </p>
              <button
                onClick={() => onNavigateTab?.("dashboard")}
                className="relative mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12.5px] font-bold border border-sky-300/70 bg-[#0A2A8A]/70 hover:bg-[#12389A] transition"
              >
                Explore Features <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </section>
          )}
        </aside>
      </div>

      {adding && (
        <AddUserModal
          onClose={() => setAdding(false)}
          onAdd={(u) => {
            setUsers((prev) => [...prev, u]);
            setShowAll(true);
            setAdding(false);
            setToast(`${u.name} added as ${ROLE_LABEL[u.role]}.`);
          }}
        />
      )}

      <div
        role="status"
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[70] px-5 py-3 rounded-full text-[13px] font-bold text-white bg-[#102A63] shadow-xl transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}
