"use client";

import { RefObject, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Search, Sun, Moon, User, Loader2, LogIn, ChevronDown } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { getTmdbImageUrl } from "@/lib/media";
import { createPersonSlug } from "@/lib/slug";
import { useSubscription } from "@/hooks/useSubscription";
import Logo from "./Logo";
import SignInModal from "./SignInModal";

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
  const [mounted, setMounted] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, userEmail, artists, logout } = useSubscription();
  const alertCount = Object.keys(artists).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (userMenuRef.current) {
      const rect = userMenuRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    updateMenuPosition();

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isUserMenuOpen, updateMenuPosition]);

  // Close user dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  const isSearchDropdownOpen =
    isOpen && (searchResults.length > 0 || (hasSearched && !isSearching));

  return (
    <>
      <header
        className={`sticky top-0 ${
          isSearchDropdownOpen ? "z-[70]" : "z-30"
        } bg-neutral-50/90 dark:bg-[#09090b]/90 backdrop-blur-md pt-5 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 -mx-4 px-4 sm:mx-0 sm:px-0`}
      >
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
              aria-label="Search suggestions"
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden z-50 divide-y divide-neutral-100 dark:divide-neutral-800/60"
            >
              {searchResults.slice(0, 6).map((person, index) => {
                const isActive = activeIndex === index;
                const slug = createPersonSlug(person.id, person.name);
                return (
                  <Link
                    key={person.id}
                    id={`search-result-${index}`}
                    href={`/${slug}`}
                    prefetch={false}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                        onSelectPerson(person);
                      }
                    }}
                    onMouseEnter={() => {
                      onSetActiveIndex(index);
                      if (person.profile_path && typeof window !== "undefined") {
                        const hero = new Image();
                        const heroUrl = getTmdbImageUrl(person.profile_path, "w300_and_h300_face");
                        if (heroUrl) hero.src = heroUrl;
                      }
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400 no-underline cursor-pointer ${
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
                            src={getTmdbImageUrl(person.profile_path, "w180_and_h180_face") || ""}
                            alt={person.name}
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            onError={(e) => {
                              const fallback = getTmdbImageUrl(person.profile_path, "w92");
                              if (fallback) {
                                (e.currentTarget as HTMLImageElement).src = fallback;
                              }
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
                  </Link>
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

        {/* Right Action Controls: Theme Toggle & Sign In / Account Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer"
          >
            {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Sign In (when not logged in) OR Account Dropdown (when logged in) */}
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => setIsSignInOpen(true)}
              aria-label="Sign In"
              className="h-8 px-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="Account menu"
                className="h-8 pl-1.5 pr-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 shadow-sm transition-colors text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline text-neutral-700 dark:text-neutral-300">
                  {userEmail ? userEmail.split("@")[0] : "Account"}
                </span>
                {alertCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 dark:text-neutral-950">
                    {alertCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 text-neutral-400 transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu Portaled to document.body (floats above mock window at z-[75]) */}
              {isUserMenuOpen && mounted && menuPosition &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    style={{
                      position: "fixed",
                      top: menuPosition.top,
                      right: menuPosition.right,
                    }}
                    className="w-52 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden z-[75] divide-y divide-neutral-100 dark:divide-neutral-800/60 animate-in fade-in slide-in-from-top-1 duration-150"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {userEmail && (
                      <div className="px-3.5 py-2.5 bg-neutral-50/50 dark:bg-neutral-950/50">
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
                          Signed in as
                        </p>
                        <p className="text-xs font-mono font-medium text-neutral-900 dark:text-neutral-100 truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                    )}

                    <div className="p-1">
                      <Link
                        href="/feeds"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center justify-between transition-colors no-underline cursor-pointer"
                      >
                        <span>My Feeds</span>
                        {alertCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {alertCount}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="p-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          )}
        </div>
      </div>
    </header>

    <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
  </>
  );
}
