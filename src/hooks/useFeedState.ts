"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { COUNTRIES } from "@/lib/constants";

export interface FeedOptionsSettings {
  media: string[];
  roles: string[];
  types: string[];
  country: string;
  alert: "announced" | "release_day" | "week_before";
  excludeShorts: boolean;
}

const STORAGE_KEY = "magnanium_feed_options";

const DEFAULT_OPTIONS: FeedOptionsSettings = {
  media: ["movie", "tv"],
  roles: ["actor", "crew"],
  types: ["cinema", "home"],
  country: "US",
  alert: "announced",
  excludeShorts: false,
};

// Global in-memory cache to preserve options instantly across client navigation
let inMemoryOptions: FeedOptionsSettings = { ...DEFAULT_OPTIONS };

function persistOption<K extends keyof FeedOptionsSettings>(
  key: K,
  value: FeedOptionsSettings[K]
) {
  inMemoryOptions = {
    ...inMemoryOptions,
    [key]: value,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryOptions));
    } catch {}
  }
}

export function useFeedState(selectedPerson: TMDBPersonSearchResult | null) {
  const [media, setMedia] = useState<string[]>(() => inMemoryOptions.media);
  const [roles, setRoles] = useState<string[]>(() => inMemoryOptions.roles);
  const [types, setTypes] = useState<string[]>(() => inMemoryOptions.types);
  const [country, setCountryState] = useState<string>(() => inMemoryOptions.country);
  const [alert, setAlertState] = useState<"announced" | "release_day" | "week_before">(
    () => inMemoryOptions.alert
  );
  const [excludeShorts, setExcludeShortsState] = useState<boolean>(
    () => inMemoryOptions.excludeShorts
  );

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [origin, setOrigin] = useState("");

  // Sync with localStorage on initial client mount
  useEffect(() => {
    setOrigin(window.location.origin);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validMedia =
          Array.isArray(parsed.media) && parsed.media.length > 0
            ? parsed.media
            : inMemoryOptions.media;
        const validRoles =
          Array.isArray(parsed.roles) && parsed.roles.length > 0
            ? parsed.roles
            : inMemoryOptions.roles;
        const validTypes =
          Array.isArray(parsed.types) && parsed.types.length > 0
            ? parsed.types
            : inMemoryOptions.types;
        const validCountry =
          typeof parsed.country === "string" && COUNTRIES.some((c) => c.code === parsed.country)
            ? parsed.country
            : inMemoryOptions.country;
        const validAlert =
          ["announced", "release_day", "week_before"].includes(parsed.alert)
            ? (parsed.alert as "announced" | "release_day" | "week_before")
            : inMemoryOptions.alert;
        const validExcludeShorts =
          typeof parsed.excludeShorts === "boolean"
            ? parsed.excludeShorts
            : inMemoryOptions.excludeShorts;

        inMemoryOptions = {
          media: validMedia,
          roles: validRoles,
          types: validTypes,
          country: validCountry,
          alert: validAlert,
          excludeShorts: validExcludeShorts,
        };

        setMedia(validMedia);
        setRoles(validRoles);
        setTypes(validTypes);
        setCountryState(validCountry);
        setAlertState(validAlert);
        setExcludeShortsState(validExcludeShorts);
      }
    } catch {}
  }, []);

  const toggleMedia = useCallback((m: string) => {
    setMedia((prev) => {
      const next = prev.includes(m)
        ? prev.length > 1
          ? prev.filter((x) => x !== m)
          : prev
        : [...prev, m];
      persistOption("media", next);
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
      persistOption("roles", next);
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
      persistOption("types", next);
      return next;
    });
  }, []);

  const setCountry = useCallback((c: string) => {
    setCountryState(c);
    persistOption("country", c);
  }, []);

  const setAlert = useCallback((a: "announced" | "release_day" | "week_before") => {
    setAlertState(a);
    persistOption("alert", a);
  }, []);

  const setExcludeShorts = useCallback((exclude: boolean) => {
    setExcludeShortsState(exclude);
    persistOption("excludeShorts", exclude);
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
