"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Star,
  AlertTriangle,
  CalendarDays,
  Lightbulb,
  MessageCircle,
  ArrowRight,
  Send,
  Clock,
  FileText,
  BarChart3,
  Search,
  type LucideIcon,
} from "lucide-react";

interface AiAssistantModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
  isDark?: boolean;
}

interface Msg {
  id: number;
  from: "bot" | "user";
  text: string;
  items?: { title: string; meta: string; status?: "Validated" | "Needs review" }[];
  time: string;
}

const PROMPTS: { text: string; Icon: LucideIcon }[] = [
  { text: "Show my Monday timetable", Icon: CalendarDays },
  { text: "Find free slots for Data Structures", Icon: Search },
  { text: "Check for conflicts", Icon: ShieldCheck },
  { text: "Suggest an alternative slot", Icon: Sparkles },
];

const nowLabel = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function BotAvatar({ size = 40 }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 border-2 border-[#9CC0FF]"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#E8F0FF,#BFD3FA)" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" style={{ width: size * 0.7, height: size * 0.7 }}>
        <rect x="3" y="7" width="26" height="19" rx="9" fill="#0B1E52" />
        <circle cx="12" cy="16" r="2.6" fill="#35D6FF" />
        <circle cx="20" cy="16" r="2.6" fill="#35D6FF" />
        <path d="M13 21 Q16 23 19 21" stroke="#35D6FF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
function Hero({ isDark }: { isDark: boolean }) {
  const chips = [
    { label: "Smart Queries", Icon: Zap, tone: "#2F6BFF" },
    { label: "Conflict Check", Icon: ShieldCheck, tone: "#10B981" },
    { label: "Alternative Plans", Icon: Star, tone: "#F5B731" },
  ];
  return (
    <section
      className="relative overflow-hidden rounded-[22px] text-white min-h-[230px] md:min-h-[200px] lg:min-h-[208px] flex items-start md:items-center"
      style={{
        background: isDark
          ? "linear-gradient(100deg,#030B24 0%,#0A1A5C 45%,#1B2FA8 100%)"
          : "linear-gradient(100deg,#1236A8 0%,#2253D6 45%,#3C7CF2 100%)",
        boxShadow: isDark ? "0 0 0 1px rgba(56,130,255,.55), 0 14px 40px rgba(0,60,200,.3)" : "0 14px 40px rgba(18,58,130,.28)",
      }}
    >
      <div
        className="hero-img absolute bottom-0 right-0 h-[40%] w-full md:h-full md:w-[60%] bg-cover bg-[position:72%_100%] md:bg-[position:center_62%]"
        style={{ backgroundImage: `url(/images/hero-campus-${isDark ? "dark" : "light"}.jpg)` }}
        role="img"
        aria-label="CIT campus"
      />

      <div className="relative z-20 px-5 pt-5 pb-4 sm:px-8 md:py-0 max-w-full sm:max-w-[520px]">
        <h1 className="font-heading font-extrabold tracking-tight text-[22px] sm:text-[34px] leading-[1.08]">
          Meet Your
          <br />
          <span className="text-[#7FD3FF]">AI</span> Timetable Copilot
        </h1>
        <p className="mt-2 text-[13px] sm:text-[15px] font-semibold text-white/95">Ask, Plan and Get the Perfect Schedule!</p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 h-8 pl-1.5 pr-3 rounded-full text-[11.5px] sm:text-[12.5px] font-bold border border-white/30 bg-[#0A1F66]/60 backdrop-blur-sm"
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: c.tone }}>
                <c.Icon className="w-3 h-3 text-white" strokeWidth={2.6} />
              </span>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 -rotate-6 text-right z-20 pointer-events-none">
        <div className="font-serif-heading italic font-semibold text-[28px] leading-[1.02] [text-shadow:0_2px_10px_rgba(0,15,70,.95)]">
          Smart
          <br />
          Campus.
          <br />
          Smarter You!
        </div>
        <svg viewBox="0 0 150 10" className="ml-auto mt-1 w-32 h-2.5" aria-hidden="true">
          <path d="M3 7C40 2 100 2 147 5" stroke="#F5B731" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */
export default function AiAssistantModule({ isDark = false }: AiAssistantModuleProps) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, from: "bot", text: "Hello! I can help parse venue booking requests in English or Hinglish. I use Groq (llama3-8b-8192) when available, with a deterministic rule-based fallback. All parsed results are drafts — scheduling validity is always checked by application code, never by the LLM.", time: "" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMsgs((m) => m.map((x) => (x.id === 0 ? { ...x, time: nowLabel() } : x)));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const send = async (value: string) => {
    const q = value.trim();
    if (!q || thinking) return;
    setMsgs((m) => [...m, { id: idRef.current++, from: "user", text: q, time: nowLabel() }]);
    setInput("");
    setThinking(true);
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result?.error || "The request could not be processed.");

      setMsgs((m) => [
        ...m,
        {
          id: idRef.current++,
          from: "bot",
          time: nowLabel(),
          text: result.text || "Your request has been analyzed.",
          items: result.items || undefined,
        },
      ]);
    } catch (error) {
      setMsgs((m) => [
        ...m,
        {
          id: idRef.current++,
          from: "bot",
          time: nowLabel(),
          text: error instanceof Error ? error.message : "Unable to reach the assistant. Please try again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const panel = "rounded-[20px] border bg-[var(--surface)]";
  const panelStyle: React.CSSProperties = {
    borderColor: isDark ? "#1B4F9C" : "var(--border)",
    boxShadow: isDark ? "0 0 0 1px rgba(30,100,220,.18), 0 10px 30px rgba(0,60,200,.15)" : "var(--shadow-card)",
  };

  const actions: { label: string; sub: string; Icon: LucideIcon; cls: string; icon: string; run: () => void }[] = [
    { label: "Check Conflicts", sub: "Scan for clashes", Icon: AlertTriangle, cls: "qa-rose", icon: "text-red-500", run: () => send("Check my timetable for conflicts") },
    { label: "View Timetable", sub: "Your schedule", Icon: CalendarDays, cls: "qa-blue", icon: "text-blue-600 dark:text-blue-300", run: () => send("Show my Monday timetable") },
    { label: "Get Suggestions", sub: "Smart options", Icon: Lightbulb, cls: "qa-green", icon: "text-emerald-600 dark:text-emerald-300", run: () => send("Suggest an alternative slot") },
    { label: "Ask a Question", sub: "Get instant help", Icon: MessageCircle, cls: "qa-lilac", icon: "text-violet-600 dark:text-violet-300", run: () => inputRef.current?.focus() },
  ];

  const stats: { label: string; value: string; Icon: LucideIcon }[] = [
    { label: "LLM", value: "Groq llama3", Icon: FileText },
    { label: "Fallback", value: "Rule-based", Icon: Clock },
    { label: "Booking approval", value: "Manual review", Icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <Hero isDark={isDark} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_240px] gap-4 sm:gap-5 items-stretch">
        {/* Chat */}
        <section className={`${panel} p-4 sm:p-5 flex flex-col lg:col-span-1`} style={panelStyle} aria-labelledby="chat-h">
          <h2 id="chat-h" className="flex items-center gap-2.5 font-heading font-extrabold text-[17px] mb-3">
            <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-300" strokeWidth={2.4} />
            </span>
            Chat with AI Assistant
          </h2>

          <div ref={listRef} className="space-y-3 max-h-[290px] min-h-[96px] overflow-y-auto pr-1" role="log" aria-live="polite">
            {msgs.map((m) =>
              m.from === "bot" ? (
                <div key={m.id} className="flex items-start gap-3">
                  <BotAvatar />
                  <div className="rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%] text-[13.5px] font-medium leading-snug" style={{ background: "var(--search-bg)" }}>
                    {m.text}
                    {m.items && (
                      <ul className="mt-2.5 space-y-1.5">
                        {m.items.map((it) => (
                          <li key={it.title} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface)] border px-3 py-2" style={{ borderColor: "var(--border)" }}>
                            <div className="min-w-0">
                              <div className="font-bold text-[12.5px] truncate">{it.title}</div>
                              <div className="text-[11.5px] text-[var(--muted)]">{it.meta}</div>
                            </div>
                            {it.status && (
                              <span className={`shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${it.status === "Validated" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                                {it.status}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="text-right text-[10.5px] text-[var(--muted)] mt-1">{m.time}</div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%] text-[13.5px] font-semibold text-white" style={{ background: "linear-gradient(110deg,#155BFF,#2F7BF5)" }}>
                    {m.text}
                    <div className="text-right text-[10.5px] text-white/70 mt-0.5">{m.time}</div>
                  </div>
                </div>
              )
            )}
            {thinking && (
              <div className="flex items-center gap-3">
                <BotAvatar />
                <div className="rounded-2xl px-4 py-2.5 text-[12.5px] font-medium text-[var(--muted)]" style={{ background: "var(--search-bg)" }}>
                  Checking timetable rules…
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p.text}
                onClick={() => send(p.text)}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-[12.5px] font-semibold transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}
              >
                <p.Icon className="w-4 h-4 text-blue-600 dark:text-sky-400" strokeWidth={2.1} />
                {p.text}
              </button>
            ))}
          </div>

          <form
            className="mt-auto pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-center gap-2 h-12 pl-3 pr-1.5 rounded-full border" style={{ background: "var(--search-bg)", borderColor: "var(--search-border)" }}>
              <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Your timetable request"
                placeholder="Type your request in natural language…"
                className="flex-1 min-w-0 bg-transparent text-[13px] font-medium focus:outline-none placeholder:text-[var(--muted)]"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={thinking}
                className="w-9 h-9 rounded-full text-white flex items-center justify-center disabled:opacity-60"
                style={{ background: "linear-gradient(110deg,#155BFF,#2F7BF5)", boxShadow: "0 6px 14px rgba(21,91,255,.35)" }}
              >
                <Send className="w-4 h-4" strokeWidth={2.3} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)] font-medium">
              The assistant proposes changes; it never publishes them without your confirmation.
            </p>
          </form>
        </section>

        {/* Quick actions */}
        <section className={`${panel} p-4 sm:p-5 flex flex-col`} style={panelStyle} aria-labelledby="qa-h">
          <div className="flex items-center justify-between mb-3">
            <h2 id="qa-h" className="flex items-center gap-2 font-heading font-extrabold text-[17px]">
              <Zap className="w-5 h-5 text-blue-600 dark:text-sky-400" strokeWidth={2.4} />
              Quick Actions
            </h2>
            <span className="text-[12.5px] font-bold text-blue-600 dark:text-sky-400 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
            </span>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.run}
                className={`qa-tile ${a.cls} min-h-[112px] p-3.5 text-left flex flex-col justify-between`}
              >
                <a.Icon className={`w-7 h-7 ${a.icon}`} strokeWidth={2.2} />
                <span>
                  <span className="block font-heading font-extrabold text-[13.5px] leading-tight">{a.label}</span>
                  <span className="block mt-0.5 text-[11.5px] text-[var(--muted)] font-medium">{a.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className={`${panel} p-4 sm:p-5 flex flex-col lg:col-span-2 xl:col-span-1`} style={panelStyle} aria-labelledby="st-h">
          <h2 id="st-h" className="flex items-center gap-2 font-heading font-extrabold text-[15px] mb-3">
            <BarChart3 className="w-[18px] h-[18px] text-blue-600 dark:text-sky-400" strokeWidth={2.4} />
            AI Assistant Stats
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative w-[82px] h-[82px] shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label="Query success rate 92 percent">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={isDark ? "#22D3A5" : "#10B981"} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${0.92 * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-heading font-extrabold text-[20px]">92%</span>
            </div>
            <div className="text-[12.5px] font-semibold leading-tight">
              Query
              <br />
              Success Rate
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-[12.5px] font-medium">
            {stats.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5">
                <s.Icon className="w-4 h-4 text-blue-600 dark:text-sky-400" strokeWidth={2.1} />
                <span className="flex-1">{s.label}</span>
                <span className="font-extrabold">{s.value}</span>
              </li>
            ))}
          </ul>
          <div
            className="mt-4 rounded-xl px-3 py-2.5 text-center text-[12px] font-bold text-white relative"
            style={{ background: "linear-gradient(110deg,#5B3DF5,#2F6BFF)" }}
          >
            “Your Smart
            <br />
            Campus Companion”
            <Star className="absolute right-2 bottom-2 w-3.5 h-3.5 text-white/60" />
          </div>
        </section>
      </div>
    </div>
  );
}
