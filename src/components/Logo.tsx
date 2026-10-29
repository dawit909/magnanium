"use client";

import { memo } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = memo(function Logo({
  className = "",
  showText = true,
}: LogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 select-none group focus:outline-none ${className}`}
    >
      {/* Letterboxd-vibe 3-lens cinephile mark */}
      <svg
        viewBox="0 0 25 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[26px] h-[13px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-hidden="true"
      >
        <g className="mix-blend-multiply dark:mix-blend-screen">
          <circle cx="5.5" cy="6" r="4.75" fill="#ff8000" fillOpacity="0.92" />
          <circle cx="12.5" cy="6" r="4.75" fill="#00e054" fillOpacity="0.92" />
          <circle cx="19.5" cy="6" r="4.75" fill="#40bcf4" fillOpacity="0.92" />
        </g>
      </svg>

      {showText && (
        <span className="font-bold text-base text-neutral-900 dark:text-neutral-100 tracking-tight transition-colors">
          Magnanium
        </span>
      )}
    </div>
  );
});

export default Logo;
