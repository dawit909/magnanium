"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Rss, Maximize2 } from "lucide-react";
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

const SUMMER_H_HOWELL: SampleArtistSummary = {
  id: 1524215,
  name: "Summer H. Howell",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/YkxshNKixpwZOKgZ9bpWBuKkok.jpg",
  popularity: 7.3,
};

const TOM_HOLLAND: SampleArtistSummary = {
  id: 1136406,
  name: "Tom Holland",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/5OK84Wn1bIEIThFKcVoaN087mLj.jpg",
  popularity: 14.3,
};

const JAMES_CAMERON: SampleArtistSummary = {
  id: 2710,
  name: "James Cameron",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/9NAZnTjBQ9WcXAQEzZpKy4vdQto.jpg",
  popularity: 3.4,
};

const RAW_SAMPLE_ITEMS: SampleFeedItem[] = [
  {
    id: "avatar-4",
    title: "Avatar 4",
    artist: JAMES_CAMERON,
    role: "Director, Writer, Producer",
    release: "2029-12-19 (US)",
    dateDisplay: "Dec 19, 2029",
    pubDateDisplay: "DEC 19, 2029 AT 9:00 AM",
    runtime: "3h 10m",
    language: "English",
    director: "James Cameron",
    writer: "James Cameron, Josh Friedman",
    stars: "Sam Worthington, Zoe Saldaña, Sigourney Weaver",
    image: "https://image.tmdb.org/t/p/w780/qzMYKnT4MG1d0gnhwytr4cKhUvS.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/216527",
    overview:
      "The fourth chapter in James Cameron's groundbreaking Avatar saga, continuing the journey of the Sully family across uncharted biomes of Pandora.",
  },
  {
    id: "summer-carrie",
    title: "Carrie",
    artist: SUMMER_H_HOWELL,
    role: "Actor (Carrie White)",
    release: "2026-10-07 (US)",
    dateDisplay: "Oct 7, 2026",
    pubDateDisplay: "OCT 7, 2026 AT 12:00 AM",
    runtime: "50m/ep",
    language: "English",
    director: "Mike Flanagan",
    writer: "Mike Flanagan, Stephen King",
    stars: "Summer H. Howell, Samantha Sloyan, Siena Agudong",
    image: "https://image.tmdb.org/t/p/w780/6mUMquPQBFJGqTACS3Azkwwrx8d.jpg",
    streaming: "[Stream on Prime Video]",
    justWatchUrl: "https://www.justwatch.com/us/tv-show/carrie",
    tmdbUrl: "https://www.themoviedb.org/tv/288673",
    overview:
      "After her father's sudden, untimely death thrusts her into the unforgiving ecosystem of public high school, Carrie is forced to navigate a viral bullying scandal that tears through her community, the relentless pressure and casual cruelty of the social‑media age, and the awakening of mysterious telekinetic powers that rise alongside her adolescence.",
  },
  {
    id: "holland-spiderman-bnd",
    title: "Spider-Man: Brand New Day",
    artist: TOM_HOLLAND,
    role: "Actor (Peter Parker / Spider-Man)",
    release: "2026-07-29 (US)",
    dateDisplay: "Jul 29, 2026",
    pubDateDisplay: "JUL 29, 2026 AT 9:00 AM",
    runtime: "2h 25m",
    language: "English",
    director: "Destin Daniel Cretton",
    writer: "Chris McKenna, Erik Sommers",
    stars: "Tom Holland, Sadie Sink, Zendaya",
    image: "https://image.tmdb.org/t/p/w780/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/969681",
    overview:
      "Fighting crime full-time as Spider-Man in a world that doesn't remember him—and the pressure of seeing his old friends move on without him—sparks a change in Peter Parker he may not have the power to control. But that transformation might also be the only thing that can stop a shocking new threat to the city and those he loves - a powerful villain no one can even see.",
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
];

// Sort descending by release date (newest/future release first, matching RSS readers)
const SAMPLE_ITEMS: SampleFeedItem[] = [...RAW_SAMPLE_ITEMS].sort((a, b) =>
  b.release.localeCompare(a.release)
);

interface SampleFeedPreviewProps {
  onSelectSampleArtist?: (person: TMDBPersonSearchResult) => void;
}

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MOCK_SETTINGS_KEY = "magnanium_mock_rss_settings";

interface MockRssSettings {
  selectedId?: string;
  readIds?: string[];
  isMinimized?: boolean;
  size?: { width: number; height: number } | null;
  offset?: { x: number; y: number };
}

// Clean up legacy global localStorage once on client side
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem(MOCK_SETTINGS_KEY);
  } catch {}
}

const getInitialTabSettings = (): MockRssSettings | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(MOCK_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved) as MockRssSettings;
    }
  } catch {}
  return null;
};

