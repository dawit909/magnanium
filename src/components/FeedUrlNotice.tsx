"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

export const NOTICE_DISMISSED_KEY = "magnanium_feed_url_notice_dismissed";

export default function FeedUrlNotice() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(NOTICE_DISMISSED_KEY);
      if (dismissed !== "true") {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(NOTICE_DISMISSED_KEY, "true");
    } catch {}
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="relative p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/25 shadow-sm text-xs animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 pr-6 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Feed URLs Have Changed
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Update Required
            </span>
          </div>

          <p className="text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed">
            All RSS feed URLs have migrated from <code className="px-1 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">/api/feed/...</code> to clean <code className="px-1 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200 font-mono font-medium text-[11px]">/feed/...</code> endpoints. Legacy API URLs are no longer supported. Please update your existing subscriptions in your RSS reader.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notice"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
