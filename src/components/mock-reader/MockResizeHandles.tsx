"use client";

import { ResizeDirection } from "@/hooks/useDraggableWindow";

interface MockResizeHandlesProps {
  onResizePointerDown: (dir: ResizeDirection, e: React.PointerEvent) => void;
}

export function MockResizeHandles({ onResizePointerDown }: MockResizeHandlesProps) {
  return (
    <>
      {/* Edge Handles (z-40): inset 16px from corners so corner zones take absolute precedence */}
      {/* Top border */}
      <div
        onPointerDown={(e) => onResizePointerDown("n", e)}
        className="absolute -top-[5px] left-4 right-4 h-[10px] cursor-ns-resize z-40 touch-none select-none"
        aria-label="Resize window top"
      />
      {/* Bottom border */}
      <div
        onPointerDown={(e) => onResizePointerDown("s", e)}
        className="absolute -bottom-[5px] left-4 right-4 h-[10px] cursor-ns-resize z-40 touch-none select-none"
        aria-label="Resize window bottom"
      />
      {/* Left border */}
      <div
        onPointerDown={(e) => onResizePointerDown("w", e)}
        className="absolute top-4 bottom-4 -left-[5px] w-[10px] cursor-ew-resize z-40 touch-none select-none"
        aria-label="Resize window left"
      />
      {/* Right border */}
      <div
        onPointerDown={(e) => onResizePointerDown("e", e)}
        className="absolute top-4 bottom-4 -right-[5px] w-[10px] cursor-ew-resize z-40 touch-none select-none"
        aria-label="Resize window right"
      />

      {/* Corner Handles (z-50): 20px x 20px hit zones, perfectly centered at the four window corners */}
      {/* Top-Left corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("nw", e)}
        className="absolute -top-[10px] -left-[10px] w-[20px] h-[20px] cursor-nwse-resize z-50 touch-none select-none"
        aria-label="Resize window top left"
      />
      {/* Top-Right corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("ne", e)}
        className="absolute -top-[10px] -right-[10px] w-[20px] h-[20px] cursor-nesw-resize z-50 touch-none select-none"
        aria-label="Resize window top right"
      />
      {/* Bottom-Left corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("sw", e)}
        className="absolute -bottom-[10px] -left-[10px] w-[20px] h-[20px] cursor-nesw-resize z-50 touch-none select-none"
        aria-label="Resize window bottom left"
      />
      {/* Bottom-Right corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("se", e)}
        className="absolute -bottom-[10px] -right-[10px] w-[20px] h-[20px] cursor-nwse-resize z-50 touch-none select-none"
        aria-label="Resize window bottom right"
      />

      {/* Subtle visual resize grip in the bottom-right corner for discovery */}
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
