"use client";

import { type ReactNode, useEffect } from "react";

/**
 * A simple centered modal dialog with a dimmed backdrop. Closes on Escape
 * or backdrop click (suppress by passing a no-op onClose while busy).
 * Locks body scroll while open.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="card fade-up relative z-10 w-full max-w-sm p-5 text-left">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
