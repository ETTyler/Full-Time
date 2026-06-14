"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { CheckIcon, LinkIcon, ShareIcon } from "@/components/icons";

/**
 * A labelled button that opens a small panel showing a link with two clear
 * actions: copy it directly, or share it via the native share sheet (shown
 * only where supported). Used for both league invites and public standings.
 */
function SharePanel({
  path,
  triggerLabel,
  triggerIcon,
  panelLabel,
  shareTitle,
  shareText,
}: {
  path: string;
  triggerLabel: string;
  triggerIcon: ReactNode;
  panelLabel: string;
  shareTitle: string;
  shareText: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, [path]);

  // Close on outside click or Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    try {
      await navigator.share({ title: shareTitle, text: shareText, url });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await copy();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-72 p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
            {panelLabel}
          </p>
          <div
            className="mt-2 truncate rounded-md border border-line bg-card-2 px-2 py-1.5 text-xs text-muted"
            title={url}
          >
            {url || "…"}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={copy}
              className="btn-ghost inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-accent" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy link"}
            </button>
            {canShare && (
              <button
                onClick={share}
                className="btn-primary inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <ShareIcon className="h-4 w-4" />
                Share
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Invite-link control for an open league. */
export function InviteLink({ code }: { code: string }) {
  return (
    <SharePanel
      path={`/join/${code}`}
      triggerLabel="Invite link"
      triggerIcon={<LinkIcon className="h-4 w-4" />}
      panelLabel="Invite link"
      shareTitle="Join my league"
      shareText="Join my World Cup sweepstake league"
    />
  );
}

/** Public, read-only standings link — share with non-members. */
export function ShareStandingsLink({ code }: { code: string }) {
  return (
    <SharePanel
      path={`/standings/${code}`}
      triggerLabel="Share standings"
      triggerIcon={<ShareIcon className="h-4 w-4" />}
      panelLabel="Standings link"
      shareTitle="League standings"
      shareText="Follow the standings for our World Cup sweepstake"
    />
  );
}
