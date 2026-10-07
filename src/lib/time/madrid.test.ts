import assert from "node:assert/strict";
import test from "node:test";
import { formatMadridDateTime, madridLocalInputToUtcIso, utcIsoToMadridInput } from "./madrid.ts";

test("converts Madrid winter time to UTC", () => {
  assert.equal(madridLocalInputToUtcIso("2026-01-15T12:00"), "2026-01-15T11:00:00.000Z");
});

test("converts Madrid summer time to UTC", () => {
  assert.equal(madridLocalInputToUtcIso("2026-07-15T12:00"), "2026-07-15T10:00:00.000Z");
});

test("rejects a local time skipped by the spring clock change", () => {
  assert.equal(madridLocalInputToUtcIso("2026-03-29T02:30"), null);
});

test("round-trips a Madrid instant back to the datetime-local value", () => {
  const iso = madridLocalInputToUtcIso("2026-10-07T09:45");
  assert.ok(iso);
  assert.equal(utcIsoToMadridInput(iso), "2026-10-07T09:45");
  assert.match(formatMadridDateTime(iso), /2026/);
});
