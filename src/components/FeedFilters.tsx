"use client";

import { useState } from "react";
import { Info, Settings2, ChevronRight } from "lucide-react";
import { getCountryOptions } from "@/lib/constants";

interface FeedFiltersProps {
  media: string[];
  onToggleMedia: (m: string) => void;
  roles: string[];
  onToggleRole: (r: string) => void;
  types: string[];
  onToggleType: (t: string) => void;
  alert: "announced" | "release_day" | "week_before";
  onSetAlert: (a: "announced" | "release_day" | "week_before") => void;
  country: string;
  onSetCountry: (c: string) => void;
  excludeShorts: boolean;
  onSetExcludeShorts: (exclude: boolean) => void;
  excludeReReleases: boolean;
  onSetExcludeReReleases: (exclude: boolean) => void;
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">{label}:</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-xs transition-all ${
        active
          ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm font-medium"
          : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function InfoTooltip({
  text,
  ariaLabel,
  content,
  width = "w-56",
}: {
  text?: string;
  ariaLabel: string;
  content?: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="relative group/info inline-flex items-center ml-1">
      <div
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors p-0.5 rounded-full cursor-help focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </div>
      <div
        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 ${width} p-2.5 rounded-xl bg-neutral-900 text-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 text-[11px] leading-snug shadow-xl border border-neutral-800 dark:border-neutral-700 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible group-focus-within/info:opacity-100 group-focus-within/info:visible transition-all duration-150 pointer-events-none z-50`}
      >
        {content || text}
      </div>
    </div>
  );
}

const MEDIA_OPTIONS = [
  { id: "movie", label: "Movie" },
  { id: "tv", label: "TV" },
];

const ROLE_OPTIONS = [
  { id: "actor", label: "Actor" },
  { id: "crew", label: "Behind the Scenes" },
  { id: "sound", label: "Sound" },
];

const FORMAT_OPTIONS = [
  { id: "cinema", label: "Theatrical" },
  { id: "home", label: "Home" },
  { id: "earliest", label: "Earliest" },
];

const ALERT_OPTIONS = [
  { id: "announced", label: "When Announced" },
  { id: "week_before", label: "Week Before Release" },
  { id: "release_day", label: "On Release Day" },
];

export default function FeedFilters({
  media,
  onToggleMedia,
  roles,
  onToggleRole,
  types,
  onToggleType,
  alert,
  onSetAlert,
  country,
  onSetCountry,
  excludeShorts,
  onSetExcludeShorts,
  excludeReReleases,
  onSetExcludeReReleases,
}: FeedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const countryOptions = getCountryOptions(country);

  return (
    <div className="space-y-3.5 text-xs">
      {/* 1. Always Visible Primary Filters */}
      {/* Media */}
      <FilterRow label="Media">
        {MEDIA_OPTIONS.map((m) => (
          <FilterPill
            key={m.id}
            active={media.includes(m.id)}
            onClick={() => onToggleMedia(m.id)}
          >
            {m.label}
          </FilterPill>
        ))}
      </FilterRow>

      {/* Role */}
      <FilterRow label="Role">
        {ROLE_OPTIONS.map((r) => (
          <FilterPill
            key={r.id}
            active={roles.includes(r.id)}
            onClick={() => onToggleRole(r.id)}
          >
            {r.label}
          </FilterPill>
        ))}
      </FilterRow>

      {/* 2. Collapsible Fine-tune Trigger */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors py-1 group focus:outline-none"
          aria-expanded={isExpanded}
        >
          <Settings2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
          <span className="font-medium">Fine-tune (Format, Timing, Region)</span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {/* 3. Collapsible Secondary Filters */}
      {isExpanded && (
        <div className="pt-2 pl-0.5 space-y-3.5 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in-50 duration-150">
          {/* Format */}
          <FilterRow label="Format">
            {FORMAT_OPTIONS.map((t) => (
              <FilterPill
                key={t.id}
                active={types.includes(t.id)}
                onClick={() => onToggleType(t.id)}
              >
                {t.label}
              </FilterPill>
            ))}
            <InfoTooltip
              ariaLabel="Format info"
              width="w-72"
              content={
                <div className="space-y-1.5 text-left">
                  <p>
                    If you choose only <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Theatrical&rdquo;</strong>, TV shows will not appear.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Home&rdquo;</strong> can send more than one alert for a single film or TV show (e.g. Digital, Streaming, and Physical).
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Earliest&rdquo;</strong> notifies only once per project on its first available release format.
                  </p>
                </div>
              }
            />
          </FilterRow>

          {/* Alert Timing */}
          <FilterRow label="Alert">
            {ALERT_OPTIONS.map((a) => (
              <FilterPill
                key={a.id}
                active={alert === a.id}
                onClick={() => onSetAlert(a.id as "announced" | "release_day" | "week_before")}
              >
                {a.label}
              </FilterPill>
            ))}
            <InfoTooltip
              ariaLabel="Alert timing info"
              width="w-72"
              content={
                <div className="space-y-1.5 text-left">
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;When Announced&rdquo;</strong> alerts as soon as a future date is scheduled.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Week Before Release&rdquo;</strong> alerts 7 days prior to release.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;On Release Day&rdquo;</strong> alerts on the release date.
                  </p>
                </div>
              }
            />
          </FilterRow>

          {/* Region */}
          <div className="flex items-center gap-2">
            <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">Region:</span>
            <select
              value={country}
              onChange={(e) => onSetCountry(e.target.value)}
              className="px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none shadow-sm cursor-pointer"
            >
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Exclude toggles */}
          <div className="flex flex-col gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="w-14"></span>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs select-none">
                <input
                  type="checkbox"
                  checked={excludeShorts}
                  onChange={(e) => onSetExcludeShorts(e.target.checked)}
                  className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer"
                />
                <span>Exclude short films</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14"></span>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs select-none">
                <input
                  type="checkbox"
                  checked={excludeReReleases}
                  onChange={(e) => onSetExcludeReReleases(e.target.checked)}
                  className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer"
                />
                <span>Exclude re-releases, remasters &amp; director&apos;s cuts</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
