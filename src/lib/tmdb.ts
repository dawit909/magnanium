import {
  TMDBPersonSearchResult,
  TMDBPersonCreditsResponse,
  FormattedRelease,
  FeedFilterOptions,
  TMDBCreditItem,
} from "@/types/tmdb";
import {
  tmdbFetch,
  hasTmdbAuth,
  getResolvedApiKey,
} from "./tmdb/client";
import {
  sortAndJoinRoles,
  isIgnoredCrewCredit,
  matchesSpecificCrewRole,
  resolveCrewRoleLabel,
  isTalkShowOrGuestAppearance,
  resolveCastRoleLabel,
} from "./tmdb/roles";
import {
  mapReleaseType,
  extractMovieReleases,
  extractTvReleases,
  ReleaseExtractionContext,
} from "./tmdb/releases";
import {
  isValidPersonId,
  isPersonMarkedNotFound,
  markPersonNotFound,
} from "./negative-cache";

// Re-export helpers for backward compatibility
export { getResolvedApiKey, mapReleaseType };

/**
 * Search TMDB for an artist (director, actor, crew, creator)
 */
export async function searchPerson(
  query: string,
  customApiKey?: string
): Promise<{ results: TMDBPersonSearchResult[]; noApiKey?: boolean }> {
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

  return { results: (data?.results || []).slice(0, 8) };
}

/**
 * Get artist details
 */
export async function getPersonDetails(personId: number, customApiKey?: string) {
  if (!isValidPersonId(personId) || isPersonMarkedNotFound(personId)) {
    return null;
  }

  const { data, status } = await tmdbFetch<any>(
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

export const getPersonCombinedCredits = getPersonCredits;

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

  const person = await getPersonDetails(personId, customApiKey);
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

  const credits = await getPersonCombinedCredits(personId, customApiKey);
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

  // Deduplicate and aggregate multiple roles per project (e.g. Director & Writer)
  const candidateMap = new Map<
    string,
    { item: TMDBCreditItem; roles: string[]; mediaType: "movie" | "tv" }
  >();

  const addCandidate = (item: TMDBCreditItem, roleStr: string, mediaType: "movie" | "tv") => {
    const key = `${mediaType}-${item.id}`;
    const existing = candidateMap.get(key);
    if (existing) {
      if (!existing.roles.includes(roleStr)) existing.roles.push(roleStr);
    } else {
      candidateMap.set(key, { item, roles: [roleStr], mediaType });
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

  // Sort candidates by date descending and take top 40 for details resolution
  const candidateList = Array.from(candidateMap.values());
  candidateList.sort((a, b) => {
    const dateA = (a.mediaType === "tv" ? a.item.first_air_date : a.item.release_date) || "0000-00-00";
    const dateB = (b.mediaType === "tv" ? b.item.first_air_date : b.item.release_date) || "0000-00-00";
    return dateB.localeCompare(dateA);
  });

  const sliceCandidates = candidateList.slice(0, 40);
  const nowStr = new Date().toISOString().split("T")[0];
  const oneYearAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const sevenDaysFromNowStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

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

  const releasesNested = await Promise.all(
    sliceCandidates.map(({ item, roles: candidateRoles, mediaType }) => {
      const combinedRole = sortAndJoinRoles(candidateRoles);
      if (mediaType === "movie") {
        return extractMovieReleases(item, combinedRole, ctx);
      }
      return extractTvReleases(item, combinedRole, ctx);
    })
  );

  const formattedReleases = releasesNested.flat();
  formattedReleases.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return {
    personName,
    releases: formattedReleases,
    profilePath: person.profile_path || null,
  };
}
