"use client";

import { useState } from "react";
import { Info, Settings2, ChevronRight, RotateCcw } from "lucide-react";
import { getCountryOptions } from "@/lib/constants";

interface FeedFiltersProps {
  roles: string[];
  onToggleRole: (r: string) => void;
  types: string[];
  onToggleType: (t: string) => void;
  alert: "announced" | "month_before" | "week_before";
  onSetAlert: (a: "announced" | "month_before" | "week_before") => void;
  country: string;
  onSetCountry: (c: string) => void;
  excludeShorts: boolean;
  onSetExcludeShorts: (exclude: boolean) => void;
  excludeReReleases: boolean;
  onSetExcludeReReleases: (exclude: boolean) => void;
  excludeUncredited: boolean;
  onSetExcludeUncredited: (exclude: boolean) => void;
  isCustomized?: boolean;
  onResetOptions?: () => void;
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">{label}:</span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
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
      type="button"
      onClick={onClick}
      suppressHydrationWarning
      className={`px-3 py-1 rounded-full border text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 cursor-pointer select-none ${
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
        className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-0.5 rounded-full cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500"
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

const ROLE_OPTIONS = [
  { id: "actor", label: "Actor" },
  { id: "director", label: "Director" },
  { id: "writer", label: "Writer" },
  { id: "producer", label: "Producer" },
  { id: "crew", label: "Crew" },
];

const FORMAT_OPTIONS = [
  { id: "cinema", label: "Cinema" },
  { id: "home", label: "Home" },
  { id: "tv", label: "TV" },
  { id: "premiere", label: "Premiere" },
  { id: "earliest", label: "Earliest" },
];

const ALERT_OPTIONS = [
  { id: "announced", label: "When Announced" },
  { id: "month_before", label: "Month Before Release" },
  { id: "week_before", label: "Week Before Release" },
];

export default function FeedFilters({
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
  excludeUncredited,
  onSetExcludeUncredited,
  isCustomized = false,
  onResetOptions,
}: FeedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const countryOptions = getCountryOptions(country);

  return (
    <div className="space-y-3 text-xs">
      {/* Collapsible Options Trigger & Reset */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors py-1 group focus:outline-none cursor-pointer select-none"
          aria-expanded={isExpanded}
        >
          <Settings2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
          <span className="font-medium">
            {isExpanded ? "Hide options" : "Show options"}
          </span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {(isCustomized || isExpanded) && onResetOptions && (
          <button
            type="button"
            onClick={onResetOptions}
            disabled={!isCustomized}
            className={`flex items-center gap-1.5 text-xs transition-colors py-1 select-none focus:outline-none ${
              isCustomized
                ? "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer"
                : "text-neutral-300 dark:text-neutral-600 cursor-default opacity-50"
            }`}
            title={isCustomized ? "Reset all options to default settings" : "Options are already at default"}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset options</span>
          </button>
        )}
      </div>

      {/* All Options Panel */}
      {isExpanded && (
        <div className="pt-2 pl-0.5 space-y-3.5 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in-50 duration-150">
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
            <InfoTooltip
              ariaLabel="Role info"
              width="w-72"
              content={
                <div className="space-y-1.5 text-left">
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Director&rdquo;</strong> includes film and TV directors.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Writer&rdquo;</strong> includes screenplays, teleplays, and TV creators / showrunners.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Producer&rdquo;</strong> includes film producers and TV executive producers.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Crew&rdquo;</strong> includes sound, score, cinematography, editing, art, and VFX.
                  </p>
                </div>
              }
            />
          </FilterRow>
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
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Cinema&rdquo;</strong> includes wide and limited commercial theatrical releases.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Home&rdquo;</strong> includes digital streaming/VOD and physical disc releases (4K, Blu-ray, DVD).
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;TV&rdquo;</strong> includes television and streaming series or season debuts.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Premiere&rdquo;</strong> includes film festival circuit screenings and red-carpet premieres.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Earliest&rdquo;</strong> notifies only once per project on its first available release event.
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
                onClick={() => onSetAlert(a.id as "announced" | "month_before" | "week_before")}
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
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Month Before Release&rdquo;</strong> alerts 30 days prior to release.
                  </p>
                  <p>
                    <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Week Before Release&rdquo;</strong> alerts 7 days prior to release.
                  </p>
                </div>
              }
            />
          </FilterRow>

          {/* Region */}
          <div className="flex items-center gap-2">
            <span className="w-14 text-neutral-500 dark:text-neutral-400 font-medium">Region:</span>
            <select
              value={country}
              onChange={(e) => onSetCountry(e.target.value)}
              aria-label="Select country for release dates and streaming options"
              className="px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 shadow-sm cursor-pointer"
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
                  className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400"
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
                  className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400"
                />
                <span>Exclude re-releases, remasters &amp; director&apos;s cuts</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14"></span>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs select-none">
                <input
                  type="checkbox"
                  checked={excludeUncredited}
                  onChange={(e) => onSetExcludeUncredited(e.target.checked)}
                  className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400"
                />
                <span>Exclude special, guest &amp; uncredited appearances</span>
              </label>
              <InfoTooltip
                ariaLabel="Special, guest & uncredited appearances info"
                width="w-72"
                content={
                  <div className="space-y-1.5 text-left">
                    <p>
                      Excludes uncredited roles, cameo appearances, TV talk show guest spots, archival footage, and special thanks credits.
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
