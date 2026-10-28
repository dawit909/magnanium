import { TMDBCreditItem } from "@/types/tmdb";

export const ROLE_PRIORITY = [
  "creator",
  "director",
  "writer",
  "executive producer",
  "producer",
  "actor",
  "original music composer",
  "composer",
  "music",
  "songs",
];

const SOUND_JOB_REGEX = /song|music|composer|score|vocal|singer|sound|musician|lyricist|conductor/i;
const DIRECTOR_REGEX = /director/i;
const WRITER_REGEX = /writer|screenplay/i;
const PRODUCER_REGEX = /producer/i;

function getRoleRank(role: string): number {
  const lower = role.toLowerCase();
  for (let i = 0; i < ROLE_PRIORITY.length; i++) {
    if (lower.includes(ROLE_PRIORITY[i])) return i;
  }
  return 99;
}

/**
 * Sort roles by importance and join.
 * Optimized with fast-paths for 0, 1, and 2 roles to avoid array allocations.
 */
export function sortAndJoinRoles(roles: string[]): string {
  const len = roles.length;
  if (len === 0) return "";
  if (len === 1) return roles[0];
  if (len === 2) {
    const rank0 = getRoleRank(roles[0]);
    const rank1 = getRoleRank(roles[1]);
    return rank0 <= rank1 ? `${roles[0]}, ${roles[1]}` : `${roles[1]}, ${roles[0]}`;
  }

  // For N > 2, precompute rank once per role before sorting
  const ranked = roles.map((role) => ({ role, rank: getRoleRank(role) }));
  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.map((r) => r.role).join(", ");
}

export function isSoundCredit(item: TMDBCreditItem): boolean {
  if (item.department && item.department.toLowerCase() === "sound") {
    return true;
  }
  return Boolean(item.job && SOUND_JOB_REGEX.test(item.job));
}

export function isIgnoredCrewCredit(item: TMDBCreditItem): boolean {
  if (item.job && /thanks/i.test(item.job)) return true;
  if (!item.job && item.department?.toLowerCase() === "crew") return true;
  return false;
}

export function matchesSpecificCrewRole(item: TMDBCreditItem, rolesFilter: string[]): boolean {
  const job = item.job || "";
  const dept = item.department || "";

  // Specific filmmaking roles
  if (rolesFilter.includes("director") && (DIRECTOR_REGEX.test(job) || /directing/i.test(dept))) {
    return true;
  }
  if (rolesFilter.includes("writer") && (WRITER_REGEX.test(job) || /writing/i.test(dept))) {
    return true;
  }
  if (rolesFilter.includes("producer") && (PRODUCER_REGEX.test(job) || /production/i.test(dept))) {
    return true;
  }

  // Behind the Scenes (crew) - excludes sound roles
  const isBts =
    rolesFilter.includes("all") ||
    rolesFilter.includes("crew") ||
    rolesFilter.includes("behind_the_scenes");
  if (isBts && !isSoundCredit(item)) {
    return true;
  }

  // Sound - includes song, composer, music, vocals, sound design, etc.
  const isSound =
    rolesFilter.includes("all") ||
    rolesFilter.includes("sound") ||
    rolesFilter.includes("music");
  if (isSound && isSoundCredit(item)) {
    return true;
  }

  return false;
}

export function resolveCrewRoleLabel(item: TMDBCreditItem): string {
  const job = item.job || "";
  const dept = item.department || "";

  if (DIRECTOR_REGEX.test(job) || /directing/i.test(dept)) return "Director";
  if (/creator/i.test(job) || /creator/i.test(dept)) return "Creator";
  if (/executive producer/i.test(job)) return "Executive Producer";
  if (PRODUCER_REGEX.test(job) || /production/i.test(dept)) return "Producer";
  if (WRITER_REGEX.test(job) || /writing/i.test(dept)) {
    return job && job.toLowerCase() !== "writer" ? `Writer (${job})` : "Writer";
  }
  return item.job || item.department || "Crew";
}

export function isTalkShowOrGuestAppearance(item: TMDBCreditItem): boolean {
  if (item.genre_ids?.includes(10767) || item.genre_ids?.includes(10763)) {
    return true;
  }
  const charLower = (item.character || "").toLowerCase();
  return charLower.startsWith("self - guest") || charLower === "self - interviewee";
}

export function resolveCastRoleLabel(item: TMDBCreditItem): string {
  const char = (item.character || "").trim();
  return char ? `Actor (${char})` : "Actor";
}
