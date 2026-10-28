"use client";

import { RefObject } from "react";
import { Search, Sun, Moon, User } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

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
  searchContainerRef,
  searchInputRef,
  onKeyDown,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-neutral-50/90 dark:bg-[#09090b]/90 backdrop-blur-md pt-5 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <button
          onClick={onHomeClick}
          className="font-semibold text-base text-neutral-900 dark:text-neutral-100 tracking-tight hover:opacity-75 transition-opacity flex-shrink-0"
        >
          Magnanium
        </button>

        {/* Search Bar in Header */}
        <div ref={searchContainerRef} className="flex-1 max-w-sm sm:max-w-md relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search director, actor, artist..."
            className="w-full pl-8 pr-8 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs shadow-sm focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
          />
          {isSearching && (
            <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {!isSearching && !query && (
            <kbd className="pointer-events-none px-1.5 py-0.5 text-[10px] font-mono rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400 dark:text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-block">
              /
            </kbd>
          )}

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden z-50 divide-y divide-neutral-100 dark:divide-neutral-800/60 max-h-80 overflow-y-auto">
              {searchResults.map((person, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={person.id}
                    id={`search-result-${index}`}
                    onClick={() => onSelectPerson(person)}
                    onMouseEnter={() => onSetActiveIndex(index)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors ${
                      isActive
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {person.profile_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                          alt={person.name}
                          loading="lazy"
                          decoding="async"
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="font-medium truncate">{person.name}</span>
                    </div>
                    <span className="text-neutral-400 dark:text-neutral-500 text-[11px] ml-2 flex-shrink-0">
                      {person.known_for_department}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {query.trim().length > 1 && !isSearching && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 p-3 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-400 dark:text-neutral-500 shadow-xl z-50 text-center">
              No matching artists found.
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex-shrink-0"
        >
          {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}
