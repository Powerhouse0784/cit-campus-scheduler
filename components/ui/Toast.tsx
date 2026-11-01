"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastApi {
  show: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

const STYLE: Record<ToastType, { ring: string; icon: React.ReactNode }> = {
  success: { ring: "border-emerald-300 dark:border-emerald-700", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
  error: { ring: "border-red-300 dark:border-red-800", icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
  info: { ring: "border-blue-300 dark:border-blue-800", icon: <Info className="w-5 h-5 text-blue-500" /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "info", title, description, duration = 4200 }: ToastInput) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed z-[120] bottom-24 md:bottom-6 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:w-[360px] pointer-events-none"
        aria-live="polite"
        role="status"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[var(--surface)] p-3.5 shadow-2xl ${STYLE[t.type].ring}`}
            >
              <span className="mt-0.5 shrink-0">{STYLE[t.type].icon}</span>
              <div className="min-w-0 flex-1 leading-snug">
                <div className="text-[13.5px] font-extrabold">{t.title}</div>
                {t.description && <div className="mt-0.5 text-[12.5px] text-[var(--muted)] font-medium">{t.description}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
