import { TMDBCreditItem } from "@/types/tmdb";

export const ROLE_PRIORITY = [
  "creator",
  "director",
  "writer",
  "executive producer",
  "producer",
  "actor",
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

export function isIgnoredCrewCredit(item: TMDBCreditItem): boolean {
  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();
  return job.includes("thanks") || dept === "crew";
}

export function matchesSpecificCrewRole(item: TMDBCreditItem, rolesFilter: string[]): boolean {
  if (rolesFilter.length !== 1) return true;

  const job = (item.job || "").toLowerCase();
  const dept = (item.department || "").toLowerCase();

  if (rolesFilter.includes("director")) {
    return job.includes("director") || dept === "directing";
  }
  if (rolesFilter.includes("writer")) {
    return job.includes("writer") || job.includes("screenplay") || dept === "writing";
  }
  if (rolesFilter.includes("producer")) {
    return job.includes("producer") || dept === "production";
  }

  return true;
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
