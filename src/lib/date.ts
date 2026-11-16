const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export interface ParsedIsoDate {
  year: number;
  month: number | null;
  day: number | null;
}

/**
 * Safely parse an ISO date string (YYYY, YYYY-MM, or YYYY-MM-DD)
 * without timezone drift or Date object allocation.
 */
export function parseIsoDate(dateStr?: string | null): ParsedIsoDate | null {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }
  const match = dateStr.trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/);
  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = match[2] ? parseInt(match[2], 10) : null;
  const day = match[3] ? parseInt(match[3], 10) : null;

  return { year, month, day };
}

/**
 * Format date for display in the UI (e.g. "Dec 25, 2026" or "May 2026" or "2026").
 * Immune to client-side timezone offsets or day-shifting bugs.
 */
export function formatDisplayDate(dateStr?: string | null, fallback: string = "TBD"): string {
  const parsed = parseIsoDate(dateStr);
  if (!parsed) {
    return fallback;
  }

  const { year, month, day } = parsed;
  if (!month) {
    return String(year);
  }

  const monthName = SHORT_MONTHS[month - 1] || "";
  if (!day) {
    return `${monthName} ${year}`;
  }

  return `${monthName} ${day}, ${year}`;
}

/**
 * Format date for email alert headers (e.g. "DEC 25, 2026").
 */
export function formatEmailPubDate(dateStr?: string | null, fallback: string = "DATE TBD"): string {
  const parsed = parseIsoDate(dateStr);
  if (!parsed) {
    return fallback;
  }

  const { year, month, day } = parsed;
  if (!month) {
    return String(year);
  }

  const monthName = (SHORT_MONTHS[month - 1] || "").toUpperCase();
  if (!day) {
    return `${monthName} ${year}`;
  }

  return `${monthName} ${day}, ${year}`;
}

/**
 * Format date for RSS feed pubDate element (RFC 822 / 2822 UTC format).
 * e.g. "Fri, 25 Dec 2026 00:00:00 GMT"
 */
export function formatRssPubDate(dateStr?: string | null, fallbackDate?: string): string {
  const parsed = parseIsoDate(dateStr);
  if (!parsed) {
    return fallbackDate || new Date().toUTCString();
  }

  const { year, month, day } = parsed;
  const d = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 0, 0, 0));
  if (isNaN(d.getTime())) {
    return fallbackDate || new Date().toUTCString();
  }

  return d.toUTCString();
}

/**
 * Format a timestamp (e.g. subscribedAt) into standard human-readable date.
 */
export function formatSubscribedDate(timestamp: number | string | Date): string {
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {}
  return "";
}

/**
 * Check if a date is a Saturday (in UTC).
 */
export function isUtcSaturday(date: Date = new Date()): boolean {
  return date.getUTCDay() === 6;
}

/**
 * Check if a date is the first Saturday of the month (in UTC).
 * A Saturday is the first Saturday of the calendar month if its day of month is <= 7.
 */
export function isUtcFirstSaturdayOfMonth(date: Date = new Date()): boolean {
  return date.getUTCDay() === 6 && date.getUTCDate() <= 7;
}

/**
 * Returns the current UTC Year-Month identifier (e.g. "2026-11").
 */
export function getUtcYearMonth(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
