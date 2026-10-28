import { FormattedRelease } from "@/types/tmdb";

/**
 * Escape text for iCalendar (RFC 5545) text fields.
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Format a YYYY-MM-DD date into iCalendar all-day date string (YYYYMMDD).
 */
function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/**
 * Calculate the next day's date string (YYYYMMDD) for exclusive DTEND in all-day events.
 */
function toIcsNextDay(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return toIcsDate(dateStr);
  }
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() + 1);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * Format a JavaScript Date into iCalendar UTC timestamp (YYYYMMDDTHHMMSSZ).
 */
function toIcsTimestamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateIcalFeed({
  personName,
  releases,
  feedUrl,
  siteUrl,
}: {
  personName: string;
  releases: FormattedRelease[];
  feedUrl: string;
  siteUrl: string;
}): string {
  const calName = `${personName} - Movie & TV Releases`;
  const calDesc = `Release dates calendar for ${personName}`;

  const events = releases
    .filter((rel) => Boolean(rel.releaseDate && /^\d{4}-\d{2}-\d{2}$/.test(rel.releaseDate)))
    .map((rel) => {
      const dtStart = toIcsDate(rel.releaseDate);
      const dtEnd = toIcsNextDay(rel.releaseDate);
      const dtStamp = `${dtStart}T000000Z`;
      const summary = `${rel.movieTitle} (${rel.releaseTypeLabel})`;
      const descLines = [
        `Title: ${rel.movieTitle}`,
        `Format: ${rel.releaseTypeLabel}`,
        rel.role ? `Role: ${rel.role}` : "",
        `Release Date: ${rel.releaseDate} (${rel.country})`,
        rel.overview ? `\n${rel.overview}` : "",
        `\nMore info: ${rel.tmdbUrl}`,
      ]
        .filter(Boolean)
        .join("\n");

      return [
        "BEGIN:VEVENT",
        `UID:${rel.id}@magnanium`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(descLines)}`,
        `URL:${rel.tmdbUrl}`,
        "STATUS:CONFIRMED",
        "TRANSP:TRANSPARENT",
        // Release day 9:00 AM notification reminder
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(`${rel.movieTitle} releases today!`)}`,
        "TRIGGER:-PT15H", // 15 hours before end of day = 9:00 AM on release day
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Magnanium//Movie & TV Releases//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-CALDESC:${escapeIcsText(calDesc)}`,
    "X-WR-TIMEZONE:UTC",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
    events,
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n") + "\r\n";
}
