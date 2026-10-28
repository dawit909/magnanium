"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export interface WindowDimensions {
  width: number;
  height: number;
}

export interface WindowCoordinates {
  x: number;
  y: number;
}

interface StoredWindowSettings {
  size?: WindowDimensions | null;
  offset?: WindowCoordinates;
}

const STORAGE_KEY = "magnanium_mock_rss_settings";

/**
 * Custom hook providing smooth, rAF-throttled dragging and 8-way resizing
 * for floating/isolated mock windows with bounds clamping and tab-session persistence.
 */
export function useDraggableWindow(initialSettings?: StoredWindowSettings | null) {
  const [size, setSize] = useState<WindowDimensions | null>(() => {
    return initialSettings?.size ?? null;
  });

  const [offset, setOffset] = useState<WindowCoordinates>(() => {
    return initialSettings?.offset ?? { x: 0, y: 0 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // rAF throttling refs to decouple mouse pointer events (120-240Hz) from React render cycles (60Hz)
  const dragRafRef = useRef<number | null>(null);
  const pendingOffsetRef = useRef<WindowCoordinates | null>(null);

  const resizeRafRef = useRef<number | null>(null);
  const pendingResizeRef = useRef<{ size: WindowDimensions; offset: WindowCoordinates } | null>(null);

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
    ): WindowCoordinates => {
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

  // Clean up any remaining rAF callbacks on unmount
  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
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

        pendingOffsetRef.current = clamped;

        // Schedule state update on next display refresh tick
        if (dragRafRef.current === null) {
          dragRafRef.current = requestAnimationFrame(() => {
            if (pendingOffsetRef.current) {
              setOffset(pendingOffsetRef.current);
            }
            dragRafRef.current = null;
          });
        }
      };

      const onPointerUp = () => {
        if (dragRafRef.current !== null) {
          cancelAnimationFrame(dragRafRef.current);
          dragRafRef.current = null;
        }
        if (pendingOffsetRef.current) {
          setOffset(pendingOffsetRef.current);
          pendingOffsetRef.current = null;
        }

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
    },
    [offset.x, offset.y, clampOffset]
  );

  const handleResizePointerDown = useCallback(
    (dir: ResizeDirection, e: React.PointerEvent) => {
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

        const nextSize = { width: Math.round(newWidth), height: Math.round(newHeight) };
        const nextOffset = { x: Math.round(newOffsetX), y: Math.round(newOffsetY) };

        pendingResizeRef.current = { size: nextSize, offset: nextOffset };

        // Schedule state update on next display refresh tick
        if (resizeRafRef.current === null) {
          resizeRafRef.current = requestAnimationFrame(() => {
            if (pendingResizeRef.current) {
              setSize(pendingResizeRef.current.size);
              setOffset(pendingResizeRef.current.offset);
            }
            resizeRafRef.current = null;
          });
        }
      };

      const onPointerUp = () => {
        if (resizeRafRef.current !== null) {
          cancelAnimationFrame(resizeRafRef.current);
          resizeRafRef.current = null;
        }
        if (pendingResizeRef.current) {
          setSize(pendingResizeRef.current.size);
          setOffset(pendingResizeRef.current.offset);
          pendingResizeRef.current = null;
        }

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
    },
    [offset.x, offset.y]
  );

  const resetWindow = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setSize(null);
  }, []);

  return {
    containerRef,
    windowRef,
    offset,
    setOffset,
    size,
    setSize,
    isDragging,
    isResizing,
    handlePointerDown,
    handleResizePointerDown,
    resetWindow,
    isElevated: isDragging || isResizing || offset.x !== 0 || offset.y !== 0 || size !== null,
  };
}
