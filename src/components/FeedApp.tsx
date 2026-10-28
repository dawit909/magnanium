"use client";

import { useState, useEffect, useRef } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { createPersonSlug, parsePersonIdFromSlug } from "@/lib/slug";
import { Search, Copy, Check, ExternalLink, Sun, Moon, User } from "lucide-react";

const COUNTRIES = [
  { code: "US", name: "US" },
  { code: "GB", name: "UK" },
  { code: "CA", name: "CA" },
  { code: "AU", name: "AU" },
  { code: "FR", name: "FR" },
  { code: "DE", name: "DE" },
  { code: "KR", name: "KR" },
  { code: "JP", name: "JP" },
];

export default function FeedApp({
  initialPerson = null,
}: {
  initialPerson?: TMDBPersonSearchResult | null;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TMDBPersonSearchResult | null>(initialPerson);

  // Filters
  const [roles, setRoles] = useState<string[]>(["director", "actor"]);
  const [types, setTypes] = useState<string[]>(["cinema", "home"]);
  const [country, setCountry] = useState("US");
  const [excludeShorts, setExcludeShorts] = useState(false);

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialize theme from localStorage (default light)
  useEffect(() => {
    setOrigin(window.location.origin);
    const savedTheme = localStorage.getItem("magnanium_theme") as "light" | "dark" | null;
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
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

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = async () => {
      const path = window.location.pathname.replace(/^\/+/, "");
      if (!path) {
        setSelectedPerson(null);
        setQuery("");
        setSearchResults([]);
      } else {
        const id = parsePersonIdFromSlug(path);
        if (id) {
          try {
            const res = await fetch(`/api/search?q=${id}`);
            const data = await res.json();
            const found = (data.results || []).find((p: TMDBPersonSearchResult) => p.id === id);
            if (found) {
              setSelectedPerson(found);
            }
          } catch (err) {
            console.error("Popstate fetch error:", err);
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("magnanium_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const goHome = () => {
    setSelectedPerson(null);
    setQuery("");
    setSearchResults([]);
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  };

  const selectPerson = (person: TMDBPersonSearchResult) => {
    setSelectedPerson(person);
    setQuery("");
    setSearchResults([]);
    const slug = createPersonSlug(person.id, person.name);
    window.history.pushState(null, "", `/${slug}`);
  };

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Construct RSS Feed URL
  const feedUrl = selectedPerson
    ? `${origin}/api/feed/${selectedPerson.id}?roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&exclude_shorts=${excludeShorts}`
    : "";

  // Fetch preview items when artist or filters change
  useEffect(() => {
    if (!selectedPerson) {
      setPreviewReleases([]);
      return;
    }

    let isCurrent = true;
    setIsLoadingPreview(true);

    const loadFeed = async () => {
      try {
        const params = new URLSearchParams({
          roles: roles.join(","),
          types: types.join(","),
          country,
          exclude_shorts: String(excludeShorts),
        });

        const res = await fetch(`/api/feed/${selectedPerson.id}?${params.toString()}`);
        if (!res.ok) return;

        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const items = xmlDoc.querySelectorAll("item");

        const parsed: FormattedRelease[] = [];
        items.forEach((item) => {
          const title = item.querySelector("title")?.textContent || "";
          const link = item.querySelector("link")?.textContent || "";
          const guid = item.querySelector("guid")?.textContent || "";
          const pubDate = item.querySelector("pubDate")?.textContent || "";
          const categories = Array.from(item.querySelectorAll("category")).map((c) => c.textContent || "");

          const dateMatch = title.match(/\((\d{4}-\d{2}-\d{2})\)/);
          const releaseDate = dateMatch ? dateMatch[1] : pubDate;

          parsed.push({
            id: guid,
            movieId: 0,
            movieTitle: title.split(" - ")[0] || title,
            overview: "",
            posterPath: null,
            releaseDate,
            releaseType: "cinema",
            releaseTypeLabel: categories[0] || "Release",
            country,
            role: categories[1] || "",
            tmdbUrl: link,
          });
        });

        if (isCurrent) setPreviewReleases(parsed);
      } catch (err) {
        console.error("Feed error:", err);
      } finally {
        if (isCurrent) setIsLoadingPreview(false);
      }
    };

    loadFeed();
    return () => {
      isCurrent = false;
    };
  }, [selectedPerson, roles, types, country, excludeShorts]);

  const toggleRole = (r: string) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
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

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md pt-5 pb-4 border-b border-neutral-200 dark:border-neutral-800 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Home button */}
          <button
            onClick={goHome}
            className="font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:opacity-75 transition-opacity flex-shrink-0"
          >
            Magnanium
          </button>

          {/* Middle: Persistent Search Bar */}
          <div ref={searchContainerRef} className="flex-1 max-w-xs sm:max-w-sm relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor or director..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />
            {isSearching && (
              <div className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
            )}

            {/* Autocomplete Dropdown under Search Bar */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800/50 shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => selectPerson(person)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {person.profile_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                          alt={person.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="text-neutral-900 dark:text-neutral-200 font-medium truncate">{person.name}</span>
                    </div>
                    <span className="text-neutral-400 dark:text-neutral-500 text-[11px] ml-2 flex-shrink-0">
                      {person.known_for_department}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query.trim().length > 1 && !isSearching && searchResults.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-400 dark:text-neutral-500 shadow-xl z-50">
                No results found.
              </div>
            )}
          </div>

          {/* Right: Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex-shrink-0"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!selectedPerson ? (
        <div className="py-20 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Search an actor or director above to generate an RSS feed.
        </div>
      ) : (
        /* Selected Person Page */
        <div className="space-y-5">
          {/* Person Header with Profile Picture (No Change button) */}
          <div className="flex items-center gap-3.5 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            {selectedPerson.profile_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://image.tmdb.org/t/p/w185${selectedPerson.profile_path}`}
                alt={selectedPerson.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 flex-shrink-0">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 block">
                {selectedPerson.name}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                {selectedPerson.known_for_department}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-14 text-neutral-400 dark:text-neutral-500">Role:</span>
              {(["director", "actor", "writer"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`px-2.5 py-1 rounded border transition-colors capitalize ${
                    roles.includes(r)
                      ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-200 dark:text-neutral-900 dark:border-neutral-200"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 text-neutral-400 dark:text-neutral-500">Format:</span>
              {[
                { id: "cinema", label: "Cinema" },
                { id: "home", label: "Home" },
                { id: "earliest", label: "Earliest" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleType(t.id)}
                  className={`px-2.5 py-1 rounded border transition-colors ${
                    types.includes(t.id)
                      ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-200 dark:text-neutral-900 dark:border-neutral-200"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 text-neutral-400 dark:text-neutral-500">Region:</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 text-xs focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14"></span>
              <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs select-none">
                <input
                  type="checkbox"
                  checked={excludeShorts}
                  onChange={(e) => setExcludeShorts(e.target.checked)}
                  className="rounded accent-neutral-800 dark:accent-neutral-200"
                />
                <span>Exclude short films</span>
              </label>
            </div>
          </div>

          {/* RSS Feed Output */}
          <div className="pt-2 space-y-1.5">
            <div className="text-xs text-neutral-400 dark:text-neutral-500">Feed URL</div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 px-2.5 py-1.5 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-200 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={feedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center transition-colors"
                title="Open RSS Feed"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Release List */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
              <span>Feed entries</span>
              {isLoadingPreview && <span>Loading...</span>}
            </div>

            {previewReleases.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 py-2">No entries found.</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900 border-t border-b border-neutral-100 dark:border-neutral-900">
                {previewReleases.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate mr-3">
                      <span className="text-neutral-800 dark:text-neutral-200">{item.movieTitle}</span>
                      <span className="text-neutral-400 dark:text-neutral-500 ml-1.5">({item.role})</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                      <span>{item.releaseTypeLabel}</span>
                      <span>{item.releaseDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
