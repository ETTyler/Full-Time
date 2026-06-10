"use client";

import { useEffect, useState } from "react";

export function InviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/join/${code}`);
  }, [code]);

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
      {copied ? "Copied" : "Copy invite link"}
    </button>
  );
}
