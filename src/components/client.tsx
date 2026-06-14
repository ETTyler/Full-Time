"use client";

import { useEffect, useState } from "react";

function CopyLinkButton({ path, label }: { path: string; label: string }) {
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
      className="btn-ghost px-3 py-1.5 text-xs"
      title={url}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function InviteLink({ code }: { code: string }) {
  return <CopyLinkButton path={`/join/${code}`} label="Copy invite link" />;
}

/** Copies the public, read-only standings link — share with non-members. */
export function ShareStandingsLink({ code }: { code: string }) {
  return (
    <CopyLinkButton path={`/standings/${code}`} label="Share standings" />
  );
}
