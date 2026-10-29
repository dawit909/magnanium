"use client";

import { memo } from "react";
import { Film, Tv } from "lucide-react";
import { FormattedRelease } from "@/types/tmdb";
import { normalizeDistributorNote } from "@/lib/tmdb/releases";

interface ReleaseListProps {
  releases: FormattedRelease[];
  isLoading: boolean;
  totalCount?: number | null;
}

const GENERIC_NOTE_TERMS = new Set([
  "theatrical",
  "theatrical release",
  "cinema",
  "cinema release",
  "wide",
  "wide release",
  "limited",
  "limited release",
  "premiere",
  "festival",
  "digital",
  "digital release",
  "physical",
  "physical release",
]);

function getInformativeNote(note?: string | null, releaseTypeLabel?: string): string | null {
  if (!note) return null;
  const clean = note.trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();
  if (GENERIC_NOTE_TERMS.has(lower)) {
    return null;
  }

  if (releaseTypeLabel && lower === releaseTypeLabel.toLowerCase()) {
    return null;
  }

  return normalizeDistributorNote(clean);
}

const ReleaseItemCard = memo(function ReleaseItemCard({ item }: { item: FormattedRelease }) {
  const posterSrc = item.posterPath
    ? item.posterPath.startsWith("http")
      ? item.posterPath
      : `https://image.tmdb.org/t/p/w185${item.posterPath}`
    : null;

  const informativeNote = getInformativeNote(item.note, item.releaseTypeLabel);

  return (
    <div className="py-3 flex items-start justify-between gap-3 group">
      <div className="flex items-start gap-3 min-w-0">
        {/* Poster Thumbnail */}
        <div className="w-10 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200/80 dark:border-neutral-700 flex-shrink-0 shadow-sm">
          {posterSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterSrc}
              alt={item.movieTitle}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform text-transparent select-none"
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
        <div className="min-w-0 pt-0.5">
          <a
            href={item.tmdbUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sm text-neutral-900 dark:text-neutral-100 hover:underline truncate block leading-snug"
          >
            {item.movieTitle}
          </a>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 truncate">
            <span className="font-medium text-neutral-600 dark:text-neutral-300">
              {item.mediaType === "tv" ? "TV" : "Movie"}
            </span>
            {item.role && (
              <>
                <span>·</span>
                <span>{item.role}</span>
              </>
            )}
            {item.runtime && (
              <>
                <span>·</span>
                <span>{item.runtime}</span>
              </>
            )}
            {item.language && (
              <>
                <span>·</span>
                <span>{item.language}</span>
              </>
            )}
            <span>·</span>
            <span>{item.country}</span>
          </div>

          {/* Director / Stars */}
          {(item.director || (item.stars && item.stars.length > 0)) && (
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {item.director && <span>Dir: {item.director}</span>}
              {item.director && item.stars && item.stars.length > 0 && <span> · </span>}
              {item.stars && item.stars.length > 0 && (
                <span>Stars: {item.stars.join(", ")}</span>
              )}
            </div>
          )}

          {/* Sub-line: Rollout/Festival/Edition Note */}
          {informativeNote && (
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-full font-normal leading-tight">
              <span title={informativeNote}>{informativeNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date & Format Tag */}
      <div className="text-right flex-shrink-0 space-y-1 pt-0.5">
        <span
          className="inline-block max-w-[260px] sm:max-w-[340px] truncate align-middle px-2 py-0.5 rounded-full text-[10px] font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 shadow-sm"
          title={informativeNote ? `${item.releaseTypeLabel} (${informativeNote})` : item.releaseTypeLabel}
        >
          {item.releaseTypeLabel}
        </span>
        <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
          {item.releaseDate}
        </div>
      </div>
    </div>
  );
});

export default function ReleaseList({ releases, isLoading, totalCount }: ReleaseListProps) {
  const isFiltered = typeof totalCount === "number" && totalCount !== releases.length;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Releases
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title={
              isFiltered
                ? `${releases.length} releases shown of ${totalCount} unfiltered`
                : undefined
            }
          >
            {isFiltered ? (
              <span>
                {releases.length}{" "}
                <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                  / {totalCount}
                </span>
              </span>
            ) : (
              releases.length
            )}
          </span>
        </div>
        {isLoading && (
          <span className="text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-ping" />
            Updating...
          </span>
        )}
      </div>

      {releases.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-1.5">
          <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
            No releases match your current filters.
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Try switching the time window to &ldquo;All Releases&rdquo; or enabling additional media and role filters above.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900 border-t border-b border-neutral-100 dark:border-neutral-900">
          {releases.map((item) => (
            <ReleaseItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
