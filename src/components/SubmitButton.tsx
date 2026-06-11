"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/Spinner";

/**
 * Submit button for server-action forms: disables itself and shows a
 * spinner + pending label while the action runs, so it can't be
 * double-clicked and the click is visibly acknowledged.
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
          <Spinner />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
