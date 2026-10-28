"use client";

import { useState } from "react";
import { Rss, Calendar, Copy, Check, ExternalLink, Download, CalendarPlus } from "lucide-react";

interface FeedUrlCardProps {
  feedUrl: string;
  calUrl: string;
  webcalUrl: string;
  googleCalUrl: string;
}

export default function FeedUrlCard({
  feedUrl,
  calUrl,
  webcalUrl,
  googleCalUrl,
}: FeedUrlCardProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "rss">("calendar");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const isRssCopied = copiedUrl === feedUrl;
  const isCalCopied = copiedUrl === webcalUrl;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-3.5">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "calendar"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Live Calendar
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              New
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rss")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "rss"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Rss className="w-3.5 h-3.5 text-amber-500" />
            RSS Feed
          </button>
        </div>

        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
          {activeTab === "calendar" ? "Auto-syncs to calendar apps" : "Standard RSS 2.0 XML"}
        </span>
      </div>

      {activeTab === "calendar" ? (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {/* Quick-action 1-click buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={webcalUrl || "#"}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm text-center"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Apple / Default Calendar</span>
            </a>

            <a
              href={googleCalUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Google Calendar</span>
            </a>

            <a
              href={calUrl || "#"}
              download
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors text-center"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Download .ics</span>
            </a>
          </div>

          {/* Copyable Webcal link */}
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={webcalUrl}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Webcal subscription URL"
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
            <button
              onClick={() => handleCopy(webcalUrl)}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isCalCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {isCalCopied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Subscribes to all-day events on release day with a 9:00 AM alarm notification. Compatible with Apple Calendar, Google Calendar, Outlook, and Thunderbird.
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={feedUrl}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="RSS Feed URL"
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
            <button
              onClick={() => handleCopy(feedUrl)}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isRssCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {isRssCopied ? "Copied" : "Copy"}
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

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Copy and paste into NetNewsWire, Feedly, Inoreader, NewsBlur, or any RSS reader.
          </p>
        </div>
      )}
    </div>
  );
}
