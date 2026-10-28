"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";

export function useFeedState(selectedPerson: TMDBPersonSearchResult | null) {
  const [media, setMedia] = useState<string[]>(["movie", "tv"]);
  const [roles, setRoles] = useState<string[]>(["actor", "crew"]);
  const [types, setTypes] = useState<string[]>(["cinema", "home"]);
  const [country, setCountry] = useState("US");
  const [alert, setAlert] = useState<"announced" | "release_day">("announced");
  const [excludeShorts, setExcludeShorts] = useState(false);

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
    if (t === "earliest") {
      setTypes(["earliest"]);
      return;
    }
    setTypes((prev) => {
      if (prev.includes("earliest")) {
        return [t];
      }
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      return next.length > 0 ? next : ["cinema", "home"];
    });
  }, []);

  // Construct RSS Feed URL (memoized to avoid reallocations)
  const feedUrl = useMemo(() => {
    if (!selectedPerson || !origin) return "";
    return `${origin}/api/feed/${selectedPerson.id}?media=${media.join(",")}&roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&alert=${alert}&exclude_shorts=${excludeShorts}`;
  }, [selectedPerson, origin, media, roles, types, country, alert, excludeShorts]);

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
          format: "json",
        });

        const res = await fetch(`/api/feed/${selectedPerson.id}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.releases) {
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
  }, [selectedPerson, media, roles, types, country, alert, excludeShorts]);

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
    previewReleases,
    isLoadingPreview,
    feedUrl,
  };
}
