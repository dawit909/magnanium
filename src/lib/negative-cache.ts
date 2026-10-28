// In-memory cache for non-existent TMDB person IDs (404s) to stop repeat cache-busting lookups
const notFoundCache = new Map<number, number>();

const TTL_MS = 60 * 60 * 1000; // Cache 404s for 1 hour

export function isValidPersonId(personId: number): boolean {
  return (
    Number.isInteger(personId) &&
    personId > 0 &&
    personId < 100_000_000
  );
}

export function isPersonMarkedNotFound(personId: number): boolean {
  const expiresAt = notFoundCache.get(personId);
  if (!expiresAt) return false;

  if (Date.now() > expiresAt) {
    notFoundCache.delete(personId);
    return false;
  }

  return true;
}

export function markPersonNotFound(personId: number): void {
  // Prevent unbounded cache growth
  if (notFoundCache.size > 10_000) {
    const oldestKey = notFoundCache.keys().next().value;
    if (oldestKey !== undefined) notFoundCache.delete(oldestKey);
  }

  notFoundCache.set(personId, Date.now() + TTL_MS);
}
