type RateEntry = { count: number; resetAt: number };

class RateLimiter {
  private entries = new Map<string, RateEntry>();

  check(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();

    // Periodic cleanup
    if (this.entries.size > 10000) {
      for (const [k, v] of this.entries) {
        if (v.resetAt <= now) this.entries.delete(k);
      }
    }

    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    entry.count++;
    if (entry.count > limit) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    return { allowed: true, retryAfterMs: 0 };
  }
}

export const loginLimiter = new RateLimiter();
export const registerLimiter = new RateLimiter();
export const marketCreateLimiter = new RateLimiter();
export const commentLimiter = new RateLimiter();
export const tradeLimiter = new RateLimiter();
