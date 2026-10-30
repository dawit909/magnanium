import { COUNTRIES, detectBrowserCountry } from "./constants";
import { AlertTimingWindow } from "@/types/tmdb";

export interface FeedOptionsSettings {
  roles: string[];
  types: string[];
  country: string;
  alert: AlertTimingWindow;
  excludeShorts: boolean;
  excludeReReleases: boolean;
  excludeUncredited: boolean;
}

export const STORAGE_KEY = "magnanium_feed_options";

export const DEFAULT_FEED_OPTIONS: FeedOptionsSettings = {
  roles: ["actor", "director", "writer", "producer", "crew"],
  types: ["cinema", "home", "tv", "premiere"],
  country: "US",
  alert: "announced",
  excludeShorts: false,
  excludeReReleases: true,
  excludeUncredited: true,
};

// Global in-memory cache for instant client-side SPA navigation
let inMemoryOptions: FeedOptionsSettings = { ...DEFAULT_FEED_OPTIONS };

/**
 * Validate untrusted option objects (e.g. from localStorage or URL params).
 */
export function validateFeedOptions(parsed: any): FeedOptionsSettings {
  if (!parsed || typeof parsed !== "object") {
    return { ...DEFAULT_FEED_OPTIONS };
  }

  let validRoles = DEFAULT_FEED_OPTIONS.roles;
  if (Array.isArray(parsed.roles)) {
    validRoles = parsed.roles.filter((r: string) =>
      ["actor", "director", "writer", "producer", "crew", "all"].includes(r)
    );
  }

  let validTypes = DEFAULT_FEED_OPTIONS.types;
  if (Array.isArray(parsed.types)) {
    validTypes = parsed.types.filter((t: string) =>
      ["cinema", "home", "tv", "premiere", "earliest"].includes(t.toLowerCase())
    );
  }

  const validCountry =
    typeof parsed.country === "string" && /^[a-zA-Z]{2}$/.test(parsed.country)
      ? parsed.country.toUpperCase()
      : DEFAULT_FEED_OPTIONS.country;

  const validAlert =
    ["announced", "month_before", "week_before"].includes(parsed.alert)
      ? (parsed.alert as FeedOptionsSettings["alert"])
      : DEFAULT_FEED_OPTIONS.alert;

  const validExcludeShorts =
    typeof parsed.excludeShorts === "boolean"
      ? parsed.excludeShorts
      : DEFAULT_FEED_OPTIONS.excludeShorts;

  const validExcludeReReleases =
    typeof parsed.excludeReReleases === "boolean"
      ? parsed.excludeReReleases
      : DEFAULT_FEED_OPTIONS.excludeReReleases;

  const validExcludeUncredited =
    typeof parsed.excludeUncredited === "boolean"
      ? parsed.excludeUncredited
      : DEFAULT_FEED_OPTIONS.excludeUncredited;

  return {
    roles: validRoles,
    types: validTypes,
    country: validCountry,
    alert: validAlert,
    excludeShorts: validExcludeShorts,
    excludeReReleases: validExcludeReReleases,
    excludeUncredited: validExcludeUncredited,
  };
}

/**
 * Get current options (from memory, localStorage, or auto-detected browser region).
 */
export function getSavedFeedOptions(): FeedOptionsSettings {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const validated = validateFeedOptions(JSON.parse(stored));
        inMemoryOptions = validated;
        return validated;
      }

      // First-time visitor: zero-click browser country auto-detection
      const detected = detectBrowserCountry();
      if (detected) {
        const withDetected: FeedOptionsSettings = {
          ...DEFAULT_FEED_OPTIONS,
          country: detected,
        };
        inMemoryOptions = withDetected;
        return withDetected;
      }
    } catch {}
  }
  return { ...inMemoryOptions };
}

/**
 * Persist all options to in-memory cache and localStorage.
 */
export function saveAllFeedOptions(options: FeedOptionsSettings): FeedOptionsSettings {
  inMemoryOptions = { ...options };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryOptions));
    } catch {}
  }

  return inMemoryOptions;
}

/**
 * Reset all options to default settings.
 */
export function resetFeedOptions(): FeedOptionsSettings {
  const detected = typeof window !== "undefined" ? detectBrowserCountry() : null;
  const defaults: FeedOptionsSettings = {
    ...DEFAULT_FEED_OPTIONS,
    country: detected || DEFAULT_FEED_OPTIONS.country,
  };
  inMemoryOptions = defaults;

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return inMemoryOptions;
}
