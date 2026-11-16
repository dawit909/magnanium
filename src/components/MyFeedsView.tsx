"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Trash2,
  Rss,
  Check,
  Mail,
  Loader2,
  User,
  Sparkles,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTimingWindow, TMDBPersonSearchResult } from "@/types/tmdb";
import { SubscribedArtist } from "@/lib/subscriptions";
import { DEFAULT_FEED_OPTIONS } from "@/lib/feed-options";
import { buildFeedUrls } from "@/lib/feed-params";
import { getTmdbImageUrl } from "@/lib/media";
import { createPersonSlug } from "@/lib/slug";
import FeedFilters from "./FeedFilters";

const SUGGESTED_ARTISTS: { id: number; name: string; department: string; profile_path: string }[] = [
  { id: 525, name: "Christopher Nolan", department: "Directing", profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg" },
  { id: 2604515, name: "Emma Myers", department: "Acting", profile_path: "/v1Y8RP39135ZOary9M4MbkrCAdn.jpg" },
  { id: 1190668, name: "Timothée Chalamet", department: "Acting", profile_path: "/dFxpwRpmzpVfP1zjluH68DeQhyj.jpg" },
  { id: 234352, name: "Margot Robbie", department: "Acting", profile_path: "/euDPyqLnuwaWMHajcU3oZ9uZezR.jpg" },
  { id: 138, name: "Quentin Tarantino", department: "Directing", profile_path: "/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg" },
  { id: 974169, name: "Jenna Ortega", department: "Acting", profile_path: "/cV4x7jNmsGLdKZn5I6xVF3Ltnmg.jpg" },
];

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
  const [copied, setCopied] = useState(false);

  // Fallbacks to default feed options if not customized
  const currentRoles = artist.roles || DEFAULT_FEED_OPTIONS.roles;
  const currentTypes = artist.types || DEFAULT_FEED_OPTIONS.types;
  const currentCountry = artist.country || DEFAULT_FEED_OPTIONS.country;
  const currentAlert = artist.alert || DEFAULT_FEED_OPTIONS.alert;
  const currentExcludeShorts =
    artist.excludeShorts !== undefined ? artist.excludeShorts : DEFAULT_FEED_OPTIONS.excludeShorts;
  const currentExcludeReReleases =
    artist.excludeReReleases !== undefined
      ? artist.excludeReReleases
      : DEFAULT_FEED_OPTIONS.excludeReReleases;
  const currentExcludeUncredited =
    artist.excludeUncredited !== undefined
      ? artist.excludeUncredited
      : DEFAULT_FEED_OPTIONS.excludeUncredited;

  const isCustomized = useMemo(() => {
    const rolesMatch =
      currentRoles.length === DEFAULT_FEED_OPTIONS.roles.length &&
      currentRoles.every((r) => DEFAULT_FEED_OPTIONS.roles.includes(r));
    const typesMatch =
      currentTypes.length === DEFAULT_FEED_OPTIONS.types.length &&
      currentTypes.every((t) => DEFAULT_FEED_OPTIONS.types.includes(t));
    const countryMatch = currentCountry === DEFAULT_FEED_OPTIONS.country;
    const alertMatch = currentAlert === DEFAULT_FEED_OPTIONS.alert;
    const shortsMatch = currentExcludeShorts === DEFAULT_FEED_OPTIONS.excludeShorts;
    const reReleasesMatch = currentExcludeReReleases === DEFAULT_FEED_OPTIONS.excludeReReleases;
    const uncreditedMatch = currentExcludeUncredited === DEFAULT_FEED_OPTIONS.excludeUncredited;

    return !(
      rolesMatch &&
      typesMatch &&
      countryMatch &&
      alertMatch &&
      shortsMatch &&
      reReleasesMatch &&
      uncreditedMatch
    );
  }, [
    currentRoles,
    currentTypes,
    currentCountry,
    currentAlert,
    currentExcludeShorts,
    currentExcludeReReleases,
    currentExcludeUncredited,
  ]);

  const handleToggleRole = useCallback(
    (roleId: string) => {
      const nextRoles = currentRoles.includes(roleId)
        ? currentRoles.filter((r) => r !== roleId)
        : [...currentRoles, roleId];
      if (nextRoles.length === 0) return;
      onUpdateOptions(artist.personId, { roles: nextRoles });
    },
    [currentRoles, artist.personId, onUpdateOptions]
  );

  const handleToggleType = useCallback(
    (typeId: string) => {
      const nextTypes = currentTypes.includes(typeId)
        ? currentTypes.filter((t) => t !== typeId)
        : [...currentTypes, typeId];
      if (nextTypes.length === 0) return;
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
    onUpdateOptions(artist.personId, {
      roles: DEFAULT_FEED_OPTIONS.roles,
      types: DEFAULT_FEED_OPTIONS.types,
      country: DEFAULT_FEED_OPTIONS.country,
      alert: DEFAULT_FEED_OPTIONS.alert,
      excludeShorts: DEFAULT_FEED_OPTIONS.excludeShorts,
      excludeReReleases: DEFAULT_FEED_OPTIONS.excludeReReleases,
      excludeUncredited: DEFAULT_FEED_OPTIONS.excludeUncredited,
    });
  }, [artist.personId, onUpdateOptions]);

  // Construct canonical feed URL reflecting this person's custom options
  const { feedUrl } = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return buildFeedUrls({
      origin,
      personId: artist.personId,
      options: {
        roles: currentRoles,
        types: currentTypes,
        country: currentCountry,
        alert: currentAlert,
        excludeShorts: currentExcludeShorts,
        excludeReReleases: currentExcludeReReleases,
        excludeUncredited: currentExcludeUncredited,
      },
    });
  }, [
    artist.personId,
    currentRoles,
    currentTypes,
    currentCountry,
    currentAlert,
    currentExcludeShorts,
    currentExcludeReReleases,
    currentExcludeUncredited,
  ]);

  const handleCopyFeed = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const slug = createPersonSlug(artist.personId, artist.personName);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* Person Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/${slug}`}
          className="flex items-center gap-3.5 min-w-0 flex-1 hover:opacity-85 transition-opacity no-underline group"
        >
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-400 border border-neutral-200 dark:border-neutral-800">
            {artist.profilePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getTmdbImageUrl(artist.profilePath, "w180_and_h180_face") || ""}
                alt={artist.personName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1.5">
              <span>{artist.personName}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              Following since{" "}
              {new Date(artist.subscribedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </Link>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyFeed}
            title={copied ? "Feed URL Copied!" : "Copy RSS Feed URL"}
            aria-label={`Copy RSS feed for ${artist.personName}`}
            className={`h-8 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              copied
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                : "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Rss className="w-3.5 h-3.5 text-amber-500" />
                <span>Copy Feed</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onUnfollow(artist.personId)}
            title="Unfollow"
            aria-label={`Unfollow ${artist.personName}`}
            className="h-8 w-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Options UI - exactly matching the person's page, folded by default */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
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
    logout,
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
      <div className="mt-12 py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Loading your feeds...</span>
      </div>
    );
  }

  // Not signed in
  if (!isAuthenticated) {
    return (
      <div className="mt-8 max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 animate-in fade-in duration-200">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            My Feeds
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Sign in to view, customize, and manage all your followed artist alerts in one place.
          </p>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-sm">
              <Check className="w-4 h-4 text-emerald-500" />
              Check Your Email
            </div>
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div className="relative">
              <div className="absolute left-3.5 inset-y-0 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 dark:text-red-400">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
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
    <div className="mt-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Profile bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                My Feeds
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {artistList.length} {artistList.length === 1 ? "artist" : "artists"}
              </span>
            </div>
            {userEmail && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                {userEmail}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Artists List */}
      {artistList.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No feeds followed yet
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Search for an actor, director, or writer in the search bar above, or click on a popular suggestion below to follow their releases.
            </p>
          </div>

          {/* Popular Artist Suggestions */}
          <div className="pt-2">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500 mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Popular Artists</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SUGGESTED_ARTISTS.map((suggested) => {
                const slug = createPersonSlug(suggested.id, suggested.name);
                return (
                  <Link
                    key={suggested.id}
                    href={`/${slug}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors no-underline"
                  >
                    <span>{suggested.name}</span>
                    <ChevronRight className="w-3 h-3 text-neutral-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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
