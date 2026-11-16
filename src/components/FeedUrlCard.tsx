"use client";

import { useState, memo } from "react";
import { Rss, Copy, Check, ExternalLink, Mail, Loader2 } from "lucide-react";
import { TMDBPersonSearchResult, AlertTimingWindow } from "@/types/tmdb";
import { useSubscription } from "@/hooks/useSubscription";
import EmailAlertModal from "./EmailAlertModal";

interface FeedUrlCardProps {
  feedUrl: string;
  feedProtocolUrl?: string;
  person?: TMDBPersonSearchResult | null;
  alert?: AlertTimingWindow;
  country?: string;
  roles?: string[];
  types?: string[];
  excludeShorts?: boolean;
  excludeReReleases?: boolean;
  excludeUncredited?: boolean;
}

const ALERT_LABELS: Record<AlertTimingWindow, string> = {
  announced: "When Announced",
  when_released: "When Released",
  month_before: "Month Before",
  week_before: "Week Before",
};

const FeedUrlCard = memo(function FeedUrlCard({
  feedUrl,
  feedProtocolUrl,
  person,
  alert = "announced",
  country = "US",
  roles,
  types,
  excludeShorts,
  excludeReReleases,
  excludeUncredited,
}: FeedUrlCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isQuickSubscribing, setIsQuickSubscribing] = useState(false);
  const [isUpdatingAlert, setIsUpdatingAlert] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState(false);

  const {
    isAuthenticated,
    isFollowing,
    getArtistSub,
    followArtist,
    unfollowArtist,
    updateArtistAlert,
  } = useSubscription();

  const following = person ? isFollowing(person.id) : false;
  const existingSub = person ? getArtistSub(person.id) : undefined;
  const activeAlertLabel = existingSub
    ? ALERT_LABELS[existingSub.alert] || existingSub.alert
    : ALERT_LABELS[alert] || alert;

  const resolvedFeedProtocol =
    feedProtocolUrl || (feedUrl ? feedUrl.replace(/^https?:\/\//, "feed://") : "");

  const handleCopy = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for restricted clipboard contexts
      try {
        const textarea = document.createElement("textarea");
        textarea.value = feedUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {}
    }
  };

  const handleQuickFollow = async () => {
    if (!person) return;
    if (!isAuthenticated) {
      setIsEmailModalOpen(true);
      return;
    }

    setIsQuickSubscribing(true);
    try {
      await followArtist(
        { id: person.id, name: person.name, profile_path: person.profile_path },
        alert,
        country,
        {
          roles,
          types,
          excludeShorts,
          excludeReReleases,
          excludeUncredited,
        }
      );
    } finally {
      setIsQuickSubscribing(false);
    }
  };

  const handleUpdateAlertToCurrent = async () => {
    if (!person) return;
    setIsUpdatingAlert(true);
    try {
      await updateArtistAlert(person.id, alert);
    } finally {
      setIsUpdatingAlert(false);
    }
  };

  const handleUnfollowArtist = async () => {
    if (!person) return;
    setIsUnfollowing(true);
    try {
      await unfollowArtist(person.id);
    } finally {
      setIsUnfollowing(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-3">
      {/* Top Section: RSS Feed URL */}
      <div className="space-y-2">
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
            aria-label="Generated RSS Feed URL"
            onFocus={(e) => e.currentTarget.select()}
            placeholder="RSS Feed URL"
            className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 transition-colors"
          />
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Feed URL copied to clipboard" : "Copy RSS Feed URL"}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
            <span className="sr-only" aria-live="polite">
              {copied ? "Feed URL copied to clipboard" : ""}
            </span>
          </button>
          <a
            href={resolvedFeedProtocol || "#"}
            aria-label="Open directly in default RSS Reader application"
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
            title="Open in RSS Reader"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Bottom Section: Email Feed Integration */}
      {person && (
        <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            {following ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Email alerts active</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {activeAlertLabel}
                </span>
              </span>
            ) : (
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Email Feed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {following ? (
              <>
                {existingSub && existingSub.alert !== alert && (
                  <button
                    type="button"
                    onClick={handleUpdateAlertToCurrent}
                    disabled={isUpdatingAlert}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isUpdatingAlert ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      `Update to ${ALERT_LABELS[alert]}`
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUnfollowArtist}
                  disabled={isUnfollowing}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 text-neutral-600 dark:text-neutral-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isUnfollowing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Unfollow"
                  )}
                </button>
              </>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleQuickFollow}
                disabled={isQuickSubscribing}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isQuickSubscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Follow via Email</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Get Email Alerts</span>
              </button>
            )}
          </div>

          <EmailAlertModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            person={person}
            currentAlert={alert}
            currentCountry={country}
            roles={roles}
            types={types}
            excludeShorts={excludeShorts}
            excludeReReleases={excludeReReleases}
            excludeUncredited={excludeUncredited}
          />
        </div>
      )}
    </div>
  );
});

export default FeedUrlCard;
