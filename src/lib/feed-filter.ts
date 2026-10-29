import { FormattedRelease } from "@/types/tmdb";

export interface ClientFilterOptions {
  roles: string[];
  types: string[];
  alert: "announced" | "month_before" | "week_before";
  excludeShorts: boolean;
  excludeReReleases: boolean;
  excludeUncredited: boolean;
}

/**
 * Check if a release's combined role matches active roles in the filter.
 */
export function matchesRoleFilter(roleStr: string, activeRoles: string[]): boolean {
  if (activeRoles.includes("all") || activeRoles.length >= 5) return true;
  if (!roleStr) return false;

  const parts = roleStr.split(",").map((p) => p.trim().toLowerCase());
  for (const part of parts) {
    if (activeRoles.includes("director") && part.includes("director")) return true;
    if (
      activeRoles.includes("writer") &&
      (part.includes("writer") ||
        part.includes("screenplay") ||
        part.includes("creator") ||
        part.includes("teleplay") ||
        part.includes("story"))
    ) return true;
    if (activeRoles.includes("producer") && part.includes("producer")) return true;
    if (activeRoles.includes("actor") && part.includes("actor")) return true;
    if (
      activeRoles.includes("crew") &&
      !part.includes("director") &&
      !part.includes("writer") &&
      !part.includes("screenplay") &&
      !part.includes("creator") &&
      !part.includes("teleplay") &&
      !part.includes("story") &&
      !part.includes("producer") &&
      !part.includes("actor")
    ) return true;
  }
  return false;
}

/**
 * Check if a release date is within the requested alert timing window.
 */
export function isDateInAlertWindow(
  dateStr: string,
  alert: "announced" | "month_before" | "week_before",
  now: number = Date.now()
): boolean {
  if (!dateStr) return false;
  const oneYearAgoStr = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const sevenDaysFromNowStr = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const thirtyDaysFromNowStr = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (alert === "week_before" && dateStr > sevenDaysFromNowStr) return false;
  if (alert === "month_before" && dateStr > thirtyDaysFromNowStr) return false;
  if (dateStr < oneYearAgoStr) return false;
  return true;
}

/**
 * Filter and format releases in-memory with sub-millisecond execution.
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

  let list = rawReleases;

  // 1. Exclusions
  if (excludeShorts) {
    list = list.filter((item) => !item.isShort);
  }
  if (excludeReReleases) {
    list = list.filter((item) => !item.isReRelease);
  }
  if (excludeUncredited) {
    list = list.filter((item) => !item.isUncredited);
  }

  // 2. Roles
  if (!roles.includes("all") && roles.length < 5) {
    list = list.filter((item) => matchesRoleFilter(item.role, roles));
  }

  // 3. Format / Channel
  const isEarliestOnly = types.includes("earliest");
  if (isEarliestOnly) {
    // Group by project (mediaType + movieId) and keep the earliest debut
    const projectMap = new Map<string, FormattedRelease>();
    for (const item of list) {
      const key = `${item.mediaType}-${item.movieId}`;
      const existing = projectMap.get(key);
      if (!existing || item.releaseDate < existing.releaseDate) {
        projectMap.set(key, item);
      }
    }
    list = Array.from(projectMap.values()).map((item) => ({
      ...item,
      releaseTypeLabel: item.releaseTypeLabel.includes("(Earliest)")
        ? item.releaseTypeLabel
        : `${item.releaseTypeLabel} (Earliest)`,
    }));
  } else {
    list = list.filter((item) => types.includes(item.releaseType));
  }

  // 4. Alert timing window
  const now = Date.now();
  list = list.filter((item) => isDateInAlertWindow(item.releaseDate, alert, now));

  // 5. Chronological sort (newest / latest first)
  list.sort((a, b) => {
    const cmp = b.releaseDate.localeCompare(a.releaseDate);
    if (cmp !== 0) return cmp;
    if (a.releaseType !== b.releaseType) {
      return a.releaseType === "cinema" ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  return list;
}
