import { describe, it, expect, vi } from "vitest";
import { kv } from "../kv";

describe("KV Multi-tier storage", () => {
  it("stores and retrieves stateful keys in fallback memory when Redis is not configured", async () => {
    const key = "sub:user:test@example.com";
    const value = { email: "test@example.com", verified: true, artists: {} };

    await kv.set(key, value);
    const retrieved = await kv.get<typeof value>(key);
    expect(retrieved).toEqual(value);

    await kv.del(key);
    const afterDel = await kv.get(key);
    expect(afterDel).toBeNull();
  });

  it("stores and retrieves cache keys", async () => {
    const key = "raw_releases:test:US";
    const value = { personName: "Test Artist", releases: [] };

    await kv.set(key, value, 300);
    const retrieved = await kv.get<typeof value>(key);
    expect(retrieved).toEqual(value);

    await kv.del(key);
    const afterDel = await kv.get(key);
    expect(afterDel).toBeNull();
  });

  it("handles deletion gracefully", async () => {
    const key = "sub:test:deletion";
    await kv.set(key, { data: 123 });
    await kv.del(key);
    expect(await kv.get(key)).toBeNull();
  });
});
