"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { createPersonSlug } from "@/lib/slug";
import { Search, Copy, Check, ExternalLink, Sun, Moon, User, Film, Tv, Rss } from "lucide-react";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "KR", name: "South Korea" },
  { code: "JP", name: "Japan" },
];

export default function FeedApp({
  initialPerson = null,
}: {
  initialPerson?: TMDBPersonSearchResult | null;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TMDBPersonSearchResult | null>(initialPerson);
  const [recentArtists, setRecentArtists] = useState<Array<{ id: number; name: string; slug: string }>>([]);

  // Filters
  const [media, setMedia] = useState<string[]>(["movie", "tv"]);
  const [roles, setRoles] = useState<string[]>(["actor", "crew"]);
  const [types, setTypes] = useState<string[]>(["cinema", "home"]);
  const [country, setCountry] = useState("US");
  const [excludeShorts, setExcludeShorts] = useState(false);

  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync state whenever initialPerson changes (URL changes, Back/Forward browser navigation)
  useEffect(() => {
    setSelectedPerson(initialPerson);
    setQuery("");
    setSearchResults([]);
  }, [initialPerson]);

  // Load theme and recent history
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

    const savedRecent = localStorage.getItem("magnanium_recent");
    if (savedRecent) {
      try {
        setRecentArtists(JSON.parse(savedRecent));
      } catch {}
    }
  }, []);

  // Save artist to recent history when viewed
  useEffect(() => {
    if (selectedPerson) {
      const slug = createPersonSlug(selectedPerson.id, selectedPerson.name);
      setRecentArtists((prev) => {
        const filtered = prev.filter((a) => a.id !== selectedPerson.id);
        const updated = [{ id: selectedPerson.id, name: selectedPerson.name, slug }, ...filtered].slice(0, 6);
        localStorage.setItem("magnanium_recent", JSON.stringify(updated));
        return updated;
      });
    }
  }, [selectedPerson]);

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
    setQuery("");
    setSearchResults([]);
    setActiveIndex(-1);
    router.push("/");
  };

  const selectPerson = (person: TMDBPersonSearchResult) => {
    setQuery("");
    setSearchResults([]);
    setActiveIndex(-1);
    const slug = createPersonSlug(person.id, person.name);
    router.push(`/${slug}`);
  };

  // Reset active index when query or search results change
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
    ? `${origin}/api/feed/${selectedPerson.id}?media=${media.join(",")}&roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&exclude_shorts=${excludeShorts}`
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
          media: media.join(","),
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
          const desc = item.querySelector("description")?.textContent || "";

          // Extract poster if available from html
          const imgMatch = desc.match(/src="([^"]+)"/);
          const posterUrl = imgMatch ? imgMatch[1] : null;

          const releaseMatch = desc.match(/<strong>Release:<\/strong>\s*(\d{4}-\d{2}-\d{2})/);
          const titleDateMatch = title.match(/\((\d{4}-\d{2}-\d{2})\)/);
          const releaseDate = releaseMatch ? releaseMatch[1] : titleDateMatch ? titleDateMatch[1] : pubDate;

          const isTv = categories.includes("TV") || link.includes("/tv/");
          const mediaType: "movie" | "tv" = isTv ? "tv" : "movie";

          const KNOWN_FORMATS = [
            "Theatrical",
            "Digital",
            "Physical",
            "TV Broadcast",
            "Premiere",
            "Season Premiere",
            "Series Premiere",
            "Cinema",
            "Home",
            "TV",
          ];

          const formatLabel =
            categories.find((c) => KNOWN_FORMATS.some((k) => c.startsWith(k))) ||
            (isTv ? "Season Premiere" : "Release");

          const roleLabel =
            categories.find(
              (c) =>
                !["Movie", "TV"].includes(c) &&
                !KNOWN_FORMATS.some((k) => c.startsWith(k)) &&
                c !== "TV"
            ) || "";

          parsed.push({
            id: guid,
            mediaType,
            movieId: 0,
            movieTitle: title.split(" - ")[0] || title,
            overview: "",
            posterPath: posterUrl,
            releaseDate,
            releaseType: isTv ? "home" : "cinema",
            releaseTypeLabel: formatLabel,
            country,
            role: roleLabel,
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
  }, [selectedPerson, media, roles, types, country, excludeShorts]);

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

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-8 text-sm">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-neutral-50/90 dark:bg-[#09090b]/90 backdrop-blur-md pt-5 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/80 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            onClick={goHome}
            className="font-semibold text-base text-neutral-900 dark:text-neutral-100 tracking-tight hover:opacity-75 transition-opacity flex-shrink-0"
          >
            Magnanium
          </button>

          {/* Search Bar in Header */}
          <div ref={searchContainerRef} className="flex-1 max-w-xs sm:max-w-sm relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (searchResults.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (activeIndex >= 0 && activeIndex < searchResults.length) {
                    selectPerson(searchResults[activeIndex]);
                  } else if (searchResults.length > 0) {
                    selectPerson(searchResults[0]);
                  }
                } else if (e.key === "Escape") {
                  setSearchResults([]);
                  setActiveIndex(-1);
                }
              }}
              placeholder="Search director, actor, artist..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs shadow-sm focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
            />
            {isSearching && (
              <div className="w-3 h-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
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
                      onClick={() => selectPerson(person)}
                      onMouseEnter={() => setActiveIndex(index)}
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
                            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="font-medium truncate">
                          {person.name}
                        </span>
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
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex-shrink-0"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {!selectedPerson ? (
        <div className="pt-6 space-y-8 animate-in fade-in duration-200">
          {/* Recent History */}
          {recentArtists.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Recent
              </span>
              <div className="flex flex-wrap gap-2">
                {recentArtists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => router.push(`/${artist.slug}`)}
                    className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm transition-all"
                  >
                    {artist.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Selected Person Page */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Person Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800/80">
            {selectedPerson.profile_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://image.tmdb.org/t/p/w185${selectedPerson.profile_path}`}
                alt={selectedPerson.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 flex-shrink-0">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {selectedPerson.name}
              </h2>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 inline-block">
                {selectedPerson.known_for_department}
              </span>
            </div>
          </div>

          {/* Filters in Clean Pill Groups */}
          <div className="space-y-3.5 text-xs">
            {/* Media */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">Media:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "movie", label: "Movie" },
                  { id: "tv", label: "TV" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleMedia(m.id)}
                    className={`px-3 py-1 rounded-full border text-xs transition-all ${
                      media.includes(m.id)
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm font-medium"
                        : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">Role:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "actor", label: "Actor" },
                  { id: "crew", label: "Behind the Scenes" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`px-3 py-1 rounded-full border text-xs transition-all ${
                      roles.includes(r.id)
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm font-medium"
                        : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">Format:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "cinema", label: "Theatrical" },
                  { id: "home", label: "Home" },
                  { id: "earliest", label: "Earliest" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className={`px-3 py-1 rounded-full border text-xs transition-all ${
                      types.includes(t.id)
                        ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm font-medium"
                        : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div className="flex items-center gap-2">
              <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">Region:</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none shadow-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Short films toggle */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="w-14"></span>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs select-none">
                <input
                  type="checkbox"
                  checked={excludeShorts}
                  onChange={(e) => setExcludeShorts(e.target.checked)}
                  className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5"
                />
                <span>Exclude short films</span>
              </label>
            </div>
          </div>

          {/* RSS Feed Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-2.5">
            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                <Rss className="w-3.5 h-3.5 text-amber-500" />
                RSS Feed URL
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={feedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
                title="Open RSS Feed XML"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Releases List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Releases ({previewReleases.length})
              </span>
              {isLoadingPreview && (
                <span className="text-neutral-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-400 animate-ping" />
                  Updating...
                </span>
              )}
            </div>

            {previewReleases.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                No releases found for the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900 border-t border-b border-neutral-100 dark:border-neutral-900">
                {previewReleases.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Movie/TV Poster Thumbnail */}
                      <div className="w-10 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200/80 dark:border-neutral-700 flex-shrink-0 shadow-sm">
                        {item.posterPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.posterPath}
                            alt={item.movieTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            {item.mediaType === "tv" ? (
                              <Tv className="w-4 h-4" />
                            ) : (
                              <Film className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0">
                        <a
                          href={item.tmdbUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:underline truncate block"
                        >
                          {item.movieTitle}
                        </a>
                        <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-medium text-neutral-600 dark:text-neutral-300">
                            {item.mediaType === "tv" ? "TV" : "Movie"}
                          </span>
                          {item.role && (
                            <>
                              <span>·</span>
                              <span>{item.role}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{item.country}</span>
                        </div>
                      </div>
                    </div>

                    {/* Date & Format Tag */}
                    <div className="text-right flex-shrink-0 space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 shadow-sm">
                        {item.releaseTypeLabel}
                      </span>
                      <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {item.releaseDate}
                      </div>
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
