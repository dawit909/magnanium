"use client";

import { useState } from "react";
import {
  FileText,
  Star,
  CheckCircle2,
  ExternalLink,
  Search,
  ChevronsRight,
  Radio,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

interface SampleFeedItem {
  id: string;
  title: string;
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

interface SampleArtist {
  id: number;
  name: string;
  badge: "Actor" | "Director";
  department: string;
  avatar: string;
  popularity: number;
  items: SampleFeedItem[];
}

const SAMPLE_ARTISTS: SampleArtist[] = [
  {
    id: 31,
    name: "Tom Hanks",
    badge: "Actor",
    department: "Acting",
    avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/oFvZoKI6lvU03n4YoNGAll9rkas.jpg",
    popularity: 10.9,
    items: [
      {
        id: "ts5",
        title: "Toy Story 5",
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
        id: "americas",
        title: "The Americas: A Wild 250th",
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
    ],
  },
  {
    id: 525,
    name: "Christopher Nolan",
    badge: "Director",
    department: "Directing",
    avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
    popularity: 7.2,
    items: [
      {
        id: "nolan-odyssey",
        title: "The Odyssey",
        role: "Director, Writer, Producer",
        release: "2026-07-15 (US)",
        dateDisplay: "Jul 15, 2026",
        pubDateDisplay: "JUL 15, 2026 AT 10:00 AM",
        runtime: "2h 45m",
        language: "English",
        director: "Christopher Nolan",
        writer: "Christopher Nolan",
        stars: "Matt Damon, Tom Holland, Anne Hathaway, Zendaya",
        image: "https://image.tmdb.org/t/p/w780/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg",
        streaming: "[Opening in Theaters & IMAX nationwide]",
        justWatchUrl: "https://www.justwatch.com",
        tmdbUrl: "https://www.themoviedb.org/movie/1368337",
        overview:
          "Odysseus, the legendary King of Ithaca, embarks on a long and perilous journey home after the fall of Troy, encountering mythical creatures, fierce gods, and treacherous waters.",
      },
      {
        id: "nolan-oppenheimer",
        title: "Oppenheimer",
        role: "Director, Writer, Producer",
        release: "2023-07-21 (US)",
        dateDisplay: "Jul 21, 2023",
        pubDateDisplay: "JUL 21, 2023 AT 9:00 AM",
        runtime: "3h 0m",
        language: "English",
        director: "Christopher Nolan",
        writer: "Christopher Nolan",
        stars: "Cillian Murphy, Emily Blunt, Matt Damon",
        image: "https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
        streaming: "[Stream on Prime Video]",
        rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
        justWatchUrl: "https://www.justwatch.com/us/movie/oppenheimer",
        tmdbUrl: "https://www.themoviedb.org/movie/872585",
        overview:
          "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, examining the theoretical physics breakthroughs and moral dilemmas that shaped the modern world.",
      },
    ],
  },
  {
    id: 137427,
    name: "Denis Villeneuve",
    badge: "Director",
    department: "Directing",
    avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg",
    popularity: 4.1,
    items: [
      {
        id: "denis-dune3",
        title: "Dune: Part Three",
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
        id: "denis-dune2",
        title: "Dune: Part Two",
        role: "Director, Screenplay, Producer",
        release: "2024-03-01 (US)",
        dateDisplay: "Mar 1, 2024",
        pubDateDisplay: "MAR 1, 2024 AT 9:00 AM",
        runtime: "2h 46m",
        language: "English",
        director: "Denis Villeneuve",
        writer: "Denis Villeneuve, Jon Spaihts",
        stars: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
        image: "https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s520Stq.jpg",
        streaming: "[Stream on Max]",
        rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
        justWatchUrl: "https://www.justwatch.com/us/movie/dune-part-two",
        tmdbUrl: "https://www.themoviedb.org/movie/693134",
        overview:
          "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      },
    ],
  },
  {
    id: 1245,
    name: "Scarlett Johansson",
    badge: "Actor",
    department: "Acting",
    avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/tgxYh3jMs5bY2Ub4d2dcp9iaz1R.jpg",
    popularity: 11.2,
    items: [
      {
        id: "scarlett-jurassic",
        title: "Jurassic World Rebirth",
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
        id: "scarlett-eleanor",
        title: "Eleanor the Great",
        role: "Director, Producer",
        release: "2025-09-04 (US)",
        dateDisplay: "Sep 4, 2025",
        pubDateDisplay: "SEP 4, 2025 AT 11:00 AM",
        runtime: "1h 38m",
        language: "English",
        director: "Scarlett Johansson",
        writer: "Tory Kamen",
        stars: "June Squibb, Chiwetel Ejiofor, Jessica Hecht",
        image: "https://image.tmdb.org/t/p/w780/tgxYh3jMs5bY2Ub4d2dcp9iaz1R.jpg",
        rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
        justWatchUrl: "https://www.justwatch.com",
        tmdbUrl: "https://www.themoviedb.org/movie/1212271",
        overview:
          "94-year-old Eleanor Morgenstein tries to rebuild her life after the death of her best friend, moving back to New York City and forging an unlikely friendship with a 19-year-old student.",
      },
      {
        id: "scarlett-transformers",
        title: "Transformers One",
        role: "Actor (Elita-1 (voice))",
        release: "2024-09-20 (US)",
        dateDisplay: "Sep 20, 2024",
        pubDateDisplay: "SEP 20, 2024 AT 9:00 AM",
        runtime: "1h 44m",
        language: "English",
        director: "Josh Cooley",
        writer: "Eric Pearson, Andrew Barrer, Gabriel Ferrari",
        stars: "Chris Hemsworth, Brian Tyree Henry, Scarlett Johansson",
        image: "https://image.tmdb.org/t/p/w780/cMfokHWle5lfCreoV08cbmkKv6G.jpg",
        streaming: "[Stream on Paramount+]",
        rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
        justWatchUrl: "https://www.justwatch.com/us/movie/transformers-one",
        tmdbUrl: "https://www.themoviedb.org/movie/698687",
        overview:
          "The untold origin story of Optimus Prime and Megatron, better known as sworn enemies, but once were friends bonded like brothers who changed the fate of Cybertron forever.",
      },
    ],
  },
];

interface SampleFeedPreviewProps {
  onSelectSampleArtist?: (person: TMDBPersonSearchResult) => void;
}

export default function SampleFeedPreview({ onSelectSampleArtist }: SampleFeedPreviewProps) {
  const [currentArtistId, setCurrentArtistId] = useState<number>(31);
  const currentArtist =
    SAMPLE_ARTISTS.find((a) => a.id === currentArtistId) || SAMPLE_ARTISTS[0];

  const [selectedId, setSelectedId] = useState<string>(currentArtist.items[0]?.id || "ts5");
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set([currentArtist.items[0]?.id || "ts5"])
  );

  const activeItem =
    currentArtist.items.find((item) => item.id === selectedId) || currentArtist.items[0];
  const unreadCount = currentArtist.items.filter((item) => !readIds.has(item.id)).length;

  const handleSelectArtist = (artistId: number) => {
    setCurrentArtistId(artistId);
    const artist = SAMPLE_ARTISTS.find((a) => a.id === artistId);
    if (artist && artist.items.length > 0) {
      setSelectedId(artist.items[0].id);
      setReadIds((prev) => new Set(prev).add(artist.items[0].id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleLoadCurrentArtist = () => {
    onSelectSampleArtist?.({
      id: currentArtist.id,
      name: currentArtist.name,
      original_name: currentArtist.name,
      known_for_department: currentArtist.department,
      profile_path: currentArtist.avatar.replace(
        "https://image.tmdb.org/t/p/w180_and_h180_face",
        ""
      ),
      popularity: currentArtist.popularity,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 space-y-4 animate-in fade-in duration-300">
      {/* Mock macOS RSS Reader Window */}
      <div className="rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-[#18181b] shadow-2xl overflow-hidden">
        {/* macOS Window Title Bar */}
        <div className="px-4 py-2.5 bg-neutral-100 dark:bg-[#202023] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            RSS Reader — Preview
          </span>
          <div className="w-12" />
        </div>

        {/* Famous Artists Switcher Tabs */}
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50/90 dark:bg-[#1a1a1d] border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider shrink-0 mr-1 pl-1">
            Feeds:
          </span>
          {SAMPLE_ARTISTS.map((artist) => {
            const isSelected = artist.id === currentArtistId;
            return (
              <button
                key={artist.id}
                onClick={() => handleSelectArtist(artist.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#007aff] text-white shadow-sm shadow-[#007aff]/25"
                    : "bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/80 border border-neutral-200/80 dark:border-neutral-700/60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
                <span>{artist.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {artist.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Master-Detail RSS Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Left Column: Feed Items List */}
          <div className="md:col-span-5 bg-neutral-50/80 dark:bg-[#161618] border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col">
            {/* List Header */}
            <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <span>Movies, Shows</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">
                    · Double-click opens TMDB
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                <Radio className="w-3.5 h-3.5" />
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Clickable Items */}
            <div className="p-1.5 space-y-1 overflow-y-auto flex-1">
              {currentArtist.items.map((item) => {
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
                      src={currentArtist.avatar}
                      alt={currentArtist.name}
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
                        <span>{currentArtist.name}</span>
                        <span>{item.dateDisplay}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Load into Configurator */}
            <div className="p-2 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-neutral-900/40">
              <button
                onClick={handleLoadCurrentArtist}
                className="w-full text-center py-1.5 px-2 rounded-lg text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Subscribe to {currentArtist.name}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Feed Content Reader */}
          <div className="md:col-span-7 bg-white dark:bg-[#121214] flex flex-col">
            {/* Native Toolbar */}
            <div className="p-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-400 dark:text-neutral-500 text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                <Star className="w-3.5 h-3.5 hover:text-amber-500 transition-colors cursor-pointer" />
                <CheckCircle2 className="w-3.5 h-3.5 hover:text-emerald-500 transition-colors cursor-pointer" />
                <button
                  onClick={() => window.open(activeItem.tmdbUrl, "_blank", "noopener,noreferrer")}
                  title="Open on TMDB"
                  className="hover:text-blue-500 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <ChevronsRight className="w-3.5 h-3.5" />
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Rendered Article Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1">
              {/* Header Section (Author row + Divider + Large Title + Timestamp) */}
              <div className="space-y-3">
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <a
                    href={activeItem.tmdbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-semibold text-[#007aff] dark:text-[#2997ff] hover:underline"
                  >
                    {currentArtist.name}
                  </a>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentArtist.avatar}
                    alt={currentArtist.name}
                    className="w-10 h-10 rounded-lg object-cover object-[center_20%] border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm"
                  />
                </div>

                {/* Dividing line */}
                <hr className="border-t border-neutral-200 dark:border-neutral-800" />

                {/* Large Title & Timestamp */}
                <div className="space-y-1 pt-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
                    {activeItem.title}
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
