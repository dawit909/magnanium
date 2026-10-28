"use client";

import { Rss, Maximize2 } from "lucide-react";
import { SampleFeedItem } from "@/data/mockFeed";

interface MockMinimizedPillProps {
  activeItem: SampleFeedItem;
  onRestore: () => void;
}

export function MockMinimizedPill({ activeItem, onRestore }: MockMinimizedPillProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={onRestore}
        className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-neutral-300 dark:border-neutral-700 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all text-left cursor-pointer"
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
