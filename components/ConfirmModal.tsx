"use client";

import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-blue-600" />;
    }
  };

  const getButtonBg = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 id="modal-title" className="font-heading font-extrabold text-base text-[var(--ink)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--row-hover)] transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${getButtonBg()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}