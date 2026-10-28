"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { BoundedMap } from "@/lib/cache";
import {
  getSavedFeedOptions,
  saveAllFeedOptions,
  FeedOptionsSettings,
} from "@/lib/feed-options";

const previewCache = new BoundedMap<string, FormattedRelease[]>(40);

export function useFeedState(selectedPerson: TMDBPersonSearchResult | null) {
  // Read saved feed options synchronously on client initialization to eliminate first-click lag/overwrite
  const [media, setMedia] = useState<string[]>(() => getSavedFeedOptions().media);
  const [roles, setRoles] = useState<string[]>(() => getSavedFeedOptions().roles);
  const [types, setTypes] = useState<string[]>(() => getSavedFeedOptions().types);
  const [country, setCountryState] = useState<string>(() => getSavedFeedOptions().country);
  const [alert, setAlertState] = useState<FeedOptionsSettings["alert"]>(() => getSavedFeedOptions().alert);
  const [excludeShorts, setExcludeShortsState] = useState<boolean>(() => getSavedFeedOptions().excludeShorts);
  const [excludeReReleases, setExcludeReReleasesState] = useState<boolean>(() => getSavedFeedOptions().excludeReReleases);

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
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
    });
  }, [media, roles, types, country, alert, excludeShorts, excludeReReleases]);

  const toggleMedia = useCallback((m: string) => {
    setMedia((prev) => {
      if (prev.includes(m)) {
        return prev.length > 1 ? prev.filter((x) => x !== m) : prev;
      }
      return [...prev, m];
    });
  }, []);

  const toggleRole = useCallback((r: string) => {
    setRoles((prev) => {
      if (prev.includes(r)) {
        return prev.length > 1 ? prev.filter((x) => x !== r) : prev;
      }
      return [...prev, r];
    });
  }, []);

  const toggleType = useCallback((t: string) => {
    setTypes((prev) => {
      if (t === "earliest") {
        return prev.includes("earliest") ? ["cinema", "home"] : ["earliest"];
      }
      if (prev.includes("earliest")) {
        return [t];
      }
      const filtered = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      return filtered.length > 0 ? filtered : ["cinema", "home"];
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

  // Construct RSS Feed URL
  const { feedUrl, feedProtocolUrl } = useMemo(() => {
    if (!selectedPerson || !origin) {
      return { feedUrl: "", feedProtocolUrl: "" };
    }
    const params = new URLSearchParams({
      media: media.join(","),
      roles: roles.join(","),
      types: types.join(","),
      country,
      alert,
      exclude_shorts: String(excludeShorts),
      exclude_rereleases: String(excludeReReleases),
    });
    const queryString = params.toString();
    const feed = `${origin}/api/feed/${selectedPerson.id}?${queryString}`;
    const hostWithPort = origin.replace(/^https?:\/\//, "");
    const feedProtocol = `feed://${hostWithPort}/api/feed/${selectedPerson.id}?${queryString}`;

    return {
      feedUrl: feed,
      feedProtocolUrl: feedProtocol,
    };
  }, [selectedPerson, origin, media, roles, types, country, alert, excludeShorts, excludeReReleases]);

  // Fetch preview items with AbortController to cancel stale in-flight requests
  useEffect(() => {
    if (!selectedPerson) {
      setPreviewReleases([]);
      return;
    }

    const controller = new AbortController();
    setIsLoadingPreview(true);

    const loadReleases = async () => {
      try {
        const params = new URLSearchParams({
          media: media.join(","),
          roles: roles.join(","),
          types: types.join(","),
          country,
          alert,
          exclude_shorts: String(excludeShorts),
          exclude_rereleases: String(excludeReReleases),
          format: "json",
        });

        const queryString = params.toString();
        const cacheKey = `${selectedPerson.id}?${queryString}`;
        const cached = previewCache.get(cacheKey);

        if (cached) {
          setPreviewReleases(cached);
          setIsLoadingPreview(false);
          return;
        }

        const res = await fetch(`/api/feed/${selectedPerson.id}?${queryString}`, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.releases) {
          previewCache.set(cacheKey, data.releases);
          setPreviewReleases(data.releases);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Feed preview fetch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreview(false);
        }
      }
    };

    loadReleases();

    return () => {
      controller.abort();
    };
  }, [selectedPerson, media, roles, types, country, alert, excludeShorts, excludeReReleases]);

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
    previewReleases,
    isLoadingPreview,
    feedUrl,
    feedProtocolUrl,
  };
}
