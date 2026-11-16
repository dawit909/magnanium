import { describe, it, expect } from "vitest";
import {
  parseIsoDate,
  formatDisplayDate,
  formatEmailPubDate,
  formatRssPubDate,
  formatSubscribedDate,
  isUtcSaturday,
  isUtcFirstSaturdayOfMonth,
  getUtcYearMonth,
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

  describe("digest calendar timing helpers", () => {
    it("correctly identifies UTC Saturdays", () => {
      // 2026-11-07 is Saturday
      const sat = new Date("2026-11-07T08:00:00Z");
      expect(isUtcSaturday(sat)).toBe(true);

      // 2026-11-08 is Sunday
      const sun = new Date("2026-11-08T08:00:00Z");
      expect(isUtcSaturday(sun)).toBe(false);

      // 2026-11-16 is Monday
      const mon = new Date("2026-11-16T08:00:00Z");
      expect(isUtcSaturday(mon)).toBe(false);
    });

    it("correctly identifies the first Saturday of each month", () => {
      // 2026-11-07 is 1st Saturday of Nov 2026 (day 7 <= 7)
      const novFirstSat = new Date("2026-11-07T08:00:00Z");
      expect(isUtcFirstSaturdayOfMonth(novFirstSat)).toBe(true);

      // 2026-11-14 is 2nd Saturday of Nov 2026 (day 14 > 7)
      const novSecondSat = new Date("2026-11-14T08:00:00Z");
      expect(isUtcFirstSaturdayOfMonth(novSecondSat)).toBe(false);

      // 2026-12-05 is 1st Saturday of Dec 2026 (day 5 <= 7)
      const decFirstSat = new Date("2026-12-05T08:00:00Z");
      expect(isUtcFirstSaturdayOfMonth(decFirstSat)).toBe(true);

      // 2026-12-12 is 2nd Saturday of Dec 2026
      const decSecondSat = new Date("2026-12-12T08:00:00Z");
      expect(isUtcFirstSaturdayOfMonth(decSecondSat)).toBe(false);
    });

    it("formats UTC year-month string", () => {
      const d1 = new Date("2026-11-07T08:00:00Z");
      expect(getUtcYearMonth(d1)).toBe("2026-11");

      const d2 = new Date("2027-01-02T08:00:00Z");
      expect(getUtcYearMonth(d2)).toBe("2027-01");
    });
  });
});
