"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { BoundedMap } from "@/lib/cache";
import {
  getSavedFeedOptions,
  saveFeedOption,
  FeedOptionsSettings,
} from "@/lib/feed-options";

const previewCache = new BoundedMap<string, FormattedRelease[]>(40);

export function useFeedState(selectedPerson: TMDBPersonSearchResult | null) {
  const initial = getSavedFeedOptions();
  const [media, setMedia] = useState<string[]>(initial.media);
  const [roles, setRoles] = useState<string[]>(initial.roles);
  const [types, setTypes] = useState<string[]>(initial.types);
  const [country, setCountryState] = useState<string>(initial.country);
  const [alert, setAlertState] = useState<FeedOptionsSettings["alert"]>(initial.alert);
  const [excludeShorts, setExcludeShortsState] = useState<boolean>(initial.excludeShorts);
  const [excludeReReleases, setExcludeReReleasesState] = useState<boolean>(initial.excludeReReleases);

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [origin, setOrigin] = useState("");

  // Sync with persisted settings on mount
  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = getSavedFeedOptions();
    setMedia(saved.media);
    setRoles(saved.roles);
    setTypes(saved.types);
    setCountryState(saved.country);
    setAlertState(saved.alert);
    setExcludeShortsState(saved.excludeShorts);
    setExcludeReReleasesState(saved.excludeReReleases);
  }, []);

  const toggleMedia = useCallback((m: string) => {
    setMedia((prev) => {
      const next = prev.includes(m)
        ? prev.length > 1
          ? prev.filter((x) => x !== m)
          : prev
        : [...prev, m];
      saveFeedOption("media", next);
      return next;
    });
  }, []);

  const toggleRole = useCallback((r: string) => {
    setRoles((prev) => {
      const next = prev.includes(r)
        ? prev.length > 1
          ? prev.filter((x) => x !== r)
          : prev
        : [...prev, r];
      saveFeedOption("roles", next);
      return next;
    });
  }, []);

  const toggleType = useCallback((t: string) => {
    setTypes((prev) => {
      let next: string[];
      if (t === "earliest") {
        next = ["earliest"];
      } else if (prev.includes("earliest")) {
        next = [t];
      } else {
        const filtered = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
        next = filtered.length > 0 ? filtered : ["cinema", "home"];
      }
      saveFeedOption("types", next);
      return next;
    });
  }, []);

  const setCountry = useCallback((c: string) => {
    setCountryState(c);
    saveFeedOption("country", c);
  }, []);

  const setAlert = useCallback((a: FeedOptionsSettings["alert"]) => {
    setAlertState(a);
    saveFeedOption("alert", a);
  }, []);

  const setExcludeShorts = useCallback((exclude: boolean) => {
    setExcludeShortsState(exclude);
    saveFeedOption("excludeShorts", exclude);
  }, []);

  const setExcludeReReleases = useCallback((exclude: boolean) => {
    setExcludeReReleasesState(exclude);
    saveFeedOption("excludeReReleases", exclude);
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
