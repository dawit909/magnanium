"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { TMDBPersonSearchResult } from "@/types/tmdb";
import { createPersonSlug } from "@/lib/slug";
import { SAMPLE_ITEMS, SampleArtistSummary } from "@/data/mockFeed";
import { useDraggableWindow } from "@/hooks/useDraggableWindow";
import { MockWindowTitleBar } from "./mock-reader/MockWindowTitleBar";
import { MockFeedList } from "./mock-reader/MockFeedList";
import { MockFeedDetail } from "./mock-reader/MockFeedDetail";
import { MockResizeHandles } from "./mock-reader/MockResizeHandles";
import { MockMinimizedPill } from "./mock-reader/MockMinimizedPill";

interface SampleFeedPreviewProps {
  onSelectSampleArtist?: (person: TMDBPersonSearchResult) => void;
}

const MOCK_SETTINGS_KEY = "magnanium_mock_rss_settings";

interface MockRssSettings {
  selectedId?: string;
  readIds?: string[];
  isMinimized?: boolean;
  size?: { width: number; height: number } | null;
  offset?: { x: number; y: number };
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
    return "emma-angry-birds-3";
  });

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const s = initialSettings.current;
    if (Array.isArray(s?.readIds)) {
      return new Set(s.readIds);
    }
    return new Set(["emma-angry-birds-3"]);
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

  // Custom hook for window drag & 8-way resize with rAF throttling and coordinate clamping
  const {
    containerRef,
    windowRef,
    offset,
    size,
    isDragging,
    isResizing,
    handlePointerDown,
    handleResizePointerDown,
    resetWindow,
    isElevated,
  } = useDraggableWindow(initialSettings.current);

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

  const activeItem =
    SAMPLE_ITEMS.find((item) => item.id === selectedId) || SAMPLE_ITEMS[0];
  const unreadCount = SAMPLE_ITEMS.filter((item) => !readIds.has(item.id)).length;

  const handleSelectItem = useCallback((id: string) => {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  const handleArtistClick = useCallback(
    (e: React.MouseEvent, artist: SampleArtistSummary) => {
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
    },
    [onSelectSampleArtist, router]
  );

  if (isClosed) {
    return null;
  }

  if (isMinimized) {
    return (
      <MockMinimizedPill
        activeItem={activeItem}
        onRestore={() => setIsMinimized(false)}
      />
    );
  }

  const canReset = offset.x !== 0 || offset.y !== 0 || size !== null;

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
          className={`absolute top-0 left-0 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-[#18181b] flex flex-col ${
            isDragging || isResizing
              ? "z-[60] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85)] transition-none"
              : isElevated
              ? "z-50 shadow-2xl transition-transform duration-200 ease-out"
              : "z-30 shadow-2xl transition-transform duration-200 ease-out"
          }`}
        >
          {/* Inner window container with rounded corners and overflow clipping */}
          <div className="flex-1 min-h-0 flex flex-col rounded-[14px] overflow-hidden">
            {/* Title Bar */}
            <MockWindowTitleBar
              isDragging={isDragging}
              canReset={canReset}
              onPointerDown={handlePointerDown}
              onReset={resetWindow}
              onClose={() => setIsClosed(true)}
              onMinimize={() => setIsMinimized(true)}
            />

            {/* Master-Detail RSS Split View */}
            <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-[220px_1fr] md:grid-rows-1 flex-1 min-h-0 overflow-hidden">
              <MockFeedList
                items={SAMPLE_ITEMS}
                selectedId={selectedId}
                readIds={readIds}
                unreadCount={unreadCount}
                onSelectItem={handleSelectItem}
              />

              <MockFeedDetail
                activeItem={activeItem}
                onArtistClick={handleArtistClick}
              />
            </div>
          </div>

          {/* 8-Way Window Resize Handles */}
          <MockResizeHandles onResizePointerDown={handleResizePointerDown} />
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
