"use client";

import { Info } from "lucide-react";
import { COUNTRIES } from "@/lib/constants";

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
}: FeedFiltersProps) {
  return (
    <div className="space-y-3.5 text-xs">
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
          width="w-64"
          content={
            <div className="space-y-1.5 text-left">
              <p>
                If you choose only <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Theatrical&rdquo;</strong>, TV shows will not appear.
              </p>
              <p>
                <strong className="font-medium text-white dark:text-neutral-100">&ldquo;Earliest&rdquo;</strong> notifies only once per project on its first available release format.
              </p>
            </div>
          }
        />
      </FilterRow>

      {/* Alert */}
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
          text="“When Announced” alerts as soon as a future date is scheduled. “Week Before Release” alerts 7 days prior. “On Release Day” alerts on the release date."
        />
      </FilterRow>

      {/* Region */}
      <div className="flex items-center gap-2">
        <span className="w-14 text-neutral-400 dark:text-neutral-500 font-medium">Region:</span>
        <select
          value={country}
          onChange={(e) => onSetCountry(e.target.value)}
          className="px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none shadow-sm"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Short films toggle */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="w-14"></span>
        <label className="flex items-center gap-2 cursor-pointer text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs select-none">
          <input
            type="checkbox"
            checked={excludeShorts}
            onChange={(e) => onSetExcludeShorts(e.target.checked)}
            className="rounded accent-neutral-900 dark:accent-neutral-200 h-3.5 w-3.5"
          />
          <span>Exclude short films</span>
        </label>
      </div>
    </div>
  );
}
