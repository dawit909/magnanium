"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { BoundedMap } from "@/lib/cache";
import {
  getSavedFeedOptions,
  saveAllFeedOptions,
  resetFeedOptions,
  DEFAULT_FEED_OPTIONS,
  FeedOptionsSettings,
} from "@/lib/feed-options";
import { detectBrowserCountry, CACHE_TTL, STORAGE_KEYS } from "@/lib/constants";
import { filterReleases } from "@/lib/feed-filter";
import { safeSessionStorage } from "@/lib/storage";
import { buildFeedUrls } from "@/lib/feed-params";

interface StoredRawReleasesEntry {
  releases: FormattedRelease[];
  timestamp: number;
}

const rawReleasesCache = new BoundedMap<string, StoredRawReleasesEntry>(120);

function getStoredRawReleases(personId: number, country: string): StoredRawReleasesEntry | null {
  const parsed = safeSessionStorage.get<any>(`${STORAGE_KEYS.RAW_PREFIX}${personId}_${country}`);
  if (!parsed) return null;
  // Modern format with timestamp
  if (Array.isArray(parsed.releases) && typeof parsed.timestamp === "number") {
    return parsed as StoredRawReleasesEntry;
  }
  // Backward compatibility with raw arrays (treat as stale to trigger background refresh)
  if (Array.isArray(parsed) && parsed.length > 0) {
    return { releases: parsed, timestamp: 0 };
  }
  return null;
}

function setStoredRawReleases(personId: number, country: string, releases: FormattedRelease[]): void {
  if (!releases) return;
  const entry: StoredRawReleasesEntry = {
    releases,
    timestamp: Date.now(),
  };
  safeSessionStorage.set(`${STORAGE_KEYS.RAW_PREFIX}${personId}_${country}`, entry);
}

