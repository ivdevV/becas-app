import assert from "node:assert/strict";
import test from "node:test";
import { resolvePeriodAccess, type ScholarshipPeriod } from "./resolve.ts";

const period: ScholarshipPeriod = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Octubre",
  startsAt: "2026-10-01T07:00:00.000Z",
  endsAt: "2026-10-31T22:59:00.000Z",
  override: "auto",
  isCurrent: true,
};

test("stays closed when there is no current period", () => {
  assert.deepEqual(resolvePeriodAccess(null, new Date("2026-10-07T10:00:00.000Z")), {
    status: "closed",
    period: null,
    reason: "none",
  });
});

test("opens only inside the automatic window", () => {
  assert.equal(resolvePeriodAccess(period, new Date("2026-09-30T10:00:00.000Z")).status, "closed");
  assert.equal(resolvePeriodAccess(period, new Date("2026-10-07T10:00:00.000Z")).status, "open");
  assert.equal(resolvePeriodAccess(period, new Date("2026-10-31T22:59:00.000Z")).status, "closed");
});

test("manual override wins over the dates", () => {
  assert.equal(
    resolvePeriodAccess({ ...period, override: "open" }, new Date("2026-01-01T00:00:00.000Z")).status,
    "open",
  );
  const forced = resolvePeriodAccess({ ...period, override: "closed" }, new Date("2026-10-07T10:00:00.000Z"));
  assert.equal(forced.status, "closed");
  if (forced.status === "closed") {
    assert.equal(forced.reason, "forced");
  }
});
