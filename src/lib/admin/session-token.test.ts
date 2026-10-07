import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, passwordsMatch, verifySessionToken } from "./session-token.ts";

const secret = "12345678901234567890123456789012";

test("compares admin passwords without accepting a different value", () => {
  assert.equal(passwordsMatch("clave-larga-123", "clave-larga-123"), true);
  assert.equal(passwordsMatch("clave-larga-123", "otra-clave-larga"), false);
});

test("accepts a signed session until it expires", () => {
  const now = Date.parse("2026-10-07T08:00:00.000Z");
  const token = createSessionToken(secret, now, 60);
  assert.equal(verifySessionToken(token, secret, now + 30_000), true);
  assert.equal(verifySessionToken(token, secret, now + 61_000), false);
  assert.equal(verifySessionToken(token, "otra-clave-de-sesion-con-32-chars", now), false);
  assert.equal(verifySessionToken(`${token}x`, secret, now), false);
});
