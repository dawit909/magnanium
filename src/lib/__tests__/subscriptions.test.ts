import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  generateSecureToken,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
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
});
