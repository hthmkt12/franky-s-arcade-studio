// Server-side crypto helpers for guest order token signing and verification.
// Uses Node's native crypto module.

import crypto from "node:crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "frankys-arcade-fallback-secret-2026";

export function signOrderToken(orderId: string, email: string): string {
  const data = `${orderId}:${email.toLowerCase().trim()}`;
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex").slice(0, 32);
}

export function verifyOrderToken(orderId: string, email: string, token: string): boolean {
  const expected = signOrderToken(orderId, email);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