export default function SampleFeedPreview({ onSelectSampleArtist }: SampleFeedPreviewProps) {
  const router = useRouter();

  const initialSettings = useRef<MockRssSettings | null>(null);
  if (!initialSettings.current && typeof window !== "undefined") {
    initialSettings.current = getInitialTabSettings();
  }

  const [selectedId, setSelectedId] = useState<string>(() => {
    const s = initialSettings.current;
    if (s?.selectedId && SAMPLE_ITEMS.some((i) => i.id === s.selectedId)) {
      return s.selectedId;
    }
    return "ts5";
  });

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const s = initialSettings.current;
    if (Array.isArray(s?.readIds)) {
      return new Set(s.readIds);
    }
    return new Set(["ts5"]);
  });

  // isClosed is strictly per-view (not stored in sessionStorage so visits to localhost:3000 always show the mock)
  const [isClosed, setIsClosed] = useState(false);

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const s = initialSettings.current;
    if (typeof s?.isMinimized === "boolean") {
      return s.isMinimized;
    }
    return false;
  });

  const [size, setSize] = useState<{ width: number; height: number } | null>(() => {
    return initialSettings.current?.size ?? null;
  });

  const [isResizing, setIsResizing] = useState(false);

  // Draggable window state
  const [offset, setOffset] = useState<{ x: number; y: number }>(() => {
    return initialSettings.current?.offset ?? { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Persist tab settings to sessionStorage on changes (scoped only to the current tab)
  useEffect(() => {
    try {
      const settings: MockRssSettings = {
        selectedId,
        readIds: Array.from(readIds),
        isMinimized,
        size,
        offset,
      };
      sessionStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [selectedId, readIds, isMinimized, size, offset]);
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

  const resizeStartRef = useRef<{
    dir: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startOffsetX: number;
    startOffsetY: number;
    baselineLeft: number;
    baselineTop: number;
    baselineDocHeight: number;
  }>({
    dir: "se",
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    baselineLeft: 0,
    baselineTop: 0,
    baselineDocHeight: 0,
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
      const winWidth = size?.width ?? windowRect.width;
      const winHeight = size?.height ?? windowRect.height;

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
    [size]
  );

  // Monitor window resize and zoom level changes to re-clamp window inside website border
  useEffect(() => {
    const handleResize = () => {
      const maxPageWidth = document.documentElement.clientWidth || window.innerWidth;

      setSize((prev) => {
        if (!prev) return null;
        if (prev.width > maxPageWidth) {
          return { ...prev, width: Math.max(340, maxPageWidth) };
        }
        return prev;
      });

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

  const handleResizePointerDown = (dir: ResizeDirection, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;
    if (!containerRef.current || !windowRef.current) return;

    const winRect = windowRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    resizeStartRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: winRect.width,
      startHeight: winRect.height,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      baselineLeft: containerRect.left,
      baselineTop: containerRect.top,
      baselineDocHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      ),
    };

    setIsResizing(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = moveEvent.clientY - resizeStartRef.current.startY;
      const {
        dir: currentDir,
        startWidth,
        startHeight,
        startOffsetX,
        startOffsetY,
        baselineLeft,
        baselineTop,
        baselineDocHeight,
      } = resizeStartRef.current;

      const maxPageWidth = document.documentElement.clientWidth || window.innerWidth;
      const docHeight = baselineDocHeight;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newOffsetX = startOffsetX;
      let newOffsetY = startOffsetY;

      // Horizontal resizing
      if (currentDir.includes("e")) {
        const maxAllowedWidth = maxPageWidth - (baselineLeft + startOffsetX);
        newWidth = Math.max(340, Math.min(maxAllowedWidth, startWidth + deltaX));
      } else if (currentDir.includes("w")) {
        const minDeltaX = -(baselineLeft + startOffsetX);
        const effectiveDeltaX = Math.max(minDeltaX, deltaX);
        const maxPossibleWidth = startWidth - minDeltaX;
        newWidth = Math.max(340, Math.min(maxPossibleWidth, startWidth - effectiveDeltaX));
        newOffsetX = startOffsetX + (startWidth - newWidth);
      }

      // Vertical resizing
      if (currentDir.includes("s")) {
        const maxAllowedHeight = docHeight - (baselineTop + window.scrollY + startOffsetY);
        newHeight = Math.max(320, Math.min(maxAllowedHeight, startHeight + deltaY));
      } else if (currentDir.includes("n")) {
        const minDeltaY = -(baselineTop + window.scrollY + startOffsetY);
        const effectiveDeltaY = Math.max(minDeltaY, deltaY);
        const maxPossibleHeight = startHeight - minDeltaY;
        newHeight = Math.max(320, Math.min(maxPossibleHeight, startHeight - effectiveDeltaY));
        newOffsetY = startOffsetY + (startHeight - newHeight);
      }

      setSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
      setOffset({ x: Math.round(newOffsetX), y: Math.round(newOffsetY) });
    };

    const onPointerUp = () => {
      setIsResizing(false);
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

  if (isClosed) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-300 dark:border-neutral-700 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all text-left"
          title="Click to restore RSS Reader"
        >
          {/* Signal Icon / Symbol */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <Rss className="w-5 h-5 animate-pulse" />
            </div>
            {/* Minimized amber badge indicator */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white dark:border-neutral-900 flex items-center justify-center">
              <span className="w-1.5 h-0.5 bg-neutral-900 rounded-full" />
            </span>
          </div>

          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              <span>RSS Reader</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono font-medium">
                Minimized
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[140px]">
              {activeItem.title}
            </div>
          </div>

          <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    );
  }

  const isElevated =
    isDragging || isResizing || offset.x !== 0 || offset.y !== 0 || size !== null;

  return (
    <div
      className={`w-full max-w-3xl mx-auto py-4 sm:py-8 space-y-4 relative ${
        isElevated ? "z-50" : "z-20"
      }`}
    >
      {/* Fixed layout slot for the mock window - reserves 520px in document flow so website height and other elements never shift */}
      <div ref={containerRef} className="relative w-full h-[520px]">
        {/* Mock macOS RSS Reader Window */}
        <div
          ref={windowRef}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            width: size ? `${size.width}px` : "100%",
            height: size ? `${size.height}px` : "520px",
            maxWidth: size ? "none" : undefined,
            willChange: isDragging || isResizing ? "transform, width, height" : "auto",
          }}
          className={`absolute top-0 left-0 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-[#18181b] overflow-hidden flex flex-col ${
            isDragging || isResizing
              ? "z-[60] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85)] ring-2 ring-[#007aff]/40 transition-none"
              : isElevated
              ? "z-50 shadow-2xl transition-transform duration-200 ease-out"
              : "z-30 shadow-2xl transition-transform duration-200 ease-out"
          }`}
        >
        {/* macOS Window Title Bar (Draggable Handle) */}
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={() => {
            setOffset({ x: 0, y: 0 });
            setSize(null);
          }}
          className={`px-4 py-2.5 bg-neutral-100 dark:bg-[#202023] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between select-none touch-none transition-colors flex-shrink-0 ${
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
                setIsClosed(true);
              }}
              title="Close RSS Reader"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:opacity-80 transition-opacity"
            />
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              title="Minimize to bottom right corner"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer hover:opacity-80 transition-opacity"
            />
            <span
              onClick={(e) => {
                e.stopPropagation();
                // Do nothing for the green button
              }}
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-default"
            />
          </div>
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            RSS Reader — Preview
          </span>
          <div className="w-12 text-right">
            {(offset.x !== 0 || offset.y !== 0 || size !== null) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOffset({ x: 0, y: 0 });
                  setSize(null);
                }}
                className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline"
                title="Reset position and size"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Master-Detail RSS Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-[220px_1fr] md:grid-rows-1 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Unified Feed Items List */}
          <div className="md:col-span-5 bg-neutral-50/80 dark:bg-[#161618] border-r border-neutral-200 dark:border-neutral-800/80 flex flex-col h-full min-h-0 overflow-hidden">
            {/* List Header */}
            <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs flex-shrink-0">
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
            <div className="p-1.5 space-y-1 overflow-y-auto flex-1 min-h-0">
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
          <div className="md:col-span-7 bg-white dark:bg-[#121214] flex flex-col h-full min-h-0 overflow-hidden">
            {/* Rendered Article Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1 min-h-0">
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

        {/* Resize Handles (macOS style window borders & corners) */}
        {/* Top border */}
        <div
          onPointerDown={(e) => handleResizePointerDown("n", e)}
          className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize z-30 touch-none"
        />
        {/* Bottom border */}
        <div
          onPointerDown={(e) => handleResizePointerDown("s", e)}
          className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize z-30 touch-none"
        />
        {/* Left border */}
        <div
          onPointerDown={(e) => handleResizePointerDown("w", e)}
          className="absolute top-3 bottom-3 -left-1.5 w-3 cursor-ew-resize z-30 touch-none"
        />
        {/* Right border */}
        <div
          onPointerDown={(e) => handleResizePointerDown("e", e)}
          className="absolute top-3 bottom-3 -right-1.5 w-3 cursor-ew-resize z-30 touch-none"
        />
        {/* Top-Left corner */}
        <div
          onPointerDown={(e) => handleResizePointerDown("nw", e)}
          className="absolute -top-1.5 -left-1.5 w-4 h-4 cursor-nwse-resize z-30 touch-none"
        />
        {/* Top-Right corner */}
        <div
          onPointerDown={(e) => handleResizePointerDown("ne", e)}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 cursor-nesw-resize z-30 touch-none"
        />
        {/* Bottom-Left corner */}
        <div
          onPointerDown={(e) => handleResizePointerDown("sw", e)}
          className="absolute -bottom-1.5 -left-1.5 w-4 h-4 cursor-nesw-resize z-30 touch-none"
        />
        {/* Bottom-Right corner */}
        <div
          onPointerDown={(e) => handleResizePointerDown("se", e)}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 cursor-nwse-resize z-30 touch-none"
        />
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
