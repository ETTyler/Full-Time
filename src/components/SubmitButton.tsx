"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for server-action forms: disables itself and shows a
 * pending label while the action runs, so it can't be double-clicked.
 */
export function SubmitButton({
  children,
  pendingLabel = "Working…",
  className = "btn-primary px-4 py-2",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button disabled={disabled || pending} className={className}>
      {pending ? (
        <>
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
