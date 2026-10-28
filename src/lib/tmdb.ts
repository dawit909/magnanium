import {
  TMDBPersonSearchResult,
  TMDBPersonCreditsResponse,
  TMDBPersonDetails,
  FormattedRelease,
  FeedFilterOptions,
  TMDBCreditItem,
} from "@/types/tmdb";
import { tmdbFetch, hasTmdbAuth } from "./tmdb/client";
import {
  sortAndJoinRoles,
  isIgnoredCrewCredit,
  matchesSpecificCrewRole,
  resolveCrewRoleLabel,
  isTalkShowOrGuestAppearance,
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

interface CandidateEntry {
  item: TMDBCreditItem;
  roles: string[];
  mediaType: "movie" | "tv";
  dateStr: string;
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

  return { results: (data?.results || []).slice(0, 8) };
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
    media = ["movie", "tv"],
    roles = ["actor", "crew"],
    types = ["cinema", "home"],
    country = "US",
    window = "all",
    alert = "announced",
    excludeShorts = false,
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

  const includeMovies = media.includes("movie");
  const includeTv = media.includes("tv");

  // Normalize release types
  const normalizedTypes = types.map((t) => {
    const lower = t.toLowerCase();
    if (lower === "theatrical") return "cinema";
    if (lower === "digital" || lower === "physical") return "home";
    return lower;
  });
  const isEarliestOnly = normalizedTypes.includes("earliest");

  const personName = person.name || "Artist";

  const isActorSelected = roles.includes("all") || roles.includes("actor");
  const isCrewSelected =
    roles.includes("all") ||
    roles.includes("crew") ||
    roles.includes("behind_the_scenes") ||
    roles.includes("director") ||
    roles.includes("writer") ||
    roles.includes("producer");
  const isSoundSelected =
    roles.includes("all") ||
    roles.includes("sound") ||
    roles.includes("music");
  const includeCrew = isCrewSelected || isSoundSelected;

  // Deduplicate and aggregate multiple roles per project in O(N)
  const candidateMap = new Map<string, CandidateEntry>();

  const addCandidate = (
    item: TMDBCreditItem,
    roleStr: string,
    mediaType: "movie" | "tv"
  ) => {
    const key = `${mediaType}-${item.id}`;
    const existing = candidateMap.get(key);
    if (existing) {
      if (!existing.roles.includes(roleStr)) existing.roles.push(roleStr);
    } else {
      const dateStr =
        (mediaType === "tv" ? item.first_air_date : item.release_date) || "0000-00-00";
      candidateMap.set(key, { item, roles: [roleStr], mediaType, dateStr });
    }
  };

  // Process crew credits
  if (includeCrew && credits.crew) {
    for (const item of credits.crew) {
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      if (mediaType === "movie" && !includeMovies) continue;
      if (mediaType === "tv" && !includeTv) continue;
      if (!item.id || (!item.title && !item.name)) continue;

      if (isIgnoredCrewCredit(item)) continue;
      if (!matchesSpecificCrewRole(item, roles)) continue;

      addCandidate(item, resolveCrewRoleLabel(item), mediaType);
    }
  }

  // Process cast credits
  if (isActorSelected && credits.cast) {
    for (const item of credits.cast) {
      const mediaType = (item.media_type as "movie" | "tv") || "movie";
      if (mediaType === "movie" && !includeMovies) continue;
      if (mediaType === "tv" && !includeTv) continue;
      if (!item.id || (!item.title && !item.name)) continue;

      if (mediaType === "tv" && isTalkShowOrGuestAppearance(item)) continue;

      addCandidate(item, resolveCastRoleLabel(item), mediaType);
    }
  }

  // Sort candidates by pre-extracted date descending (fast string comparison)
  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => (b.dateStr > a.dateStr ? 1 : b.dateStr < a.dateStr ? -1 : 0));

  const sliceCandidates = candidateList.slice(0, 40);
  const now = Date.now();
  const nowStr = new Date(now).toISOString().split("T")[0];
  const oneYearAgoStr = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const sevenDaysFromNowStr = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const ctx: ReleaseExtractionContext = {
    country,
    window,
    alert,
    excludeShorts,
    normalizedTypes,
    isEarliestOnly,
    nowStr,
    oneYearAgoStr,
    sevenDaysFromNowStr,
    clientKey: customApiKey,
  };

  // Execute extraction with pooled concurrency (10 parallel requests max)
  const releasesNested = await mapConcurrent(sliceCandidates, 10, async ({ item, roles: candidateRoles, mediaType }) => {
    const combinedRole = sortAndJoinRoles(candidateRoles);
    if (mediaType === "movie") {
      return extractMovieReleases(item, combinedRole, ctx);
    }
    return extractTvReleases(item, combinedRole, ctx);
  });

  const formattedReleases = releasesNested.flat();
  formattedReleases.sort((a, b) => (b.releaseDate > a.releaseDate ? 1 : b.releaseDate < a.releaseDate ? -1 : 0));

  return {
    personName,
    releases: formattedReleases,
    profilePath: person.profile_path || null,
  };
}
