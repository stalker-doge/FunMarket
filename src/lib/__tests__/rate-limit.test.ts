import { describe, it, expect, beforeEach, vi } from "vitest";
import { RateLimiter } from "../rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it("allows requests within the limit", () => {
    const result = limiter.check("test-key", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("allows exactly up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.check("test-key", 5, 60000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 5; i++) {
      limiter.check("test-key", 5, 60000);
    }
    const result = limiter.check("test-key", 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the time window expires", () => {
    vi.useFakeTimers();

    limiter.check("test-key", 2, 1000);
    limiter.check("test-key", 2, 1000);

    const blocked = limiter.check("test-key", 2, 1000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    const allowed = limiter.check("test-key", 2, 1000);
    expect(allowed.allowed).toBe(true);

    vi.useRealTimers();
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 5; i++) {
      limiter.check("user:alice", 5, 60000);
    }
    expect(limiter.check("user:alice", 5, 60000).allowed).toBe(false);
    expect(limiter.check("user:bob", 5, 60000).allowed).toBe(true);
  });

  it("returns retryAfterMs when blocked", () => {
    vi.useFakeTimers();
    const windowMs = 5000;

    for (let i = 0; i < 2; i++) {
      limiter.check("key", 2, windowMs);
    }

    const result = limiter.check("key", 2, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(windowMs);

    vi.useRealTimers();
  });
});
