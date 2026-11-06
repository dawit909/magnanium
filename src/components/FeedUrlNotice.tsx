"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
import { safeLocalStorage } from "@/lib/storage";

export const NOTICE_DISMISSED_KEY = STORAGE_KEYS.NOTICE_DISMISSED;

export default function FeedUrlNotice() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = safeLocalStorage.getItem(NOTICE_DISMISSED_KEY);
    if (dismissed !== "true") {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    safeLocalStorage.setItem(NOTICE_DISMISSED_KEY, "true");
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
            Magnanium now tracks upcoming and catalog titles on a unified, high-speed feed. If
            you subscribed to an older <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px]">/feed/...</code> URL,
            please copy and replace it in your RSS reader below to ensure continued updates.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
