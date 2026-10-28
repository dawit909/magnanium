"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { BoundedMap } from "@/lib/cache";

// In-memory cache for search queries to avoid repeated network calls
const searchCache = new BoundedMap<string, TMDBPersonSearchResult[]>(50);

// 600ms delay: ensures search results only update after user stops typing
const SEARCH_DEBOUNCE_MS = 600;

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

  // Delay updating search results while typing (600ms debounce)
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

    // Indicate that search is queued while user is typing
    setIsSearching(true);

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
        if (data.error) return;
        const results = data.results || [];

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
    }, SEARCH_DEBOUNCE_MS);

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
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        if (searchResults.length === 0) return;
        e.preventDefault();
        setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        if (searchResults.length === 0) return;
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev > 0) return prev - 1;
          if (prev === 0) {
            searchInputRef.current?.focus();
            return -1;
          }
          return -1;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        // If an item in dropdown was navigated to by arrow keys, select it
        if (activeIndex >= 0 && activeIndex < searchResults.length) {
          onSelect(searchResults[activeIndex]);
          resetSearch();
          return;
        }

        // If user pressed Enter before the debounce timer finished, execute immediate search
        const trimmed = query.trim();
        if (trimmed.length >= 2) {
          setIsSearching(true);
          const cacheKey = trimmed.toLowerCase();
          let results = searchCache.get(cacheKey);

          if (!results) {
            try {
              const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
              if (res.ok) {
                const data = await res.json();
                const fetchedResults: TMDBPersonSearchResult[] = data.results || [];
                searchCache.set(cacheKey, fetchedResults);
                results = fetchedResults;
              }
            } catch {}
          }

          setIsSearching(false);
          if (results && results.length > 0) {
            onSelect(results[0]);
            resetSearch();
            return;
          }
        }

        if (searchResults.length > 0) {
          onSelect(searchResults[0]);
          resetSearch();
        }
      } else if (e.key === "Escape") {
        resetSearch();
      }
    },
    [query, searchResults, activeIndex, onSelect, resetSearch]
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
