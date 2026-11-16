import { describe, it, expect } from "vitest";
import { normalizeSearchText, damerauLevenshtein, scoreCandidate } from "../fuzzy";

describe("fuzzy search utilities", () => {
  describe("normalizeSearchText", () => {
    it("strips accents and diacritics", () => {
      expect(normalizeSearchText("Denis Villeneuve")).toBe("denis villeneuve");
      expect(normalizeSearchText("Alejandro González Iñárritu")).toBe("alejandro gonzalez inarritu");
      expect(normalizeSearchText("Bong Joon-ho")).toBe("bong joon ho");
    });

    it("collapses multiple spaces and trims", () => {
      expect(normalizeSearchText("   Christopher   Nolan   ")).toBe("christopher nolan");
    });
  });

  describe("damerauLevenshtein", () => {
    it("computes 0 distance for identical strings", () => {
      expect(damerauLevenshtein("nolan", "nolan")).toBe(0);
    });

    it("handles single transposition", () => {
      // "onlan" vs "nolan" (1 transposition)
      expect(damerauLevenshtein("onlan", "nolan")).toBe(1);
    });

    it("handles insertions and deletions", () => {
      expect(damerauLevenshtein("nolan", "nolann")).toBe(1);
      expect(damerauLevenshtein("nolan", "nola")).toBe(1);
    });
  });

  describe("scoreCandidate", () => {
    it("gives low distance score to exact prefix matches", () => {
      const match = scoreCandidate("christopher", "Christopher Nolan", 10);
      expect(match.dist).toBeLessThanOrEqual(0.3);
      expect(match.score).toBeLessThan(0); // Boosted by popularity
    });

    it("gives high distance score for unrelated strings", () => {
      const unrelated = scoreCandidate("xyzabc", "Christopher Nolan", 0);
      expect(unrelated.dist).toBeGreaterThanOrEqual(5);
    });
  });
});
