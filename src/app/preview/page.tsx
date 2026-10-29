"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Film,
  Sparkles,
  Clapperboard,
  Sun,
  Moon,
  Search,
  Rss,
  Check,
  Copy,
  Settings2,
  ChevronRight,
  ExternalLink,
  Info,
  Calendar,
  Clock,
  Globe,
  Tv,
  ArrowLeft,
} from "lucide-react";
import { SAMPLE_ITEMS } from "@/data/mockFeed";

type OptionId = "warm-cinema" | "midnight-neon" | "velvet-carpet";
type ViewMode = "home" | "artist";

interface ThemeConfig {
  id: OptionId;
  name: string;
  subtitle: string;
  icon: typeof Film;
  darkBg: string;
  lightBg: string;
  darkSurface: string;
  lightSurface: string;
  darkBorder: string;
  lightBorder: string;
  accentGradient: string;
  accentText: string;
  darkBadge: string;
  lightBadge: string;
  cinemaBadge: string;
  tvBadge: string;
  premiereBadge: string;
  homeBadge: string;
  buttonClass: string;
  activePillClass: string;
}

const THEME_CONFIGS: Record<OptionId, ThemeConfig> = {
  "warm-cinema": {
    id: "warm-cinema",
    name: "Option 1: Warm Cinema",
    subtitle: "35mm Film Stock, Golden Projection Lamps & Criterion Warmth",
    icon: Film,
    darkBg: "bg-[#0c0a09] text-[#f5f2eb]",
    lightBg: "bg-[#faf7f2] text-[#292524]",
    darkSurface: "bg-[#161311] border-[#292420]",
    lightSurface: "bg-white border-[#e7e2d9]",
    darkBorder: "border-[#292420]",
    lightBorder: "border-[#e7e2d9]",
    accentGradient: "from-amber-500 via-amber-600 to-amber-700",
    accentText: "text-amber-500 dark:text-amber-400",
    darkBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    lightBadge: "bg-amber-100 text-amber-900 border-amber-300",
    cinemaBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    tvBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    premiereBadge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    homeBadge: "bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/30",
    buttonClass: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25",
    activePillClass: "bg-amber-600 text-white border-amber-600 shadow-sm",
  },
  "midnight-neon": {
    id: "midnight-neon",
    name: "Option 2: Midnight Neon",
    subtitle: "A24 Indie Aesthetic, Electric Violet Marquee & Cyan Highlights",
    icon: Sparkles,
    darkBg: "bg-[#070914] text-[#f1f5f9]",
    lightBg: "bg-[#f8fafc] text-[#0f172a]",
    darkSurface: "bg-[#0d1024] border-[#1e2648]",
    lightSurface: "bg-white border-[#e2e8f0]",
    darkBorder: "border-[#1e2648]",
    lightBorder: "border-[#e2e8f0]",
    accentGradient: "from-indigo-500 via-purple-500 to-cyan-400",
    accentText: "text-indigo-600 dark:text-indigo-400",
    darkBadge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    lightBadge: "bg-indigo-100 text-indigo-900 border-indigo-300",
    cinemaBadge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    tvBadge: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    premiereBadge: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
    homeBadge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    buttonClass:
      "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-95 text-white shadow-indigo-500/25",
    activePillClass: "bg-indigo-600 text-white border-indigo-600 shadow-sm",
  },
  "velvet-carpet": {
    id: "velvet-carpet",
    name: "Option 3: Velvet Red Carpet",
    subtitle: "Film Festival Palace, Velvet Curtains & Champagne Gold Laurels",
    icon: Clapperboard,
    darkBg: "bg-[#0b0507] text-[#fff1f2]",
    lightBg: "bg-[#fdfbfc] text-[#1c0c12]",
    darkSurface: "bg-[#14080c] border-[#2d121b]",
    lightSurface: "bg-white border-[#f0e4e7]",
    darkBorder: "border-[#2d121b]",
    lightBorder: "border-[#f0e4e7]",
    accentGradient: "from-rose-600 via-rose-700 to-amber-600",
    accentText: "text-rose-600 dark:text-rose-400",
    darkBadge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    lightBadge: "bg-rose-100 text-rose-900 border-rose-300",
    cinemaBadge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    tvBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    premiereBadge:
      "bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-700 dark:text-rose-200 border-rose-400/40 font-semibold",
    homeBadge: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    buttonClass:
      "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/25",
    activePillClass: "bg-rose-600 text-white border-rose-600 shadow-sm",
  },
};

