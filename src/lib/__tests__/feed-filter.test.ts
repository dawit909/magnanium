import { describe, it, expect } from "vitest";
import {
  filterReleases,
  compareReleasesDescending,
  compareReleasesAscending,
  matchesRoleFilter,
  getDateWindowBoundaries,
} from "../feed-filter";
import { FormattedRelease } from "@/types/tmdb";

function createMockRelease(overrides: Partial<FormattedRelease> = {}): FormattedRelease {
  return {
    id: "movie-100-cinema",
    mediaType: "movie",
    movieId: 100,
    movieTitle: "Inception 2",
    overview: "A dream within a dream.",
    posterPath: "/poster.jpg",
    releaseDate: "2027-06-15",
    releaseType: "cinema",
    releaseTypeLabel: "Cinema",
    country: "US",
    role: "Director",
    tmdbUrl: "https://www.themoviedb.org/movie/100",
    ...overrides,
  };
}

describe("feed-filter utilities", () => {
  describe("matchesRoleFilter", () => {
    it("matches single roles accurately", () => {
      expect(matchesRoleFilter("Director", true, false, false, false, false)).toBe(true);
      expect(matchesRoleFilter("Writer", false, true, false, false, false)).toBe(true);
      expect(matchesRoleFilter("Actor", false, false, false, true, false)).toBe(true);
      expect(matchesRoleFilter("Producer", false, false, true, false, false)).toBe(true);
      expect(matchesRoleFilter("Actor", true, false, false, false, false)).toBe(false);
    });

    it("matches composite roles accurately", () => {
      const composite = "Director, Writer";
      expect(matchesRoleFilter(composite, true, false, false, false, false)).toBe(true);
      expect(matchesRoleFilter(composite, false, true, false, false, false)).toBe(true);
      expect(matchesRoleFilter(composite, false, false, false, true, false)).toBe(false);
    });

    it("handles crew roles", () => {
      expect(matchesRoleFilter("Cinematographer", false, false, false, false, true)).toBe(true);
      expect(matchesRoleFilter("Director", false, false, false, false, true)).toBe(false);
    });
  });

  describe("compareReleases", () => {
    it("sorts releases descending chronologically", () => {
      const a = createMockRelease({ id: "1", releaseDate: "2026-10-01" });
      const b = createMockRelease({ id: "2", releaseDate: "2026-12-01" });
      expect(compareReleasesDescending(a, b)).toBe(1); // b before a
      expect(compareReleasesDescending(b, a)).toBe(-1);
    });

    it("safely handles empty release dates", () => {
      const a = createMockRelease({ id: "1", releaseDate: "" });
      const b = createMockRelease({ id: "2", releaseDate: "2026-12-01" });
      expect(() => compareReleasesDescending(a, b)).not.toThrow();
    });
  });

  describe("filterReleases", () => {
    const boundaries = getDateWindowBoundaries();

    it("filters out releases not matching active roles", () => {
      const releases = [
        createMockRelease({ id: "1", role: "Actor" }),
        createMockRelease({ id: "2", role: "Director" }),
      ];

      const filtered = filterReleases(releases, {
        roles: ["director"],
        types: ["cinema"],
        alert: "announced",
        excludeShorts: false,
        excludeReReleases: false,
        excludeUncredited: false,
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("2");
    });

    it("filters out releases by format type", () => {
      const releases = [
        createMockRelease({ id: "1", releaseType: "cinema" }),
        createMockRelease({ id: "2", releaseType: "home" }),
      ];

      const filtered = filterReleases(releases, {
        roles: ["all"],
        types: ["home"],
        alert: "announced",
        excludeShorts: false,
        excludeReReleases: false,
        excludeUncredited: false,
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("2");
    });

    it("respects excludeShorts, excludeReReleases, and excludeUncredited flags", () => {
      const releases = [
        createMockRelease({ id: "1", isShort: true }),
        createMockRelease({ id: "2", isReRelease: true }),
        createMockRelease({ id: "3", isUncredited: true }),
        createMockRelease({ id: "4" }),
      ];

      const filtered = filterReleases(releases, {
        roles: ["all"],
        types: ["cinema"],
        alert: "announced",
        excludeShorts: true,
        excludeReReleases: true,
        excludeUncredited: true,
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("4");
    });

    it("filters for earliest format debut", () => {
      const releases = [
        createMockRelease({ id: "movie-1-cinema", movieId: 1, releaseDate: "2027-01-01", releaseType: "cinema" }),
        createMockRelease({ id: "movie-1-home", movieId: 1, releaseDate: "2027-03-01", releaseType: "home" }),
      ];

      const filtered = filterReleases(releases, {
        roles: ["all"],
        types: ["earliest"],
        alert: "announced",
        excludeShorts: false,
        excludeReReleases: false,
        excludeUncredited: false,
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("movie-1-cinema");
      expect(filtered[0].releaseTypeLabel).toContain("(Earliest)");
    });
  });
});
