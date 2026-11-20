#!/usr/bin/env node
// Checks knowledge/sandbox-scenarios.json (see knowledge/sandbox-scenarios.md §4):
//  1. validates the data (ids, horizons, instruments, shares, weights, rules, …);
//  2. runs every reference allocation and trap on many seeds with the GBM engine's math
//     (parameters from data.sql, one step per weekday, dt = 1/periodsPerYear) and the
//     scenario evaluation, and checks the average scores against the acceptance thresholds.
// It uses JavaScript random numbers, not Java's, so it checks statistics, not exact results.
//
// Usage (from the repository root):  node scripts/check-sandbox-scenarios.mjs [seeds]

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(ROOT, "knowledge", "sandbox-scenarios.json"), "utf8"));
const sql = readFileSync(join(ROOT, "backend", "src", "main", "resources", "data.sql"), "utf8");
const SEEDS = Number(process.argv[2] ?? data.defaults.acceptance.seeds);
const EPS = 1e-9;

// ---------- validation ----------

const gbm = {};
for (const m of sql.matchAll(/INSERT INTO simulation_configuration \([^)]*\) VALUES \(\d+, (\d+), 'GBM', '([^']*)'/g)) {
  const p = JSON.parse(m[2]);
  gbm[m[1]] = { mu: p.annualExpectedReturn, sigma: p.annualVolatility, periodsPerYear: p.periodsPerYear };
}

const errors = [];
const catalogue = new Set(data.catalogue.map((i) => String(i.id)));
for (const id of catalogue) if (!gbm[id]) errors.push(`catalogue ${id}: no GBM configuration in data.sql`);

const step = data.defaults.shareStep;
const maxDays = data.defaults.evaluation.maxDurationDays;
const unique = (pick, what) => {
  const values = data.scenarios.map(pick);
  const dup = values.filter((v, i) => values.indexOf(v) !== i);
  if (dup.length) errors.push(`duplicate ${what}: ${[...new Set(dup)].join(", ")}`);
};
unique((s) => s.id, "id");
unique((s) => s.code, "code");
unique((s) => s.budget, "budget");
unique((s) => s.durationDays, "durationDays");
unique((s) => s.persona.name, "persona");
unique((s) => s.scenarioSeed, "scenarioSeed");

function checkAllocation(s, alloc, what) {
  let total = 0;
  for (const [key, share] of Object.entries(alloc)) {
    total += share;
    if (key !== "CASH" && !s.instrumentIds.map(String).includes(key)) errors.push(`${s.code} ${what}: ${key} is not allowed`);
    if (share <= 0 || Math.abs(share / step - Math.round(share / step)) > EPS) errors.push(`${s.code} ${what}: share ${key}=${share} is not a ${step} step`);
  }
  if (Math.abs(total - 1) > EPS) errors.push(`${s.code} ${what}: shares add up to ${total}`);
}

for (const s of data.scenarios) {
  const w = s.weights;
  if (Math.abs(w.growth + w.stability - 1) > EPS) errors.push(`${s.code}: weights don't add up to 1`);
  if (!Number.isInteger(s.durationDays) || s.durationDays < 1 || s.durationDays > maxDays) errors.push(`${s.code}: durationDays outside 1–${maxDays}`);
  if (!(s.budget > 0)) errors.push(`${s.code}: budget must be positive`);
  if (!(s.floor < s.target)) errors.push(`${s.code}: floor must be below target`);
  if (!(s.maxDrawdown > 0 && s.maxDrawdown < 1)) errors.push(`${s.code}: maxDrawdown must be between 0 and 1`);
  for (const id of s.instrumentIds) if (!catalogue.has(String(id))) errors.push(`${s.code}: unknown instrument ${id}`);
  const needs = s.moneyNeeds.reduce((a, n) => a + n.amount, 0);
  if (needs >= s.budget) errors.push(`${s.code}: money needs use the whole budget`);
  for (const n of s.moneyNeeds) if (n.day < 1 || n.day > s.durationDays) errors.push(`${s.code}: money need on day ${n.day} is outside the horizon`);
  for (const r of s.rules) {
    if (!["MAX_SHARE_EACH", "MAX_TOTAL_SHARE"].includes(r.type)) errors.push(`${s.code}: unknown rule ${r.type}`);
    for (const id of r.instrumentIds) if (!s.instrumentIds.includes(id)) errors.push(`${s.code}: rule uses ${id}, which isn't allowed`);
  }
  checkAllocation(s, s.referenceAllocation, "reference");
  s.alsoAcceptable.forEach((a, i) => checkAllocation(s, a, `alsoAcceptable ${i + 1}`));
  s.traps.forEach((t) => checkAllocation(s, t.allocation, `trap "${t.label}"`));
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

// ---------- simulation ----------

let state = 1;
let spare = null;
const uniform = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
function gaussian() {
  if (spare !== null) { const v = spare; spare = null; return v; }
  let u, v, r;
  do { u = uniform() * 2 - 1; v = uniform() * 2 - 1; r = u * u + v * v; } while (r === 0 || r >= 1);
  const f = Math.sqrt((-2 * Math.log(r)) / r);
  spare = v * f;
  return u * f;
}

// Day offsets of the engine's points for a Monday start: day 0, every weekday, and a carried end point.
function pointDays(duration) {
  const days = [0];
  for (let d = 1; d <= duration; d++) if (d % 7 < 5) days.push(d);
  if (days.at(-1) !== duration) days.push(duration);
  return days;
}

function runOnce(s, alloc) {
  const days = pointDays(s.durationDays);
  const ids = Object.keys(alloc).filter((k) => k !== "CASH");
  const values = ids.map((id) => alloc[id] * s.budget);
  let cash = (alloc.CASH ?? 0) * s.budget;
  const needs = [...s.moneyNeeds].sort((a, b) => a.day - b.day);
  let next = 0, withdrawn = 0, shortfall = false, peak = s.budget, drop = 0;
  for (let i = 1; i < days.length; i++) {
    if (days[i] % 7 < 5) {
      ids.forEach((id, j) => {
        const { mu, sigma, periodsPerYear } = gbm[id];
        const dt = 1 / periodsPerYear;
        values[j] *= Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussian());
      });
    }
    while (next < needs.length && days[i] >= needs[next].day) {
      let due = needs[next].amount;
      const fromCash = Math.min(cash, due);
      cash -= fromCash;
      due -= fromCash;
      const held = values.reduce((a, b) => a + b, 0);
      if (due > 0) {
        if (held < due) { shortfall = true; values.fill(0); }
        else values.forEach((v, j) => (values[j] = v * (1 - due / held)));
      }
      withdrawn += needs[next].amount;
      next++;
    }
    const performance = cash + values.reduce((a, b) => a + b, 0) + withdrawn;
    peak = Math.max(peak, performance);
    drop = Math.max(drop, 1 - performance / peak);
  }
  const finalValue = cash + values.reduce((a, b) => a + b, 0);
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const growth = shortfall ? 0 : 100 * clamp((finalValue - s.floor) / (s.target - s.floor));
  const stability = 100 * clamp(1 - Math.max(0, drop - s.maxDrawdown) / s.maxDrawdown);
  return { finalValue, drop, growth, stability, goal: !shortfall && finalValue >= s.target };
}

