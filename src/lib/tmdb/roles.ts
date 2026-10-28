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

export function sortAndJoinRoles(roles: string[]): string {
  const sorted = [...roles].sort((a, b) => {
    const idxA = ROLE_PRIORITY.findIndex((r) => a.toLowerCase().includes(r));
    const idxB = ROLE_PRIORITY.findIndex((r) => b.toLowerCase().includes(r));
    const orderA = idxA === -1 ? 99 : idxA;
    const orderB = idxB === -1 ? 99 : idxB;
    return orderA - orderB;
  });
  return sorted.join(", ");
}

export function isSoundCredit(item: TMDBCreditItem): boolean {
  const dept = (item.department || "").toLowerCase().trim();
  const job = (item.job || "").toLowerCase().trim();

  if (dept === "sound") return true;

  if (
    job.includes("song") ||
    job.includes("music") ||
    job.includes("composer") ||
    job.includes("score") ||
    job.includes("vocal") ||
    job.includes("singer") ||
    job.includes("sound") ||
    job === "musician" ||
    job === "lyricist" ||
    job === "conductor"
  ) {
    return true;
  }

  return false;
}

export function isIgnoredCrewCredit(item: TMDBCreditItem): boolean {
  const job = (item.job || "").toLowerCase().trim();
  const dept = (item.department || "").toLowerCase().trim();

  // Thanks, generic uncredited crew, or non-production entries
  if (job.includes("thanks") || (dept === "crew" && !job)) {
    return true;
  }

  return false;
}

export function matchesSpecificCrewRole(item: TMDBCreditItem, rolesFilter: string[]): boolean {
  const job = (item.job || "").toLowerCase().trim();
  const dept = (item.department || "").toLowerCase().trim();

  // Specific filmmaking roles
  if (rolesFilter.includes("director") && (job.includes("director") || dept === "directing")) {
    return true;
  }
  if (rolesFilter.includes("writer") && (job.includes("writer") || job.includes("screenplay") || dept === "writing")) {
    return true;
  }
  if (rolesFilter.includes("producer") && (job.includes("producer") || dept === "production")) {
    return true;
  }

  // Behind the Scenes (crew) - excludes sound roles
  const isBts = rolesFilter.includes("all") || rolesFilter.includes("crew") || rolesFilter.includes("behind_the_scenes");
  if (isBts && !isSoundCredit(item)) {
    return true;
  }

  // Sound - includes song, composer, music, vocals, sound design, etc.
  const isSound = rolesFilter.includes("all") || rolesFilter.includes("sound") || rolesFilter.includes("music");
  if (isSound && isSoundCredit(item)) {
    return true;
  }

  return false;
}

export function resolveCrewRoleLabel(item: TMDBCreditItem): string {
  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();

  if (job.includes("director") || dept === "directing") return "Director";
  if (job.includes("creator") || dept === "creator") return "Creator";
  if (job.includes("executive producer")) return "Executive Producer";
  if (job.includes("producer") || dept === "production") return "Producer";
  if (job.includes("screenplay") || job.includes("writer") || dept === "writing") {
    return item.job && item.job.toLowerCase() !== "writer" ? `Writer (${item.job})` : "Writer";
  }
  return item.job || item.department || "Crew";
}

export function isTalkShowOrGuestAppearance(item: TMDBCreditItem): boolean {
  // TMDB Genres: 10767 = Talk, 10763 = News/Talk
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
