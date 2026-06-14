"use client";

import { type ReactNode, useEffect, useState } from "react";
import { CheckIcon, LinkIcon, ShareIcon } from "@/components/icons";

function CopyLinkButton({
  path,
  label,
  icon,
  share,
}: {
  path: string;
  label: string;
  icon: ReactNode;
  // When set, prefer the native share sheet (iOS/Android) before copying.
  share?: { title?: string; text?: string };
}) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClick = async () => {
    // On devices with the Web Share API (iPhone, Android, some desktops),
    // open the OS share sheet. Otherwise fall back to copying the link.
    if (share && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ ...share, url });
        return;
      } catch (err) {
        // The user dismissed the sheet — don't also copy behind their back.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Any other failure: fall through to the copy fallback.
      }
    }
    await copy();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={copied ? "Copied" : label}
      className="btn-ghost inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:px-3"
      title={url}
    >
      {copied ? <CheckIcon className="h-4 w-4 text-accent" /> : icon}
      <span className="hidden sm:inline">{copied ? "Copied" : label}</span>
    </button>
  );
}

export function InviteLink({ code }: { code: string }) {
  return (
    <CopyLinkButton
      path={`/join/${code}`}
      label="Copy invite link"
      icon={<LinkIcon className="h-4 w-4" />}
      share={{
        title: "Join my league",
        text: "Join my World Cup sweepstake league",
      }}
    />
  );
}

/** Copies the public, read-only standings link — share with non-members. */
export function ShareStandingsLink({ code }: { code: string }) {
  return (
    <CopyLinkButton
      path={`/standings/${code}`}
      label="Share standings"
      icon={<ShareIcon className="h-4 w-4" />}
      share={{
        title: "League standings",
        text: "Follow the standings for our World Cup sweepstake",
      }}
    />
  );
}
