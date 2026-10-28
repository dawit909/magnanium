"use client";

import { User } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

interface ArtistHeroProps {
  person: TMDBPersonSearchResult;
}

export default function ArtistHero({ person }: ArtistHeroProps) {
  return (
    <div className="flex items-center gap-5 sm:gap-6 pb-6 border-b border-neutral-200/80 dark:border-neutral-800/80">
      {person.profile_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
          alt={person.name}
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-md flex-shrink-0"
        />
      ) : (
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 flex-shrink-0">
          <User className="w-16 h-16" />
        </div>
      )}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {person.name}
        </h2>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 inline-block">
          {person.known_for_department}
        </span>
      </div>
    </div>
  );
}
