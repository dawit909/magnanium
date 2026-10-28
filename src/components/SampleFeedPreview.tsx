"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { createPersonSlug } from "@/lib/slug";

interface SampleArtistSummary {
  id: number;
  name: string;
  department: string;
  avatar: string;
  popularity: number;
}

interface SampleFeedItem {
  id: string;
  title: string;
  artist: SampleArtistSummary;
  role: string;
  release: string;
  dateDisplay: string;
  pubDateDisplay: string;
  runtime: string;
  language: string;
  director?: string;
  writer?: string;
  stars?: string;
  image: string;
  streaming?: string;
  rentBuy?: string;
  justWatchUrl: string;
  tmdbUrl: string;
  overview: string;
}

const TOM_HANKS: SampleArtistSummary = {
  id: 31,
  name: "Tom Hanks",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/oFvZoKI6lvU03n4YoNGAll9rkas.jpg",
  popularity: 10.9,
};

const EMMA_MYERS: SampleArtistSummary = {
  id: 2604515,
  name: "Emma Myers",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/v1Y8RP39135ZOary9M4MbkrCAdn.jpg",
  popularity: 6.8,
};

const CHRISTOPHER_NOLAN: SampleArtistSummary = {
  id: 525,
  name: "Christopher Nolan",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
  popularity: 7.2,
};

const DENIS_VILLENEUVE: SampleArtistSummary = {
  id: 137427,
  name: "Denis Villeneuve",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg",
  popularity: 4.1,
};

const SCARLETT_JOHANSSON: SampleArtistSummary = {
  id: 1245,
  name: "Scarlett Johansson",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/tgxYh3jMs5bY2Ub4d2dcp9iaz1R.jpg",
  popularity: 11.2,
};

