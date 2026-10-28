import { COUNTRIES, detectBrowserCountry } from "./constants";

export interface FeedOptionsSettings {
  media: string[];
  roles: string[];
  types: string[];
  country: string;
  alert: "announced" | "month_before" | "week_before";
  excludeShorts: boolean;
  excludeReReleases: boolean;
}

export const STORAGE_KEY = "magnanium_feed_options";

export const DEFAULT_FEED_OPTIONS: FeedOptionsSettings = {
  media: ["movie", "tv"],
  roles: ["actor", "director", "writer", "producer", "crew"],
  types: ["cinema", "home"],
  country: "US",
  alert: "announced",
  excludeShorts: false,
  excludeReReleases: false,
};

// Global in-memory cache for instant client-side SPA navigation
let inMemoryOptions: FeedOptionsSettings = { ...DEFAULT_FEED_OPTIONS };

/**
 * Validate untrusted option objects (e.g. from localStorage or URL params).
 */
export function validateFeedOptions(parsed: any): FeedOptionsSettings {
  if (!parsed || typeof parsed !== "object") {
    return { ...inMemoryOptions };
  }

  const validMedia =
    Array.isArray(parsed.media) && parsed.media.length > 0
      ? parsed.media
      : inMemoryOptions.media;

  let validRoles = inMemoryOptions.roles;
  if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
    const filtered = parsed.roles.filter((r: string) =>
      ["actor", "director", "writer", "producer", "crew", "all"].includes(r)
    );
    if (filtered.length > 0) {
      validRoles = filtered;
    }
  }

  const validTypes =
    Array.isArray(parsed.types) && parsed.types.length > 0
      ? parsed.types
      : inMemoryOptions.types;

  const validCountry =
    typeof parsed.country === "string" && /^[a-zA-Z]{2}$/.test(parsed.country)
      ? parsed.country.toUpperCase()
      : inMemoryOptions.country;

  const validAlert =
    ["announced", "month_before", "week_before"].includes(parsed.alert)
      ? (parsed.alert as FeedOptionsSettings["alert"])
      : inMemoryOptions.alert;

  const validExcludeShorts =
    typeof parsed.excludeShorts === "boolean"
      ? parsed.excludeShorts
      : inMemoryOptions.excludeShorts;

  const validExcludeReReleases =
    typeof parsed.excludeReReleases === "boolean"
      ? parsed.excludeReReleases
      : inMemoryOptions.excludeReReleases;

  return {
    media: validMedia,
    roles: validRoles,
    types: validTypes,
    country: validCountry,
    alert: validAlert,
    excludeShorts: validExcludeShorts,
    excludeReReleases: validExcludeReReleases,
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
        inMemoryOptions = {
          ...inMemoryOptions,
          country: detected,
        };
        return inMemoryOptions;
      }
    } catch {}
  }
  return inMemoryOptions;
}

/**
 * Persist an updated option value to in-memory cache and localStorage.
 */
export function saveFeedOption<K extends keyof FeedOptionsSettings>(
  key: K,
  value: FeedOptionsSettings[K]
): FeedOptionsSettings {
  inMemoryOptions = {
    ...inMemoryOptions,
    [key]: value,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryOptions));
    } catch {}
  }

  return inMemoryOptions;
}
