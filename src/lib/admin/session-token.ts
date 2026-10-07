import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function passwordsMatch(provided: string, expected: string) {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export function createSessionToken(secret: string, nowMs: number, ttlSeconds = SESSION_TTL_SECONDS) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(nowMs / 1000) + ttlSeconds })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string, secret: string, nowMs: number) {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac("sha256", secret).update(payload).digest();
  const provided = decodeBase64Url(signature);

  if (!provided || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof parsed.exp === "number" && Number.isFinite(parsed.exp) && parsed.exp > Math.floor(nowMs / 1000);
  } catch {
    return false;
  }
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  try {
    return Buffer.from(value, "base64url");
  } catch {
    return null;
  }
}
