import assert from "node:assert/strict";
import test from "node:test";
import { clearLoginFailures, isLoginAllowed, recordLoginFailure } from "./rate-limit.ts";

test("locks an address after five failed logins inside the window", () => {
  const ip = "203.0.113.10";
  const start = Date.parse("2026-10-07T08:00:00.000Z");
  clearLoginFailures(ip);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(isLoginAllowed(ip, start + attempt), true);
    recordLoginFailure(ip, start + attempt);
  }

  assert.equal(isLoginAllowed(ip, start + 6), false);
  assert.equal(isLoginAllowed(ip, start + 16 * 60 * 1000), true);
  clearLoginFailures(ip);
});
