"use client";

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { ChevronDown, RotateCcw, Check, X } from "lucide-react";
import { getCountryOptions } from "@/lib/constants";
import { AlertTimingWindow } from "@/types/tmdb";

interface FeedFiltersProps {
  roles: string[];
  onToggleRole: (r: string) => void;
  types: string[];
  onToggleType: (t: string) => void;
  alert: AlertTimingWindow;
  onSetAlert: (a: AlertTimingWindow) => void;
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
  defaultExpanded?: boolean;
  saveExpandedState?: boolean;
  hideToggle?: boolean;
}

const ROLE_OPTIONS = [
  { id: "director", label: "Director" },
  { id: "writer", label: "Writer" },
  { id: "producer", label: "Producer" },
  { id: "actor", label: "Actor" },
  { id: "crew", label: "Crew" },
];

const FORMAT_OPTIONS = [
  { id: "cinema", label: "Cinema", desc: "Theatrical release" },
  { id: "home", label: "Home", desc: "Digital VOD & streaming" },
  { id: "tv", label: "TV", desc: "Television / series" },
  { id: "premiere", label: "Premiere", desc: "Festival screenings" },
  { id: "earliest", label: "Earliest", desc: "First debut format only" },
];

const ALERT_OPTIONS: Array<{ id: AlertTimingWindow; label: string; desc: string }> = [
  { id: "announced", label: "When Announced", desc: "As soon as scheduled" },
  { id: "when_released", label: "When Released", desc: "On official release date" },
  { id: "month_before", label: "Month Before", desc: "30 days prior" },
  { id: "week_before", label: "Week Before", desc: "7 days prior" },
];

function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const upper = code.toUpperCase();
  return String.fromCodePoint(upper.charCodeAt(0) + 127397, upper.charCodeAt(1) + 127397);
}

type PopoverType = "country" | "roles" | "types" | "alert" | "exclusions" | null;

