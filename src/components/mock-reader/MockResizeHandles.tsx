"use client";

import { ResizeDirection } from "@/hooks/useDraggableWindow";

interface MockResizeHandlesProps {
  onResizePointerDown: (dir: ResizeDirection, e: React.PointerEvent) => void;
}

export function MockResizeHandles({ onResizePointerDown }: MockResizeHandlesProps) {
  return (
    <>
      {/* Top border: generous 32px hit area (16px outside, 16px inside) */}
      <div
        onPointerDown={(e) => onResizePointerDown("n", e)}
        className="absolute -top-4 left-6 right-6 h-8 cursor-ns-resize z-40 touch-none select-none"
        aria-label="Resize window top"
      />
      {/* Bottom border: generous 32px hit area */}
      <div
        onPointerDown={(e) => onResizePointerDown("s", e)}
        className="absolute -bottom-4 left-6 right-6 h-8 cursor-ns-resize z-40 touch-none select-none"
        aria-label="Resize window bottom"
      />
      {/* Left border: generous 32px hit area */}
      <div
        onPointerDown={(e) => onResizePointerDown("w", e)}
        className="absolute top-6 bottom-6 -left-4 w-8 cursor-ew-resize z-40 touch-none select-none"
        aria-label="Resize window left"
      />
      {/* Right border: generous 32px hit area */}
      <div
        onPointerDown={(e) => onResizePointerDown("e", e)}
        className="absolute top-6 bottom-6 -right-4 w-8 cursor-ew-resize z-40 touch-none select-none"
        aria-label="Resize window right"
      />

      {/* Top-Left corner: 36px x 36px touch zone */}
      <div
        onPointerDown={(e) => onResizePointerDown("nw", e)}
        className="absolute -top-4.5 -left-4.5 w-9 h-9 cursor-nwse-resize z-40 touch-none select-none"
        aria-label="Resize window top left"
      />
      {/* Top-Right corner: 36px x 36px touch zone */}
      <div
        onPointerDown={(e) => onResizePointerDown("ne", e)}
        className="absolute -top-4.5 -right-4.5 w-9 h-9 cursor-nesw-resize z-40 touch-none select-none"
        aria-label="Resize window top right"
      />
      {/* Bottom-Left corner: 36px x 36px touch zone */}
      <div
        onPointerDown={(e) => onResizePointerDown("sw", e)}
        className="absolute -bottom-4.5 -left-4.5 w-9 h-9 cursor-nesw-resize z-40 touch-none select-none"
        aria-label="Resize window bottom left"
      />
      {/* Bottom-Right corner: 36px x 36px touch zone */}
      <div
        onPointerDown={(e) => onResizePointerDown("se", e)}
        className="absolute -bottom-4.5 -right-4.5 w-9 h-9 cursor-nwse-resize z-40 touch-none select-none"
        aria-label="Resize window bottom right"
      />

      {/* Subtle visual resize grip in the bottom-right corner for touch and desktop discovery */}
      <div
        className="absolute bottom-1 right-1 pointer-events-none opacity-40 dark:opacity-30 z-30"
        aria-hidden="true"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          className="text-neutral-500 dark:text-neutral-400"
        >
          <path d="M8.5 1.5L1.5 8.5M8.5 5.5L5.5 8.5M8.5 8.5H8.51" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}