export default function DesignPreviewPage() {
  const [activeOption, setActiveOption] = useState<OptionId>("warm-cinema");
  const [isDark, setIsDark] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [selectedMockId, setSelectedMockId] = useState<string>("denis-dune3");
  const [copied, setCopied] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(true);

  const theme = THEME_CONFIGS[activeOption];
  const activeItem = useMemo(
    () => SAMPLE_ITEMS.find((i) => i.id === selectedMockId) || SAMPLE_ITEMS[0],
    [selectedMockId]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(`http://localhost:3000/api/feed/137427`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getFormatBadgeClass = (format?: string) => {
    const f = (format || "").toLowerCase();
    if (f.includes("cinema")) return theme.cinemaBadge;
    if (f.includes("tv")) return theme.tvBadge;
    if (f.includes("premiere")) return theme.premiereBadge;
    return theme.homeBadge;
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? `${theme.darkBg} dark` : theme.lightBg
      }`}
    >
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-900/90 text-white border-b border-neutral-800 px-4 py-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors font-medium select-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
            <div className="h-4 w-px bg-neutral-700 hidden sm:block" />
            <span className="font-bold text-white text-sm hidden sm:inline">Design Explorer</span>
          </div>

          {/* Theme Option Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-neutral-800">
            {(["warm-cinema", "midnight-neon", "velvet-carpet"] as OptionId[]).map((id) => {
              const cfg = THEME_CONFIGS[id];
              const Icon = cfg.icon;
              const isActive = activeOption === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveOption(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-neutral-900 font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.name.replace("Option ", "")}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode & Dark/Light Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px]">
              <button
                onClick={() => setViewMode("home")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  viewMode === "home" ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Home View
              </button>
              <button
                onClick={() => setViewMode("artist")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  viewMode === "artist" ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Artist View
              </button>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Aesthetic Explainer Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? theme.darkSurface : theme.lightSurface
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${isDark ? theme.darkBadge : theme.lightBadge}`}>
                {theme.name}
              </span>
              <span className="text-xs opacity-60">·</span>
              <span className="text-xs opacity-75 font-medium">{isDark ? "Dark Theme" : "Light Theme"}</span>
            </div>
            <p className="text-xs opacity-85 leading-relaxed pt-1">{theme.subtitle}</p>
          </div>
        </div>

        {/* Website Header Bar (Themed) */}
        <header
          className={`flex items-center justify-between gap-3 pb-4 border-b transition-colors duration-300 ${
            isDark ? theme.darkBorder : theme.lightBorder
          }`}
        >
          {/* Logo with Option-Specific Character */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${theme.accentGradient}`}
            >
              <theme.icon className="w-4 h-4" />
            </div>
            <span
              className={`text-lg font-bold tracking-tight ${
                activeOption === "warm-cinema"
                  ? "font-serif text-amber-600 dark:text-amber-400"
                  : activeOption === "midnight-neon"
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent font-sans"
                  : "font-serif text-rose-700 dark:text-rose-400"
              }`}
            >
              Magnanium
            </span>
          </div>

          {/* Search Bar (Themed) */}
          <div className="flex-1 max-w-sm relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              readOnly
              value="Search actor, director, writer..."
              className={`w-full pl-8 pr-8 py-1.5 rounded-full border text-xs shadow-sm cursor-default transition-all ${
                isDark
                  ? "bg-neutral-900/90 border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:border-neutral-700"
                  : "bg-white border-neutral-200 text-neutral-800 placeholder-neutral-400"
              }`}
            />
            <kbd className="absolute right-3 top-2 px-1.5 py-0.2 text-[10px] font-mono rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
              /
            </kbd>
          </div>

          <div
            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs opacity-75 ${
              isDark ? theme.darkBorder : theme.lightBorder
            }`}
          >
            {isDark ? "🌙" : "☀️"}
          </div>
        </header>

        {/* VIEW 1: HOME PAGE (with Floating / Docked Mock RSS Reader) */}
        {viewMode === "home" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Themed Mock Feed Reader */}
            <div
              className={`rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
                isDark ? theme.darkSurface : theme.lightSurface
              }`}
            >
              {/* Window Title Bar */}
              <div
                className={`px-4 py-2.5 border-b flex items-center justify-between text-xs transition-colors duration-300 ${
                  isDark ? "bg-black/30 border-neutral-800/80" : "bg-neutral-50/80 border-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                  </div>
                  <Rss className={`w-3.5 h-3.5 ${theme.accentText}`} />
                  <span className="font-bold tracking-tight">Magnanium Feed Reader</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${isDark ? theme.darkBadge : theme.lightBadge}`}>
                    {activeItem.artist.name}
                  </span>
                </div>
                <span className="text-[11px] opacity-60 font-mono">11 unreleased projects</span>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x border-neutral-200 dark:border-neutral-800">
                {/* Left List */}
                <div className="md:col-span-5 p-3 space-y-1.5 max-h-[480px] overflow-y-auto">
                  {SAMPLE_ITEMS.map((item) => {
                    const isSelected = item.id === selectedMockId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMockId(item.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? isDark
                              ? `bg-white/10 border-neutral-400 text-white shadow-sm ring-1 ring-white/20`
                              : `bg-neutral-900 text-white border-neutral-900 shadow-sm`
                            : isDark
                            ? "bg-neutral-900/40 border-neutral-800/60 text-neutral-300 hover:bg-neutral-800/40"
                            : "bg-white border-neutral-200/80 text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <img
                            src={item.artist.avatar}
                            alt={item.artist.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs truncate leading-tight">{item.title}</div>
                            <div
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected ? "opacity-90" : "text-neutral-500 dark:text-neutral-400"
                              }`}
                            >
                              Role: {item.role}
                            </div>
                            <div className="flex items-center justify-between text-[10px] mt-1.5">
                              <span className={isSelected ? "opacity-90" : "opacity-60"}>{item.artist.name}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-medium border text-[10px] ${getFormatBadgeClass(
                                  item.format
                                )}`}
                              >
                                {item.format || "Cinema"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Item Detail */}
                <div className="md:col-span-7 p-4 sm:p-5 space-y-4 max-h-[480px] overflow-y-auto">
                  {/* Item Title & Action */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                      <h2 className="text-base font-bold leading-tight">{activeItem.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getFormatBadgeClass(
                            activeItem.format
                          )}`}
                        >
                          {activeItem.format || "Cinema"}
                        </span>
                        <span className="text-xs opacity-60">{activeItem.dateDisplay}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${theme.buttonClass}`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Feed"}</span>
                    </button>
                  </div>

                  {/* Metadata Lines in newly specified order */}
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 leading-relaxed ${
                      isDark ? "bg-black/30 border-neutral-800/80" : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <div>
                      <strong className="font-semibold">Role:</strong> {activeItem.role}
                    </div>
                    {activeItem.director && (
                      <div>
                        <strong className="font-semibold">Director:</strong> {activeItem.director}
                      </div>
                    )}
                    {activeItem.writer && (
                      <div>
                        <strong className="font-semibold">Writer:</strong> {activeItem.writer}
                      </div>
                    )}
                    {activeItem.stars && (
                      <div>
                        <strong className="font-semibold">Stars:</strong> {activeItem.stars}
                      </div>
                    )}
                    <div>
                      <strong className="font-semibold">Release:</strong> {activeItem.release}
                    </div>
                    {typeof activeItem.episodes === "number" && activeItem.episodes > 0 && (
                      <div>
                        <strong className="font-semibold">Episodes:</strong> {activeItem.episodes}{" "}
                        {activeItem.episodes === 1 ? "episode" : "episodes"}
                      </div>
                    )}
                    <div>
                      <strong className="font-semibold">Format:</strong> {activeItem.format}
                      {activeItem.formatNote && (
                        <span className="ml-1 px-1.5 py-0.2 rounded font-medium border text-[11px] bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700">
                          {activeItem.formatNote}
                        </span>
                      )}
                    </div>
                    <div>
                      <strong className="font-semibold">Runtime:</strong> {activeItem.runtime}
                    </div>
                    <div>
                      <strong className="font-semibold">Language:</strong> {activeItem.language}
                    </div>
                  </div>

                  {/* Overview */}
                  <p className="text-xs leading-relaxed opacity-85">{activeItem.overview}</p>

                  {/* Streaming Box */}
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      isDark ? "bg-black/30 border-neutral-800/80" : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <div className="font-semibold">Streaming in US:</div>
                    <div className="text-xs opacity-75">
                      {activeItem.streaming ? activeItem.streaming : "Theatrical premiere scheduled. Streaming to follow."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ARTIST PAGE (with Hero, RSS Feed URL Card, Feed Filters, Releases List) */}
        {viewMode === "artist" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Themed Artist Hero */}
            <div
              className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm flex items-center gap-6 ${
                isDark ? theme.darkSurface : theme.lightSurface
              }`}
            >
              <div className="relative">
                {/* Ambient glow behind avatar in dark mode */}
                <div
                  className={`absolute -inset-1 rounded-full blur-md opacity-40 bg-gradient-to-r ${theme.accentGradient}`}
                />
                <img
                  src="https://image.tmdb.org/t/p/w300_and_h300_face/137427.jpg"
                  alt="Denis Villeneuve"
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white/20 shadow-lg"
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${isDark ? theme.darkBadge : theme.lightBadge}`}>
                  Directing & Writing
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Denis Villeneuve</h1>
                <p className="text-xs opacity-70">
                  Follow upcoming cinematic releases, theatrical IMAX dates, and streaming drops.
                </p>
              </div>
            </div>

            {/* Themed Feed URL Card */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm space-y-2.5 ${
                isDark ? theme.darkSurface : theme.lightSurface
              }`}
            >
              <div className="flex items-center text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Rss className={`w-3.5 h-3.5 ${theme.accentText}`} />
                  <span>Personalized RSS Feed URL</span>
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value="http://localhost:3000/api/feed/137427?roles=director,writer&country=US"
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? "bg-black/40 border-neutral-800 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-800"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${theme.buttonClass}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy URL"}</span>
                </button>
              </div>
            </div>

            {/* Themed Feed Options Filters */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm space-y-3 text-xs ${
                isDark ? theme.darkSurface : theme.lightSurface
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOptionsExpanded(!optionsExpanded)}
                  className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5 opacity-70" />
                  <span>{optionsExpanded ? "Hide options" : "Show options"}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-70 transition-transform ${optionsExpanded ? "rotate-90" : ""}`}
                  />
                </button>
                <span className="text-[11px] opacity-60">Unhidden by default</span>
              </div>

              {optionsExpanded && (
                <div className="pt-2 space-y-3 border-t border-neutral-200 dark:border-neutral-800/80">
                  {/* Role */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-14 opacity-60 font-medium">Role:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${theme.activePillClass}`}>
                        Director
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${theme.activePillClass}`}>
                        Writer
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs border border-neutral-300 dark:border-neutral-700 opacity-60">
                        Actor
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs border border-neutral-300 dark:border-neutral-700 opacity-60">
                        Producer
                      </span>
                    </div>
                  </div>

                  {/* Format with Semantic Color Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-14 opacity-60 font-medium">Format:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${theme.cinemaBadge}`}>
                        Cinema
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${theme.tvBadge}`}>
                        TV
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${theme.premiereBadge}`}>
                        Premiere
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${theme.homeBadge}`}>
                        Home
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Themed Release List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sm">Upcoming Releases (2)</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${isDark ? theme.darkBadge : theme.lightBadge}`}>
                  Active Filter
                </span>
              </div>

              {/* Release Item 1 */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm flex items-center justify-between gap-4 ${
                  isDark ? theme.darkSurface : theme.lightSurface
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Dune: Part Three</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme.cinemaBadge}`}>
                      Cinema
                    </span>
                  </div>
                  <div className="text-xs opacity-75">
                    Role: Director, Writer (Screenplay), Producer · Runtime: 2h 45m
                  </div>
                  <div className="text-[11px] opacity-60">IMAX 70mm, Dolby Cinema worldwide rollout</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-xs font-semibold">2026-12-18</div>
                  <div className="text-[11px] opacity-60">United States</div>
                </div>
              </div>

              {/* Release Item 2 */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm flex items-center justify-between gap-4 ${
                  isDark ? theme.darkSurface : theme.lightSurface
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Rendezvous with Rama</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme.cinemaBadge}`}>
                      Cinema
                    </span>
                  </div>
                  <div className="text-xs opacity-75">Role: Director · Arthur C. Clarke sci-fi adaptation</div>
                  <div className="text-[11px] opacity-60">Pre-production · In development</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-xs font-semibold">2027-11-19</div>
                  <div className="text-[11px] opacity-60">United States</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
