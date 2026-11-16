"use client";

import { useState, useMemo, memo } from "react";
import {
  Rss,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Loader2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { TMDBPersonSearchResult, AlertTimingWindow } from "@/types/tmdb";
import { useSubscription } from "@/hooks/useSubscription";
import { areFeedOptionsEqual } from "@/lib/feed-options";
import { useClipboard } from "@/hooks/useClipboard";
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
  const { copied, copy } = useClipboard({ timeoutMs: 1500 });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isQuickSubscribing, setIsQuickSubscribing] = useState(false);
  const [isUpdatingOptions, setIsUpdatingOptions] = useState(false);
  const [showRawUrl, setShowRawUrl] = useState(false);

  const {
    isAuthenticated,
    isFollowing,
    getArtistSub,
    followArtist,
    updateArtistOptions,
  } = useSubscription();

  const following = person ? isFollowing(person.id) : false;
  const existingSub = person ? getArtistSub(person.id) : undefined;

  const frequencyTitle = useMemo(() => {
    const f = existingSub?.frequency || "instant";
    if (f === "weekly") return "Weekly";
    if (f === "monthly") return "Monthly";
    return "Instant";
  }, [existingSub?.frequency]);

  const hasOptionsChanged = useMemo(() => {
    if (!existingSub) return false;
    return !areFeedOptionsEqual(existingSub, {
      roles,
      types,
      country,
      alert,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    });
  }, [
    existingSub,
    roles,
    types,
    country,
    alert,
    excludeShorts,
    excludeReReleases,
    excludeUncredited,
  ]);

  const resolvedFeedProtocol =
    feedProtocolUrl || (feedUrl ? feedUrl.replace(/^https?:\/\//, "feed://") : "");

  const handleCopy = () => {
    if (feedUrl) {
      copy(feedUrl);
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

  const handleUpdateEmailFeed = async () => {
    if (!person) return;
    setIsUpdatingOptions(true);
    try {
      await updateArtistOptions(person.id, {
        alert,
        country,
        roles,
        types,
        excludeShorts,
        excludeReReleases,
        excludeUncredited,
      });
    } finally {
      setIsUpdatingOptions(false);
    }
  };

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition-all space-y-2.5">
      {/* Sleek Two-Button Action Bar */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        {/* Left Action: RSS Feed */}
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Feed URL copied to clipboard" : "Copy RSS Feed URL"}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Feed URL</span>
              </>
            ) : (
              <>
                <Rss className="w-3.5 h-3.5 text-amber-500" />
                <span>Copy RSS Feed</span>
              </>
            )}
          </button>

          <a
            href={resolvedFeedProtocol || "#"}
            aria-label="Open directly in default RSS Reader application"
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
            title="Open in default RSS Reader (NetNewsWire, Feedly, Reeder)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setShowRawUrl((prev) => !prev)}
            className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 px-1 py-1 transition-colors cursor-pointer select-none"
            title={showRawUrl ? "Hide raw feed URL" : "View raw feed URL"}
          >
            {showRawUrl ? "Hide URL" : "Show URL"}
          </button>
        </div>

        {/* Right Action: Follow via Email */}
        {person && (
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
            {following ? (
              <>
                {hasOptionsChanged && (
                  <button
                    type="button"
                    onClick={handleUpdateEmailFeed}
                    disabled={isUpdatingOptions}
                    className="px-2.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sync options to your email feed"
                  >
                    {isUpdatingOptions ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync options</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title={`Following: ${frequencyTitle} (click to adjust options or unfollow)`}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Following: {frequencyTitle}</span>
                  <ChevronDown className="w-3 h-3 text-emerald-600/70 dark:text-emerald-400/70" />
                </button>
              </>
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={handleQuickFollow}
                disabled={isQuickSubscribing}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isQuickSubscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Follow</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional Raw URL drawer for power users */}
      {showRawUrl && (
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in duration-150">
          <input
            type="text"
            readOnly
            value={feedUrl}
            aria-label="Generated RSS Feed URL"
            onFocus={(e) => e.currentTarget.select()}
            className="w-full px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          />
        </div>
      )}

      {/* Email Alert Management Modal */}
      {person && (
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
      )}
    </div>
  );
});

export default FeedUrlCard;
