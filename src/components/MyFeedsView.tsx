"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Trash2,
  Check,
  Mail,
  Loader2,
  User,
  SlidersHorizontal,
  Search,
  X,
  Plus,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTimingWindow, DigestFrequency, TMDBPersonSearchResult } from "@/types/tmdb";
import { SubscribedArtist } from "@/lib/subscriptions";
import {
  extractFeedOptions,
  isDefaultFeedOptions,
  DEFAULT_FEED_OPTIONS,
  DIGEST_FREQUENCIES,
  getSavedFeedOptions,
} from "@/lib/feed-options";
import { formatSubscribedDate } from "@/lib/date";
import { getTmdbImageUrl } from "@/lib/media";
import { createPersonSlug } from "@/lib/slug";
import { BoundedMap } from "@/lib/cache";
import FeedFilters from "./FeedFilters";

const addSearchCache = new BoundedMap<string, TMDBPersonSearchResult[]>(50);

const SUGGESTED_ARTISTS: TMDBPersonSearchResult[] = [
  {
    id: 525,
    name: "Christopher Nolan",
    original_name: "Christopher Nolan",
    known_for_department: "Directing",
    profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
    popularity: 7.3,
  },
  {
    id: 137427,
    name: "Denis Villeneuve",
    original_name: "Denis Villeneuve",
    known_for_department: "Directing",
    profile_path: "/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg",
    popularity: 4.0,
  },
  {
    id: 45400,
    name: "Greta Gerwig",
    original_name: "Greta Gerwig",
    known_for_department: "Directing",
    profile_path: "/dxKAhpkz4XNwmRzMG5QOpXjPZ1N.jpg",
    popularity: 2.4,
  },
  {
    id: 1190668,
    name: "Timothée Chalamet",
    original_name: "Timothée Chalamet",
    known_for_department: "Acting",
    profile_path: "/dFxpwRpmzpVfP1zjluH68DeQhyj.jpg",
    popularity: 9.5,
  },
  {
    id: 2037,
    name: "Cillian Murphy",
    original_name: "Cillian Murphy",
    known_for_department: "Acting",
    profile_path: "/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg",
    popularity: 5.9,
  },
  {
    id: 138,
    name: "Quentin Tarantino",
    original_name: "Quentin Tarantino",
    known_for_department: "Directing",
    profile_path: "/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg",
    popularity: 7.9,
  },
];

interface FollowedPersonItemProps {
  artist: SubscribedArtist;
  isEditing: boolean;
  onSelectForEdit: (personId: number) => void;
  onUnfollow: (personId: number) => void;
  onUpdateFrequency: (personId: number, freq: DigestFrequency) => void;
}

