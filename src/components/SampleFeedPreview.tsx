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
} from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";

interface SampleFeedItem {
  id: string;
  title: string;
  role: string;
  release: string;
  dateDisplay: string;
  runtime: string;
  language: string;
  director?: string;
  writer?: string;
  stars?: string;
  image: string;
  streaming?: string;
  rentBuy?: string;
  justWatchUrl: string;
}

const SAMPLE_ITEMS: SampleFeedItem[] = [
  {
    id: "americas",
    title: "The Americas: A Wild 250th",
    role: "Actor (Narrator)",
    release: "2026-07-02 (US)",
    dateDisplay: "Jul 2, 2026",
    runtime: "42m",
    language: "English",
    director: "Anthony Geffen",
    stars: "Tom Hanks",
    image: "https://image.tmdb.org/t/p/w780/oFvZoKI6lvU03n4YoNGAll9rkas.jpg",
    streaming: "[Stream on Peacock, NBC]",
    justWatchUrl: "https://www.justwatch.com",
  },
  {
    id: "ts5",
    title: "Toy Story 5",
    role: "Actor (Woody (voice))",
    release: "2026-06-09 (US)",
    dateDisplay: "Jun 9, 2026",
    runtime: "1h 42m",
    language: "English",
    director: "Andrew Stanton",
    writer: "Andrew Stanton, Kenna Harris",
    stars: "Joan Cusack, Tom Hanks, Tim Allen",
    image: "https://image.tmdb.org/t/p/w780/qjTqY5coNiz6sVtPng40IzltsoN.jpg",
    streaming: "[Stream on Disney+]",
    rentBuy: "[Rent on Amazon Video] · [Rent on Apple TV] · [Rent on Google Play]",
    justWatchUrl: "https://www.justwatch.com/us/movie/toy-story-5",
  },
  {
    id: "ww2",
    title: "World War II with Tom Hanks: Season 1",
    role: "Actor (Self - Presenter)",
    release: "2026-05-25 (US)",
    dateDisplay: "May 25, 2026",
    runtime: "44m/ep",
    language: "English",
    director: "Matthew Wortman",
    writer: "Tom Hanks, Matthew Wortman",
    stars: "Tom Hanks",
    image: "https://image.tmdb.org/t/p/w780/xVN8rq2VM9cvFmM0grv1AFnhO6d.jpg",
    streaming: "[Stream on History Vault, Prime Video]",
    justWatchUrl: "https://www.justwatch.com",
  },
  {
    id: "shut-up",
    title: "The Shut Up Fairy",
    role: "Actor (Self (archival footage))",
    release: "2026-05-03 (US)",
    dateDisplay: "May 3, 2026",
    runtime: "2h 4m",
    language: "English",
    director: "Gillian Robespierre",
    writer: "Gillian Robespierre",
    stars: "Tom Hanks, Rita Wilson",
    image: "https://image.tmdb.org/t/p/w780/5VcrtQBVlZbYbi8hLoVlQ4xaMjX.jpg",
    rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video] · [Rent on Fandango]",
    justWatchUrl: "https://www.justwatch.com",
  },
];

interface SampleFeedPreviewProps {
  onSelectSampleArtist?: (person: TMDBPersonSearchResult) => void;
}

export default function SampleFeedPreview({ onSelectSampleArtist }: SampleFeedPreviewProps) {
  const [selectedId, setSelectedId] = useState<string>("ts5");
  const [readIds, setReadIds] = useState<Set<string>>(new Set(["ts5"]));

  const activeItem = SAMPLE_ITEMS.find((item) => item.id === selectedId) || SAMPLE_ITEMS[0];
  const unreadCount = SAMPLE_ITEMS.filter((item) => !readIds.has(item.id)).length;

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleLoadTomHanks = () => {
    onSelectSampleArtist?.({
      id: 31,
      name: "Tom Hanks",
      original_name: "Tom Hanks",
      known_for_department: "Acting",
      profile_path: "/oFvZoKI6lvU03n4YoNGAll9rkas.jpg",
      popularity: 10.9,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 space-y-4 animate-in fade-in duration-300">
      {/* Mock macOS NetNewsWire Window */}
      <div className="rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-[#18181b] shadow-2xl overflow-hidden">
        {/* macOS Window Title Bar */}
        <div className="px-4 py-2.5 bg-neutral-100 dark:bg-[#202023] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>
          <button
            onClick={handleLoadTomHanks}
            className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Click to view full live feed for Tom Hanks"
          >
            NetNewsWire — Tom Hanks Feed
          </button>
          <div className="w-12" />
        </div>

        {/* Master-Detail NetNewsWire Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* Left Column: Feed Items List */}
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
              <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                <Radio className="w-3.5 h-3.5" />
                <SlidersHorizontal className="w-3.5 h-3.5" />
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
                      src="https://image.tmdb.org/t/p/w180_and_h180_face/oFvZoKI6lvU03n4YoNGAll9rkas.jpg"
                      alt="Tom Hanks"
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
                        <span>Tom Hanks</span>
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
            {/* NetNewsWire Toolbar */}
            <div className="p-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-400 dark:text-neutral-500 text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                <Star className="w-3.5 h-3.5 hover:text-amber-500 transition-colors cursor-pointer" />
                <CheckCircle2 className="w-3.5 h-3.5 hover:text-emerald-500 transition-colors cursor-pointer" />
                <ExternalLink className="w-3.5 h-3.5 hover:text-blue-500 transition-colors cursor-pointer" />
              </div>
              <div className="flex items-center gap-3">
                <ChevronsRight className="w-3.5 h-3.5" />
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Rendered Article Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
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
