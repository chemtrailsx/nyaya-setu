import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenize } from "./bm25";

test("lowercases and splits on non-word characters", () => {
  assert.deepEqual(tokenize("FIR Registration!"), ["fir", "registration"]);
});

test("drops stopwords and single characters", () => {
  const toks = tokenize("the police refused to register a FIR");
  assert.ok(!toks.includes("the"));
  assert.ok(!toks.includes("to"));
  assert.ok(!toks.includes("a"));
  assert.ok(toks.includes("police"));
  assert.ok(toks.includes("register"));
});

test("keeps section-number tokens", () => {
  assert.ok(tokenize("Section 173 of the BNSS").includes("173"));
});
