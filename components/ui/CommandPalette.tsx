"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search, type LucideIcon } from "lucide-react";

export interface PaletteItem {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  hint?: string;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: PaletteItem[];
}

/** Ctrl/Cmd + K launcher: jump to any screen or run a common action. */
export default function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.group} ${it.keywords || ""}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, query]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    if (el && "scrollIntoView" in el) (el as HTMLElement).scrollIntoView({ block: "nearest" });
  }, [index, filtered]);

  const choose = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[index]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-start justify-center px-4 pt-[14vh] bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-[560px] overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-2xl"
            style={{ borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 h-14 border-b" style={{ borderColor: "var(--border)" }}>
              <Search className="w-[18px] h-[18px] text-[var(--brand-700)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Jump to a screen or run an action…"
                aria-label="Search commands"
                className="flex-1 bg-transparent text-[14.5px] font-medium text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
              />
              <kbd className="hidden sm:inline text-[11px] font-bold text-[var(--muted)] border rounded-md px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="py-10 text-center text-[13px] font-semibold text-[var(--muted)]">Nothing matches “{query}”. Try “timetable”, “book” or “conflicts”.</p>
              )}
              {filtered.map((it, i) => {
                const Icon = it.icon;
                const showGroup = it.group !== lastGroup;
                lastGroup = it.group;
                const active = i === index;
                return (
                  <React.Fragment key={it.id}>
                    {showGroup && (
                      <div className="px-3 pt-2.5 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">{it.group}</div>
                    )}
                    <button
                      type="button"
                      data-active={active}
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => choose(it)}
                      className={`w-full flex items-center gap-3 px-3 h-11 rounded-xl text-left text-[13.5px] font-semibold ${
                        active ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "text-[var(--ink)]"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-[var(--brand-600)] text-white" : "bg-[var(--brand-50)] text-[var(--brand-700)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.hint && <span className="hidden sm:inline text-[11.5px] font-medium text-[var(--muted)]">{it.hint}</span>}
                      {active && <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-4 px-4 h-9 border-t text-[11px] font-semibold text-[var(--muted)]" style={{ borderColor: "var(--border)" }}>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span className="ml-auto">Tip: press Ctrl / ⌘ + K anywhere</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