function FollowedPersonItem({
  artist,
  isEditing,
  onSelectForEdit,
  onUnfollow,
  onUpdateFrequency,
}: FollowedPersonItemProps) {
  const isCustomized = useMemo(() => {
    return !isDefaultFeedOptions(artist);
  }, [artist]);

  const slug = createPersonSlug(artist.personId, artist.personName);
  const subscribedDateLabel = artist.subscribedAt
    ? `Following since ${formatSubscribedDate(artist.subscribedAt)}`
    : "";

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-neutral-900 border transition-all flex flex-col justify-between ${
        isEditing
          ? "border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-500/[0.02] shadow-sm"
          : "border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <Link
          href={`/${slug}`}
          title={`${artist.personName} (${subscribedDateLabel})`}
          className="flex-shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:ring-2 group-hover:ring-amber-500/30 transition-all">
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
        </Link>

        {/* Content: Name + Frequency */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/${slug}`}
            className="block font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate hover:text-amber-600 dark:hover:text-amber-400 transition-colors no-underline"
            title={`${artist.personName} — ${subscribedDateLabel}`}
          >
            {artist.personName}
          </Link>

          <div className="flex items-center justify-between gap-1.5 mt-1">
            {/* Frequency 3-segment pill */}
            <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-0.5 text-[10px]">
              {DIGEST_FREQUENCIES.map((freq) => {
                const isSelected = (artist.frequency || "instant") === freq.value;
                return (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onUpdateFrequency(artist.personId, freq.value);
                    }}
                    className={`px-1.5 py-0.5 rounded-lg font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                    title={freq.description}
                  >
                    {freq.value === "instant" ? "Instant" : freq.value === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                );
              })}
            </div>

            {/* Actions: Options button + Unfollow */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onSelectForEdit(artist.personId)}
                title={
                  isEditing
                    ? "Options (click to close)"
                    : isCustomized
                    ? "Options (customized)"
                    : "Options"
                }
                aria-label={`Options for ${artist.personName}`}
                className={`h-6 px-2.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer relative ${
                  isEditing
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : isCustomized
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                    : "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Options</span>
              </button>

              <button
                type="button"
                onClick={() => onUnfollow(artist.personId)}
                title="Unfollow"
                aria-label={`Unfollow ${artist.personName}`}
                className="h-6 w-6 rounded-xl bg-neutral-100 hover:bg-red-50 dark:bg-neutral-800 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
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
    isFollowing,
    followArtist,
    unfollowArtist,
    updateArtistOptions,
    sendMagicLink,
  } = useSubscription();

  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search Bar for directly adding artists to email feeds
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<TMDBPersonSearchResult[]>([]);
  const [isAddSearching, setIsAddSearching] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeAddIndex, setActiveAddIndex] = useState(-1);
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  const addSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const addSearchInputRef = useRef<HTMLInputElement | null>(null);
  const editingSectionRef = useRef<HTMLElement | null>(null);

  // Debounced search for adding artists to email feed
  useEffect(() => {
    const trimmed = addQuery.trim();
    setActiveAddIndex(-1);

    if (trimmed.length < 2) {
      setAddResults([]);
      setIsAddSearching(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (addSearchCache.has(cacheKey)) {
      setAddResults(addSearchCache.get(cacheKey) || []);
      setIsAddSearching(false);
      return;
    }

    setIsAddSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const rawResults: TMDBPersonSearchResult[] = data.results || [];
        const uniqueResults = rawResults
          .filter((p, i, arr) => i === arr.findIndex((x) => x.id === p.id))
          .slice(0, 8);
        addSearchCache.set(cacheKey, uniqueResults);
        if (!controller.signal.aborted) {
          setAddResults(uniqueResults);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (err instanceof Error) {
          console.error("Search error:", err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsAddSearching(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addQuery]);

  // Click outside to close add search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        addSearchContainerRef.current &&
        !addSearchContainerRef.current.contains(e.target as Node)
      ) {
        setIsAddOpen(false);
        setActiveAddIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Escape key to dismiss add search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAddOpen) {
        setIsAddOpen(false);
        setActiveAddIndex(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddOpen]);

  // Direct add to email feeds handler
  const handleAddArtist = useCallback(
    async (person: TMDBPersonSearchResult) => {
      if (subscribingId === person.id) return;
      setSubscribingId(person.id);
      try {
        const defaults = getSavedFeedOptions();
        const ok = await followArtist(
          { id: person.id, name: person.name, profile_path: person.profile_path },
          defaults.alert,
          defaults.country,
          defaults
        );
        if (ok) {
          setJustAddedId(person.id);
          setTimeout(() => {
            setJustAddedId((prev) => (prev === person.id ? null : prev));
          }, 2500);
        }
      } finally {
        setSubscribingId(null);
      }
    },
    [followArtist, subscribingId]
  );

  const currentDisplayList = useMemo(() => {
    return addQuery.trim().length >= 2 ? addResults : SUGGESTED_ARTISTS;
  }, [addQuery, addResults]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isAddOpen) {
          setIsAddOpen(true);
          setActiveAddIndex(0);
        } else if (currentDisplayList.length > 0) {
          setActiveAddIndex((prev) => (prev + 1) % currentDisplayList.length);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (isAddOpen && currentDisplayList.length > 0) {
          setActiveAddIndex((prev) => (prev <= 0 ? currentDisplayList.length - 1 : prev - 1));
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (isAddOpen && currentDisplayList.length > 0) {
          const target =
            activeAddIndex >= 0 && activeAddIndex < currentDisplayList.length
              ? currentDisplayList[activeAddIndex]
              : currentDisplayList[0];
          if (target && !isFollowing(target.id) && subscribingId !== target.id) {
            handleAddArtist(target);
          }
        }
      } else if (e.key === "Escape") {
        setIsAddOpen(false);
        setActiveAddIndex(-1);
      }
    },
    [isAddOpen, currentDisplayList, activeAddIndex, isFollowing, subscribingId, handleAddArtist]
  );

  const artistList = useMemo(() => {
    return Object.values(artists).sort((a, b) =>
      a.personName.localeCompare(b.personName)
    );
  }, [artists]);

  // Selected artist for dedicated options panel
  const editingArtist = editingPersonId ? artists[String(editingPersonId)] : null;
  const isEditingCustomized = useMemo(() => {
    if (!editingArtist) return false;
    return !isDefaultFeedOptions(editingArtist);
  }, [editingArtist]);

  const editingOptions = useMemo(() => {
    if (!editingArtist) return DEFAULT_FEED_OPTIONS;
    return extractFeedOptions(editingArtist);
  }, [editingArtist]);

  const handleStartEditing = useCallback(
    (personId: number) => {
      setEditingPersonId((prev) => {
        const next = prev === personId ? null : personId;
        if (next !== null) {
          setTimeout(() => {
            editingSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 50);
        }
        return next;
      });
    },
    []
  );

  const handleUnfollow = useCallback(
    (personId: number) => {
      if (editingPersonId === personId) {
        setEditingPersonId(null);
      }
      unfollowArtist(personId);
    },
    [editingPersonId, unfollowArtist]
  );

  const handleUpdateFrequency = useCallback(
    (personId: number, freq: DigestFrequency) => {
      updateArtistOptions(personId, { frequency: freq });
    },
    [updateArtistOptions]
  );

  // Handlers for the dedicated options section
  const handleToggleRole = useCallback(
    (roleId: string) => {
      if (!editingArtist) return;
      const currentRoles = editingOptions.roles;
      const nextRoles = currentRoles.includes(roleId)
        ? currentRoles.filter((r) => r !== roleId)
        : [...currentRoles, roleId];
      updateArtistOptions(editingArtist.personId, { roles: nextRoles });
    },
    [editingArtist, editingOptions.roles, updateArtistOptions]
  );

  const handleToggleType = useCallback(
    (typeId: string) => {
      if (!editingArtist) return;
      const currentTypes = editingOptions.types;
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
      updateArtistOptions(editingArtist.personId, { types: nextTypes });
    },
    [editingArtist, editingOptions.types, updateArtistOptions]
  );

  const handleSetAlert = useCallback(
    (newAlert: AlertTimingWindow) => {
      if (!editingArtist) return;
      updateArtistOptions(editingArtist.personId, { alert: newAlert });
    },
    [editingArtist, updateArtistOptions]
  );

  const handleSetCountry = useCallback(
    (newCountry: string) => {
      if (!editingArtist) return;
      updateArtistOptions(editingArtist.personId, { country: newCountry });
    },
    [editingArtist, updateArtistOptions]
  );

  const handleSetExcludeShorts = useCallback(
    (exclude: boolean) => {
      if (!editingArtist) return;
      updateArtistOptions(editingArtist.personId, { excludeShorts: exclude });
    },
    [editingArtist, updateArtistOptions]
  );

  const handleSetExcludeReReleases = useCallback(
    (exclude: boolean) => {
      if (!editingArtist) return;
      updateArtistOptions(editingArtist.personId, { excludeReReleases: exclude });
    },
    [editingArtist, updateArtistOptions]
  );

  const handleSetExcludeUncredited = useCallback(
    (exclude: boolean) => {
      if (!editingArtist) return;
      updateArtistOptions(editingArtist.personId, { excludeUncredited: exclude });
    },
    [editingArtist, updateArtistOptions]
  );

  const handleResetOptions = useCallback(() => {
    if (!editingArtist) return;
    updateArtistOptions(editingArtist.personId, { ...DEFAULT_FEED_OPTIONS });
  }, [editingArtist, updateArtistOptions]);

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
            Sign in to view and manage your followed feeds and options in one place.
          </p>
        </div>

        {successMessage ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs space-y-1.5">
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
      <div className="relative z-30 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            My Feeds
          </h1>
          <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {artistList.length} {artistList.length === 1 ? "artist" : "artists"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-1 sm:flex-initial justify-end">
          {/* Search Bar (in place of filter list, exact same size) */}
          <div ref={addSearchContainerRef} className="relative min-w-[130px] max-w-[180px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={addSearchInputRef}
              type="text"
              role="combobox"
              aria-expanded={isAddOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-label="Search actor, director, or writer to follow"
              aria-controls="feeds-search-dropdown-listbox"
              aria-activedescendant={activeAddIndex >= 0 ? `add-artist-${activeAddIndex}` : undefined}
              value={addQuery}
              onChange={(e) => {
                setAddQuery(e.target.value);
                setIsAddOpen(true);
                setActiveAddIndex(-1);
              }}
              onFocus={() => setIsAddOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search to follow..."
              title="Search actor, director, or writer to follow"
              className="w-full pl-8 pr-6 py-1 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
            />
            {isAddSearching ? (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <Loader2 className="w-3 h-3 text-neutral-400 animate-spin" />
              </div>
            ) : addQuery ? (
              <button
                type="button"
                onClick={() => {
                  setAddQuery("");
                  setAddResults([]);
                  setActiveAddIndex(-1);
                  addSearchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}

            {/* Search Results / Quick Suggestions Dropdown */}
            {isAddOpen && (
              <div
                id="feeds-search-dropdown-listbox"
                role="listbox"
                aria-label="Creator suggestions"
                className="absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/60 max-h-[420px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
              >
                {addQuery.trim().length >= 2 ? (
                  isAddSearching && addResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                      <span>Searching for &ldquo;{addQuery}&rdquo;...</span>
                    </div>
                  ) : addResults.length === 0 ? (
                    <div className="p-5 text-center text-xs text-neutral-400 space-y-1">
                      <p className="font-medium text-neutral-600 dark:text-neutral-300">No matching artists found</p>
                      <p>Check the spelling or try searching for another artist.</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-3.5 py-1.5 bg-neutral-50 dark:bg-neutral-950/60 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                        <span>Search Results ({addResults.length})</span>
                        <span className="text-[10px] text-neutral-400">Click a person to follow</span>
                      </div>
                      {addResults.map((person, index) => {
                        const following = isFollowing(person.id);
                        const isSubmittingThis = subscribingId === person.id;
                        const wasJustAdded = justAddedId === person.id;
                        const isActive = activeAddIndex === index;

                        return (
                          <div
                            key={person.id}
                            id={`add-artist-${index}`}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActiveAddIndex(index)}
                            onClick={() => {
                              if (!following && !isSubmittingThis) {
                                handleAddArtist(person);
                              }
                            }}
                            className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                              isActive
                                ? "bg-amber-500/10 dark:bg-amber-500/15 cursor-pointer"
                                : following
                                ? "bg-neutral-50/50 dark:bg-neutral-900/50 cursor-default"
                                : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                                {person.profile_path ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={getTmdbImageUrl(person.profile_path, "w180_and_h180_face") || ""}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                    {person.name}
                                  </span>
                                  {person.known_for_department && (
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800">
                                      {person.known_for_department}
                                    </span>
                                  )}
                                </div>
                                {person.known_for && person.known_for.length > 0 && (
                                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                                    Known for: {person.known_for.map((k: any) => k.title || k.name).filter(Boolean).slice(0, 3).join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isSubmittingThis ? (
                                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                              ) : wasJustAdded ? (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Followed!</span>
                                </span>
                              ) : following ? (
                                <div className="px-2.5 py-1 rounded-xl text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 select-none">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Following</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )
                ) : (
                  <div className="p-3 bg-neutral-50/50 dark:bg-neutral-950/40">
                    <div className="px-1 pb-2 flex items-center justify-between text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      <span>Popular creators to follow</span>
                      <span className="text-[10px] text-neutral-400">
                        {addQuery.trim().length === 1 ? "Type 1 more character..." : "Click to follow"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {SUGGESTED_ARTISTS.map((person, index) => {
                        const following = isFollowing(person.id);
                        const isSubmittingThis = subscribingId === person.id;
                        const wasJustAdded = justAddedId === person.id;
                        const isActive = activeAddIndex === index;

                        return (
                          <div
                            key={person.id}
                            id={`add-popular-${index}`}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActiveAddIndex(index)}
                            onClick={() => {
                              if (!following && !isSubmittingThis) {
                                handleAddArtist(person);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2.5 transition-colors ${
                              isActive
                                ? "bg-amber-500/10 dark:bg-amber-500/15 cursor-pointer"
                                : following
                                ? "opacity-80 cursor-default"
                                : "hover:bg-white dark:hover:bg-neutral-800/60 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                                {person.profile_path ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={getTmdbImageUrl(person.profile_path, "w180_and_h180_face") || ""}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-xs text-neutral-900 dark:text-neutral-100 truncate block">
                                  {person.name}
                                </span>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                                  {person.known_for_department}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isSubmittingThis ? (
                                <Loader2 className="w-3 h-3 text-neutral-400 animate-spin" />
                              ) : wasJustAdded ? (
                                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span>Followed!</span>
                                </span>
                              ) : following ? (
                                <div className="px-2 py-0.5 rounded-xl text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 select-none">
                                  <Check className="w-3 h-3" />
                                  <span>Following</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {userEmail && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono truncate hidden sm:block">
              {userEmail}
            </p>
          )}
        </div>
      </div>

      {/* Dedicated Options Section (appears when an artist is selected for editing) */}
      {editingArtist && (
        <section
          ref={editingSectionRef}
          aria-label={`Options for ${editingArtist.personName}`}
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-500/30 dark:border-amber-500/30 shadow-md space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center">
                {editingArtist.profilePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getTmdbImageUrl(editingArtist.profilePath, "w180_and_h180_face") || ""}
                    alt={editingArtist.personName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {editingArtist.personName}
                </h2>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  Release alerts &amp; options
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setEditingPersonId(null)}
                className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-[11px] font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Options Controls */}
          <FeedFilters
            roles={editingOptions.roles}
            onToggleRole={handleToggleRole}
            types={editingOptions.types}
            onToggleType={handleToggleType}
            alert={editingOptions.alert}
            onSetAlert={handleSetAlert}
            country={editingOptions.country}
            onSetCountry={handleSetCountry}
            excludeShorts={editingOptions.excludeShorts}
            onSetExcludeShorts={handleSetExcludeShorts}
            excludeReReleases={editingOptions.excludeReReleases}
            onSetExcludeReReleases={handleSetExcludeReReleases}
            excludeUncredited={editingOptions.excludeUncredited}
            onSetExcludeUncredited={handleSetExcludeUncredited}
            isCustomized={isEditingCustomized}
            onResetOptions={handleResetOptions}
            defaultExpanded={true}
            saveExpandedState={false}
            hideToggle={true}
          />
        </section>
      )}

      {/* Artists Grid (100% stable, completely uniform cards that never expand) */}
      {artistList.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No feeds followed yet
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Use the search bar above to follow your favorite directors, actors, and writers.
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-1.5 flex-wrap max-w-md mx-auto">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 w-full sm:w-auto">Quick add:</span>
            {SUGGESTED_ARTISTS.slice(0, 4).map((p) => {
              const following = isFollowing(p.id);
              const isSubmittingThis = subscribingId === p.id;
              const wasJustAdded = justAddedId === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddArtist(p)}
                  disabled={isSubmittingThis || following}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                    following
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {following ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : isSubmittingThis ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : wasJustAdded ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Plus className="w-3 h-3 text-amber-500" />
                  )}
                  <span>{wasJustAdded ? "Followed!" : p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 items-start">
          {artistList.map((artist) => (
            <FollowedPersonItem
              key={artist.personId}
              artist={artist}
              isEditing={editingPersonId === artist.personId}
              onSelectForEdit={handleStartEditing}
              onUnfollow={handleUnfollow}
              onUpdateFrequency={handleUpdateFrequency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
