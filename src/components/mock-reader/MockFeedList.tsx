"use client";

import { SampleFeedItem } from "@/data/mockFeed";

interface MockFeedListProps {
  items: SampleFeedItem[];
  selectedId: string;
  readIds: Set<string>;
  unreadCount: number;
  onSelectItem: (id: string) => void;
}

export function MockFeedList({
  items,
  selectedId,
  readIds,
  unreadCount,
  onSelectItem,
}: MockFeedListProps) {
  return (
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
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isUnread = !readIds.has(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                window.open(item.tmdbUrl, "_blank", "noopener,noreferrer");
              }}
              title="Click to view · Double-click to open TMDB page"
              className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2 text-xs cursor-pointer ${
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
                loading="eager"
                decoding="async"
                className="w-8 h-8 rounded-lg object-cover object-[center_20%] flex-shrink-0 border border-black/10 dark:border-white/10 text-transparent select-none bg-neutral-200 dark:bg-neutral-800"
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
                  {[
                    item.role && `Role: ${item.role}`,
                    item.director && `Director: ${item.director}`,
                    item.writer && `Writer: ${item.writer}`,
                    item.stars && `Stars: ${item.stars}`,
                    item.release && `Release: ${item.release}`,
                    item.format && `Format: ${item.format}`,
                    item.runtime && `Runtime: ${item.runtime}`,
                    item.language && `Language: ${item.language}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  ...
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
  );
}
