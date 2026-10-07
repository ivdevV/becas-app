import { randomUUID } from "node:crypto";
import { getDatabase } from "../db/sqlite.ts";
import { madridLocalInputToUtcIso } from "../time/madrid.ts";
import {
  isPeriodOverride,
  resolvePeriodAccess,
  type PeriodOverride,
  type PublicPeriodState,
  type ScholarshipPeriod,
} from "./resolve.ts";

type PeriodRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  override: string;
  is_current: number | bigint;
  created_at: string;
  updated_at: string;
};

export type PeriodWriteResult =
  | { ok: true }
  | { ok: false; error: "nombre" | "fechas" | "control" | "no-encontrada" | "guardar" };

const NAME_LIMIT = 120;

export function listPeriods(): ScholarshipPeriod[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, name, starts_at, ends_at, override, is_current, created_at, updated_at
       FROM scholarship_periods
       ORDER BY is_current DESC, starts_at DESC`,
    )
    .all() as PeriodRow[];

  return rows.map(mapPeriod);
}

export function getCurrentPeriod() {
  const row = getDatabase()
    .prepare(
      `SELECT id, name, starts_at, ends_at, override, is_current, created_at, updated_at
       FROM scholarship_periods
       WHERE is_current = 1`,
    )
    .get() as PeriodRow | undefined;

  return row ? mapPeriod(row) : null;
}

export function getPublicPeriodState(now = new Date()): PublicPeriodState {
  try {
    return resolvePeriodAccess(getCurrentPeriod(), now);
  } catch (error) {
    console.error("Scholarship period lookup failed", error);
    return { status: "closed", period: null, reason: "none" };
  }
}

export function createPeriod(input: {
  name: string;
  startsAtLocal: string;
  endsAtLocal: string;
  override: string;
}): PeriodWriteResult {
  const parsed = parsePeriodInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  const database = getDatabase();
  const now = new Date().toISOString();
  const id = randomUUID();
  const currentCount = database.prepare("SELECT COUNT(*) AS count FROM scholarship_periods WHERE is_current = 1").get() as
    | { count: number }
    | undefined;
  const isCurrent = Number(currentCount?.count ?? 0) === 0 ? 1 : 0;

  try {
    database
      .prepare(
        `INSERT INTO scholarship_periods
          (id, name, starts_at, ends_at, override, is_current, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, parsed.name, parsed.startsAt, parsed.endsAt, parsed.override, isCurrent, now, now);
  } catch (error) {
    console.error("Scholarship period create failed", error);
    return { ok: false, error: "guardar" };
  }

  return { ok: true };
}

export function updatePeriod(input: {
  id: string;
  name: string;
  startsAtLocal: string;
  endsAtLocal: string;
  override: string;
}): PeriodWriteResult {
  if (!isUuid(input.id)) {
    return { ok: false, error: "no-encontrada" };
  }

  const parsed = parsePeriodInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  const changes = getDatabase()
    .prepare(
      `UPDATE scholarship_periods
       SET name = ?, starts_at = ?, ends_at = ?, override = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(parsed.name, parsed.startsAt, parsed.endsAt, parsed.override, new Date().toISOString(), input.id).changes;

  if (changes !== 1) {
    return { ok: false, error: "no-encontrada" };
  }

  return { ok: true };
}

export function setCurrentPeriod(id: string): PeriodWriteResult {
  if (!isUuid(id)) {
    return { ok: false, error: "no-encontrada" };
  }

  const database = getDatabase();
  const existing = database.prepare("SELECT id FROM scholarship_periods WHERE id = ?").get(id);
  if (!existing) {
    return { ok: false, error: "no-encontrada" };
  }

  const now = new Date().toISOString();
  database.exec("BEGIN IMMEDIATE");

  try {
    database.prepare("UPDATE scholarship_periods SET is_current = 0 WHERE is_current = 1").run();
    const changes = database
      .prepare("UPDATE scholarship_periods SET is_current = 1, updated_at = ? WHERE id = ?")
      .run(now, id).changes;
    if (changes !== 1) {
      database.exec("ROLLBACK");
      return { ok: false, error: "no-encontrada" };
    }

    database.exec("COMMIT");
    return { ok: true };
  } catch (error) {
    database.exec("ROLLBACK");
    console.error("Scholarship period activation failed", error);
    return { ok: false, error: "guardar" };
  }
}

export function deletePeriod(id: string): PeriodWriteResult {
  if (!isUuid(id)) {
    return { ok: false, error: "no-encontrada" };
  }

  const changes = getDatabase().prepare("DELETE FROM scholarship_periods WHERE id = ?").run(id).changes;
  if (changes !== 1) {
    return { ok: false, error: "no-encontrada" };
  }

  return { ok: true };
}

function parsePeriodInput(input: { name: string; startsAtLocal: string; endsAtLocal: string; override: string }):
  | { ok: true; name: string; startsAt: string; endsAt: string; override: PeriodOverride }
  | { ok: false; error: "nombre" | "fechas" | "control" } {
  const name = input.name.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!name || name.length > NAME_LIMIT) {
    return { ok: false, error: "nombre" };
  }

  if (!isPeriodOverride(input.override)) {
    return { ok: false, error: "control" };
  }

  const startsAt = madridLocalInputToUtcIso(input.startsAtLocal);
  const endsAt = madridLocalInputToUtcIso(input.endsAtLocal);
  if (!startsAt || !endsAt || new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    return { ok: false, error: "fechas" };
  }

  return { ok: true, name, startsAt, endsAt, override: input.override };
}

function mapPeriod(row: PeriodRow): ScholarshipPeriod {
  const override = isPeriodOverride(row.override) ? row.override : "closed";

  return {
    id: String(row.id),
    name: String(row.name),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    override,
    isCurrent: Number(row.is_current) === 1,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
