import { TimedCache } from "./cache";

const ONE_HOUR_MS = 60 * 60 * 1000;
const notFoundCache = new TimedCache<number, boolean>(ONE_HOUR_MS, 10_000);

export function isValidPersonId(personId: number): boolean {
  return Number.isInteger(personId) && personId > 0 && personId < 100_000_000;
}

export function isPersonMarkedNotFound(personId: number): boolean {
  return notFoundCache.has(personId);
}

export function markPersonNotFound(personId: number): void {
  notFoundCache.set(personId, true);
}
