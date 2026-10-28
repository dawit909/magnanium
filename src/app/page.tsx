"use client";

import { useState, useEffect } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
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

export default function HomePage() {
  // Theme state: defaults to light
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TMDBPersonSearchResult | null>(null);

  // Filters
  const [roles, setRoles] = useState<string[]>(["director", "actor"]);
  const [types, setTypes] = useState<string[]>(["theatrical", "digital"]);
  const [country, setCountry] = useState("US");
  const [windowFilter, setWindowFilter] = useState<"upcoming" | "all">("all");

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

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
    ? `${origin}/api/feed/${selectedPerson.id}?roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&window=${windowFilter}`
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
          window: windowFilter,
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
            releaseType: "theatrical",
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
  }, [selectedPerson, roles, types, country, windowFilter]);

  const toggleRole = (r: string) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const toggleType = (t: string) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <button
          onClick={goHome}
          className="font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:opacity-75 transition-opacity"
        >
          Magnanium
        </button>

        {/* Theme Toggle (White / Dark) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Search Input (Home View) */}
      {!selectedPerson ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor or director..."
              autoFocus
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
            />
            {isSearching && (
              <div className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800/50 shadow-sm overflow-hidden">
              {searchResults.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedPerson(person);
                    setQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {person.profile_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://image.tmdb.org/t/p/w92${person.profile_path}`}
                        alt={person.name}
                        className="w-6 h-6 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                    <span className="text-neutral-900 dark:text-neutral-200">{person.name}</span>
                  </div>
                  <span className="text-neutral-400 dark:text-neutral-500">{person.known_for_department}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim().length > 1 && !isSearching && searchResults.length === 0 && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">No results found.</p>
          )}
        </div>
      ) : (
        /* Selected Person Page */
        <div className="space-y-5">
          {/* Person Header with Profile Picture */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              {selectedPerson.profile_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://image.tmdb.org/t/p/w185${selectedPerson.profile_path}`}
                  alt={selectedPerson.name}
                  className="w-11 h-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-neutral-900 dark:text-neutral-100 font-medium block">
                  {selectedPerson.name}
                </span>
                <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                  {selectedPerson.known_for_department}
                </span>
              </div>
            </div>

            <button
              onClick={goHome}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              Change
            </button>
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
                { id: "theatrical", label: "Cinema" },
                { id: "digital", label: "Streaming" },
                { id: "physical", label: "Physical" },
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

              <select
                value={windowFilter}
                onChange={(e) => setWindowFilter(e.target.value as "upcoming" | "all")}
                className="px-2 py-1 rounded bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 text-xs focus:outline-none ml-1"
              >
                <option value="all">Recent & Upcoming</option>
                <option value="upcoming">Upcoming Only</option>
              </select>
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