const FeedFilters = memo(function FeedFilters({
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
  const [activePopover, setActivePopover] = useState<PopoverType>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const countryOptions = useMemo(() => getCountryOptions(country), [country]);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!activePopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopover]);

  // Compute active chip summary labels
  const countryName = countryOptions.find((c) => c.code === country)?.name || country;
  const countryLabel = `${getCountryFlag(country)} ${country}`;

  const rolesLabel = useMemo(() => {
    if (roles.includes("all") || roles.length === 5) return "All Roles";
    if (roles.length === 0) return "No Roles";
    const labels = roles.map((r) => ROLE_OPTIONS.find((opt) => opt.id === r)?.label || r);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
    return `${labels[0]} +${labels.length - 1}`;
  }, [roles]);

  const typesLabel = useMemo(() => {
    if (types.includes("earliest")) return "Earliest Debut";
    if (types.length === 4) return "All Formats";
    if (types.length === 0) return "No Formats";
    const labels = types.map((t) => FORMAT_OPTIONS.find((opt) => opt.id === t)?.label || t);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
    return `${labels[0]} +${labels.length - 1}`;
  }, [types]);

  const alertLabel = useMemo(() => {
    return ALERT_OPTIONS.find((a) => a.id === alert)?.label || alert;
  }, [alert]);

  const exclusionsCount = useMemo(() => {
    let count = 0;
    if (excludeShorts) count++;
    if (excludeReReleases) count++;
    if (excludeUncredited) count++;
    return count;
  }, [excludeShorts, excludeReReleases, excludeUncredited]);

  const isRoleCustomized = roles.length !== 5 && !roles.includes("all");
  const isTypeCustomized = !types.includes("cinema") || !types.includes("home") || !types.includes("tv") || !types.includes("premiere");
  const isAlertCustomized = alert !== "announced";
  const isExclusionCustomized = excludeShorts || !excludeReReleases || !excludeUncredited;

  return (
    <div ref={containerRef} className="relative select-none text-xs">
      {/* 1-Line Active Summary Chips Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 mr-0.5">
          Filters:
        </span>

        {/* 1. Country Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "country" ? null : "country")}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              activePopover === "country"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs"
            }`}
            title={`Region: ${countryName} (${country})`}
          >
            <span>{countryLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {activePopover === "country" && (
            <div className="absolute left-0 top-full mt-1.5 z-50 w-64 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span>Release Region</span>
                <span className="text-[10px] font-normal text-neutral-400 truncate max-w-[120px]">
                  {countryName}
                </span>
              </div>
              <select
                value={country}
                onChange={(e) => {
                  onSetCountry(e.target.value);
                  setActivePopover(null);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 cursor-pointer"
              >
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {getCountryFlag(c.code)} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Roles Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "roles" ? null : "roles")}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              activePopover === "roles"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm"
                : isRoleCustomized
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs"
            }`}
            title={`Active Roles: ${roles.join(", ")}`}
          >
            <span>{rolesLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {activePopover === "roles" && (
            <div className="absolute left-0 sm:left-auto top-full mt-1.5 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span>Filter by Role</span>
                <button
                  type="button"
                  onClick={() => {
                    const allRoleIds = ROLE_OPTIONS.map((r) => r.id);
                    const allSelected = allRoleIds.every((r) => roles.includes(r));
                    allRoleIds.forEach((r) => {
                      if (allSelected && roles.includes(r)) onToggleRole(r);
                      if (!allSelected && !roles.includes(r)) onToggleRole(r);
                    });
                  }}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
                >
                  {roles.length === 5 ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ROLE_OPTIONS.map((r) => {
                  const active = roles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onToggleRole(r.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        active
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs"
                          : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Formats Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "types" ? null : "types")}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              activePopover === "types"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm"
                : isTypeCustomized
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs"
            }`}
            title={`Release Formats: ${types.join(", ")}`}
          >
            <span>{typesLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {activePopover === "types" && (
            <div className="absolute left-0 sm:left-auto top-full mt-1.5 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span>Release Formats</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FORMAT_OPTIONS.map((t) => {
                  const active = types.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onToggleType(t.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        active
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs"
                          : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                      title={t.desc}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Alert Timing Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "alert" ? null : "alert")}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              activePopover === "alert"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm"
                : isAlertCustomized
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs"
            }`}
            title={`Alert Timing: ${alertLabel}`}
          >
            <span>{alertLabel}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {activePopover === "alert" && (
            <div className="absolute left-0 sm:left-auto top-full mt-1.5 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span>Alert Timing</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {ALERT_OPTIONS.map((a) => {
                  const active = alert === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        onSetAlert(a.id);
                        setActivePopover(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        active
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs"
                          : "bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                      }`}
                      title={a.desc}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. Exclusions Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === "exclusions" ? null : "exclusions")}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              activePopover === "exclusions"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm"
                : isExclusionCustomized
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs"
            }`}
            title="Filter exclusions"
          >
            <span>Exclusions ({exclusionsCount})</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {activePopover === "exclusions" && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span>Filter Exclusions</span>
              </div>
              <div className="flex flex-col gap-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 select-none">
                  <input
                    type="checkbox"
                    checked={excludeShorts}
                    onChange={(e) => onSetExcludeShorts(e.target.checked)}
                    className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Exclude short films</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 select-none">
                  <input
                    type="checkbox"
                    checked={excludeReReleases}
                    onChange={(e) => onSetExcludeReReleases(e.target.checked)}
                    className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Exclude re-releases &amp; cuts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 select-none">
                  <input
                    type="checkbox"
                    checked={excludeUncredited}
                    onChange={(e) => onSetExcludeUncredited(e.target.checked)}
                    className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Exclude uncredited appearances</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Reset button if customized */}
        {isCustomized && onResetOptions && (
          <button
            type="button"
            onClick={onResetOptions}
            title="Reset all filters to default settings"
            className="px-2 py-1 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default FeedFilters;
