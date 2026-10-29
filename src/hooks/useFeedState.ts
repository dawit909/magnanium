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
import { detectBrowserCountry } from "@/lib/constants";
import { filterReleases } from "@/lib/feed-filter";

const rawReleasesCache = new BoundedMap<string, FormattedRelease[]>(120);

export function useFeedState(selectedPerson: TMDBPersonSearchResult | null) {
  // Read saved feed options synchronously on client initialization to eliminate first-click lag/overwrite
  const [media, setMedia] = useState<string[]>(() => getSavedFeedOptions().media);
  const [roles, setRoles] = useState<string[]>(() => getSavedFeedOptions().roles);
  const [types, setTypes] = useState<string[]>(() => getSavedFeedOptions().types);
  const [country, setCountryState] = useState<string>(() => getSavedFeedOptions().country);
  const [alert, setAlertState] = useState<FeedOptionsSettings["alert"]>(() => getSavedFeedOptions().alert);
  const [excludeShorts, setExcludeShortsState] = useState<boolean>(() => getSavedFeedOptions().excludeShorts);
  const [excludeReReleases, setExcludeReReleasesState] = useState<boolean>(() => getSavedFeedOptions().excludeReReleases);
  const [excludeUncredited, setExcludeUncreditedState] = useState<boolean>(() => getSavedFeedOptions().excludeUncredited);

  const [rawReleases, setRawReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [origin, setOrigin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  const isMountedRef = useRef(false);

  // Sync origin on client mount
  useEffect(() => {
    if (!origin && typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [origin]);

  // Persist options changes to storage (skipping initial mount so first-click is never clobbered)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    saveAllFeedOptions({
      media,
      roles,
      types,
      country,
      alert,
      excludeShorts,
      excludeReReleases,
      excludeUncredited,
    });
  }, [media, roles, types, country, alert, excludeShorts, excludeReReleases, excludeUncredited]);

  const toggleMedia = useCallback((m: string) => {
    setMedia((prev) => {
      if (prev.includes(m)) {
        return prev.length > 1 ? prev.filter((x) => x !== m) : prev;
      }
      return [...prev, m];
    });
  }, []);

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

  const defaultCountryRef = useRef<string | null>(null);
  if (!defaultCountryRef.current) {
    defaultCountryRef.current =
      typeof window !== "undefined"
        ? detectBrowserCountry() || DEFAULT_FEED_OPTIONS.country
        : DEFAULT_FEED_OPTIONS.country;
  }

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
    const params = new URLSearchParams({
      roles: roles.join(","),
      types: types.join(","),
      country,
      alert,
      exclude_shorts: String(excludeShorts),
      exclude_rereleases: String(excludeReReleases),
      exclude_uncredited: String(excludeUncredited),
    });
    const queryString = params.toString();
    const feed = `${origin}/api/feed/${selectedPerson.id}?${queryString}`;
    const hostWithPort = origin.replace(/^https?:\/\//, "");
    const feedProtocol = `feed://${hostWithPort}/api/feed/${selectedPerson.id}?${queryString}`;

    return {
      feedUrl: feed,
      feedProtocolUrl: feedProtocol,
    };
  }, [selectedPerson?.id, origin, roles, types, country, alert, excludeShorts, excludeReReleases, excludeUncredited]);

  // Fetch artist's raw releases for the selected country (1 network request per artist/country)
  useEffect(() => {
    if (!selectedPerson) {
      setRawReleases([]);
      setIsLoadingPreview(false);
      return;
    }

    const cacheKey = `raw:${selectedPerson.id}:${country}`;
    const cached = rawReleasesCache.get(cacheKey);

    if (cached) {
      setRawReleases(cached);
      setIsLoadingPreview(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingPreview(true);

    const loadRawReleases = async () => {
      try {
        const res = await fetch(
          `/api/feed/${selectedPerson.id}?format=json&country=${country}&raw=true`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!res.ok) {
          console.warn(`Feed raw releases fetch returned HTTP ${res.status}`);
          return;
        }

        const data = await res.json();
        if (data.releases) {
          rawReleasesCache.set(cacheKey, data.releases);
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
    media,
    toggleMedia,
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
