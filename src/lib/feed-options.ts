import { COUNTRIES, detectBrowserCountry, STORAGE_KEYS } from "./constants";
import { AlertTimingWindow } from "@/types/tmdb";
import { safeLocalStorage } from "./storage";

export interface FeedOptionsSettings {
  roles: string[];
  types: string[];
  country: string;
  alert: AlertTimingWindow;
  excludeShorts: boolean;
  excludeReReleases: boolean;
  excludeUncredited: boolean;
}

export const STORAGE_KEY = STORAGE_KEYS.FEED_OPTIONS;

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
 * Normalizes types array ensuring 'earliest' format exclusivity.
 */
export function normalizeTypes(types?: string[] | null): string[] {
  if (!Array.isArray(types) || types.length === 0) {
    return [...DEFAULT_FEED_OPTIONS.types];
  }
  const clean = types.filter(Boolean);
  if (clean.includes("earliest")) {
    return ["earliest"];
  }
  return clean;
}

/**
 * Normalizes roles array falling back to defaults if empty.
 */
export function normalizeRoles(roles?: string[] | null): string[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [...DEFAULT_FEED_OPTIONS.roles];
  }
  return roles.filter(Boolean);
}

/**
 * Extract complete FeedOptionsSettings from partial or missing settings.
 */
export function extractFeedOptions(
  options?: Partial<FeedOptionsSettings> | null,
  defaultCountry: string = DEFAULT_FEED_OPTIONS.country
): FeedOptionsSettings {
  if (!options) {
    return { ...DEFAULT_FEED_OPTIONS, country: defaultCountry };
  }
  return {
    roles: normalizeRoles(options.roles),
    types: normalizeTypes(options.types),
    country: (options.country || defaultCountry).toUpperCase(),
    alert: options.alert || DEFAULT_FEED_OPTIONS.alert,
    excludeShorts:
      options.excludeShorts !== undefined
        ? options.excludeShorts
        : DEFAULT_FEED_OPTIONS.excludeShorts,
    excludeReReleases:
      options.excludeReReleases !== undefined
        ? options.excludeReReleases
        : DEFAULT_FEED_OPTIONS.excludeReReleases,
    excludeUncredited:
      options.excludeUncredited !== undefined
        ? options.excludeUncredited
        : DEFAULT_FEED_OPTIONS.excludeUncredited,
  };
}

/**
 * Check whether two feed options configurations are identical.
 */
export function areFeedOptionsEqual(
  a?: Partial<FeedOptionsSettings> | null,
  b?: Partial<FeedOptionsSettings> | null
): boolean {
  if (a === b) return true;
  if (!a && !b) return true;

  const optA = extractFeedOptions(a);
  const optB = extractFeedOptions(b);

  if (optA.country !== optB.country) return false;
  if (optA.alert !== optB.alert) return false;
  if (optA.excludeShorts !== optB.excludeShorts) return false;
  if (optA.excludeReReleases !== optB.excludeReReleases) return false;
  if (optA.excludeUncredited !== optB.excludeUncredited) return false;

  if (optA.roles.length !== optB.roles.length) return false;
  if (!optA.roles.every((r) => optB.roles.includes(r))) return false;

  if (optA.types.length !== optB.types.length) return false;
  if (!optA.types.every((t) => optB.types.includes(t))) return false;

  return true;
}

/**
 * Check whether feed options match default settings.
 */
export function isDefaultFeedOptions(
  options?: Partial<FeedOptionsSettings> | null,
  defaultCountry?: string | null
): boolean {
  return areFeedOptionsEqual(options, {
    ...DEFAULT_FEED_OPTIONS,
    country: defaultCountry || DEFAULT_FEED_OPTIONS.country,
  });
}

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
    validTypes = normalizeTypes(
      parsed.types.filter((t: string) =>
        ["cinema", "home", "tv", "premiere", "earliest"].includes(t.toLowerCase())
      )
    );
  }

  const validCountry =
    typeof parsed.country === "string" && /^[a-zA-Z]{2}$/.test(parsed.country)
      ? parsed.country.toUpperCase()
      : DEFAULT_FEED_OPTIONS.country;

  const validAlert =
    ["announced", "month_before", "week_before", "when_released"].includes(parsed.alert)
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
  const stored = safeLocalStorage.get<any>(STORAGE_KEY);
  if (stored) {
    const validated = validateFeedOptions(stored);
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

  return { ...inMemoryOptions };
}

/**
 * Persist all options to in-memory cache and localStorage.
 */
export function saveAllFeedOptions(options: FeedOptionsSettings): FeedOptionsSettings {
  inMemoryOptions = { ...options };
  safeLocalStorage.set(STORAGE_KEY, inMemoryOptions);
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
  safeLocalStorage.removeItem(STORAGE_KEY);
  return inMemoryOptions;
}
