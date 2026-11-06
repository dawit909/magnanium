import { TMDBCreditItem, TMDBPersonCreditsResponse } from "@/types/tmdb";
import {
  isSpecialGuestOrUncreditedCredit,
  resolveCrewRoleLabel,
  resolveCastRoleLabel,
} from "./roles";

export interface CandidateEntry {
  item: TMDBCreditItem;
  roles: string[];
  mediaType: "movie" | "tv";
  dateStr: string;
  isUncredited: boolean;
  creditIds?: string[];
}

export const CANDIDATE_LIMITS = {
  CORE_TV: 20,
  GUEST_TV: 10,
  CATALOG_MOVIES: 18,
} as const;

/**
 * Deduplicate and aggregate multiple cast/crew roles per project in O(N).
 */
export function aggregateCandidatesFromCredits(
  credits: TMDBPersonCreditsResponse
): CandidateEntry[] {
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
      if (item.credit_id) {
        if (!existing.creditIds) existing.creditIds = [];
        if (!existing.creditIds.includes(item.credit_id)) {
          existing.creditIds.push(item.credit_id);
        }
      }
      if (typeof item.episode_count === "number") {
        existing.item.episode_count = Math.max(
          existing.item.episode_count || 0,
          item.episode_count
        );
      }
      if (item.first_credit_air_date) {
        if (
          !existing.item.first_credit_air_date ||
          item.first_credit_air_date > existing.item.first_credit_air_date
        ) {
          existing.item.first_credit_air_date = item.first_credit_air_date;
        }
      }
    } else {
      const dateStr =
        (mediaType === "tv" ? item.first_air_date : item.release_date) || "0000-00-00";
      candidateMap.set(key, {
        item: { ...item },
        roles: [roleStr],
        mediaType,
        dateStr,
        isUncredited,
        creditIds: item.credit_id ? [item.credit_id] : [],
      });
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

  return Array.from(candidateMap.values());
}

/**
 * Multi-tier deterministic candidate selection:
 * 1. All upcoming or undated projects (announced, in development, or future release dates).
 * 2. All recent projects that debuted within the active 1-year window.
 * 3. Core long-running TV series (artist is recurring regular >3 eps or creator/writer/director/producer),
 *    sorted by show popularity to capture returning series.
 * 4. Guest TV appearances within the 1-year window (capped to avoid displacing core series).
 * 5. Prominent catalog movies (sorted by popularity) to discover theatrical re-releases and remasters.
 */
export function selectAndSortCandidates(
  allCandidates: CandidateEntry[],
  boundaries: { nowStr: string; oneYearAgoStr: string }
): CandidateEntry[] {
  const { nowStr, oneYearAgoStr } = boundaries;

  const upcomingCandidates = allCandidates.filter(
    (c) => c.dateStr === "0000-00-00" || c.dateStr >= nowStr
  );

  const recentCandidates = allCandidates.filter(
    (c) => c.dateStr < nowStr && c.dateStr >= oneYearAgoStr
  );

  const coreTvCandidates = allCandidates
    .filter((c) => c.mediaType === "tv" && c.dateStr < oneYearAgoStr && !c.isUncredited)
    .sort((a, b) => (b.item.popularity || 0) - (a.item.popularity || 0))
    .slice(0, CANDIDATE_LIMITS.CORE_TV);

  const guestTvCandidates = allCandidates
    .filter((c) => c.mediaType === "tv" && c.dateStr < oneYearAgoStr && c.isUncredited)
    .sort((a, b) => (b.item.popularity || 0) - (a.item.popularity || 0))
    .slice(0, CANDIDATE_LIMITS.GUEST_TV);

  const catalogMovieCandidates = allCandidates
    .filter(
      (c) =>
        c.mediaType === "movie" &&
        c.dateStr < oneYearAgoStr &&
        c.dateStr !== "0000-00-00"
    )
    .sort((a, b) => (b.item.popularity || 0) - (a.item.popularity || 0))
    .slice(0, CANDIDATE_LIMITS.CATALOG_MOVIES);

  const selectedCandidatesMap = new Map<string, CandidateEntry>();
  for (const list of [
    upcomingCandidates,
    recentCandidates,
    coreTvCandidates,
    guestTvCandidates,
    catalogMovieCandidates,
  ]) {
    for (const c of list) {
      const key = `${c.mediaType}-${c.item.id}`;
      if (!selectedCandidatesMap.has(key)) {
        selectedCandidatesMap.set(key, c);
      }
    }
  }

  const activeCandidates = Array.from(selectedCandidatesMap.values());

  // Sort candidates with upcoming/undated first, then chronological descending
  activeCandidates.sort((a, b) => {
    const aIsUndated = a.dateStr === "0000-00-00";
    const bIsUndated = b.dateStr === "0000-00-00";
    if (aIsUndated && !bIsUndated) return -1;
    if (!aIsUndated && bIsUndated) return 1;
    return b.dateStr > a.dateStr ? 1 : b.dateStr < a.dateStr ? -1 : 0;
  });

  return activeCandidates;
}