export function useFeedState(selectedPerson: TMDBPersonSearchResult | null) {
  // Deterministic baseline state matching SSR to prevent hydration mismatch
  const [roles, setRoles] = useState<string[]>(DEFAULT_FEED_OPTIONS.roles);
  const [types, setTypes] = useState<string[]>(DEFAULT_FEED_OPTIONS.types);
  const [country, setCountryState] = useState<string>(DEFAULT_FEED_OPTIONS.country);
  const [alert, setAlertState] = useState<FeedOptionsSettings["alert"]>(DEFAULT_FEED_OPTIONS.alert);
  const [excludeShorts, setExcludeShortsState] = useState<boolean>(DEFAULT_FEED_OPTIONS.excludeShorts);
  const [excludeReReleases, setExcludeReReleasesState] = useState<boolean>(DEFAULT_FEED_OPTIONS.excludeReReleases);
  const [excludeUncredited, setExcludeUncreditedState] = useState<boolean>(DEFAULT_FEED_OPTIONS.excludeUncredited);

  const [rawReleases, setRawReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [origin, setOrigin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  const hasHydratedOptionsRef = useRef(false);
  const defaultCountryRef = useRef<string | null>(null);
  if (!defaultCountryRef.current) {
    defaultCountryRef.current =
      typeof window !== "undefined"
        ? detectBrowserCountry() || DEFAULT_FEED_OPTIONS.country
        : DEFAULT_FEED_OPTIONS.country;
  }

  // Sync origin on client mount
  useEffect(() => {
    if (!origin && typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [origin]);

  // Client-side hydration of saved options from localStorage
  useEffect(() => {
    defaultCountryRef.current = detectBrowserCountry() || DEFAULT_FEED_OPTIONS.country;
    const saved = getSavedFeedOptions();
    setRoles(saved.roles);
    setTypes(saved.types);
    setCountryState(saved.country);
    setAlertState(saved.alert);
    setExcludeShortsState(saved.excludeShorts);
    setExcludeReReleasesState(saved.excludeReReleases);
    setExcludeUncreditedState(saved.excludeUncredited);
    hasHydratedOptionsRef.current = true;
  }, []);

  // Persist options changes to storage ONLY after client has hydrated from storage
  useEffect(() => {
    if (!hasHydratedOptionsRef.current) {
      return;
    }

    saveAllFeedOptions({
      roles,
      types,
      country,
      alert,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    });
  }, [roles, types, country, alert, excludeShorts, excludeReReleases, excludeUncredited]);

  const toggleRole = useCallback((r: string) => {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }, []);

  const toggleType = useCallback((t: string) => {
    setTypes((prev) => {
      if (t === "earliest") {
        return prev.includes("earliest") ? [] : ["earliest"];
      }
      if (prev.includes("earliest")) {
        return [t];
      }
      return prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
    });
  }, []);

  const setCountry = useCallback((c: string) => {
    setCountryState(c);
  }, []);

  const setAlert = useCallback((a: FeedOptionsSettings["alert"]) => {
    setAlertState(a);
  }, []);

  const setExcludeShorts = useCallback((exclude: boolean) => {
    setExcludeShortsState(exclude);
  }, []);

  const setExcludeReReleases = useCallback((exclude: boolean) => {
    setExcludeReReleasesState(exclude);
  }, []);

  const setExcludeUncredited = useCallback((exclude: boolean) => {
    setExcludeUncreditedState(exclude);
  }, []);

  const resetOptions = useCallback(() => {
    const defaults = resetFeedOptions();
    setRoles([...defaults.roles]);
    setTypes([...defaults.types]);
    setCountryState(defaults.country);
    setAlertState(defaults.alert);
    setExcludeShortsState(defaults.excludeShorts);
    setExcludeReReleasesState(defaults.excludeReReleases);
    setExcludeUncreditedState(defaults.excludeUncredited);
  }, []);

  const isCustomized = useMemo(() => {
    const rolesMatch =
      roles.length === DEFAULT_FEED_OPTIONS.roles.length &&
      roles.every((r) => DEFAULT_FEED_OPTIONS.roles.includes(r));
    const typesMatch =
      types.length === DEFAULT_FEED_OPTIONS.types.length &&
      types.every((t) => DEFAULT_FEED_OPTIONS.types.includes(t));
    const countryMatch = country === defaultCountryRef.current;
    const alertMatch = alert === DEFAULT_FEED_OPTIONS.alert;
    const shortsMatch = excludeShorts === DEFAULT_FEED_OPTIONS.excludeShorts;
    const reReleasesMatch = excludeReReleases === DEFAULT_FEED_OPTIONS.excludeReReleases;
    const uncreditedMatch = excludeUncredited === DEFAULT_FEED_OPTIONS.excludeUncredited;

    return !(
      rolesMatch &&
      typesMatch &&
      countryMatch &&
      alertMatch &&
      shortsMatch &&
      reReleasesMatch &&
      uncreditedMatch
    );
  }, [roles, types, country, alert, excludeShorts, excludeReReleases, excludeUncredited]);

  // Construct RSS Feed URL
  const { feedUrl, feedProtocolUrl } = useMemo(() => {
    if (!selectedPerson || !origin) {
      return { feedUrl: "", feedProtocolUrl: "" };
    }
    return buildFeedUrls({
      origin,
      personId: selectedPerson.id,
      options: {
        roles,
        types,
        country,
        alert,
        excludeShorts,
        excludeReReleases,
        excludeUncredited,
      },
    });
  }, [selectedPerson?.id, origin, roles, types, country, alert, excludeShorts, excludeReReleases, excludeUncredited]);

  // Fetch artist's raw releases for the selected country (with instant storage restore & background SWR)
  useEffect(() => {
    if (!selectedPerson) {
      setRawReleases([]);
      setIsLoadingPreview(false);
      return;
    }

    const cacheKey = `raw:${selectedPerson.id}:${country}`;
    const memEntry = rawReleasesCache.get(cacheKey);
    const storedEntry = memEntry || getStoredRawReleases(selectedPerson.id, country);

    let isFresh = false;
    if (storedEntry && Array.isArray(storedEntry.releases)) {
      // Instantly restore cached releases from storage — zero delay, no loading spinner on refresh!
      rawReleasesCache.set(cacheKey, storedEntry);
      setRawReleases(storedEntry.releases);
      setIsLoadingPreview(false);

      // Check if data is within the client freshness window
      isFresh = Date.now() - storedEntry.timestamp < CACHE_TTL.SWR_FRESHNESS_MS;
      if (isFresh) {
        // Data is completely fresh — skip background network request!
        return;
      }
    } else {
      // Only show loading indicator if we don't have any cached data yet for this artist/country
      setIsLoadingPreview(true);
    }

    const controller = new AbortController();

    const loadRawReleases = async () => {
      try {
        const res = await fetch(
          `/feed/${selectedPerson.id}?format=json&country=${country}&raw=true`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          console.warn(`Feed raw releases fetch returned HTTP ${res.status}`);
          return;
        }

        const data = await res.json();
        if (data.releases) {
          const freshEntry: StoredRawReleasesEntry = {
            releases: data.releases,
            timestamp: Date.now(),
          };
          rawReleasesCache.set(cacheKey, freshEntry);
          setStoredRawReleases(selectedPerson.id, country, data.releases);
          setRawReleases(data.releases);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Feed raw releases fetch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreview(false);
        }
      }
    };

    loadRawReleases();

    return () => {
      controller.abort();
    };
  }, [selectedPerson?.id, country]);

  // Pure in-memory filtering: 0ms instant response on any option change
  const previewReleases = useMemo(() => {
    if (!selectedPerson || rawReleases.length === 0) return [];
    return filterReleases(rawReleases, {
      roles,
      types,
      alert,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    });
  }, [
    selectedPerson?.id,
    rawReleases,
    roles,
    types,
    alert,
    excludeShorts,
    excludeReReleases,
    excludeUncredited,
  ]);

  // Baseline unfiltered total for that country
  const totalUnfilteredCount = useMemo(() => {
    if (!selectedPerson || rawReleases.length === 0) return null;
    return rawReleases.length;
  }, [selectedPerson, rawReleases]);

  return {
    roles,
    toggleRole,
    types,
    toggleType,
    country,
    setCountry,
    alert,
    setAlert,
    excludeShorts,
    setExcludeShorts,
    excludeReReleases,
    setExcludeReReleases,
    excludeUncredited,
    setExcludeUncredited,
    resetOptions,
    isCustomized,
    previewReleases,
    totalUnfilteredCount,
    isLoadingPreview,
    feedUrl,
    feedProtocolUrl,
  };
}
