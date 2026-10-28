"use client";

import { Film, Tv } from "lucide-react";
import { FormattedRelease } from "@/types/tmdb";

interface ReleaseListProps {
  releases: FormattedRelease[];
  isLoading: boolean;
}

export default function ReleaseList({ releases, isLoading }: ReleaseListProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          Releases ({releases.length})
        </span>
        {isLoading && (
          <span className="text-neutral-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-ping" />
            Updating...
          </span>
        )}
      </div>

      {releases.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
          No releases found for the selected filters.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900 border-t border-b border-neutral-100 dark:border-neutral-900">
          {releases.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Poster Thumbnail */}
                <div className="w-10 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200/80 dark:border-neutral-700 flex-shrink-0 shadow-sm">
                  {item.posterPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        item.posterPath.startsWith("http")
                          ? item.posterPath
                          : `https://image.tmdb.org/t/p/w185${item.posterPath}`
                      }
                      alt={item.movieTitle}
                      loading="lazy"
                      decoding="async"
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
                    {item.runtime && (
                      <>
                        <span>·</span>
                        <span>{item.runtime}</span>
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

                  {/* Streaming & Watch Providers Badge */}
                  {item.watchProviders?.stream && item.watchProviders.stream.length > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="truncate">
                        Stream on {item.watchProviders.stream.slice(0, 3).join(", ")}
                      </span>
                    </div>
                  ) : item.watchProviders?.rent && item.watchProviders.rent.length > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      <span className="truncate">
                        Rent on {item.watchProviders.rent.slice(0, 2).join(", ")}
                      </span>
                    </div>
                  ) : null}
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
  );
}
