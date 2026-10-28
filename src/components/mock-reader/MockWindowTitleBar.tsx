"use client";

interface MockWindowTitleBarProps {
  isDragging: boolean;
  canReset: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onReset: () => void;
  onClose: () => void;
  onMinimize: () => void;
}

export function MockWindowTitleBar({
  isDragging,
  canReset,
  onPointerDown,
  onReset,
  onClose,
  onMinimize,
}: MockWindowTitleBarProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
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
            onClose();
          }}
          title="Close RSS Reader"
          className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:opacity-80 transition-opacity"
        />
        <span
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          title="Minimize to bottom right corner"
          className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer hover:opacity-80 transition-opacity"
        />
        <span
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-default"
        />
      </div>

      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        RSS Reader — Preview
      </span>

      <div className="w-12 text-right">
        {canReset && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline cursor-pointer"
            title="Reset position and size"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
