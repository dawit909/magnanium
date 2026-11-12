import {
  AlertTimingWindow,
  ReleaseTypeCategory,
  FeedFilterOptions,
} from "@/types/tmdb";
import { DEFAULT_FEED_OPTIONS, FeedOptionsSettings } from "./feed-options";

export interface FeedQueryParams {
  roles: string[];
  types: ReleaseTypeCategory[];
  country: string;
  window: "upcoming" | "all";
  alert: AlertTimingWindow;
  excludeShorts: boolean;
  excludeReReleases: boolean;
  excludeUncredited: boolean;
  isRaw: boolean;
  refresh: boolean;
  isJson: boolean;
  clientKey?: string;
}

export interface ParsedFeedRequest {
  personId?: number;
  feedParams: FeedQueryParams;
  filterOptions: FeedFilterOptions;
  etagKey?: string;
}

/**
 * Build URLSearchParams from feed options
 */
export function buildFeedSearchParams(
  options: Partial<FeedOptionsSettings> & {
    window?: "upcoming" | "all";
    raw?: boolean;
    refresh?: boolean;
    format?: string;
  }
): URLSearchParams {
  const params = new URLSearchParams();
  if (options.roles) params.set("roles", options.roles.join(","));
  if (options.types) params.set("types", options.types.join(","));
  if (options.country) params.set("country", options.country);
  if (options.alert) params.set("alert", options.alert);
  if (options.window && options.window !== "all") params.set("window", options.window);
  if (options.excludeShorts !== undefined) params.set("exclude_shorts", String(options.excludeShorts));
  if (options.excludeReReleases !== undefined) params.set("exclude_rereleases", String(options.excludeReReleases));
  if (options.excludeUncredited !== undefined) params.set("exclude_uncredited", String(options.excludeUncredited));
  if (options.raw) params.set("raw", "true");
  if (options.refresh) params.set("refresh", "true");
  if (options.format) params.set("format", options.format);
  return params;
}

/**
 * Build canonical HTTP and feed:// protocol URLs for an artist feed.
 */
export function buildFeedUrls({
  origin,
  personId,
  options,
  window = "all",
}: {
  origin: string;
  personId: number | string;
  options: FeedOptionsSettings;
  window?: "upcoming" | "all";
}): { feedUrl: string; feedProtocolUrl: string } {
  if (!origin || !personId) {
    return { feedUrl: "", feedProtocolUrl: "" };
  }

  const params = new URLSearchParams({
    roles: options.roles.join(","),
    types: options.types.join(","),
    country: options.country,
    alert: options.alert,
    exclude_shorts: String(options.excludeShorts),
    exclude_rereleases: String(options.excludeReReleases),
    exclude_uncredited: String(options.excludeUncredited),
  });

  if (window !== "all") {
    params.set("window", window);
  }

  const queryString = params.toString();
  const feedUrl = `${origin}/feed/${personId}?${queryString}`;
  const hostWithPort = origin.replace(/^https?:\/\//, "");
  const feedProtocolUrl = `feed://${hostWithPort}/feed/${personId}?${queryString}`;

  return { feedUrl, feedProtocolUrl };
}

/**
 * Construct cache ETag key for feed requests
 */
export function getFeedEtagKey(
  personId: number,
  feedParams: FeedQueryParams
): string {
  const normRoles = [...feedParams.roles].sort().join(",");
  const normTypes = [...feedParams.types].sort().join(",");
  const countryUpper = feedParams.country.toUpperCase();
  const filterPart = feedParams.isRaw
    ? "raw"
    : `${normRoles}_${normTypes}_${feedParams.window}_${feedParams.alert}_${feedParams.excludeShorts}_${feedParams.excludeReReleases}_${feedParams.excludeUncredited}`;
  return `feed_etag:${personId}:${countryUpper}:${feedParams.isJson ? "json" : "rss"}:${filterPart}${feedParams.clientKey ? `:${feedParams.clientKey}` : ""}`;
}

/**
 * Parse and validate incoming query parameters and headers for /feed/[personId]
 */
export function parseFeedRequestParams(
  searchParams: URLSearchParams,
  headers?: Headers,
  personId: number = 0
): {
  feedParams: FeedQueryParams;
  filterOptions: FeedFilterOptions;
} {
  const format = searchParams.get("format");
  const accept = headers?.get("accept") || "";
  const isJson =
    format === "json" ||
    (accept.includes("application/json") && !accept.includes("xml"));

  const isRaw = searchParams.get("raw") === "true";
  const refresh = searchParams.get("refresh") === "true";
  const rolesParam = searchParams.get("roles");
  const typesParam = searchParams.get("types");
  const country = searchParams.get("country") || DEFAULT_FEED_OPTIONS.country;
  const window = (searchParams.get("window") as "upcoming" | "all") || "all";
  const rawAlert = searchParams.get("alert");
  const alert: AlertTimingWindow =
    rawAlert === "announced" ||
    rawAlert === "month_before" ||
    rawAlert === "week_before" ||
    rawAlert === "when_released"
      ? rawAlert
      : DEFAULT_FEED_OPTIONS.alert;
  const excludeShorts = searchParams.get("exclude_shorts") === "true";
  const excludeReReleases = searchParams.get("exclude_rereleases") !== "false";
  const excludeUncredited = searchParams.get("exclude_uncredited") !== "false";
  const clientKey = headers?.get("x-tmdb-key") || searchParams.get("api_key") || undefined;

  const roles = searchParams.has("roles")
    ? (rolesParam ? rolesParam.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean) : [])
    : DEFAULT_FEED_OPTIONS.roles;

  const types = searchParams.has("types")
    ? (typesParam ? (typesParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) as ReleaseTypeCategory[]) : [])
    : (DEFAULT_FEED_OPTIONS.types as ReleaseTypeCategory[]);

  const feedParams: FeedQueryParams = {
    roles,
    types,
    country,
    window,
    alert,
    excludeShorts,
    excludeReReleases,
    excludeUncredited,
    isRaw,
    refresh,
    isJson,
    clientKey,
  };

  const filterOptions: FeedFilterOptions = isRaw
    ? {
        personId,
        roles: DEFAULT_FEED_OPTIONS.roles,
        types: DEFAULT_FEED_OPTIONS.types as ReleaseTypeCategory[],
        country,
        window: "all",
        alert: "announced",
        excludeShorts: false,
        excludeReReleases: false,
        excludeUncredited: false,
        bypassCache: refresh,
      }
    : {
        personId,
        roles,
        types,
        country,
        window,
        alert,
        excludeShorts,
        excludeReReleases,
        excludeUncredited,
        bypassCache: refresh,
      };

  return { feedParams, filterOptions };
}
