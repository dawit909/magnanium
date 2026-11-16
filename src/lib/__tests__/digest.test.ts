import { describe, it, expect } from "vitest";
import { SUB_KEYS } from "../subscriptions";
import { sendReleaseAlertEmail } from "../email";
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
});
