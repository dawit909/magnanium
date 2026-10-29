"use client";

import { RefObject, useEffect } from "react";
import { Search, Sun, Moon, User, Loader2 } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import Logo from "./Logo";

interface HeaderProps {
  onHomeClick: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  searchResults: TMDBPersonSearchResult[];
  activeIndex: number;
  onSetActiveIndex: (index: number) => void;
  onSelectPerson: (person: TMDBPersonSearchResult) => void;
  isSearching: boolean;
  hasSearched: boolean;
  isOpen: boolean;
  onFocus: () => void;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function Header({
  onHomeClick,
  theme,
  onToggleTheme,
  query,
  onQueryChange,
  searchResults,
  activeIndex,
  onSetActiveIndex,
  onSelectPerson,
  isSearching,
  hasSearched,
  isOpen,
  onFocus,
  searchContainerRef,
  searchInputRef,
  onKeyDown,
}: HeaderProps) {
  // Speculatively preload hero and avatar images for top search results so they render in 0ms on click
  useEffect(() => {
    if (typeof window === "undefined" || searchResults.length === 0) return;
    searchResults.slice(0, 5).forEach((person) => {
      if (person.profile_path) {
        // Preload dropdown thumbnail
        const thumb = new Image();
        thumb.src = `https://image.tmdb.org/t/p/w180_and_h180_face${person.profile_path}`;
        // Preload artist page hero image
        const hero = new Image();
        hero.src = `https://image.tmdb.org/t/p/w300_and_h300_face${person.profile_path}`;
      }
    });
  }, [searchResults]);
  return (
    <header className="sticky top-0 z-30 bg-neutral-50/90 dark:bg-[#09090b]/90 backdrop-blur-md pt-5 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <button
          onClick={onHomeClick}
          aria-label="Magnanium Home"
          className="hover:opacity-85 transition-opacity flex-shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer"
        >
          <Logo />
        </button>

        {/* Search Bar in Header */}
        <div ref={searchContainerRef} className="flex-1 max-w-sm sm:max-w-md relative">
          <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen && searchResults.length > 0}
            aria-controls="search-dropdown-listbox"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            aria-label="Search artist, actor, director, writer"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            placeholder="Search actor, director, writer..."
            className="w-full pl-8 pr-8 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 transition-colors block"
          />
          {isSearching && (
            <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
              <Loader2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 animate-spin" />
            </div>
          )}
          {!isSearching && !query && (
            <div className="absolute right-2.5 inset-y-0 flex items-center pointer-events-none hidden sm:flex">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500">
                /
              </kbd>
            </div>
          )}

          {/* Screen Reader Live Announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {hasSearched && !isSearching
              ? searchResults.length > 0
                ? `${searchResults.length} people found`
                : "No matching people found"
              : ""}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && searchResults.length > 0 && (
            <div
              id="search-dropdown-listbox"
              role="listbox"
              aria-label="Search suggestions"
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden z-50 divide-y divide-neutral-100 dark:divide-neutral-800/60"
            >
              {searchResults.slice(0, 6).map((person, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={person.id}
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => onSelectPerson(person)}
                    onMouseEnter={() => {
                      onSetActiveIndex(index);
                      if (person.profile_path && typeof window !== "undefined") {
                        const hero = new Image();
                        hero.src = `https://image.tmdb.org/t/p/w300_and_h300_face${person.profile_path}`;
                      }
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400 ${
                      isActive
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {person.profile_path ? (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex-shrink-0 shadow-sm flex items-center justify-center text-neutral-400">
                          <User className="w-3 h-3 pointer-events-none" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://image.tmdb.org/t/p/w180_and_h180_face${person.profile_path}`}
                            alt={person.name}
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://image.tmdb.org/t/p/w92${person.profile_path}`;
                            }}
                            className="absolute inset-0 w-full h-full object-cover object-[center_20%] text-transparent select-none"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                      )}
                      <span className="font-medium truncate text-xs">{person.name}</span>
                    </div>
                    <span className="text-neutral-500 dark:text-neutral-400 text-[10px] ml-2 flex-shrink-0">
                      {person.known_for_department}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {isOpen && query.trim().length > 1 && !isSearching && hasSearched && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 p-2.5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-400 dark:text-neutral-500 shadow-xl z-50 text-center">
              No matching people found.
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
        >
          {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}
