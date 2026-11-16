"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const email = "apps.hydrant673@passinbox.com";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = email;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  return (
    <footer className="py-8 text-center text-[11px] text-neutral-400 dark:text-neutral-500 space-y-1.5">
      <p className="flex items-center justify-center gap-1 flex-wrap">
        <span>If you have a feedback, send to</span>
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Copied to clipboard!" : "Click to copy email address"}
          aria-label={copied ? "Email copied to clipboard" : "Copy feedback email address"}
          className="group inline-flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80"
        >
          <span className="underline underline-offset-2">{email}</span>
          {copied ? (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 animate-in fade-in duration-150">
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Copied!</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors opacity-70 group-hover:opacity-100">
              <Copy className="w-3 h-3" />
            </span>
          )}
        </button>
      </p>
      <p className="text-[10px] text-neutral-400/80 dark:text-neutral-600">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </footer>
  );
}
