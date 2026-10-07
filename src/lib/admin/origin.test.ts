import assert from "node:assert/strict";
import test from "node:test";
import { originsMatch } from "./origin.ts";

test("accepts only an origin that matches the request host", () => {
  assert.equal(originsMatch("https://becas.example.com", "becas.example.com"), true);
  assert.equal(originsMatch("https://evil.example", "becas.example.com"), false);
  assert.equal(originsMatch(null, "becas.example.com"), false);
  assert.equal(originsMatch("https://becas.example.com", "becas.example.com, proxy.internal"), true);
});
