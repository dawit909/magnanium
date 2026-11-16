import { describe, it, expect } from "vitest";
import {
  parseIsoDate,
  formatDisplayDate,
  formatEmailPubDate,
  formatRssPubDate,
  formatSubscribedDate,
} from "../date";

describe("date utilities", () => {
  describe("parseIsoDate", () => {
    it("parses full YYYY-MM-DD correctly", () => {
      const parsed = parseIsoDate("2026-12-25");
      expect(parsed).toEqual({ year: 2026, month: 12, day: 25 });
    });

    it("parses YYYY-MM correctly", () => {
      const parsed = parseIsoDate("2026-05");
      expect(parsed).toEqual({ year: 2026, month: 5, day: null });
    });

    it("parses YYYY correctly", () => {
      const parsed = parseIsoDate("2027");
      expect(parsed).toEqual({ year: 2027, month: null, day: null });
    });

    it("returns null on invalid or empty dates", () => {
      expect(parseIsoDate("")).toBeNull();
      expect(parseIsoDate(null)).toBeNull();
      expect(parseIsoDate(undefined)).toBeNull();
      expect(parseIsoDate("invalid-date")).toBeNull();
    });
  });

  describe("formatDisplayDate", () => {
    it("formats full date into standard human readable string", () => {
      expect(formatDisplayDate("2026-12-25")).toBe("Dec 25, 2026");
      expect(formatDisplayDate("2026-01-01")).toBe("Jan 1, 2026");
      expect(formatDisplayDate("2026-07-04")).toBe("Jul 4, 2026");
    });

    it("formats year-month into month and year", () => {
      expect(formatDisplayDate("2026-05")).toBe("May 2026");
    });

    it("formats year-only into string year", () => {
      expect(formatDisplayDate("2028")).toBe("2028");
    });

    it("falls back to default fallback on missing or unparseable input", () => {
      expect(formatDisplayDate("")).toBe("TBD");
      expect(formatDisplayDate(null)).toBe("TBD");
      expect(formatDisplayDate("unknown", "Coming Soon")).toBe("Coming Soon");
    });
  });

  describe("formatEmailPubDate", () => {
    it("formats release date into uppercase email pub date format", () => {
      expect(formatEmailPubDate("2026-12-25")).toBe("DEC 25, 2026");
      expect(formatEmailPubDate("2026-04-15")).toBe("APR 15, 2026");
    });

    it("falls back on missing dates", () => {
      expect(formatEmailPubDate(null)).toBe("DATE TBD");
      expect(formatEmailPubDate("")).toBe("DATE TBD");
    });
  });

  describe("formatRssPubDate", () => {
    it("formats date to RFC 822 UTC pubDate", () => {
      const pubDate = formatRssPubDate("2026-12-25");
      expect(pubDate).toBe("Fri, 25 Dec 2026 00:00:00 GMT");
    });

    it("uses fallback date if dateStr is invalid", () => {
      const fallback = "Thu, 01 Jan 2026 00:00:00 GMT";
      expect(formatRssPubDate(null, fallback)).toBe(fallback);
    });
  });

  describe("formatSubscribedDate", () => {
    it("formats timestamp into localized date", () => {
      const ts = new Date(2026, 5, 15).getTime();
      const formatted = formatSubscribedDate(ts);
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Jun");
    });
  });
});
