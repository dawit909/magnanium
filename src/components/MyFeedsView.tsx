"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Trash2,
  Check,
  Mail,
  Loader2,
  User,
  ChevronRight,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTimingWindow, TMDBPersonSearchResult } from "@/types/tmdb";
import { SubscribedArtist } from "@/lib/subscriptions";
import {
  extractFeedOptions,
  isDefaultFeedOptions,
  DEFAULT_FEED_OPTIONS,
  DIGEST_FREQUENCIES,
} from "@/lib/feed-options";
import { formatSubscribedDate } from "@/lib/date";
import { getTmdbImageUrl } from "@/lib/media";
import { createPersonSlug } from "@/lib/slug";
import FeedFilters from "./FeedFilters";

interface FollowedPersonItemProps {
  artist: SubscribedArtist;
  onUnfollow: (personId: number) => void;
  onUpdateOptions: (personId: number, options: Partial<SubscribedArtist>) => void;
}

function FollowedPersonItem({
  artist,
  onUnfollow,
  onUpdateOptions,
}: FollowedPersonItemProps) {
  const options = extractFeedOptions(artist);
  const currentRoles = options.roles;
  const currentTypes = options.types;
  const currentCountry = options.country;
  const currentAlert = options.alert;
  const currentExcludeShorts = options.excludeShorts;
  const currentExcludeReReleases = options.excludeReReleases;
  const currentExcludeUncredited = options.excludeUncredited;

  const isCustomized = useMemo(() => {
    return !isDefaultFeedOptions(artist);
  }, [artist]);

  const handleToggleRole = useCallback(
    (roleId: string) => {
      const nextRoles = currentRoles.includes(roleId)
        ? currentRoles.filter((r) => r !== roleId)
        : [...currentRoles, roleId];
      onUpdateOptions(artist.personId, { roles: nextRoles });
    },
    [currentRoles, artist.personId, onUpdateOptions]
  );

  const handleToggleType = useCallback(
    (typeId: string) => {
      let nextTypes: string[];
      if (typeId === "earliest") {
        nextTypes = currentTypes.includes("earliest") ? [] : ["earliest"];
      } else if (currentTypes.includes("earliest")) {
        nextTypes = [typeId];
      } else {
        nextTypes = currentTypes.includes(typeId)
          ? currentTypes.filter((x) => x !== typeId)
          : [...currentTypes, typeId];
      }
      onUpdateOptions(artist.personId, { types: nextTypes });
    },
    [currentTypes, artist.personId, onUpdateOptions]
  );

  const handleSetAlert = useCallback(
    (newAlert: AlertTimingWindow) => {
      onUpdateOptions(artist.personId, { alert: newAlert });
    },
    [artist.personId, onUpdateOptions]
  );

  const handleSetCountry = useCallback(
    (newCountry: string) => {
      onUpdateOptions(artist.personId, { country: newCountry });
    },
    [artist.personId, onUpdateOptions]
  );

  const handleSetExcludeShorts = useCallback(
    (exclude: boolean) => {
      onUpdateOptions(artist.personId, { excludeShorts: exclude });
    },
    [artist.personId, onUpdateOptions]
  );

  const handleSetExcludeReReleases = useCallback(
    (exclude: boolean) => {
      onUpdateOptions(artist.personId, { excludeReReleases: exclude });
    },
    [artist.personId, onUpdateOptions]
  );

  const handleSetExcludeUncredited = useCallback(
    (exclude: boolean) => {
      onUpdateOptions(artist.personId, { excludeUncredited: exclude });
    },
    [artist.personId, onUpdateOptions]
  );

  const handleResetOptions = useCallback(() => {
    onUpdateOptions(artist.personId, { ...DEFAULT_FEED_OPTIONS });
  }, [artist.personId, onUpdateOptions]);

  const slug = createPersonSlug(artist.personId, artist.personName);

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-2.5 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* Person Header Row */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${slug}`}
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity no-underline group"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-400 border border-neutral-200 dark:border-neutral-800">
            {artist.profilePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getTmdbImageUrl(artist.profilePath, "w180_and_h180_face") || ""}
                alt={artist.personName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1.5">
              <span>{artist.personName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Following since {formatSubscribedDate(artist.subscribedAt)}
            </div>
            {/* Frequency Selector */}
            <div className="flex items-center gap-1.5 pt-1.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
                Digest:
              </span>
              <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-800/80 p-0.5 text-[10px]">
                {DIGEST_FREQUENCIES.map((freq) => {
                  const isSelected = (artist.frequency || "instant") === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onUpdateOptions(artist.personId, { frequency: freq.value });
                      }}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      {freq.label.replace(" Digest", "")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onUnfollow(artist.personId)}
            title="Unfollow"
            aria-label={`Unfollow ${artist.personName}`}
            className="h-7 w-7 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Options UI - exactly matching the person's page, folded by default */}
      <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80">
        <FeedFilters
          roles={currentRoles}
          onToggleRole={handleToggleRole}
          types={currentTypes}
          onToggleType={handleToggleType}
          alert={currentAlert}
          onSetAlert={handleSetAlert}
          country={currentCountry}
          onSetCountry={handleSetCountry}
          excludeShorts={currentExcludeShorts}
          onSetExcludeShorts={handleSetExcludeShorts}
          excludeReReleases={currentExcludeReReleases}
          onSetExcludeReReleases={handleSetExcludeReReleases}
          excludeUncredited={currentExcludeUncredited}
          onSetExcludeUncredited={handleSetExcludeUncredited}
          isCustomized={isCustomized}
          onResetOptions={handleResetOptions}
          defaultExpanded={false}
          saveExpandedState={false}
        />
      </div>
    </div>
  );
}

interface MyFeedsViewProps {
  onSelectArtist?: (artist: TMDBPersonSearchResult) => void;
}

export default function MyFeedsView({ onSelectArtist }: MyFeedsViewProps) {
  const {
    isAuthenticated,
    userEmail,
    artists,
    isLoading,
    unfollowArtist,
    updateArtistOptions,
    sendMagicLink,
  } = useSubscription();

  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const artistList = Object.values(artists).sort((a, b) =>
    a.personName.localeCompare(b.personName)
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await sendMagicLink(emailInput.trim());
      setSuccessMessage(
        res.simulated
          ? `[Dev Mode] Verification link logged to server console for ${emailInput}.`
          : `We sent a verification link to ${emailInput}. Check your inbox!`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send verification link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 py-12 flex flex-col items-center justify-center gap-2.5 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Loading your feeds...</span>
      </div>
    );
  }

  // Not signed in
  if (!isAuthenticated) {
    return (
      <div className="mt-6 max-w-md mx-auto p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4 animate-in fade-in duration-200">
        <div className="text-center space-y-1.5">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            My Feeds
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Sign in to view, customize, and manage all your followed artist alerts in one place.
          </p>
        </div>

        {successMessage ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-sm">
              <Check className="w-4 h-4 text-emerald-500" />
              Check Your Email
            </div>
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Verification Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Signed in
  return (
    <div className="mt-4 sm:mt-6 space-y-3 animate-in fade-in duration-200">
      {/* Top Banner & Profile bar - compact row */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            My Feeds
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {artistList.length} {artistList.length === 1 ? "artist" : "artists"}
          </span>
        </div>

        {userEmail && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono truncate">
            {userEmail}
          </p>
        )}
      </div>

      {/* Artists List */}
      {artistList.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center space-y-2">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            No feeds followed yet
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Search for an actor, director, or writer in the search bar above to follow their releases.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {artistList.map((artist) => (
            <FollowedPersonItem
              key={artist.personId}
              artist={artist}
              onUnfollow={unfollowArtist}
              onUpdateOptions={updateArtistOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