function brokenRules(s, alloc) {
  return s.rules.filter((r) => {
    const shares = r.instrumentIds.map((id) => alloc[String(id)] ?? 0);
    return r.type === "MAX_SHARE_EACH"
      ? shares.some((x) => x > r.maxShare + EPS)
      : shares.reduce((a, b) => a + b, 0) > r.maxShare + EPS;
  }).length;
}

function evaluate(s, alloc) {
  state = s.scenarioSeed >>> 0;
  spare = null;
  const runs = Array.from({ length: SEEDS }, () => runOnce(s, alloc));
  const penalty = brokenRules(s, alloc) * data.defaults.rulePenaltyPoints;
  const scores = runs.map((r) => Math.min(100, Math.max(0, s.weights.growth * r.growth + s.weights.stability * r.stability - penalty)));
  const finals = runs.map((r) => r.finalValue).sort((a, b) => a - b);
  const quantile = (p) => finals[Math.floor(p * (finals.length - 1))];
  return {
    score: scores.reduce((a, b) => a + b, 0) / SEEDS,
    goal: runs.filter((r) => r.goal).length / SEEDS,
    p5: quantile(0.05),
    median: quantile(0.5),
    p95: quantile(0.95),
    medianDrop: runs.map((r) => r.drop).sort((a, b) => a - b)[Math.floor(SEEDS / 2)],
    penalty,
  };
}

// ---------- report ----------

const { referenceMinMeanScore, trapMaxMeanScore } = data.defaults.acceptance;
const money = (n) => Math.round(n).toLocaleString("en-US").padStart(9);
let failures = 0;
for (const s of data.scenarios) {
  console.log(`\n${s.code} ${s.title}: €${s.budget.toLocaleString("en-US")}, ${s.durationDays} days, target ${s.target.toLocaleString("en-US")}, floor ${s.floor.toLocaleString("en-US")}, max drop ${s.maxDrawdown * 100}%`);
  const rows = [
    ["reference", s.referenceAllocation, true],
    ...s.alsoAcceptable.map((a, i) => [`also acceptable ${i + 1}`, a, true]),
    ...s.traps.map((t) => [`trap: ${t.label}`, t.allocation, false]),
  ];
  for (const [label, alloc, shouldPass] of rows) {
    const e = evaluate(s, alloc);
    const ok = shouldPass ? e.score >= referenceMinMeanScore : e.score <= trapMaxMeanScore;
    if (!ok) failures++;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${label.padEnd(30)} score ${e.score.toFixed(1).padStart(5)}  goal ${(e.goal * 100).toFixed(0).padStart(3)}%` +
        `  p5 ${money(e.p5)}  median ${money(e.median)}  p95 ${money(e.p95)}  median drop ${(e.medianDrop * 100).toFixed(1)}%` +
        (e.penalty ? `  rules −${e.penalty}` : ""),
    );
  }
}
console.log(`\n${data.scenarios.length} scenarios, ${SEEDS} seeds each: ${failures ? `${failures} acceptance failure(s)` : "all acceptance checks passed"}`);
process.exit(failures ? 1 : 0);
