"use client";

import { type ReactNode, useEffect, useState } from "react";
import { CheckIcon, LinkIcon, ShareIcon } from "@/components/icons";

function CopyLinkButton({
  path,
  label,
  icon,
}: {
  path: string;
  label: string;
  icon: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
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
    />
  );
}
