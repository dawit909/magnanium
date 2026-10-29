import { FormattedRelease, AlertTimingWindow } from "@/types/tmdb";
import { ROLE_REGEX } from "./tmdb/roles";

export interface ClientFilterOptions {
  roles: string[];
  types: string[];
  alert: AlertTimingWindow;
  excludeShorts: boolean;
  excludeReReleases: boolean;
  excludeUncredited: boolean;
}

export interface DateWindowBoundaries {
  nowStr: string;
  oneYearAgoStr: string;
  sevenDaysFromNowStr: string;
  thirtyDaysFromNowStr: string;
}

/**
 * Precomputes ISO 8601 date boundary strings once to eliminate repeated Date allocations.
 */
export function getDateWindowBoundaries(nowMs: number = Date.now()): DateWindowBoundaries {
  return {
    nowStr: new Date(nowMs).toISOString().split("T")[0],
    oneYearAgoStr: new Date(nowMs - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    sevenDaysFromNowStr: new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    thirtyDaysFromNowStr: new Date(nowMs + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  };
}

/**
 * Fast ISO 8601 release date sorting (direct byte/string comparison, ~10x faster than localeCompare).
 */
export function compareReleasesDescending(a: FormattedRelease, b: FormattedRelease): number {
  if (b.releaseDate !== a.releaseDate) {
    return b.releaseDate > a.releaseDate ? 1 : -1;
  }
  if (a.releaseType !== b.releaseType) {
    return a.releaseType === "cinema" ? -1 : 1;
  }
  return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
}

export function compareReleasesAscending(a: FormattedRelease, b: FormattedRelease): number {
  if (a.releaseDate !== b.releaseDate) {
    return a.releaseDate > b.releaseDate ? 1 : -1;
  }
  if (a.releaseType !== b.releaseType) {
    return a.releaseType === "cinema" ? -1 : 1;
  }
  return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
}

/**
 * Check if a release's combined role matches active roles with zero unnecessary allocations.
 */
export function matchesRoleFilter(
  roleStr: string,
  hasDirector: boolean,
  hasWriter: boolean,
  hasProducer: boolean,
  hasActor: boolean,
  hasCrew: boolean
): boolean {
  if (!roleStr) return false;

  if (hasDirector && ROLE_REGEX.director.test(roleStr)) return true;
  if (hasWriter && ROLE_REGEX.writer.test(roleStr)) return true;
  if (hasProducer && ROLE_REGEX.producer.test(roleStr)) return true;
  if (hasActor && ROLE_REGEX.actor.test(roleStr)) return true;

  if (hasCrew) {
    if (!roleStr.includes(",")) {
      return (
        !ROLE_REGEX.director.test(roleStr) &&
        !ROLE_REGEX.writer.test(roleStr) &&
        !ROLE_REGEX.producer.test(roleStr) &&
        !ROLE_REGEX.actor.test(roleStr)
      );
    }
    const parts = roleStr.split(",");
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (
        !ROLE_REGEX.director.test(p) &&
        !ROLE_REGEX.writer.test(p) &&
        !ROLE_REGEX.producer.test(p) &&
        !ROLE_REGEX.actor.test(p)
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter and format releases in-memory with single-pass, sub-millisecond execution.
 */
export function filterReleases(
  rawReleases: FormattedRelease[],
  options: ClientFilterOptions
): FormattedRelease[] {
  if (!rawReleases || rawReleases.length === 0) return [];

  const {
    roles,
    types,
    alert,
    excludeShorts,
    excludeReReleases,
    excludeUncredited,
  } = options;

  // If nothing is selected for role or format, result is strictly empty
  if (roles.length === 0 || types.length === 0) {
    return [];
  }

  // Precompute role flags once
  const roleAll = roles.includes("all") || roles.length >= 5;
  const hasDirector = roles.includes("director");
  const hasWriter = roles.includes("writer");
  const hasProducer = roles.includes("producer");
  const hasActor = roles.includes("actor");
  const hasCrew = roles.includes("crew");

  // Precompute alert window date boundaries once outside the loop (0 Date allocations in loop)
  const boundaries = getDateWindowBoundaries();
  const { oneYearAgoStr, sevenDaysFromNowStr, thirtyDaysFromNowStr } = boundaries;

  const isEarliestOnly = types.includes("earliest");
  const typeSet = isEarliestOnly ? null : new Set(types);

  // Single-pass filter loop
  const result: FormattedRelease[] = [];

  for (let i = 0; i < rawReleases.length; i++) {
    const item = rawReleases[i];

    // 1. Exclusions
    if (excludeShorts && item.isShort) continue;
    if ((excludeReReleases || isEarliestOnly) && item.isReRelease) continue;
    if (excludeUncredited && item.isUncredited) continue;

    // Earliest format only notifies on a project's true debut within the window (never pre-window catalogue titles)
    if (isEarliestOnly && item.originalReleaseDate && item.originalReleaseDate < oneYearAgoStr) continue;

    // 2. Format
    if (!isEarliestOnly && !typeSet!.has(item.releaseType)) continue;

    // 3. Alert timing window
    const d = item.releaseDate;
    if (!d || d < oneYearAgoStr) continue;
    if (alert === "week_before" && d > sevenDaysFromNowStr) continue;
    if (alert === "month_before" && d > thirtyDaysFromNowStr) continue;

    // 4. Role
    if (!roleAll) {
      if (
        !matchesRoleFilter(
          item.role,
          hasDirector,
          hasWriter,
          hasProducer,
          hasActor,
          hasCrew
        )
      ) {
        continue;
      }
    }

    result.push(item);
  }

  // 5. Earliest deduplication if requested
  if (isEarliestOnly) {
    const projectMap = new Map<string, FormattedRelease>();
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const key = `${item.mediaType}-${item.movieId}`;
      const existing = projectMap.get(key);
      if (!existing || item.releaseDate < existing.releaseDate) {
        projectMap.set(key, item);
      }
    }

    const earliestList = Array.from(projectMap.values());
    for (let i = 0; i < earliestList.length; i++) {
      const it = earliestList[i];
      if (!it.releaseTypeLabel.includes("(Earliest)")) {
        it.releaseTypeLabel = `${it.releaseTypeLabel} (Earliest)`;
      }
    }
    earliestList.sort(compareReleasesDescending);
    return earliestList;
  }

  // 6. Chronological sort
  result.sort(compareReleasesDescending);
  return result;
}
