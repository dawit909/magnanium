"use client";

interface RecentArtist {
  id: number;
  name: string;
  slug: string;
}

interface RecentArtistsProps {
  artists: RecentArtist[];
  onSelect: (slug: string) => void;
}

export default function RecentArtists({ artists, onSelect }: RecentArtistsProps) {
  if (artists.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
        Recent
      </span>
      <div className="flex flex-wrap gap-2">
        {artists.map((artist) => (
          <button
            key={artist.id}
            onClick={() => onSelect(artist.slug)}
            className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm transition-all"
          >
            {artist.name}
          </button>
        ))}
      </div>
    </div>
  );
}
