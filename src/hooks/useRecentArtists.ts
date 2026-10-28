"use client";

import { useState, useEffect } from "react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { createPersonSlug } from "@/lib/slug";

export interface RecentArtist {
  id: number;
  name: string;
  slug: string;
}

const STORAGE_KEY = "magnanium_recent";
const MAX_RECENT = 6;

export function useRecentArtists(selectedPerson: TMDBPersonSearchResult | null) {
  const [recentArtists, setRecentArtists] = useState<RecentArtist[]>([]);

  // Load recent history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRecentArtists(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save artist to recent history when viewed
  useEffect(() => {
    if (!selectedPerson) return;

    const slug = createPersonSlug(selectedPerson.id, selectedPerson.name);
    setRecentArtists((prev) => {
      const filtered = prev.filter((a) => a.id !== selectedPerson.id);
      const updated = [{ id: selectedPerson.id, name: selectedPerson.name, slug }, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [selectedPerson]);

  return { recentArtists };
}
