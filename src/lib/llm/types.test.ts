import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJSON } from "./types";

test("parses plain JSON", () => {
  assert.deepEqual(parseJSON('{"a":1}'), { a: 1 });
});

test("strips markdown code fences", () => {
  assert.deepEqual(parseJSON('```json\n{"a":1}\n```'), { a: 1 });
});

test("recovers JSON embedded in prose", () => {
  assert.deepEqual(parseJSON('Here you go:\n{"a":1}\nHope that helps'), { a: 1 });
});

test("repairs unescaped newlines inside string values", () => {
  const raw = '{"body":"line one\nline two"}';
  const out = parseJSON<{ body: string }>(raw);
  assert.ok(out.body.includes("line one"));
  assert.ok(out.body.includes("line two"));
});

test("throws on genuinely invalid input", () => {
  assert.throws(() => parseJSON("not json at all"));
});
