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
      {/* Cinephile Dual-Lens Projector Mark (Teal & Orange) */}
      <svg
        viewBox="0 0 25 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[25px] h-[14px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-hidden="true"
      >
        {/* Left Reel / Lens (Cinema Orange) */}
        <circle cx="6.5" cy="7" r="5.5" fill="#ff7a00" fillOpacity="0.9" />
        <circle
          cx="6.5"
          cy="7"
          r="1.6"
          className="fill-[#fafafa] dark:fill-[#09090b] transition-colors"
        />

        {/* Right Reel / Lens (Cinema Teal/Cyan) */}
        <circle cx="18.5" cy="7" r="5.5" fill="#00b4d8" fillOpacity="0.9" />
        <circle
          cx="18.5"
          cy="7"
          r="1.6"
          className="fill-[#fafafa] dark:fill-[#09090b] transition-colors"
        />

        {/* Optical Overlap Center Aperture */}
        <ellipse
          cx="12.5"
          cy="7"
          rx="2.2"
          ry="4"
          fill="currentColor"
          className="text-white/30 dark:text-white/25"
        />
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
