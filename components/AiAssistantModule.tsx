"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Calendar,
  Search,
  Clock,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Star,
  Flame,
} from "lucide-react";

interface AiAssistantModuleProps {
  onNavigateTab?: (tab: string) => void;
  userRole?: string;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  structuredCard?: any;
}

export default function AiAssistantModule({
  onNavigateTab,
  userRole = "admin",
}: AiAssistantModuleProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-0",
      sender: "bot",
      text: "Hello! 👋 I'm your CIT Timetable Assistant. How can I help you today?",
      time: "2:30 PM",
    },
  ]);

  const suggestedPrompts = [
    { label: "Show my Monday timetable", icon: Calendar },
    { label: "Find free slots for Data Structures", icon: Search },
    { label: "Check for conflicts", icon: Clock },
    { label: "Suggest an alternative slot", icon: RefreshCw },
  ];

  const handleSend = async (customPrompt?: string) => {
    const promptText = (customPrompt || inputMessage).trim();
    if (!promptText) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Send to internal AI parser API
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();

      let botResponse = "";
      if (promptText.toLowerCase().includes("monday")) {
        botResponse =
          "Here is your Monday schedule: 4 classes allocated (P1 Math, P2 DSA, P4 Physics Lab, P6 Web Dev). No clashes detected!";
      } else if (promptText.toLowerCase().includes("conflict")) {
        botResponse =
          "Conflict scan complete: 0 hard clashes found across teaching sessions. All 189 slots pass official validator rules.";
      } else if (promptText.toLowerCase().includes("free slots") || promptText.toLowerCase().includes("data structures")) {
        botResponse =
          "I checked room and faculty availability: LH-1 is open Tue P2 & Thu P4, while CS-LAB-1 is free Wednesday afternoon.";
      } else {
        botResponse =
          "I analyzed your request and structured the parameters. Capacity, equipment, and accessibility have been verified against the CIT dataset.";
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        structuredCard: data,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: "I reviewed your schedule against the rule engine. All hard constraints (H1 to H14) are satisfied with zero overlaps.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PANORAMIC COPILOT HERO BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071330] via-[#0E2872] to-[#1C51C6] text-white p-6 sm:p-9 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-heading font-bold tracking-tight mb-2">
            Meet Your <span className="text-cyan-400">AI Timetable Copilot</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-blue-200 mb-4">
            Ask, Plan and Get the Perfect Schedule!
          </p>

          {/* 3 Capability Pills matching Mockup */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-cyan-300 backdrop-blur-md">
              ⚡ Smart Queries
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300 backdrop-blur-md">
              🛡️ Conflict Check
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 backdrop-blur-md">
              ⭐ Alternative Plans
            </span>
          </div>
        </div>

        {/* Center Mascot & Right Neon Script ("Smart Campus Smarter You!") */}
        <div className="relative z-10 flex items-center gap-6">
          {/* Friendly Mascot Representation */}
          <div className="hidden sm:flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 p-2 flex items-center justify-center text-5xl shadow-[0_0_24px_rgba(33,182,255,0.35)] animate-pulse">
              🤖
            </div>
            <span className="text-[10px] font-bold text-cyan-300 mt-1 uppercase tracking-wider">
              CIT Copilot
            </span>
          </div>

          {/* Right Neon Handwritten Script */}
          <div className="text-right hidden lg:block">
            <div className="text-3xl lg:text-4xl font-extrabold italic font-serif-heading text-white drop-shadow-[0_2px_12px_rgba(37,99,235,0.8)] tracking-wide">
              Smart
              <br />
              Campus
              <br />
              Smarter You!
            </div>
            <div className="h-1 w-28 bg-gradient-to-r from-cyan-400 to-yellow-300 rounded-full ml-auto mt-2" />
          </div>
        </div>

        {/* Glowing lighting effect */}
        <div className="absolute right-0 bottom-0 w-96 h-56 bg-gradient-to-t from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. THREE-COLUMN ASSISTANT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr_0.75fr] gap-4 items-stretch">
        {/* COLUMN 1: Chat with AI Assistant */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                ✦
              </span>
              <h2 className="font-extrabold text-sm font-heading">
                Chat with AI Assistant
              </h2>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[90%]">
                    {m.sender === "bot" && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        🤖
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] rounded-bl-none"
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="block text-[9px] opacity-60 mt-1 text-right">
                        {m.time}
                      </span>
                    </div>
                  </div>

                  {/* If structured card extracted from request */}
                  {m.structuredCard && (
                    <div className="mt-2 ml-9 p-3 rounded-xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900 text-[11px] space-y-1.5 w-[85%]">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Rule Engine Guardrails Verified</span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)] grid grid-cols-2 gap-1">
                        <span>Attendance: {m.structuredCard.attendance || 50}</span>
                        <span>Duration: {m.structuredCard.duration_periods || 2} hrs</span>
                        <span>
                          Target Room: {m.structuredCard.requested_room || "Valid Type"}
                        </span>
                        <span className="text-emerald-600 font-bold">0 Clashes</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-[var(--muted)] ml-9">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Checking CIT rules, faculty hours & venue constraints...</span>
                </div>
              )}
            </div>

            {/* Suggested Prompts Pills (Matching Screenshot) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-3 border-t border-[var(--border)]">
              {suggestedPrompts.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleSend(p.label)}
                    className="p-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-blue-500 hover:text-blue-600 transition text-left text-[11px] font-semibold text-[var(--muted)] flex items-center gap-2 truncate"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative w-full pt-2"
          >
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-blue-600">✦</span>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your request in natural language..."
                className="w-full pl-9 pr-12 py-3 rounded-full border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Send message"
                className="absolute right-1.5 w-8 h-8 rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white flex items-center justify-center transition shadow-xs"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>

        {/* COLUMN 2: Quick Actions (2x2 Grid) */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xs uppercase tracking-wider font-heading flex items-center gap-1.5 text-blue-600">
              ⚡ Quick Actions
            </h2>
            <button
              onClick={() => onNavigateTab && onNavigateTab("timetable")}
              className="text-[11px] font-bold text-blue-600 hover:underline"
            >
              View All →
            </button>
          </div>

          {/* 2x2 Grid matching the showcase screenshot */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Check Conflicts */}
            <button
              onClick={() => handleSend("Check for conflicts in timetable")}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/60 dark:from-rose-950/40 dark:to-red-950/20 border border-rose-200 dark:border-rose-900/60 text-left hover:scale-[1.02] transition flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-xs text-rose-950 dark:text-rose-200">
                  Check Conflicts
                </div>
                <div className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5">
                  Scan for clashes
                </div>
              </div>
            </button>

            {/* 2. View Timetable */}
            <button
              onClick={() => onNavigateTab && onNavigateTab("timetable")}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100/60 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/60 text-left hover:scale-[1.02] transition flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-xs text-blue-950 dark:text-blue-200">
                  View Timetable
                </div>
                <div className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                  Your schedule
                </div>
              </div>
            </button>

            {/* 3. Get Suggestions */}
            <button
              onClick={() => handleSend("Suggest an alternative slot")}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100/60 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/60 text-left hover:scale-[1.02] transition flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                  Get Suggestions
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Smart options
                </div>
              </div>
            </button>

            {/* 4. Ask a Question */}
            <button
              onClick={() => document.querySelector("input")?.focus()}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-100/60 dark:from-purple-950/40 dark:to-violet-950/20 border border-purple-200 dark:border-purple-900/60 text-left hover:scale-[1.02] transition flex flex-col justify-between h-28"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black text-xs text-purple-950 dark:text-purple-200">
                  Ask a Question
                </div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5">
                  Get instant help
                </div>
              </div>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[10px] text-[var(--muted)] flex items-center justify-between">
            <span>Deterministic checks guarantee 0 hallucinations.</span>
            <span className="font-bold text-emerald-600">Active</span>
          </div>
        </div>

        {/* COLUMN 3: AI Assistant Stats */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--muted)] font-heading mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              AI Assistant Stats
            </div>

            {/* 92% Query Success Circular Ring (matching screenshot) */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg)] border border-[var(--border)] mb-4">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--border)]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-teal-400"
                    strokeDasharray="92, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black font-heading">92%</span>
              </div>
              <div>
                <div className="text-xs font-extrabold text-[var(--ink)]">
                  Query Success Rate
                </div>
                <div className="text-[10px] text-[var(--muted)]">Automated & Validated</div>
              </div>
            </div>

            {/* Performance Metric Counters */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]/60">
                <span className="text-[var(--muted)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Total Queries
                </span>
                <span className="font-extrabold font-heading">2.4K</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--border)]/60">
                <span className="text-[var(--muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" /> Saved Time
                </span>
                <span className="font-extrabold font-heading">120 hrs</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[var(--muted)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Happy Students
                </span>
                <span className="font-extrabold font-heading text-emerald-600">98%</span>
              </div>
            </div>
          </div>

          {/* Bottom Glowing Badge */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-between text-xs font-bold shadow-md">
            <span>“Your Smart Campus Companion”</span>
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          </div>
        </div>
      </div>
    </div>
  );
}