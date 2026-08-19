import { describe, expect, it } from "vitest";
import { signOrderToken, verifyOrderToken } from "@/lib/server-crypto";

describe("server-crypto: Guest HMAC order security", () => {
  const orderId = "c8b415a7-d861-4fa2-9387-9bc952fefcb1";
  const email = "player1@arcade.shop";

  it("generates a deterministic 32-character hexadecimal token", () => {
    const token1 = signOrderToken(orderId, email);
    const token2 = signOrderToken(orderId, email);

    expect(token1).toHaveLength(32);
    expect(token1).toMatch(/^[0-9a-f]{32}$/);
    expect(token1).toBe(token2);
  });

  it("normalizes email casing and whitespace when signing", () => {
    const tokenNormal = signOrderToken(orderId, "player1@arcade.shop");
    const tokenUpper = signOrderToken(orderId, "  PLAYER1@ARCADE.SHOP  ");

    expect(tokenNormal).toBe(tokenUpper);
  });

  it("verifies a valid token successfully", () => {
    const token = signOrderToken(orderId, email);
    const isValid = verifyOrderToken(orderId, email, token);

    expect(isValid).toBe(true);
  });

  it("rejects token when email does not match", () => {
    const token = signOrderToken(orderId, email);
    const isValid = verifyOrderToken(orderId, "imposter@arcade.shop", token);

    expect(isValid).toBe(false);
  });

  it("rejects token when orderId does not match", () => {
    const token = signOrderToken(orderId, email);
    const isValid = verifyOrderToken("99999999-0000-0000-0000-000000000000", email, token);

    expect(isValid).toBe(false);
  });

  it("rejects malformed, empty or tampered tokens safely without throwing", () => {
    expect(verifyOrderToken(orderId, email, "")).toBe(false);
    expect(verifyOrderToken(orderId, email, "invalid-short-token")).toBe(false);
    expect(verifyOrderToken(orderId, email, "00000000000000000000000000000000")).toBe(false);
  });
});