const SAMPLE_ITEMS: SampleFeedItem[] = [
  {
    id: "ts5",
    title: "Toy Story 5",
    artist: TOM_HANKS,
    role: "Actor (Woody (voice))",
    release: "2026-06-19 (US)",
    dateDisplay: "Jun 19, 2026",
    pubDateDisplay: "JUN 19, 2026 AT 9:00 AM",
    runtime: "1h 42m",
    language: "English",
    director: "Andrew Stanton",
    writer: "Andrew Stanton, Kenna Harris",
    stars: "Joan Cusack, Tom Hanks, Tim Allen",
    image: "https://image.tmdb.org/t/p/w780/qjTqY5coNiz6sVtPng40IzltsoN.jpg",
    streaming: "[Stream on Disney+]",
    rentBuy: "[Rent on Amazon Video] · [Rent on Apple TV] · [Rent on Google Play]",
    justWatchUrl: "https://www.justwatch.com/us/movie/toy-story-5",
    tmdbUrl: "https://www.themoviedb.org/movie/1084244",
    overview:
      "When Bonnie receives a Lilypad tablet as a gift and becomes obsessed, Buzz, Woody, Jessie and the rest of the gang's jobs become exponentially harder when they have to go head to head with the all-new threat to playtime.",
  },
  {
    id: "minecraft",
    title: "A Minecraft Movie",
    artist: EMMA_MYERS,
    role: "Actor (Natalie)",
    release: "2025-04-04 (US)",
    dateDisplay: "Apr 4, 2025",
    pubDateDisplay: "APR 4, 2025 AT 9:00 AM",
    runtime: "1h 41m",
    language: "English",
    director: "Jared Hess",
    writer: "Chris Bowman, Hubbel Palmer",
    stars: "Jack Black, Jason Momoa, Emma Myers",
    image: "https://image.tmdb.org/t/p/w780/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/950387",
    overview:
      "Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination. To get back home, they'll have to master this world while embarking on a magical quest with an unexpected, expert crafter, Steve.",
  },
  {
    id: "nolan-odyssey",
    title: "The Odyssey",
    artist: CHRISTOPHER_NOLAN,
    role: "Director, Writer, Producer",
    release: "2026-07-15 (US)",
    dateDisplay: "Jul 15, 2026",
    pubDateDisplay: "JUL 15, 2026 AT 10:00 AM",
    runtime: "2h 45m",
    language: "English",
    director: "Christopher Nolan",
    writer: "Christopher Nolan",
    stars: "Matt Damon, Tom Holland, Anne Hathaway",
    image: "https://image.tmdb.org/t/p/w780/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1368337",
    overview:
      "Odysseus, the legendary King of Ithaca, embarks on a long and perilous journey home after the fall of Troy, encountering mythical creatures, vengeful gods, and treacherous waters.",
  },
  {
    id: "wednesday-s2",
    title: "Wednesday: Season 2",
    artist: EMMA_MYERS,
    role: "Actor (Enid Sinclair)",
    release: "2025-09-15 (US)",
    dateDisplay: "Sep 15, 2025",
    pubDateDisplay: "SEP 15, 2025 AT 12:00 AM",
    runtime: "55m/ep",
    language: "English",
    director: "Tim Burton",
    writer: "Alfred Gough, Miles Millar",
    stars: "Jenna Ortega, Emma Myers, Hunter Doohan",
    image: "https://image.tmdb.org/t/p/w780/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",
    streaming: "[Stream on Netflix]",
    justWatchUrl: "https://www.justwatch.com/us/tv-show/wednesday",
    tmdbUrl: "https://www.themoviedb.org/tv/119051",
    overview:
      "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries while making new friends — and foes — alongside her vibrant werewolf roommate Enid Sinclair at Nevermore Academy.",
  },
  {
    id: "denis-dune3",
    title: "Dune: Part Three",
    artist: DENIS_VILLENEUVE,
    role: "Director, Screenplay, Producer",
    release: "2026-12-18 (US)",
    dateDisplay: "Dec 18, 2026",
    pubDateDisplay: "DEC 18, 2026 AT 9:00 AM",
    runtime: "2h 50m",
    language: "English",
    director: "Denis Villeneuve",
    writer: "Denis Villeneuve, Jon Spaihts",
    stars: "Timothée Chalamet, Zendaya, Florence Pugh",
    image: "https://image.tmdb.org/t/p/w780/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1170608",
    overview:
      "Nearly two decades after he seized control of the Imperium, Paul Atreides is now Emperor of the Known Universe, facing the unintended holy war waged in his name and conspiracies threatening Arrakis.",
  },
  {
    id: "scarlett-jurassic",
    title: "Jurassic World Rebirth",
    artist: SCARLETT_JOHANSSON,
    role: "Actor (Zora Bennett)",
    release: "2025-07-02 (US)",
    dateDisplay: "Jul 2, 2025",
    pubDateDisplay: "JUL 2, 2025 AT 9:00 AM",
    runtime: "2h 10m",
    language: "English",
    director: "Gareth Edwards",
    writer: "David Koepp",
    stars: "Scarlett Johansson, Jonathan Bailey, Mahershala Ali",
    image: "https://image.tmdb.org/t/p/w780/zNriRTr0kWwyaXPzdg1EIxf0BWk.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1234821",
    overview:
      "Five years after the events of Jurassic World Dominion, covert operations expert Zora Bennett leads a skilled team on a top-secret mission to secure genetic material from the world's three most massive dinosaurs.",
  },
  {
    id: "americas",
    title: "The Americas: A Wild 250th",
    artist: TOM_HANKS,
    role: "Actor (Narrator)",
    release: "2026-07-02 (US)",
    dateDisplay: "Jul 2, 2026",
    pubDateDisplay: "JUL 2, 2026 AT 8:00 PM",
    runtime: "42m",
    language: "English",
    director: "Anthony Geffen",
    stars: "Tom Hanks",
    image: "https://image.tmdb.org/t/p/w780/oFvZoKI6lvU03n4YoNGAll9rkas.jpg",
    streaming: "[Stream on Peacock, NBC]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1418733",
    overview:
      "Narrated by Tom Hanks, this special wildlife documentary showcases the breathtaking wonders, natural history, and diverse ecosystems across North and South America.",
  },
  {
    id: "ww2",
    title: "World War II with Tom Hanks: Season 1",
    artist: TOM_HANKS,
    role: "Actor (Self - Presenter)",
    release: "2026-05-25 (US)",
    dateDisplay: "May 25, 2026",
    pubDateDisplay: "MAY 25, 2026 AT 9:00 PM",
    runtime: "44m/ep",
    language: "English",
    director: "Matthew Wortman",
    writer: "Tom Hanks, Matthew Wortman",
    stars: "Tom Hanks",
    image: "https://image.tmdb.org/t/p/w780/xVN8rq2VM9cvFmM0grv1AFnhO6d.jpg",
    streaming: "[Stream on History Vault, Prime Video]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/tv/254779",
    overview:
      "Hosted and executive produced by Tom Hanks, this landmark historical docuseries brings rare footage, restored letters, and firsthand accounts to life.",
  },
  {
    id: "phoenician",
    title: "The Phoenician Scheme",
    artist: TOM_HANKS,
    role: "Actor (Leland)",
    release: "2025-05-23 (US)",
    dateDisplay: "May 23, 2025",
    pubDateDisplay: "MAY 23, 2025 AT 12:00 AM",
    runtime: "1h 58m",
    language: "English",
    director: "Wes Anderson",
    writer: "Wes Anderson, Roman Coppola",
    stars: "Benicio del Toro, Michael Cera, Tom Hanks",
    image: "https://image.tmdb.org/t/p/w780/bajke0ThKJ2V2iHE9DDYOJGdS7a.jpg",
    streaming: "[Stream on Peacock]",
    rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1137350",
    overview:
      "Wealthy businessman Zsa-zsa Korda appoints his only daughter, a nun, as sole heir to his estate. As Korda embarks on a new enterprise, they soon become the target of scheming tycoons, foreign terrorists, and determined assassins.",
  },
];

