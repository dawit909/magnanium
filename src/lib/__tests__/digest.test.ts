import { describe, it, expect } from "vitest";
import { SUB_KEYS } from "../subscriptions";
import { sendReleaseAlertEmail } from "../email";
import { getDateWindowBoundaries } from "../feed-filter";
import { FormattedRelease } from "@/types/tmdb";

describe("digest frequency and summary tests", () => {
  const dummyRelease: FormattedRelease = {
    id: "movie-12345",
    movieId: 12345,
    mediaType: "movie",
    movieTitle: "Interstellar 2",
    overview: "A thrilling cosmic exploration.",
    posterPath: "/poster.jpg",
    releaseDate: "2027-05-15",
    releaseType: "cinema",
    releaseTypeLabel: "Cinema Release",
    role: "Director",
    country: "US",
    tmdbUrl: "https://www.themoviedb.org/movie/12345",
  };

  describe("Redis KV Key format and intervals", () => {
    it("generates correct key for weekly digest throttle", () => {
      const key = SUB_KEYS.digestSent("weekly", "cinephile@example.com", 525);
      expect(key).toBe("sub:digest:weekly:cinephile@example.com:525");
    });

    it("generates correct key for monthly digest throttle", () => {
      const key = SUB_KEYS.digestSent("monthly", "cinephile@example.com", 525);
      expect(key).toBe("sub:digest:monthly:cinephile@example.com:525");
    });

    it("defines 7-day and 30-day throttle intervals", () => {
      const weeklySeconds = 7 * 86400;
      const monthlySeconds = 30 * 86400;

      expect(weeklySeconds).toBe(604800);
      expect(monthlySeconds).toBe(2592000);
    });
  });

  describe("Email Digest Subject Line & Simulation", () => {
    it("simulates instant alert cleanly", async () => {
      const res = await sendReleaseAlertEmail({
        to: "tester@example.com",
        artistName: "Christopher Nolan",
        releases: [dummyRelease],
        artistUrl: "https://magnanium.com/christopher-nolan-525",
        manageUrl: "https://magnanium.com/feeds",
        unsubscribeUrl: "https://magnanium.com/unsubscribe",
        frequency: "instant",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("simulates weekly digest with proper frequency flag", async () => {
      const res = await sendReleaseAlertEmail({
        to: "tester@example.com",
        artistName: "Christopher Nolan",
        releases: [dummyRelease],
        artistUrl: "https://magnanium.com/christopher-nolan-525",
        manageUrl: "https://magnanium.com/feeds",
        unsubscribeUrl: "https://magnanium.com/unsubscribe",
        frequency: "weekly",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it("simulates monthly digest with multiple upcoming releases", async () => {
      const releases: FormattedRelease[] = [
        dummyRelease,
        {
          ...dummyRelease,
          id: "movie-67890",
          movieId: 67890,
          movieTitle: "The Odyssey",
          releaseDate: "2027-11-20",
        },
      ];

      const res = await sendReleaseAlertEmail({
        to: "tester@example.com",
        artistName: "Christopher Nolan",
        releases,
        artistUrl: "https://magnanium.com/christopher-nolan-525",
        manageUrl: "https://magnanium.com/feeds",
        unsubscribeUrl: "https://magnanium.com/unsubscribe",
        frequency: "monthly",
      });

      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });
  });

  describe("Subscriber Date Window Boundaries & New Subscriber Protection", () => {
    it("provides 2-day, 7-day, and 30-day lookback boundaries", () => {
      const now = new Date("2026-11-16T12:00:00Z").getTime();
      const b = getDateWindowBoundaries(now);

      expect(b.nowStr).toBe("2026-11-16");
      expect(b.twoDaysAgoStr).toBe("2026-11-14");
      expect(b.sevenDaysAgoStr).toBe("2026-11-09");
      expect(b.thirtyDaysAgoStr).toBe("2026-10-17");
      expect(b.sevenDaysFromNowStr).toBe("2026-11-23");
      expect(b.thirtyDaysFromNowStr).toBe("2026-12-16");
    });

    it("ensures old releases released before subscription date are rejected", () => {
      const nowMs = new Date("2026-11-16T12:00:00Z").getTime();
      const boundaries = getDateWindowBoundaries(nowMs);
      const subscribedAt = new Date("2026-11-16T10:00:00Z").getTime();
      const subscribedDateStr = new Date(subscribedAt).toISOString().split("T")[0];

      // Release that premiered 1 month earlier (e.g. Carrie: Season 1 on October 7, 2026)
      const oldReleaseDate = "2026-10-07";

      const frequency = "weekly";
      const recentWindowStart = boundaries.sevenDaysAgoStr; // 2026-11-09
      const minAllowedDate =
        subscribedDateStr > recentWindowStart ? subscribedDateStr : recentWindowStart;

      // 2026-10-07 is strictly before 2026-11-16
      const matchesTiming =
        oldReleaseDate <= boundaries.nowStr && oldReleaseDate >= minAllowedDate;

      expect(matchesTiming).toBe(false);
    });
  });
});
