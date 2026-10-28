"use client";

import { useState } from "react";
import { Rss, Copy, Check, ExternalLink } from "lucide-react";

interface FeedUrlCardProps {
  feedUrl: string;
}

export default function FeedUrlCard({ feedUrl }: FeedUrlCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-2.5">
      <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
          <Rss className="w-3.5 h-3.5 text-amber-500" />
          RSS Feed URL
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={feedUrl}
          className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 select-all focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={feedUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
          title="Open RSS Feed XML"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
