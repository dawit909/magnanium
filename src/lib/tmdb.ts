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
import { getDateWindowBoundaries, compareReleasesDescending } from "./feed-filter";

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

  // Include direct results in case one ranks reasonably
  addCandidates(directResults);

  if (tokens.length >= 2) {
    // 1. Token Decomposition: Extract surname (last token) and first name
    const surname = tokens[tokens.length - 1];
    const firstName = tokens[0];

    // 2. Broad TMDB Candidate Fetch: Fetch TMDB candidates for surname and first name
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

  // Query top artists fuzzy index to inject known prominent artists
  const fuzzyIndex = await getPopularArtistsIndex();
  if (fuzzyIndex) {
    const indexMatches = fuzzyIndex.search(query, 10);
    addCandidates(indexMatches);
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

/**
 * Compile formatted movie and TV releases for an artist
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
  } = options;

  if (!isValidPersonId(personId) || isPersonMarkedNotFound(personId)) {
    return { personName: "", releases: [], profilePath: null, notFound: true };
  }

  // Fetch person profile and combined credits concurrently
  const [person, credits] = await Promise.all([
    getPersonDetails(personId, customApiKey),
    getPersonCredits(personId, customApiKey),
  ]);

  if (!person || !person.id) {
    markPersonNotFound(personId);
    return { personName: "", releases: [], profilePath: null, notFound: true };
  }

  // Normalize release types
  const normalizedTypes = types.map((t) => t.toLowerCase() as ReleaseTypeCategory);
  const isEarliestOnly = normalizedTypes.includes("earliest");

  // Determine media inclusion
  const includeMovies =
    normalizedTypes.some((t) => ["cinema", "home", "premiere"].includes(t)) ||
    isEarliestOnly ||
    normalizedTypes.length === 0;

  const includeTv = normalizedTypes.includes("tv") || isEarliestOnly;

  const personName = person.name || "Artist";

  const isActorSelected = roles.includes("all") || roles.includes("actor");
  const includeCrew =
    roles.includes("all") ||
    roles.includes("director") ||
    roles.includes("writer") ||
    roles.includes("producer") ||
    roles.includes("crew");

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

  // Process crew credits
  if (includeCrew && credits.crew) {
    for (const item of credits.crew) {
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      if (mediaType === "movie" && !includeMovies) continue;
      if (mediaType === "tv" && !includeTv) continue;
      if (!item.id || (!item.title && !item.name)) continue;

      const isUncredited = isSpecialGuestOrUncreditedCredit(item);
      if (excludeUncredited && isUncredited) continue;
      if (!matchesSpecificCrewRole(item, roles)) continue;

      addCandidate(item, resolveCrewRoleLabel(item), mediaType, isUncredited);
    }
  }

  // Process cast credits
  if (isActorSelected && credits.cast) {
    for (const item of credits.cast) {
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      if (mediaType === "movie" && !includeMovies) continue;
      if (mediaType === "tv" && !includeTv) continue;
      if (!item.id || (!item.title && !item.name)) continue;

      const isUncredited = isSpecialGuestOrUncreditedCredit(item);
      if (excludeUncredited && isUncredited) continue;

      addCandidate(item, resolveCastRoleLabel(item), mediaType, isUncredited);
    }
  }

  // Sort candidates by pre-extracted date descending (fast string comparison)
  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => (b.dateStr > a.dateStr ? 1 : b.dateStr < a.dateStr ? -1 : 0));

  const sliceCandidates = candidateList.slice(0, 40);
  const { nowStr, oneYearAgoStr, sevenDaysFromNowStr, thirtyDaysFromNowStr } =
    getDateWindowBoundaries();

  const ctx: ReleaseExtractionContext = {
    country,
    window,
    alert,
    excludeShorts,
    excludeReReleases,
    normalizedTypes,
    isEarliestOnly,
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
