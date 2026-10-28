"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { TMDBPersonSearchResult, FormattedRelease } from "@/types/tmdb";
import {
  Search,
  Rss,
  Check,
  Copy,
  ExternalLink,
  Film,
  Sparkles,
  Calendar,
  Globe,
  Sliders,
  Clapperboard,
  Tv,
  Disc,
} from "lucide-react";

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

const POPULAR_SUGGESTIONS = [
  { id: 525, name: "Christopher Nolan", dept: "Directing" },
  { id: 137427, name: "Denis Villeneuve", dept: "Directing" },
  { id: 234352, name: "Margot Robbie", dept: "Acting" },
  { id: 18897, name: "Quentin Tarantino", dept: "Directing" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBPersonSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TMDBPersonSearchResult | null>(null);

  // Filter options
  const [roles, setRoles] = useState<string[]>(["director", "actor"]);
  const [types, setTypes] = useState<string[]>(["theatrical", "digital"]);
  const [country, setCountry] = useState("US");
  const [windowFilter, setWindowFilter] = useState<"upcoming" | "all">("all");

  // Preview state
  const [previewReleases, setPreviewReleases] = useState<FormattedRelease[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // Set origin on client
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Construct RSS feed URL
  const feedUrl = selectedPerson
    ? `${origin}/api/feed/${selectedPerson.id}?roles=${roles.join(",")}&types=${types.join(",")}&country=${country}&window=${windowFilter}`
    : "";

  // Fetch preview releases whenever filters or selected person change
  useEffect(() => {
    if (!selectedPerson) {
      setPreviewReleases([]);
      return;
    }

    let isSubscribed = true;
    setIsLoadingPreview(true);

    const loadPreview = async () => {
      try {
        const params = new URLSearchParams({
          roles: roles.join(","),
          types: types.join(","),
          country,
          window: windowFilter,
        });

        const res = await fetch(`/api/feed/${selectedPerson.id}?${params.toString()}`);
        if (!res.ok) throw new Error("Feed request failed");

        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const items = xmlDoc.querySelectorAll("item");

        const parsedList: FormattedRelease[] = [];
        items.forEach((item) => {
          const title = item.querySelector("title")?.textContent || "";
          const link = item.querySelector("link")?.textContent || "";
          const guid = item.querySelector("guid")?.textContent || "";
          const pubDate = item.querySelector("pubDate")?.textContent || "";
          const desc = item.querySelector("description")?.textContent || "";
          const categories = Array.from(item.querySelectorAll("category")).map(
            (c) => c.textContent || ""
          );

          // Extract poster if available from html
          const imgMatch = desc.match(/src="([^"]+)"/);
          const posterPath = imgMatch ? imgMatch[1].replace("https://image.tmdb.org/t/p/w342", "") : null;

          // Extract date
          const dateMatch = title.match(/\((\d{4}-\d{2}-\d{2})\)/);
          const releaseDate = dateMatch ? dateMatch[1] : pubDate;

          parsedList.push({
            id: guid,
            movieId: 0,
            movieTitle: title.split(" - ")[0] || title,
            overview: desc.replace(/<[^>]+>/g, " ").slice(0, 140) + "...",
            posterPath,
            releaseDate,
            releaseType: "theatrical",
            releaseTypeLabel: categories[0] || "Release",
            country,
            role: categories[1] || "",
            tmdbUrl: link,
          });
        });

        if (isSubscribed) {
          setPreviewReleases(parsedList);
        }
      } catch (err) {
        console.error("Error previewing feed:", err);
      } finally {
        if (isSubscribed) {
          setIsLoadingPreview(false);
        }
      }
    };

    startTransition(() => {
      loadPreview();
    });

    return () => {
      isSubscribed = false;
    };
  }, [selectedPerson, roles, types, country, windowFilter]);

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleType = (type: string) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectPerson = (p: TMDBPersonSearchResult) => {
    setSelectedPerson(p);
    setQuery("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <section className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Track Any Actor or Filmmaker
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
          Movie Release Feeds for Creators You Love
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Get an instant, automatically updated RSS feed for upcoming theatrical, digital, and streaming releases. Plug it into Feedly, NetNewsWire, or Slack.
        </p>
      </section>

      {/* Search Input Box */}
      <section className="max-w-2xl mx-auto relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an actor or director (e.g. Christopher Nolan, Zendaya)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-slate-500 shadow-xl transition-all outline-none"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div
            ref={searchDropdownRef}
            className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-40 divide-y divide-slate-800"
          >
            {searchResults.map((person) => (
              <button
                key={person.id}
                onClick={() => selectPerson(person)}
                className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-slate-800/80 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                  {person.profile_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                      {person.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{person.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium">
                      {person.known_for_department}
                    </span>
                    {person.known_for && person.known_for.length > 0 && (
                      <span className="truncate">
                        Known for: {person.known_for.map((k) => k.title || k.name).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick Suggestion Pills */}
        {!selectedPerson && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-400">
            <span className="text-slate-500">Popular:</span>
            {POPULAR_SUGGESTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  selectPerson({
                    id: item.id,
                    name: item.name,
                    original_name: item.name,
                    known_for_department: item.dept,
                    profile_path: null,
                    popularity: 10,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Selected Person & Customizer */}
      {selectedPerson && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-8 animate-in fade-in duration-300">
          {/* Active Artist Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden border-2 border-amber-500/30 flex-shrink-0 shadow-lg">
                {selectedPerson.profile_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w185${selectedPerson.profile_path}`}
                    alt={selectedPerson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold text-xl">
                    {selectedPerson.name[0]}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPerson.name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    {selectedPerson.known_for_department}
                  </span>
                  <span>TMDB ID: #{selectedPerson.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPerson(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Choose another artist
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Roles */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clapperboard className="w-4 h-4 text-amber-400" />
                Artist Role
              </label>
              <div className="space-y-2">
                {[
                  { id: "director", label: "Director" },
                  { id: "actor", label: "Actor / Cast" },
                  { id: "writer", label: "Writer / Screenplay" },
                  { id: "producer", label: "Producer" },
                ].map((role) => (
                  <label
                    key={role.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-sm transition-all ${
                      roles.includes(role.id)
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span>{role.label}</span>
                    <input
                      type="checkbox"
                      checked={roles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="rounded accent-amber-500 h-4 w-4"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Release Types */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                Release Formats
              </label>
              <div className="space-y-2">
                {[
                  { id: "theatrical", label: "Theatrical (Cinemas)", icon: Film },
                  { id: "digital", label: "Digital / Streaming (VOD)", icon: Tv },
                  { id: "physical", label: "Physical (Blu-ray / DVD)", icon: Disc },
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-sm transition-all ${
                        types.includes(type.id)
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 opacity-70" />
                        <span>{type.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={types.includes(type.id)}
                        onChange={() => toggleType(type.id)}
                        className="rounded accent-amber-500 h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Region & Time Window */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-400" />
                  Release Region
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Time Window
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWindowFilter("all")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      windowFilter === "all"
                        ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    Recent & Upcoming
                  </button>
                  <button
                    onClick={() => setWindowFilter("upcoming")}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      windowFilter === "upcoming"
                        ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    Upcoming Only
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Feed URL Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Rss className="w-4 h-4" />
                Your Custom RSS Feed URL
              </span>
              <span className="text-[11px] text-slate-400">Auto-cached every 12 hours</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-200/90 font-mono select-all focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy RSS Link"}
                </button>
                <a
                  href={feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                  title="Open XML in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick RSS Reader Guides */}
            <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Paste this URL into:</span>
              <span className="text-slate-400">Feedly</span>
              <span className="text-slate-400">NetNewsWire</span>
              <span className="text-slate-400">Inoreader</span>
              <span className="text-slate-400">Apple Podcasts / RSS</span>
            </div>
          </div>

          {/* Live Feed Preview */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Feed Items Preview</span>
                {isLoadingPreview && (
                  <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                )}
              </h3>
              <span className="text-xs text-slate-500">
                {previewReleases.length} {previewReleases.length === 1 ? "release" : "releases"} found
              </span>
            </div>

            {previewReleases.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-slate-500 text-sm">
                No releases matched the current filters. Try enabling more release formats or selecting &quot;Recent &amp; Upcoming&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {previewReleases.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-14 h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-800">
                      {item.posterPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://image.tmdb.org/t/p/w185${item.posterPath}`}
                          alt={item.movieTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-white truncate" title={item.movieTitle}>
                          {item.movieTitle}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                          {item.releaseTypeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-amber-300 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 opacity-70" />
                        {item.releaseDate} ({item.country})
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{item.role}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.overview}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Feature Explainer */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-semibold text-white text-sm">Pick Any Filmmaker</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Search thousands of directors, actors, writers, and producers tracked by TMDB.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-semibold text-white text-sm">Choose Your Formats</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Target theatrical cinema dates, VOD/streaming releases, or physical 4K/Blu-ray launches for your specific country.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="font-semibold text-white text-sm">Public & Cached</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard RSS 2.0 format with smart HTTP caching headers so readers can poll cleanly without rate limits.
          </p>
        </div>
      </section>
    </div>
  );
}
