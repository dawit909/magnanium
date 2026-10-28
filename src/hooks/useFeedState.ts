"use client";

import { useState, useEffect } from "react";
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

  const toggleMedia = (m: string) => {
    setMedia((prev) => {
      if (prev.includes(m)) {
        return prev.length > 1 ? prev.filter((x) => x !== m) : prev;
      }
      return [...prev, m];
    });
  };

  const toggleRole = (r: string) => {
    setRoles((prev) => {
      if (prev.includes(r)) {
        return prev.length > 1 ? prev.filter((x) => x !== r) : prev;
      }
      return [...prev, r];
    });
  };

  const toggleType = (t: string) => {
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
  };

  // Construct RSS Feed URL (without format=json)
  const feedUrl = selectedPerson && origin
    ? `${origin}/api/feed/${selectedPerson.id}?media=${media.join(",")}&roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&alert=${alert}&exclude_shorts=${excludeShorts}`
    : "";

  // Fetch preview items when artist or filters change
  useEffect(() => {
    if (!selectedPerson) {
      setPreviewReleases([]);
      return;
    }

    let isCurrent = true;
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

        const res = await fetch(`/api/feed/${selectedPerson.id}?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (isCurrent && data.releases) {
          setPreviewReleases(data.releases);
        }
      } catch (err) {
        console.error("Feed preview fetch error:", err);
      } finally {
        if (isCurrent) setIsLoadingPreview(false);
      }
    };

    loadReleases();
    return () => {
      isCurrent = false;
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
