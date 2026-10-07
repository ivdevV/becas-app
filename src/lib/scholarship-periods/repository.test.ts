import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { closeDatabase } from "../db/sqlite.ts";

const directory = mkdtempSync(path.join(tmpdir(), "becas-periods-"));
process.env.SCHOLARSHIP_DB_PATH = path.join(directory, "becas.sqlite");

test.after(() => {
  closeDatabase();
  rmSync(directory, { recursive: true, force: true });
});

test("stores convocatorias and lets only the current one open the public form", async () => {
  const repository = await import("./repository.ts");
  const created = repository.createPeriod({
    name: "Octubre",
    startsAtLocal: "2026-10-01T09:00",
    endsAtLocal: "2026-10-31T23:59",
    override: "auto",
  });
  assert.equal(created.ok, true);

  const second = repository.createPeriod({
    name: "Noviembre",
    startsAtLocal: "2026-11-01T09:00",
    endsAtLocal: "2026-11-30T23:59",
    override: "open",
  });
  assert.equal(second.ok, true);

  const periods = repository.listPeriods();
  assert.equal(periods.length, 2);
  assert.equal(periods.filter((period) => period.isCurrent).length, 1);
  assert.equal(repository.getPublicPeriodState(new Date("2026-10-07T10:00:00.000Z")).status, "open");
  assert.equal(repository.getPublicPeriodState(new Date("2026-11-07T10:00:00.000Z")).status, "closed");

  const november = periods.find((period) => period.name === "Noviembre");
  assert.ok(november);
  assert.equal(repository.setCurrentPeriod(november.id).ok, true);
  assert.equal(repository.getPublicPeriodState(new Date("2026-01-01T00:00:00.000Z")).status, "open");

  assert.equal(
    repository.updatePeriod({
      id: november.id,
      name: "Noviembre revisada",
      startsAtLocal: "2026-11-01T09:00",
      endsAtLocal: "2026-11-30T23:59",
      override: "closed",
    }).ok,
    true,
  );
  assert.equal(repository.getPublicPeriodState().status, "closed");
  assert.equal(repository.deletePeriod(november.id).ok, true);
  assert.equal(repository.listPeriods().some((period) => period.isCurrent), false);
  assert.deepEqual(
    repository.createPeriod({
      name: "Invertida",
      startsAtLocal: "2026-10-31T23:59",
      endsAtLocal: "2026-10-01T09:00",
      override: "auto",
    }),
    { ok: false, error: "fechas" },
  );
});
