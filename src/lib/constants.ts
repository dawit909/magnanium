export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "PL", name: "Poland" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PT", name: "Portugal" },
  { code: "AR", name: "Argentina" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
];

/**
 * Standard time durations in milliseconds
 */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Standard time durations in seconds
 */
export const TIME_SECONDS = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 7 * 86400,
} as const;

/**
 * Standard Cache TTLs in seconds (unless suffixed with _MS)
 */
export const CACHE_TTL = {
  PERSON_DETAILS: 7 * TIME_SECONDS.DAY, // 7 days (604,800s)
  PERSON_CREDITS: TIME_SECONDS.DAY,     // 24 hours (86,400s)
  RAW_RELEASES: TIME_SECONDS.DAY,       // 24 hours (86,400s)
  FEED_ETAG: TIME_SECONDS.DAY,          // 24 hours (86,400s)
  SEARCH: TIME_SECONDS.HOUR,            // 1 hour (3,600s)
  POPULAR_ARTISTS_INDEX: TIME_SECONDS.DAY, // 24 hours
  SWR_FRESHNESS_MS: 15 * TIME_MS.MINUTE,   // 15 minutes client freshness window
} as const;

/**
 * Centralized HTTP caching directives
 */
export const HTTP_CACHE = {
  FEED_JSON: {
    maxAge: 300,
    sMaxAge: 3600,
    staleWhileRevalidate: 172800,
  },
  FEED_RSS: {
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 172800,
  },
  SEARCH: {
    maxAge: 300,
    sMaxAge: 3600,
    staleWhileRevalidate: 86400,
  },
  AVATAR: {
    maxAge: 86400,
    sMaxAge: 604800,
    staleWhileRevalidate: 172800,
  },
} as const;

/**
 * Centralized rate limit configurations
 */
export const RATE_LIMITS = {
  FEED_PREVIEW: {
    max: 120,
    windowMs: TIME_MS.MINUTE,
    prefix: "feed-preview",
  },
  FEED_RSS: {
    max: 30,
    windowMs: TIME_MS.MINUTE,
    prefix: "feed-rss",
  },
  SEARCH: {
    max: 30,
    windowMs: TIME_MS.MINUTE,
    prefix: "search",
  },
  AVATAR: {
    max: 60,
    windowMs: TIME_MS.MINUTE,
    prefix: "avatar",
  },
} as const;

/**
 * Storage keys used across client components and hooks
 */
export const STORAGE_KEYS = {
  FEED_OPTIONS: "magnanium_feed_options",
  OPTIONS_EXPANDED: "magnanium_feed_options_expanded",
  MOCK_SETTINGS: "magnanium_mock_rss_settings",
  THEME: "magnanium_theme",
  NOTICE_DISMISSED: "magnanium_feed_url_notice_dismissed",
  RAW_PREFIX: "magnanium_raw_",
} as const;

/**
 * Get country display name using Intl.DisplayNames where available.
 */
export function getCountryDisplayName(code: string): string {
  const upper = code.toUpperCase();
  const known = COUNTRIES.find((c) => c.code === upper);
  if (known) return known.name;

  if (typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined") {
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      const name = dn.of(upper);
      if (name) return name;
    } catch {}
  }
  return upper;
}

/**
 * Returns country options ensuring the currently selected or detected country is included.
 */
export function getCountryOptions(selectedCode?: string): CountryOption[] {
  if (!selectedCode) return COUNTRIES;
  const upper = selectedCode.toUpperCase();
  if (COUNTRIES.some((c) => c.code === upper)) {
    return COUNTRIES;
  }
  const custom: CountryOption = {
    code: upper,
    name: getCountryDisplayName(upper),
  };
  return [...COUNTRIES, custom].sort((a, b) => a.name.localeCompare(b.name));
}

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Seoul": "KR",
  "Asia/Tokyo": "JP",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Stockholm": "SE",
  "Europe/Warsaw": "PL",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Brussels": "BE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Lisbon": "PT",
  "Europe/Dublin": "IE",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Montreal": "CA",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
  "America/Sao_Paulo": "BR",
  "America/Mexico_City": "MX",
  "America/Buenos_Aires": "AR",
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Singapore": "SG",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
};

/**
 * Detect user's ISO-3166-1 country code from browser locale and timezone.
 * Returns 2-letter uppercase country code (e.g. 'US', 'GB', 'KR') or null.
 */
export function detectBrowserCountry(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Try navigator.languages or navigator.language
  try {
    const candidateLangs: string[] = [];
    if (Array.isArray(navigator.languages)) {
      candidateLangs.push(...navigator.languages);
    }
    if (navigator.language) {
      candidateLangs.push(navigator.language);
    }

    for (const lang of candidateLangs) {
      if (!lang) continue;

      // Use Intl.Locale if available
      if (typeof Intl !== "undefined" && typeof Intl.Locale !== "undefined") {
        try {
          const locale = new Intl.Locale(lang);
          if (locale.region && locale.region.length === 2) {
            return locale.region.toUpperCase();
          }
        } catch {}
      }

      // Regex fallback for BCP-47 tags (e.g. en-US, ko-KR)
      const match = /^[a-z]{2,3}[-_]([A-Za-z]{2})(?:[-_].+)?$/i.exec(lang);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
  } catch {}

  // 2. Timezone heuristic fallback
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat !== "undefined") {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_TO_COUNTRY[tz]) {
        return TIMEZONE_TO_COUNTRY[tz];
      }
    }
  } catch {}

  return null;
}
