import { describe, it, expect } from "vitest";
import {
  areFeedOptionsEqual,
  isDefaultFeedOptions,
  normalizeTypes,
  normalizeRoles,
  extractFeedOptions,
  validateFeedOptions,
  DEFAULT_FEED_OPTIONS,
} from "../feed-options";

describe("feed-options utilities", () => {
  describe("normalizeTypes", () => {
    it("preserves multiple valid types when earliest is absent", () => {
      const types = ["cinema", "home", "tv"];
      expect(normalizeTypes(types)).toEqual(["cinema", "home", "tv"]);
    });

    it("collapses to ['earliest'] if earliest is present with other types", () => {
      const types = ["cinema", "earliest", "home"];
      expect(normalizeTypes(types)).toEqual(["earliest"]);
    });

    it("falls back to default types if empty or undefined", () => {
      expect(normalizeTypes([])).toEqual(DEFAULT_FEED_OPTIONS.types);
      expect(normalizeTypes(null)).toEqual(DEFAULT_FEED_OPTIONS.types);
      expect(normalizeTypes(undefined)).toEqual(DEFAULT_FEED_OPTIONS.types);
    });
  });

  describe("normalizeRoles", () => {
    it("returns non-empty roles array", () => {
      expect(normalizeRoles(["director", "writer"])).toEqual(["director", "writer"]);
    });

    it("falls back to default roles if empty or undefined", () => {
      expect(normalizeRoles([])).toEqual(DEFAULT_FEED_OPTIONS.roles);
      expect(normalizeRoles(null)).toEqual(DEFAULT_FEED_OPTIONS.roles);
    });
  });

  describe("extractFeedOptions", () => {
    it("fills missing options with defaults", () => {
      const partial = { country: "GB" };
      const full = extractFeedOptions(partial);
      expect(full.country).toBe("GB");
      expect(full.roles).toEqual(DEFAULT_FEED_OPTIONS.roles);
      expect(full.types).toEqual(DEFAULT_FEED_OPTIONS.types);
      expect(full.alert).toBe(DEFAULT_FEED_OPTIONS.alert);
      expect(full.frequency).toBe(DEFAULT_FEED_OPTIONS.frequency);
      expect(full.excludeShorts).toBe(DEFAULT_FEED_OPTIONS.excludeShorts);
      expect(full.excludeReReleases).toBe(DEFAULT_FEED_OPTIONS.excludeReReleases);
      expect(full.excludeUncredited).toBe(DEFAULT_FEED_OPTIONS.excludeUncredited);
    });

    it("handles null / undefined cleanly", () => {
      const full = extractFeedOptions(null, "FR");
      expect(full.country).toBe("FR");
      expect(full.alert).toBe("announced");
    });
  });

  describe("areFeedOptionsEqual", () => {
    it("returns true for identical options", () => {
      const a = { ...DEFAULT_FEED_OPTIONS };
      const b = { ...DEFAULT_FEED_OPTIONS };
      expect(areFeedOptionsEqual(a, b)).toBe(true);
    });

    it("returns true regardless of role ordering", () => {
      const a = { ...DEFAULT_FEED_OPTIONS, roles: ["director", "actor"] };
      const b = { ...DEFAULT_FEED_OPTIONS, roles: ["actor", "director"] };
      expect(areFeedOptionsEqual(a, b)).toBe(true);
    });

    it("returns true for case-insensitive country match", () => {
      const a = { ...DEFAULT_FEED_OPTIONS, country: "us" };
      const b = { ...DEFAULT_FEED_OPTIONS, country: "US" };
      expect(areFeedOptionsEqual(a, b)).toBe(true);
    });

    it("returns false if alert differs", () => {
      const a = { ...DEFAULT_FEED_OPTIONS, alert: "announced" as const };
      const b = { ...DEFAULT_FEED_OPTIONS, alert: "week_before" as const };
      expect(areFeedOptionsEqual(a, b)).toBe(false);
    });

    it("returns false if frequency differs", () => {
      const a = { ...DEFAULT_FEED_OPTIONS, frequency: "instant" as const };
      const b = { ...DEFAULT_FEED_OPTIONS, frequency: "weekly" as const };
      expect(areFeedOptionsEqual(a, b)).toBe(false);
    });

    it("returns false if exclusions differ", () => {
      const a = { ...DEFAULT_FEED_OPTIONS, excludeShorts: false };
      const b = { ...DEFAULT_FEED_OPTIONS, excludeShorts: true };
      expect(areFeedOptionsEqual(a, b)).toBe(false);
    });
  });

  describe("isDefaultFeedOptions", () => {
    it("returns true for pristine defaults", () => {
      expect(isDefaultFeedOptions(DEFAULT_FEED_OPTIONS)).toBe(true);
    });

    it("returns true when matching custom browser default country", () => {
      const customDefault = { ...DEFAULT_FEED_OPTIONS, country: "JP" };
      expect(isDefaultFeedOptions(customDefault, "JP")).toBe(true);
      expect(isDefaultFeedOptions(customDefault, "US")).toBe(false);
    });
  });

  describe("validateFeedOptions", () => {
    it("sanitizes untrusted input safely", () => {
      const untrusted = {
        roles: ["actor", "invalid_role"],
        types: ["cinema", "malicious_type"],
        country: "InvalidLongString",
        alert: "invalid_alert",
        excludeShorts: "not_a_boolean",
      };
      const sanitized = validateFeedOptions(untrusted);
      expect(sanitized.roles).toEqual(["actor"]);
      expect(sanitized.types).toEqual(["cinema"]);
      expect(sanitized.country).toBe("US");
      expect(sanitized.alert).toBe("announced");
      expect(sanitized.frequency).toBe("instant");
      expect(sanitized.excludeShorts).toBe(DEFAULT_FEED_OPTIONS.excludeShorts);
    });

    it("accepts valid digest frequencies", () => {
      expect(validateFeedOptions({ frequency: "weekly" }).frequency).toBe("weekly");
      expect(validateFeedOptions({ frequency: "monthly" }).frequency).toBe("monthly");
      expect(validateFeedOptions({ frequency: "instant" }).frequency).toBe("instant");
    });
  });
});
