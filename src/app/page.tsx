"use client";

import { useState, useEffect } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import { Search, Copy, Check, ExternalLink, Key, X } from "lucide-react";

const COUNTRIES = [
  { code: "US", name: "United States (US)" },
  { code: "GB", name: "United Kingdom (GB)" },
  { code: "CA", name: "Canada (CA)" },
  { code: "AU", name: "Australia (AU)" },
  { code: "FR", name: "France (FR)" },
  { code: "DE", name: "Germany (DE)" },
  { code: "KR", name: "South Korea (KR)" },
  { code: "JP", name: "Japan (JP)" },
];

export default function HomePage() {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TMDBPersonSearchResult | null>(null);

  // Filters
  const [roles, setRoles] = useState<string[]>(["director", "actor"]);
  const [types, setTypes] = useState<string[]>(["theatrical", "digital"]);
  const [country, setCountry] = useState("US");
  const [windowFilter, setWindowFilter] = useState<"upcoming" | "all">("all");

  // Output
  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // Load API key from localStorage on mount
  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = localStorage.getItem("tmdb_api_key");
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("tmdb_api_key", key);
    if (key.trim()) setNeedsApiKey(false);
  };

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const headers: Record<string, string> = {};
        if (apiKey.trim()) headers["x-tmdb-key"] = apiKey.trim();

        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers });
        const data = await res.json();
        setSearchResults(data.results || []);
        if (data.noApiKey && !apiKey) {
          setNeedsApiKey(true);
        } else {
          setNeedsApiKey(false);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, apiKey]);

  // Feed URL builder
  const feedUrl = selectedPerson
    ? `${origin}/api/feed/${selectedPerson.id}?roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&window=${windowFilter}${
        apiKey ? `&api_key=${apiKey}` : ""
      }`
    : "";

  // Load preview items
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
        if (apiKey) params.set("api_key", apiKey);

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
  }, [selectedPerson, roles, types, country, windowFilter, apiKey]);

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
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Top Bar: Title & optional API Key toggle */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-white">CineFeed</h1>
          <p className="text-xs text-neutral-400 mt-0.5">RSS feeds for movie releases</p>
        </div>

        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5 transition-colors"
        >
          <Key className="w-3.5 h-3.5" />
          {apiKey ? "API Key Set" : "TMDB API Key"}
        </button>
      </div>

      {/* API Key prompt if not set or toggled */}
      {(showKeyInput || needsApiKey) && (
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 text-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-300 font-medium">
            <span>The Movie Database (TMDB) API Key</span>
            {showKeyInput && (
              <button onClick={() => setShowKeyInput(false)} className="text-neutral-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-neutral-400 leading-relaxed">
            Searching any actor or director requires a free TMDB API key. Add it to <code className="text-neutral-300">.env.local</code> as <code className="text-neutral-300">TMDB_API_KEY</code>, or paste it here:
          </p>
          <div className="flex gap-2 pt-1">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="Paste TMDB API Key (e.g. 8f4a...)"
              className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
            />
            {apiKey && (
              <button
                onClick={() => saveApiKey("")}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-500">
            Get one free in 1 minute at{" "}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 underline hover:text-white"
            >
              themoviedb.org/settings/api
            </a>
          </p>
        </div>
      )}

      {/* Search Input */}
      {!selectedPerson ? (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search an actor or director..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            {isSearching && (
              <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-xl divide-y divide-neutral-800/60">
              {searchResults.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    setSelectedPerson(person);
                    setQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-neutral-800/60 transition-colors"
                >
                  <span className="text-sm font-medium text-white">{person.name}</span>
                  <span className="text-xs text-neutral-500">{person.known_for_department}</span>
                </button>
              ))}
            </div>
          )}

          {query.trim().length > 1 && !isSearching && searchResults.length === 0 && (
            <p className="text-xs text-neutral-500 mt-2 px-1">
              No results found. {needsApiKey && "(TMDB API key required for full live search)"}
            </p>
          )}
        </div>
      ) : (
        /* Selected Artist & Feed Configuration */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-lg font-medium text-white">{selectedPerson.name}</h2>
              <p className="text-xs text-neutral-500">{selectedPerson.known_for_department}</p>
            </div>
            <button
              onClick={() => setSelectedPerson(null)}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              Change
            </button>
          </div>

          {/* Simple Options */}
          <div className="space-y-4 text-xs">
            {/* Roles */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-neutral-500">Role:</span>
              <div className="flex items-center gap-2">
                {[
                  { id: "director", label: "Director" },
                  { id: "actor", label: "Actor" },
                  { id: "writer", label: "Writer" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
                      roles.includes(r.id)
                        ? "bg-neutral-200 text-neutral-900 border-neutral-200 font-medium"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-neutral-500">Format:</span>
              <div className="flex items-center gap-2">
                {[
                  { id: "theatrical", label: "Cinema" },
                  { id: "digital", label: "Streaming" },
                  { id: "physical", label: "Physical" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className={`px-3 py-1 rounded-lg border transition-colors ${
                      types.includes(t.id)
                        ? "bg-neutral-200 text-neutral-900 border-neutral-200 font-medium"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region & Time */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-neutral-500">Region:</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 focus:outline-none"
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
                className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 focus:outline-none ml-2"
              >
                <option value="all">Recent & Upcoming</option>
                <option value="upcoming">Upcoming Only</option>
              </select>
            </div>
          </div>

          {/* RSS Feed URL Box */}
          <div className="space-y-2 pt-2">
            <span className="text-xs text-neutral-500">RSS Feed URL</span>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-900 font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={feedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                title="Open feed"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Releases list preview */}
          <div className="space-y-3 pt-4 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Preview</span>
              {isLoadingPreview && <span>Loading...</span>}
            </div>

            {previewReleases.length === 0 ? (
              <p className="text-xs text-neutral-500 py-3">No releases found for selected options.</p>
            ) : (
              <div className="divide-y divide-neutral-900 border-t border-b border-neutral-900">
                {previewReleases.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="truncate mr-4">
                      <span className="text-neutral-200 font-medium">{item.movieTitle}</span>
                      <span className="text-neutral-500 ml-2">({item.role})</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-neutral-400 font-mono">
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
