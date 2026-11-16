import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  generateSecureToken,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  createMagicToken,
  verifyAndConsumeMagicToken,
  subscribeArtist,
  getUser,
} from "../subscriptions";

describe("subscriptions utilities", () => {
  describe("normalizeEmail", () => {
    it("lowercases and trims email addresses", () => {
      expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
    });

    it("safely handles null / undefined / empty", () => {
      expect(normalizeEmail("")).toBe("");
      expect(normalizeEmail(null)).toBe("");
      expect(normalizeEmail(undefined)).toBe("");
    });
  });

  describe("generateSecureToken", () => {
    it("generates a random hex token of expected byte length", () => {
      const token = generateSecureToken(16);
      expect(typeof token).toBe("string");
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });
  });

  describe("unsubscribeToken HMAC", () => {
    it("generates and successfully verifies valid token", () => {
      const email = "subscriber@example.com";
      const personId = 525;
      const token = createUnsubscribeToken(email, personId);

      const verified = verifyUnsubscribeToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.email).toBe(email);
      expect(verified?.personId).toBe(personId);
    });

    it("rejects tampered or malformed tokens", () => {
      expect(verifyUnsubscribeToken("invalid-token-string")).toBeNull();
      expect(verifyUnsubscribeToken("")).toBeNull();

      // Tamper payload
      const validToken = createUnsubscribeToken("user@example.com", 123);
      const tampered = validToken.slice(0, -4) + "XXXX";
      expect(verifyUnsubscribeToken(tampered)).toBeNull();
    });
  });

  describe("magic token payload & frequency persistence", () => {
    it("preserves monthly frequency through magic token lifecycle to subscription", async () => {
      const email = "monthly-subscriber@example.com";
      const artist = {
        personId: 9999,
        personName: "Shameik Moore",
        profilePath: "/shameik.jpg",
        alert: "when_released" as const,
        frequency: "monthly" as const,
        country: "US",
      };

      const token = await createMagicToken(email, artist);
      expect(typeof token).toBe("string");

      const consumed = await verifyAndConsumeMagicToken(token);
      expect(consumed).not.toBeNull();
      expect(consumed?.email).toBe(email);
      expect(consumed?.artist?.frequency).toBe("monthly");

      if (consumed?.artist) {
        const user = await subscribeArtist(consumed.email, consumed.artist);
        expect(user.artists["9999"]).toBeDefined();
        expect(user.artists["9999"].frequency).toBe("monthly");
      }

      // Check user record directly
      const saved = await getUser(email);
      expect(saved?.artists["9999"]?.frequency).toBe("monthly");
    });

    it("preserves weekly frequency through subscription", async () => {
      const email = "weekly-subscriber@example.com";
      const artist = {
        personId: 8888,
        personName: "Christopher Nolan",
        profilePath: null,
        alert: "announced" as const,
        frequency: "weekly" as const,
        country: "US",
      };

      const user = await subscribeArtist(email, artist);
      expect(user.artists["8888"].frequency).toBe("weekly");
    });

    it("defaults to instant if frequency is not specified", async () => {
      const email = "default-subscriber@example.com";
      const artist = {
        personId: 7777,
        personName: "Denis Villeneuve",
        profilePath: null,
        alert: "announced" as const,
        country: "US",
      };

      const user = await subscribeArtist(email, artist);
      expect(user.artists["7777"].frequency).toBe("instant");
    });
  });
});
