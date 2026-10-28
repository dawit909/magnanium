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

export function isDirectorCredit(item: TMDBCreditItem): boolean {
  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();
  if (job.includes("photography") || dept.includes("camera")) {
    return false;
  }
  return job.includes("director") || dept.includes("directing");
}

export function isWriterCredit(item: TMDBCreditItem): boolean {
  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();
  return (
    job.includes("writer") ||
    job.includes("screenplay") ||
    job.includes("teleplay") ||
    job.includes("story") ||
    job.includes("written by") ||
    job.includes("creator") ||
    job.includes("showrunner") ||
    job.includes("created by") ||
    dept.includes("writing") ||
    dept.includes("creator")
  );
}

export function isProducerCredit(item: TMDBCreditItem): boolean {
  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();
  return job.includes("producer") || dept.includes("production");
}

export function isOtherCrewCredit(item: TMDBCreditItem): boolean {
  return !isDirectorCredit(item) && !isWriterCredit(item) && !isProducerCredit(item);
}

export function isIgnoredCrewCredit(item: TMDBCreditItem): boolean {
  if (item.job && /thanks/i.test(item.job)) return true;
  if (!item.job && item.department?.toLowerCase() === "crew") return true;
  return false;
}

export const ARCHIVAL_FOOTAGE_REGEX =
  /\b(archive|archival|stock)\s+(footage|sound|audio)\b|\((?:archive|archival|footage)\)/i;

export function isArchivalFootageCredit(item: TMDBCreditItem): boolean {
  const char = (item.character || "").trim();
  const job = (item.job || "").trim();
  return ARCHIVAL_FOOTAGE_REGEX.test(char) || ARCHIVAL_FOOTAGE_REGEX.test(job);
}

export function matchesSpecificCrewRole(item: TMDBCreditItem, rolesFilter: string[]): boolean {
  if (rolesFilter.includes("all")) return true;

  if (rolesFilter.includes("director") && isDirectorCredit(item)) {
    return true;
  }
  if (rolesFilter.includes("writer") && isWriterCredit(item)) {
    return true;
  }
  if (rolesFilter.includes("producer") && isProducerCredit(item)) {
    return true;
  }
  if (rolesFilter.includes("crew") && isOtherCrewCredit(item)) {
    return true;
  }

  return false;
}

export function resolveCrewRoleLabel(item: TMDBCreditItem): string {
  const job = (item.job || "").trim();
  const dept = (item.department || "").trim();

  if (isDirectorCredit(item)) return "Director";
  if (/creator|showrunner/i.test(job) || /creator/i.test(dept)) return "Creator";
  if (/executive producer/i.test(job)) return "Executive Producer";
  if (isProducerCredit(item)) return "Producer";
  if (isWriterCredit(item)) {
    return job && job.toLowerCase() !== "writer" && job.toLowerCase() !== "creator"
      ? `Writer (${job})`
      : "Writer";
  }
  return job || dept || "Crew";
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
