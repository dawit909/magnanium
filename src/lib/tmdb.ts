import {
  TMDBPersonSearchResult,
  TMDBPersonCreditsResponse,
  TMDBPersonDetails,
  FormattedRelease,
  FeedFilterOptions,
  TMDBCreditItem,
  ReleaseTypeCategory,
} from "@/types/tmdb";
import { tmdbFetch, hasTmdbAuth } from "./tmdb/client";
import {
  sortAndJoinRoles,
  matchesSpecificCrewRole,
  resolveCrewRoleLabel,
  isSpecialGuestOrUncreditedCredit,
  resolveCastRoleLabel,
} from "./tmdb/roles";
import {
  extractMovieReleases,
  extractTvReleases,
  ReleaseExtractionContext,
} from "./tmdb/releases";
import {
  isValidPersonId,
  isPersonMarkedNotFound,
  markPersonNotFound,
} from "./negative-cache";
import {
  normalizeSearchText,
  scoreCandidate,
  getPopularArtistsIndex,
} from "./fuzzy";
import { DEFAULT_FEED_OPTIONS } from "./feed-options";
import { getDateWindowBoundaries, compareReleasesDescending, filterReleases } from "./feed-filter";
import { kv } from "./kv";

interface CandidateEntry {
  item: TMDBCreditItem;
  roles: string[];
  mediaType: "movie" | "tv";
  dateStr: string;
  isUncredited: boolean;
}

/**
 * Execute async operations over an array with bounded concurrency.
 * Prevents socket exhaustion, spikes, and rate-limiting while maintaining throughput.
 */
async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (currentIndex < items.length) {
        const idx = currentIndex++;
        results[idx] = await fn(items[idx]);
      }
    }
  );

  await Promise.all(workers);
  return results;
}

/**
 * Search TMDB for an artist (director, actor, crew, creator)
 * Implements Approach 1: Multi-Pass Fuzzy Fallback with Damerau-Levenshtein
 * Scoring + Popularity Boost when direct search yields 0 results or only obscure entities.
 */
export async function searchPerson(
  query: string,
  customApiKey?: string
): Promise<{ results: TMDBPersonSearchResult[]; noApiKey?: boolean; error?: string }> {
  if (!hasTmdbAuth(customApiKey)) {
    return { results: [], noApiKey: true };
  }

  const { data, status } = await tmdbFetch<{ results: TMDBPersonSearchResult[] }>(
    "/search/person",
    { query },
    3600,
    customApiKey
  );

  if (status === 401) {
    return { results: [], noApiKey: true };
  }

  if (status !== 200 || !data) {
    return { results: [], error: `TMDB search request failed with status ${status}` };
  }

  const directResults = data.results || [];
  const hasStrongResults =
    directResults.length > 0 &&
    directResults.some((p) => (p.popularity || 0) >= 1.0);

  // If TMDB returns solid matches, return them immediately
  if (hasStrongResults) {
    return { results: directResults.slice(0, 6) };
  }

  // --- Approach 1: Multi-Pass Fuzzy Fallback ---
  // When a query returns 0 results or only obscure entities (popularity < 1.0):
  const normQuery = normalizeSearchText(query);
  const tokens = normQuery.split(/\s+/).filter((t) => t.length >= 2);

  // 1. Check local pre-indexed popular artists FIRST (0 network calls, < 1ms)
  const fuzzyIndex = await getPopularArtistsIndex();
  if (fuzzyIndex) {
    const indexMatches = fuzzyIndex.search(query, 6);
    if (indexMatches.length > 0) {
      const top = indexMatches[0];
      const { dist, score } = scoreCandidate(normQuery, top.name, top.popularity || 0, true);

      // High-confidence typo match for a prominent artist: return immediately and skip TMDB token calls!
      if ((dist <= 2.0 || score <= 1.2) && (top.popularity || 0) >= 1.0) {
        return { results: indexMatches.slice(0, 6) };
      }
    }
  }

  const candidatePool: TMDBPersonSearchResult[] = [];
  const seenIds = new Set<number>();

  const addCandidates = (list?: TMDBPersonSearchResult[]) => {
    if (!list) return;
    for (const c of list) {
      if (c && c.id && !seenIds.has(c.id)) {
        seenIds.add(c.id);
        candidatePool.push(c);
      }
    }
  };

  // Include direct results and any preliminary index matches
  addCandidates(directResults);
  if (fuzzyIndex) {
    const indexMatches = fuzzyIndex.search(query, 10);
    addCandidates(indexMatches);
  }

  // 2. Fall back to surname and first name queries on TMDB ONLY if local index didn't have a high-confidence match
  if (tokens.length >= 2) {
    // Token Decomposition: Extract surname (last token) and first name
    const surname = tokens[tokens.length - 1];
    const firstName = tokens[0];

    // Broad TMDB Candidate Fetch: Fetch TMDB candidates for surname and first name
    const [surRes, firstRes] = await Promise.all([
      tmdbFetch<{ results: TMDBPersonSearchResult[] }>(
        "/search/person",
        { query: surname },
        3600,
        customApiKey
      ),
      tmdbFetch<{ results: TMDBPersonSearchResult[] }>(
        "/search/person",
        { query: firstName },
        3600,
        customApiKey
      ),
    ]);

    addCandidates(surRes.data?.results);
    addCandidates(firstRes.data?.results);
  }

  // 3. Damerau-Levenshtein Scoring + Popularity Boost:
  // Score = LevenshteinDistance(query, candidate) - min(Popularity / 5, 2)
  const scored: Array<{ candidate: TMDBPersonSearchResult; score: number; dist: number }> = [];

  for (const c of candidatePool) {
    const isTop = fuzzyIndex ? fuzzyIndex.hasArtist(c.id) : false;
    const { dist, score } = scoreCandidate(normQuery, c.name, c.popularity || 0, isTop);
    if (dist <= 3.5 || score <= 2.2) {
      scored.push({ candidate: c, score, dist });
    }
  }

  scored.sort((a, b) => a.score - b.score);

  if (scored.length > 0) {
    return { results: scored.slice(0, 6).map((s) => s.candidate) };
  }

  return { results: directResults.slice(0, 6) };
}

