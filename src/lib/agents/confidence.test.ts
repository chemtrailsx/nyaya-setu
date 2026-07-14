import { test } from "node:test";
import assert from "node:assert/strict";
import { ensembleConfidence, evaluateGate } from "./confidence";

test("ensemble collapses when any signal is weak (conservative)", () => {
  const strong = ensembleConfidence({ ocr: 0.95, classification: 0.95, retrieval: 0.9 });
  const oneWeak = ensembleConfidence({ ocr: 0.95, classification: 0.95, retrieval: 0.1 });
  assert.ok(strong > 0.9, `expected strong > 0.9, got ${strong}`);
  assert.ok(oneWeak < 0.5, `one weak signal should drag the ensemble down, got ${oneWeak}`);
});

test("gate escalates below the threshold", () => {
  const d = evaluateGate({ ocr: 0.5, classification: 0.5, retrieval: 0.4 }, "land_inheritance", 0.72);
  assert.equal(d.escalate, true);
});

test("gate clears above the threshold", () => {
  const d = evaluateGate({ ocr: 0.95, classification: 0.95, retrieval: 0.9 }, "land_inheritance", 0.72);
  assert.equal(d.escalate, false);
});

test("sensitive case type always escalates, even with high confidence", () => {
  const d = evaluateGate({ ocr: 1, classification: 1, retrieval: 1 }, "domestic_violence", 0.72);
  assert.equal(d.escalate, true);
});

test("low draft confidence forces escalation", () => {
  const d = evaluateGate({ ocr: 0.95, classification: 0.95, retrieval: 0.9 }, "land_inheritance", 0.72, 0.5);
  assert.equal(d.escalate, true);
});
