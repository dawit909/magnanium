"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { BoundedMap } from "@/lib/cache";
import { getPopularArtistsIndex, TopArtistsFuzzyIndex } from "@/lib/fuzzy";

// In-memory cache for search queries to avoid repeated network calls
const searchCache = new BoundedMap<string, TMDBPersonSearchResult[]>(50);

// 600ms delay: ensures search results only update after user stops typing
const SEARCH_DEBOUNCE_MS = 600;

export function useSearch(onSelect: (person: TMDBPersonSearchResult) => void) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fuzzyIndexRef = useRef<TopArtistsFuzzyIndex | null>(null);

  // Approach 2: Pre-cache top popular artists index for instant (< 2ms) fuzzy search
  useEffect(() => {
    getPopularArtistsIndex().then((idx) => {
      if (idx) fuzzyIndexRef.current = idx;
    });
  }, []);

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
          setIsOpen(true);
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
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (!fuzzyIndexRef.current) {
      getPopularArtistsIndex().then((idx) => {
        if (idx) fuzzyIndexRef.current = idx;
      });
    }
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [query]);

  // Handle query change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setHasSearched(false);
    }
  }, []);

  // Delay updating search results while typing (600ms debounce)
  // Provides instant (< 2ms) client-side fuzzy suggestions while network query is pending
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
      setHasSearched(false);
      return;
    }

    // Approach 2: Instant Client-Side Fuzzy Index (< 2ms)
    // Runs before network query to provide instant typo-tolerant suggestions
    if (fuzzyIndexRef.current) {
      const instantMatches = fuzzyIndexRef.current.search(trimmed, 6);
      if (instantMatches.length > 0) {
        setSearchResults(instantMatches);
        setHasSearched(true);
      }
    }

    // Indicate that search is queued while user is typing
    setIsSearching(true);

    const timer = setTimeout(async () => {
      const cacheKey = trimmed.toLowerCase();
      if (searchCache.has(cacheKey)) {
        setSearchResults(searchCache.get(cacheKey) || []);
        setIsSearching(false);
        setHasSearched(true);
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
        const results: TMDBPersonSearchResult[] = (data.results || []).slice(0, 6);

        if (results.length > 0) {
          searchCache.set(cacheKey, results);
          setSearchResults(results);
          setHasSearched(true);
        } else {
          // If server returned 0 results, fall back to client fuzzy index
          const fallback = fuzzyIndexRef.current ? fuzzyIndexRef.current.search(trimmed, 6) : [];
          searchCache.set(cacheKey, fallback);
          setSearchResults(fallback);
          setHasSearched(true);
        }
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
    setHasSearched(false);
    setIsOpen(false);
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
        setIsOpen(true);
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

          if (!results && fuzzyIndexRef.current) {
            const instant = fuzzyIndexRef.current.search(trimmed, 6);
            if (instant.length > 0) {
              results = instant;
            }
          }

          if (!results) {
            try {
              const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
              if (res.ok) {
                const data = await res.json();
                const fetchedResults: TMDBPersonSearchResult[] = (data.results || []).slice(0, 6);
                if (fetchedResults.length > 0) {
                  searchCache.set(cacheKey, fetchedResults);
                  results = fetchedResults;
                } else if (fuzzyIndexRef.current) {
                  results = fuzzyIndexRef.current.search(trimmed, 6);
                }
                setHasSearched(true);
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
        setIsOpen(false);
      }
    },
    [query, searchResults, activeIndex, onSelect, resetSearch]
  );

  return {
    query,
    setQuery: handleQueryChange,
    searchResults,
    activeIndex,
    setActiveIndex,
    isSearching,
    hasSearched,
    isOpen,
    handleFocus,
    searchContainerRef,
    searchInputRef,
    resetSearch,
    handleKeyDown,
  };
}