interface SampleFeedPreviewProps {
  onSelectSampleArtist?: (person: TMDBPersonSearchResult) => void;
}

export default function SampleFeedPreview({ onSelectSampleArtist }: SampleFeedPreviewProps) {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string>("ts5");
  const [readIds, setReadIds] = useState<Set<string>>(new Set(["ts5"]));

  // Draggable window state
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    baselineLeft: number;
    baselineTop: number;
  }>({
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    baselineLeft: 0,
    baselineTop: 0,
  });

  // Clamp offset to ensure window borders strictly never leave website borders
  const clampOffset = useCallback(
    (
      proposedX: number,
      proposedY: number,
      bLeft?: number,
      bTop?: number
    ): { x: number; y: number } => {
      if (!containerRef.current || !windowRef.current) {
        return { x: proposedX, y: proposedY };
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const windowRect = windowRef.current.getBoundingClientRect();

      const baselineLeft = bLeft ?? containerRect.left;
      const baselineTop = bTop ?? containerRect.top;
      const winWidth = windowRect.width;
      const winHeight = windowRect.height;

      // Website horizontal bounds (viewport width / client width)
      const maxPageWidth = document.documentElement.clientWidth || window.innerWidth;
      const minX = -baselineLeft;
      const maxX = maxPageWidth - baselineLeft - winWidth;

      let clampedX: number;
      if (maxX < minX) {
        // Narrower than window (e.g. mobile or high zoom): pin to left edge
        clampedX = minX;
      } else {
        clampedX = Math.max(minX, Math.min(maxX, proposedX));
      }

      // Website vertical bounds
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );

      // Top border cannot leave the top of the webpage or the top of the visible screen
      const minY = Math.max(-baselineTop, -(baselineTop + window.scrollY));

      // Bottom border cannot leave the bottom of the website
      const maxY = docHeight - (baselineTop + window.scrollY + winHeight);

      let clampedY: number;
      if (maxY < minY) {
        clampedY = minY;
      } else {
        clampedY = Math.max(minY, Math.min(maxY, proposedY));
      }

      return { x: clampedX, y: clampedY };
    },
    []
  );

  // Monitor window resize and zoom level changes to re-clamp window inside website border
  useEffect(() => {
    const handleResize = () => {
      setOffset((curr) => {
        const clamped = clampOffset(curr.x, curr.y);
        if (clamped.x === curr.x && clamped.y === curr.y) return curr;
        return clamped;
      });
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    let ro: ResizeObserver | null = null;
    if (windowRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(windowRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      ro?.disconnect();
    };
  }, [clampOffset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Primary button only

    if (!containerRef.current || !windowRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      baselineLeft: containerRect.left,
      baselineTop: containerRect.top,
    };

    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      const proposedX = dragStartRef.current.startOffsetX + deltaX;
      const proposedY = dragStartRef.current.startOffsetY + deltaY;

      const clamped = clampOffset(
        proposedX,
        proposedY,
        dragStartRef.current.baselineLeft,
        dragStartRef.current.baselineTop
      );

      setOffset(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const activeItem =
    SAMPLE_ITEMS.find((item) => item.id === selectedId) || SAMPLE_ITEMS[0];
  const unreadCount = SAMPLE_ITEMS.filter((item) => !readIds.has(item.id)).length;

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleArtistClick = (e: React.MouseEvent, artist: SampleArtistSummary) => {
    e.preventDefault();
    const tmdbPerson: TMDBPersonSearchResult = {
      id: artist.id,
      name: artist.name,
      original_name: artist.name,
      known_for_department: artist.department,
      profile_path: artist.avatar.replace(
        "https://image.tmdb.org/t/p/w180_and_h180_face",
        ""
      ),
      popularity: artist.popularity,
    };
    onSelectSampleArtist?.(tmdbPerson);
    const slug = createPersonSlug(artist.id, artist.name);
    router.push(`/${slug}`);
  };

  return (
    <div
      ref={containerRef}
      className="w-full max-w-3xl mx-auto py-4 sm:py-8 space-y-4 animate-in fade-in duration-300 relative"
    >
      {/* Mock macOS RSS Reader Window */}
      <div
        ref={windowRef}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          willChange: isDragging ? "transform" : "auto",
        }}
        className={`rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-[#18181b] overflow-hidden relative ${
          isDragging
            ? "z-40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85)] ring-2 ring-[#007aff]/40 transition-none"
            : offset.x !== 0 || offset.y !== 0
            ? "z-30 shadow-2xl transition-transform duration-200 ease-out"
            : "shadow-2xl transition-transform duration-200 ease-out"
        }`}
      >
        {/* macOS Window Title Bar (Draggable Handle) */}
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={() => setOffset({ x: 0, y: 0 })}
          className={`px-4 py-2.5 bg-neutral-100 dark:bg-[#202023] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between select-none touch-none transition-colors ${
            isDragging
              ? "cursor-grabbing bg-neutral-200/80 dark:bg-[#28282c]"
              : "cursor-grab hover:bg-neutral-200/50 dark:hover:bg-[#252528]"
          }`}
          title="Drag by top bar to move · Double-click to center"
        >
          <div className="flex items-center gap-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setOffset({ x: 0, y: 0 });
              }}
              title="Reset position"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:opacity-80 transition-opacity"
            />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <span
              onClick={(e) => {
                e.stopPropagation();
                setOffset({ x: 0, y: 0 });
              }}
              title="Center window"
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer hover:opacity-80 transition-opacity"
            />
          </div>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            RSS Reader — Preview
          </span>
          <div className="w-12 text-right">
            {(offset.x !== 0 || offset.y !== 0) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOffset({ x: 0, y: 0 });
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline"
                title="Reset position"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Master-Detail RSS Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Left Column: Unified Feed Items List */}
          <div className="md:col-span-5 bg-neutral-50/80 dark:bg-[#161618] border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col">
            {/* List Header */}
            <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Movies, Shows
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
                </div>
              </div>
            </div>

            {/* Clickable Items */}
            <div className="p-1.5 space-y-1 overflow-y-auto flex-1">
              {SAMPLE_ITEMS.map((item) => {
                const isSelected = item.id === selectedId;
                const isUnread = !readIds.has(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      window.open(item.tmdbUrl, "_blank", "noopener,noreferrer");
                    }}
                    title="Click to view · Double-click to open TMDB page"
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2 text-xs ${
                      isSelected
                        ? "bg-[#007aff] text-white shadow-sm ring-1 ring-blue-500"
                        : "hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {/* Unread indicator */}
                    <div className="pt-1 flex-shrink-0">
                      {isUnread ? (
                        <span
                          className={`block w-2 h-2 rounded-full ${
                            isSelected ? "bg-white" : "bg-[#007aff]"
                          }`}
                        />
                      ) : (
                        <span className="block w-2 h-2" />
                      )}
                    </div>

                    {/* Artist avatar */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.artist.avatar}
                      alt={item.artist.name}
                      className="w-8 h-8 rounded-lg object-cover object-[center_20%] flex-shrink-0 border border-black/10 dark:border-white/10"
                    />

                    {/* Item info */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-semibold truncate leading-tight">
                        {item.title}
                      </div>
                      <div
                        className={`text-[11px] line-clamp-2 leading-tight ${
                          isSelected ? "text-white/85" : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        Role: {item.role} Release: {item.release} Runtime: {item.runtime}...
                      </div>
                      <div
                        className={`flex items-center justify-between text-[10px] pt-0.5 ${
                          isSelected ? "text-white/75" : "text-neutral-400 dark:text-neutral-500"
                        }`}
                      >
                        <span>{item.artist.name}</span>
                        <span>{item.dateDisplay}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Feed Content Reader */}
          <div className="md:col-span-7 bg-white dark:bg-[#121214] flex flex-col">
            {/* Rendered Article Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1">
              {/* Header Section (Author row + Divider + Large Title + Timestamp) */}
              <div className="space-y-3">
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <a
                    href={`/${createPersonSlug(activeItem.artist.id, activeItem.artist.name)}`}
                    onClick={(e) => handleArtistClick(e, activeItem.artist)}
                    className="text-base font-semibold text-[#007aff] dark:text-[#2997ff] hover:underline cursor-pointer flex items-center gap-1.5"
                    title={`View ${activeItem.artist.name}'s filmography in Magnanium`}
                  >
                    <span>{activeItem.artist.name}</span>
                  </a>
                  <a
                    href={`/${createPersonSlug(activeItem.artist.id, activeItem.artist.name)}`}
                    onClick={(e) => handleArtistClick(e, activeItem.artist)}
                    title={`View ${activeItem.artist.name}'s filmography in Magnanium`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeItem.artist.avatar}
                      alt={activeItem.artist.name}
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

              {/* Image banner */}
              <div className="rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeItem.image}
                  alt={activeItem.title}
                  className="w-full h-full object-cover"
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

              {/* Streaming Box (JustWatch) */}
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

              {/* Description Overview below Streaming Box */}
              {activeItem.overview && (
                <div className="pt-1">
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-xs sm:text-[13px]">
                    {activeItem.overview}
                  </p>
                </div>
              )}
            </div>
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
