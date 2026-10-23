import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function compareVersions(left: string, right: string) {
  const a = left.split(".").map((part) => Number(part));
  const b = right.split(".").map((part) => Number(part));
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

test("next y eslint-config-next quedan fijados en 16.4.3", () => {
  const pkg = readJson("package.json");
  assert.equal(pkg.dependencies.next, "16.4.3");
  assert.equal(pkg.devDependencies["eslint-config-next"], "16.4.3");
});

test("nodemailer queda fijado en 10.0.10", () => {
  const pkg = readJson("package.json");
  const lock = readJson("package-lock.json");
  assert.equal(pkg.dependencies.nodemailer, "10.0.10");
  assert.equal(lock.packages?.["node_modules/nodemailer"]?.version, "10.0.10");
});

test("Node.js queda fijado en 22.23.4", () => {
  const pkg = readJson("package.json");
  assert.equal(pkg.engines.node, "22.23.4");
  assert.equal(readFileSync(path.join(root, ".nvmrc"), "utf8").trim(), "22.23.4");
});

test("el lockfile resuelve sharp >= 0.35.5 y @next/* en 16.4.3", () => {
  const lock = readJson("package-lock.json");
  const packages = lock.packages ?? {};
  assert.equal(packages["node_modules/next"]?.version, "16.4.3");
  assert.equal(packages["node_modules/eslint-config-next"]?.version, "16.4.3");
  const sharp = packages["node_modules/sharp"];
  assert.ok(sharp, "sharp tiene que estar resuelto en el lockfile");
  assert.equal(compareVersions(sharp.version, "0.35.5") >= 0, true, sharp.version);

  const nextPackages = Object.entries(packages).filter(([name]) => name.includes("node_modules/@next/"));
  assert.ok(nextPackages.length > 0, "el lockfile tiene que incluir paquetes @next/*");
  for (const [name, meta] of nextPackages) {
    assert.equal((meta as { version?: string }).version, "16.4.3", name);
  }
});

test("Dockerfile, nixpacks y railpack, si existen, fijan Node 22.23.4", () => {
  const candidates = ["Dockerfile", "nixpacks.toml", "railpack.json"].filter((relativePath) =>
    existsSync(path.join(root, relativePath)),
  );
  for (const relativePath of candidates) {
    const contents = readFileSync(path.join(root, relativePath), "utf8");
    assert.match(contents, /22\.23\.4/, relativePath);
  }
});
