"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

// In-memory LRU-style cache for search queries
const searchCache = new Map<string, TMDBPersonSearchResult[]>();

export function useSearch(onSelect: (person: TMDBPersonSearchResult) => void) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus search bar on "/" keypress anywhere on the page
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";

        if (!isInput) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Delay updating search results while typing with debounce, abort controller, and cache
  useEffect(() => {
    const trimmed = query.trim();

    // Abort any ongoing network request immediately when the query changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set searching indicator while typing
    setIsSearching(true);

    // 400ms debounce delay while typing
    const timer = setTimeout(async () => {
      const cacheKey = trimmed.toLowerCase();
      if (searchCache.has(cacheKey)) {
        setSearchResults(searchCache.get(cacheKey) || []);
        setIsSearching(false);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();
        const results = data.results || [];

        // Save to in-memory cache (limit cache size to 50 items)
        if (searchCache.size > 50) {
          const oldestKey = searchCache.keys().next().value;
          if (oldestKey) searchCache.delete(oldestKey);
        }
        searchCache.set(cacheKey, results);

        setSearchResults(results);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // Reset active index when query or results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, searchResults]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0) {
      const el = document.getElementById(`search-result-${activeIndex}`);
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const resetSearch = useCallback(() => {
    setQuery("");
    setSearchResults([]);
    setActiveIndex(-1);
    setIsSearching(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target =
          activeIndex >= 0 && activeIndex < searchResults.length
            ? searchResults[activeIndex]
            : searchResults[0];
        if (target) {
          onSelect(target);
          resetSearch();
        }
      } else if (e.key === "Escape") {
        resetSearch();
      }
    },
    [searchResults, activeIndex, onSelect, resetSearch]
  );

  return {
    query,
    setQuery,
    searchResults,
    activeIndex,
    setActiveIndex,
    isSearching,
    searchContainerRef,
    searchInputRef,
    resetSearch,
    handleKeyDown,
  };
}
