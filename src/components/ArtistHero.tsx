"use client";

import { useState, memo } from "react";
import { User, ExternalLink } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

interface ArtistHeroProps {
  person: TMDBPersonSearchResult;
}

const ArtistHero = memo(function ArtistHero({ person }: ArtistHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="flex items-center gap-5 sm:gap-6 pb-6 border-b border-neutral-200/80 dark:border-neutral-800/80">
      {person.profile_path ? (
        <a
          href={`https://www.themoviedb.org/person/${person.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center justify-center text-neutral-300 dark:text-neutral-600 transition-opacity hover:opacity-90"
          title="View on TMDB"
        >
          {/* Neutral silhouette placeholder while downloading - never shows raw alt text */}
          <User className="w-14 h-14 sm:w-16 sm:h-16 pointer-events-none" />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(img) => {
              if (img?.complete) {
                setIsLoaded(true);
              }
            }}
            src={`https://image.tmdb.org/t/p/w300_and_h300_face${person.profile_path}`}
            alt={person.name}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://image.tmdb.org/t/p/w185${person.profile_path}`;
            }}
            className={`absolute inset-0 w-full h-full object-cover object-[center_20%] text-transparent select-none transition-opacity duration-150 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </a>
      ) : (
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 flex-shrink-0">
          <User className="w-16 h-16" />
        </div>
      )}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
          <a
            href={`https://www.themoviedb.org/person/${person.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline group"
            title="View on TMDB"
          >
            <span>{person.name}</span>
            <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300 transition-colors" />
          </a>
        </h2>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 inline-block">
          {person.known_for_department}
        </span>
      </div>
    </div>
  );
});

export default ArtistHero;
