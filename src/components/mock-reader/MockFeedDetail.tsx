"use client";

import { SampleFeedItem, SampleArtistSummary } from "@/data/mockFeed";
import { createPersonSlug } from "@/lib/slug";

interface MockFeedDetailProps {
  activeItem: SampleFeedItem;
  onArtistClick: (e: React.MouseEvent, artist: SampleArtistSummary) => void;
}

export function MockFeedDetail({ activeItem, onArtistClick }: MockFeedDetailProps) {
  const artistSlug = createPersonSlug(activeItem.artist.id, activeItem.artist.name);

  return (
    <div className="md:col-span-7 bg-white dark:bg-[#121214] flex flex-col h-full min-h-0 overflow-hidden">
      {/* Rendered Article Content */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1 min-h-0">
        {/* Header Section (Author row + Divider + Large Title + Timestamp) */}
        <div className="space-y-3">
          {/* Author row */}
          <div className="flex items-center justify-between">
            <a
              href={`/${artistSlug}`}
              onClick={(e) => onArtistClick(e, activeItem.artist)}
              className="text-base font-semibold text-[#007aff] dark:text-[#2997ff] hover:underline cursor-pointer flex items-center gap-1.5"
              title={`View ${activeItem.artist.name}'s filmography in Magnanium`}
            >
              <span>{activeItem.artist.name}</span>
            </a>
            <a
              href={`/${artistSlug}`}
              onClick={(e) => onArtistClick(e, activeItem.artist)}
              title={`View ${activeItem.artist.name}'s filmography in Magnanium`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeItem.artist.avatar}
                alt={activeItem.artist.name}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded-lg object-cover object-[center_20%] border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm hover:ring-2 hover:ring-[#007aff]/40 transition-all cursor-pointer"
              />
            </a>
          </div>

          {/* Dividing line */}
          <hr className="border-t border-neutral-200 dark:border-neutral-800" />

          {/* Large Title & Timestamp */}
          <div className="space-y-1 pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
              <a
                href={activeItem.tmdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#007aff] dark:hover:text-[#2997ff] transition-colors"
                title="Open on TMDB (opens in new tab)"
              >
                {activeItem.title}
              </a>
            </h1>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 font-mono">
              {activeItem.pubDateDisplay}
            </p>
          </div>
        </div>

        {/* Movie/Show Poster (vertical portrait, matching actual RSS feed) */}
        <div className="max-w-[280px] sm:max-w-[320px] rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeItem.image}
            alt={activeItem.title}
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Formatted Metadata Lines */}
        <div className="space-y-1 text-xs text-neutral-800 dark:text-neutral-200 font-sans">
          <p>
            <strong className="font-semibold text-neutral-950 dark:text-white">Role:</strong>{" "}
            {activeItem.role}
          </p>
          <p>
            <strong className="font-semibold text-neutral-950 dark:text-white">Release:</strong>{" "}
            {activeItem.release}
          </p>
          <p>
            <strong className="font-semibold text-neutral-950 dark:text-white">Runtime:</strong>{" "}
            {activeItem.runtime}
          </p>
          <p>
            <strong className="font-semibold text-neutral-950 dark:text-white">Language:</strong>{" "}
            {activeItem.language}
          </p>
          {activeItem.director && (
            <p>
              <strong className="font-semibold text-neutral-950 dark:text-white">Director:</strong>{" "}
              {activeItem.director}
            </p>
          )}
          {activeItem.writer && (
            <p>
              <strong className="font-semibold text-neutral-950 dark:text-white">Writer:</strong>{" "}
              {activeItem.writer}
            </p>
          )}
          {activeItem.stars && (
            <p>
              <strong className="font-semibold text-neutral-950 dark:text-white">Stars:</strong>{" "}
              {activeItem.stars}
            </p>
          )}
        </div>

        {/* Description Overview (Plot) */}
        {activeItem.overview && (
          <div className="pt-1">
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-xs sm:text-[13px]">
              {activeItem.overview}
            </p>
          </div>
        )}

        {/* Streaming Box (JustWatch) - below the plot */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-1 text-xs">
          {activeItem.streaming && (
            <p>
              <strong className="font-semibold text-neutral-950 dark:text-white">
                Streaming in US:
              </strong>{" "}
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {activeItem.streaming}
              </span>
            </p>
          )}
          {activeItem.rentBuy && (
            <p>
              <strong className="font-semibold text-neutral-950 dark:text-white">
                Rent / Buy:
              </strong>{" "}
              <span className="text-neutral-600 dark:text-neutral-300">
                {activeItem.rentBuy}
              </span>
            </p>
          )}
          <div className="pt-1 text-[11px]">
            <a
              href={activeItem.justWatchUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#007aff] dark:text-[#2997ff] hover:underline inline-flex items-center gap-1 font-medium"
            >
              View all streaming options on JustWatch &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
