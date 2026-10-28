"use client";

import { ResizeDirection } from "@/hooks/useDraggableWindow";

interface MockResizeHandlesProps {
  onResizePointerDown: (dir: ResizeDirection, e: React.PointerEvent) => void;
}

export function MockResizeHandles({ onResizePointerDown }: MockResizeHandlesProps) {
  return (
    <>
      {/* Top border */}
      <div
        onPointerDown={(e) => onResizePointerDown("n", e)}
        className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize z-30 touch-none"
      />
      {/* Bottom border */}
      <div
        onPointerDown={(e) => onResizePointerDown("s", e)}
        className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize z-30 touch-none"
      />
      {/* Left border */}
      <div
        onPointerDown={(e) => onResizePointerDown("w", e)}
        className="absolute top-3 bottom-3 -left-1.5 w-3 cursor-ew-resize z-30 touch-none"
      />
      {/* Right border */}
      <div
        onPointerDown={(e) => onResizePointerDown("e", e)}
        className="absolute top-3 bottom-3 -right-1.5 w-3 cursor-ew-resize z-30 touch-none"
      />
      {/* Top-Left corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("nw", e)}
        className="absolute -top-1.5 -left-1.5 w-4 h-4 cursor-nwse-resize z-30 touch-none"
      />
      {/* Top-Right corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("ne", e)}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 cursor-nesw-resize z-30 touch-none"
      />
      {/* Bottom-Left corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("sw", e)}
        className="absolute -bottom-1.5 -left-1.5 w-4 h-4 cursor-nesw-resize z-30 touch-none"
      />
      {/* Bottom-Right corner */}
      <div
        onPointerDown={(e) => onResizePointerDown("se", e)}
        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 cursor-nwse-resize z-30 touch-none"
      />
    </>
  );
}