/**
 * Get artist details
 */
export async function getPersonDetails(
  personId: number,
  customApiKey?: string
): Promise<TMDBPersonDetails | null> {
  if (!isValidPersonId(personId) || isPersonMarkedNotFound(personId)) {
    return null;
  }

  const { data, status } = await tmdbFetch<TMDBPersonDetails>(
    `/person/${personId}`,
    {},
    86400,
    customApiKey
  );

  if (status === 404 || !data || !data.id) {
    markPersonNotFound(personId);
    return null;
  }

  return data;
}

/**
 * Get combined credits (both movies and TV shows)
 */
export async function getPersonCredits(
  personId: number,
  customApiKey?: string
): Promise<TMDBPersonCreditsResponse> {
  const { data } = await tmdbFetch<TMDBPersonCreditsResponse>(
    `/person/${personId}/combined_credits`,
    {},
    21600,
    customApiKey
  );
  return data || { id: personId, cast: [], crew: [] };
}

export interface RawPersonReleasesResult {
  personName: string;
  releases: FormattedRelease[];
  profilePath: string | null;
  notFound?: boolean;
}

// In-flight promise map to deduplicate concurrent requests for the same artist
const inFlightRawFetches = new Map<string, Promise<RawPersonReleasesResult>>();

/**
 * Retrieve raw compiled releases for an artist from L1/L2 KV cache,
 * or fetch from TMDB once and populate KV with a 12-hour TTL.
 */
