"use client";

import { useState } from "react";
import { Rss, Film, CheckCircle2, Sparkles } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

interface SampleFeedPreviewProps {
  onSelectSampleArtist?: (person: TMDBPersonSearchResult) => void;
}

export default function SampleFeedPreview({ onSelectSampleArtist }: SampleFeedPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<"cinema" | "home">("cinema");

  const sampleArtist: TMDBPersonSearchResult = {
    id: 525,
    name: "Christopher Nolan",
    original_name: "Christopher Nolan",
    known_for_department: "Directing",
    profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3Z5.jpg",
    popularity: 28.5,
  };

  return (
    <div className="max-w-lg mx-auto py-8 sm:py-12 space-y-6 animate-in fade-in duration-300">
      {/* Introduction Subtitle */}
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5">
          <Rss className="w-3.5 h-3.5 text-amber-500" />
          Interactive Feed Preview
        </span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          This is how release entries appear inside your favorite RSS reader.
        </p>
      </div>

      {/* Mock Feed Reader Card */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-5 space-y-4">
        {/* Top Channel Header */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-neutral-100 dark:divide-neutral-800/80 border-neutral-100 dark:border-neutral-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <button
              onClick={() => onSelectSampleArtist?.(sampleArtist)}
              className="font-medium text-neutral-900 dark:text-neutral-100 hover:underline flex items-center gap-1.5 truncate"
              title="Click to load Christopher Nolan's live feed"
            >
              <span>{sampleArtist.name}</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </button>
          </div>
          <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 flex-shrink-0">
            {selectedFormat === "cinema" ? "2026-07-17" : "2026-10-25"}
          </span>
        </div>

        {/* Entry Content Body */}
        <div className="flex gap-3.5 sm:gap-4 items-start">
          {/* Poster Thumbnail */}
          <div className="w-16 h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex-shrink-0 overflow-hidden shadow-sm flex flex-col items-center justify-center text-neutral-400">
            <Film className="w-6 h-6 stroke-[1.5]" />
            <span className="text-[9px] font-mono mt-1 text-neutral-400">FILM</span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-tight">
                Untitled Christopher Nolan Event Film
              </h3>
            </div>

            {/* Metadata Line */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Movie</span>
              <span>·</span>
              <span>Director, Writer</span>
              <span>·</span>
              <span>2h 45m</span>
              <span>·</span>
              <span>English</span>
              <span>·</span>
              <span>US 🇺🇸</span>
            </div>

            {/* Interactive Format Toggle */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedFormat("cinema")}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  selectedFormat === "cinema"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Theatrical
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat("home")}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  selectedFormat === "home"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                Streaming / Digital
              </button>
            </div>

            {/* Watch Providers / Status */}
            {selectedFormat === "cinema" ? (
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span>Opening in IMAX & Theaters nationwide</span>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>Stream on Netflix, Apple TV · 4K HDR</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlights: No ads. No tracking. Pure RSS. */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>No ads</span>
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>No tracking</span>
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Pure RSS</span>
        </span>
      </div>
    </div>
  );
}
