import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit.server";

describe("rate-limit.server: in-memory rate limiter", () => {
  it("allows requests under the limit", () => {
    const ip = "192.168.1.100";
    const opts = { prefix: "test_allow", windowMs: 10000, maxRequests: 3 };

    const r1 = checkRateLimit(ip, opts);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(ip, opts);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(ip, opts);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding max limit", () => {
    const ip = "192.168.1.101";
    const opts = { prefix: "test_block", windowMs: 10000, maxRequests: 2 };

    checkRateLimit(ip, opts);
    checkRateLimit(ip, opts);

    const blocked = checkRateLimit(ip, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });

  it("distinguishes between different client IPs", () => {
    const opts = { prefix: "test_multi_ip", windowMs: 10000, maxRequests: 1 };

    const rA = checkRateLimit("10.0.0.1", opts);
    expect(rA.success).toBe(true);

    const rB = checkRateLimit("10.0.0.2", opts);
    expect(rB.success).toBe(true);

    const rABlocked = checkRateLimit("10.0.0.1", opts);
    expect(rABlocked.success).toBe(false);
  });
});
