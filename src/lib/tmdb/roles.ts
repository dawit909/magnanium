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

export const ROLE_REGEX = {
  director: /director/i,
  writer: /writer|screenplay|creator|teleplay|story/i,
  producer: /producer/i,
  actor: /actor/i,
} as const;

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

export const TALK_REALITY_GENRE_IDS = new Set([10767, 10763, 10764]);

export const NON_NARRATIVE_TITLE_REGEX =
  /\b(tonight show|late show|late night|late late show|daily show|jimmy kimmel|graham norton|kelly clarkson|jennifer hudson|el hormiguero|quotidien|watch what happens live|hot ones|actors on actors|today show|good morning america|jeopardy!?|wheel of fortune|family feud|price is right|who wants to be a millionaire|oscars?|academy awards?|emmy awards?|emmys?|golden globes?|grammy awards?|grammys?|tony awards?|bafta|mtv movie|screen actors guild awards?|sag awards?|critics choice|peoples choice|choice awards|music awards|dancing with the stars|project runway|america's next top model|k-foodie meets j-foodie)\b/i;

export const GUEST_OR_NON_NARRATIVE_ROLE_REGEX =
  /^\s*(self|herself|himself|themselves|guest|special guest|guest star|guest host|guest judge|judge|contestant|clue presenter|presenter|interviewee|panelist|nominee|winner)\b/i;

export function isNonNarrativeShow(item: TMDBCreditItem): boolean {
  if (item.genre_ids?.some((g) => TALK_REALITY_GENRE_IDS.has(g))) {
    return true;
  }
  const title = (item.name || item.title || "").trim();
  return Boolean(title && NON_NARRATIVE_TITLE_REGEX.test(title));
}

export function isHostOrCoreRegular(item: TMDBCreditItem): boolean {
  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();
  if (/creator|showrunner|host|executive producer|head writer/i.test(job)) return true;
  if (/creator/i.test(dept)) return true;
  const char = (item.character || "").toLowerCase();
  if (/\bhost\b/i.test(char) && !/\bguest host\b/i.test(char) && !/\bpresenter\b/i.test(char)) {
    if (typeof item.episode_count === "number" && item.episode_count >= 10) return true;
  }
  if (typeof item.episode_count === "number" && item.episode_count >= 50) return true;
  return false;
}

export function isTalkShowOrGuestAppearance(item: TMDBCreditItem): boolean {
  if (isHostOrCoreRegular(item)) return false;

  const char = (item.character || "").trim();
  const isNonNarrative = isNonNarrativeShow(item);

  if (GUEST_OR_NON_NARRATIVE_ROLE_REGEX.test(char)) {
    if (isNonNarrative) return true;
    if (/^\s*(self|herself|himself|themselves|guest)\b/i.test(char)) return true;
  }

  if (isNonNarrative && (!char || /^actor$/i.test(char))) {
    return true;
  }

  return false;
}

export const SPECIAL_GUEST_UNCREDITED_REGEX =
  /\b(uncredited|cameo|special appearance|special guest|guest star|guest appearance|in memory of|dedicated to)\b|\((?:uncredited|cameo|guest|special appearance)\)/i;

/**
 * Checks whether a cast or crew credit is a special, guest, cameo,
 * uncredited, archival, or talk show appearance.
 */
export function isSpecialGuestOrUncreditedCredit(item: TMDBCreditItem): boolean {
  if (isIgnoredCrewCredit(item)) return true;
  if (isHostOrCoreRegular(item)) return false;
  if (isArchivalFootageCredit(item)) return true;
  if (isTalkShowOrGuestAppearance(item)) return true;

  const char = (item.character || "").trim();
  const job = (item.job || "").trim();

  return SPECIAL_GUEST_UNCREDITED_REGEX.test(char) || SPECIAL_GUEST_UNCREDITED_REGEX.test(job);
}

export function resolveCastRoleLabel(item: TMDBCreditItem): string {
  const char = (item.character || "").trim();
  return char ? `Actor (${char})` : "Actor";
}