export async function getRawPersonReleases(
  personId: number,
  country: string = DEFAULT_FEED_OPTIONS.country,
  customApiKey?: string,
  bypassCache: boolean = false
): Promise<RawPersonReleasesResult> {
  if (!isValidPersonId(personId) || isPersonMarkedNotFound(personId)) {
    return { personName: "", releases: [], profilePath: null, notFound: true };
  }

  const countryUpper = (country || DEFAULT_FEED_OPTIONS.country).toUpperCase();
  const cacheKey = `raw_releases:${personId}:${countryUpper}${customApiKey ? `:${customApiKey}` : ""}`;

  // 1. Check L1/L2 KV cache unless explicitly bypassing
  if (!bypassCache) {
    const cached = await kv.get<RawPersonReleasesResult>(cacheKey);
    if (cached && cached.releases) {
      return cached;
    }
  }

  // 2. Deduplicate concurrent in-flight fetches for the same artist & country
  const existingFetch = inFlightRawFetches.get(cacheKey);
  if (existingFetch) {
    return existingFetch;
  }

  const fetchPromise = (async () => {
    try {
      const result = await fetchRawPersonReleasesFromTMDB(personId, countryUpper, customApiKey);
      if (!result.notFound && result.releases) {
        // Cache compiled raw releases in L1/L2 KV for 12 hours (43,200 seconds)
        await kv.set(cacheKey, result, 43200);
      }
      return result;
    } finally {
      inFlightRawFetches.delete(cacheKey);
    }
  })();

  inFlightRawFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function fetchRawPersonReleasesFromTMDB(
  personId: number,
  country: string,
  customApiKey?: string
): Promise<RawPersonReleasesResult> {
  // Fetch person profile and combined credits concurrently
  const [person, credits] = await Promise.all([
    getPersonDetails(personId, customApiKey),
    getPersonCredits(personId, customApiKey),
  ]);

  if (!person || !person.id) {
    markPersonNotFound(personId);
    return { personName: "", releases: [], profilePath: null, notFound: true };
  }

  const personName = person.name || "Artist";

  // Deduplicate and aggregate multiple roles per project in O(N)
  const candidateMap = new Map<string, CandidateEntry>();

  const addCandidate = (
    item: TMDBCreditItem,
    roleStr: string,
    mediaType: "movie" | "tv",
    isUncredited: boolean
  ) => {
    const key = `${mediaType}-${item.id}`;
    const existing = candidateMap.get(key);
    if (existing) {
      if (!existing.roles.includes(roleStr)) existing.roles.push(roleStr);
      if (!isUncredited) existing.isUncredited = false;
    } else {
      const dateStr =
        (mediaType === "tv" ? item.first_air_date : item.release_date) || "0000-00-00";
      candidateMap.set(key, { item, roles: [roleStr], mediaType, dateStr, isUncredited });
    }
  };

  // Process all crew credits
  if (credits.crew) {
    for (const item of credits.crew) {
      if (!item.id || (!item.title && !item.name)) continue;
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      const isUncredited = isSpecialGuestOrUncreditedCredit(item);
      addCandidate(item, resolveCrewRoleLabel(item), mediaType, isUncredited);
    }
  }

  // Process all cast credits
  if (credits.cast) {
    for (const item of credits.cast) {
      if (!item.id || (!item.title && !item.name)) continue;
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      const isUncredited = isSpecialGuestOrUncreditedCredit(item);
      addCandidate(item, resolveCastRoleLabel(item), mediaType, isUncredited);
    }
  }

  // Sort candidates:
  // 1. In-development / announced projects without confirmed release dates (dateStr === "0000-00-00") first
  // 2. Then by dateStr descending (most recent & upcoming first)
  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => {
    const aIsUndated = a.dateStr === "0000-00-00";
    const bIsUndated = b.dateStr === "0000-00-00";
    if (aIsUndated && !bIsUndated) return -1;
    if (!aIsUndated && bIsUndated) return 1;
    return b.dateStr > a.dateStr ? 1 : b.dateStr < a.dateStr ? -1 : 0;
  });

  // Evaluate top candidates (up to 30 projects covers all upcoming, recent 2-3 years, and recent catalog anniversary titles)
  const sliceCandidates = candidateList.slice(0, 30);
  const { nowStr, oneYearAgoStr, sevenDaysFromNowStr, thirtyDaysFromNowStr } =
    getDateWindowBoundaries();

  const ctx: ReleaseExtractionContext = {
    country,
    window: "all",
    alert: "announced",
    excludeShorts: false,
    excludeReReleases: false,
    normalizedTypes: ["cinema", "home", "premiere", "tv"],
    isEarliestOnly: false,
    nowStr,
    oneYearAgoStr,
    sevenDaysFromNowStr,
    thirtyDaysFromNowStr,
    clientKey: customApiKey,
    personId: Number(personId),
  };

  // Execute extraction with pooled concurrency (10 parallel requests max)
  const releasesNested = await mapConcurrent(
    sliceCandidates,
    10,
    async ({ item, roles: candidateRoles, mediaType, isUncredited }) => {
      const combinedRole = sortAndJoinRoles(candidateRoles);
      const itemCtx: ReleaseExtractionContext = {
        ...ctx,
        isCandidateUncredited: isUncredited,
      };
      if (mediaType === "movie") {
        return extractMovieReleases(item, combinedRole, itemCtx);
      }
      return extractTvReleases(item, combinedRole, itemCtx);
    }
  );

  const formattedReleases = releasesNested.flat();
  formattedReleases.sort(compareReleasesDescending);

  return {
    personName,
    releases: formattedReleases,
    profilePath: person.profile_path || null,
  };
}

/**
 * Compile formatted movie and TV releases for an artist.
 * Leverages L1/L2 KV cached raw releases and fast in-memory filtering.
 */
export async function getPersonReleases(
  options: FeedFilterOptions,
  customApiKey?: string
): Promise<{
  personName: string;
  releases: FormattedRelease[];
  profilePath?: string | null;
  notFound?: boolean;
}> {
  const {
    personId,
    roles = DEFAULT_FEED_OPTIONS.roles,
    types = DEFAULT_FEED_OPTIONS.types,
    country = DEFAULT_FEED_OPTIONS.country,
    window = "all",
    alert = DEFAULT_FEED_OPTIONS.alert,
    excludeShorts = DEFAULT_FEED_OPTIONS.excludeShorts,
    excludeReReleases = DEFAULT_FEED_OPTIONS.excludeReReleases,
    excludeUncredited = DEFAULT_FEED_OPTIONS.excludeUncredited,
    bypassCache = false,
  } = options;

  const rawData = await getRawPersonReleases(personId, country, customApiKey, bypassCache);
  if (rawData.notFound) {
    return rawData;
  }

  // Fast in-memory filtering from the cached raw releases
  const isRaw =
    roles.length === DEFAULT_FEED_OPTIONS.roles.length &&
    types.length === DEFAULT_FEED_OPTIONS.types.length &&
    !excludeShorts &&
    !excludeReReleases &&
    !excludeUncredited &&
    window === "all" &&
    alert === "announced";

  const releases = isRaw
    ? rawData.releases
    : filterReleases(rawData.releases, {
        roles,
        types,
        country,
        window,
        alert,
        excludeShorts,
        excludeReReleases,
        excludeUncredited,
      });

  return {
    personName: rawData.personName,
    releases,
    profilePath: rawData.profilePath,
  };
}
