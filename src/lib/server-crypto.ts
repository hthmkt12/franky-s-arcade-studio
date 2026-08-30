// Server-side crypto helpers for guest order token signing and verification.
// Uses Node's native crypto module.
//
// Fail-closed: production MUST provide a real secret. A hardcoded fallback
// would be visible in the public repo, letting anyone forge guest tokens and
// read another customer's PII (name, email, address) via GET /api/orders/:id.

import crypto from "node:crypto";

const DEV_FALLBACK_SECRET = "frankys-arcade-dev-only-secret-2026";

function getSecret(): string {
  const secret = process.env.ORDER_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[server-crypto] ORDER_TOKEN_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not configured — refusing to sign/verify guest order tokens in production.",
    );
  }
  return DEV_FALLBACK_SECRET;
}

export function signOrderToken(orderId: string, email: string): string {
  const data = `${orderId}:${email.toLowerCase().trim()}`;
  return crypto.createHmac("sha256", getSecret()).update(data).digest("hex").slice(0, 32);
}

export function verifyOrderToken(orderId: string, email: string, token: string): boolean {
  const expected = signOrderToken(orderId, email);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
