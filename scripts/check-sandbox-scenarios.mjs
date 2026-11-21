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
  checkEvaluation(s);
}

// The star evaluation (defaults.stars): which instruments suit the person, and the share ranges.
function checkEvaluation(s) {
  const e = s.evaluation;
  if (!e) return errors.push(`${s.code}: evaluation is missing`);
  const onStep = (x) => Math.abs(x / step - Math.round(x / step)) <= EPS;
  for (const id of e.suitableInstrumentIds) if (!s.instrumentIds.includes(id)) errors.push(`${s.code}: suitable instrument ${id} isn't allowed`);
  if (new Set(e.suitableInstrumentIds).size !== e.suitableInstrumentIds.length) errors.push(`${s.code}: suitable instruments repeat`);
  if (!Number.isInteger(e.minInstruments) || e.minInstruments < 0 || e.minInstruments > e.suitableInstrumentIds.length)
    errors.push(`${s.code}: minInstruments must be 0–${e.suitableInstrumentIds.length}`);
  if (!e.explanation?.trim()) errors.push(`${s.code}: evaluation explanation is missing`);
  if (!e.shareRanges.length) errors.push(`${s.code}: at least one share range is needed`);
  for (const r of e.shareRanges) {
    if (!r.label?.trim()) errors.push(`${s.code}: a share range has no label`);
    if (!r.includesCash && !r.instrumentIds.length) errors.push(`${s.code} range "${r.label}": no cash and no instruments`);
    if (r.each && (r.includesCash || r.min !== 0)) errors.push(`${s.code} range "${r.label}": a per-instrument (each) range needs min 0 and no cash`);
    for (const id of r.instrumentIds) if (!s.instrumentIds.includes(id)) errors.push(`${s.code} range "${r.label}": ${id} isn't allowed`);
    if (!(r.min >= 0 && r.min <= r.max && r.max <= 1) || !onStep(r.min) || !onStep(r.max))
      errors.push(`${s.code} range "${r.label}": needs 0 ≤ min ≤ max ≤ 1 in ${step} steps`);
    // A spectrum, not one right answer.
    if (r.max - r.min < step - EPS) errors.push(`${s.code} range "${r.label}": min and max are equal; give a range`);
  }
  const stars = (alloc) => ({ assets: rightAssets(s, alloc), shares: rightShares(s, alloc) });
  for (const [what, alloc] of [["reference", s.referenceAllocation], ...s.alsoAcceptable.map((a, i) => [`alsoAcceptable ${i + 1}`, a])]) {
    const st = stars(alloc);
    if (!st.assets || !st.shares) errors.push(`${s.code} ${what}: must earn the assets and shares stars (assets ${st.assets}, shares ${st.shares})`);
  }
  for (const t of s.traps) {
    const st = stars(t.allocation);
    if (st.assets && st.shares) errors.push(`${s.code} trap "${t.label}": earns both the assets and shares stars`);
  }
  // Breaking an advisory rule must cost a star: each suitable instrument a rule covers sits in one
  // range that is at least as strict as the rule.
  for (const rule of s.rules) {
    const covered = rule.instrumentIds.filter((id) => e.suitableInstrumentIds.includes(id));
    if (!covered.length) continue;
    // A range's total caps every subset too, so it is strict enough for both rule types.
    const strict = e.shareRanges.some(
      (r) => !r.includesCash && covered.every((id) => r.instrumentIds.includes(id)) && r.max <= rule.maxShare + EPS &&
        (!r.each || rule.type === "MAX_SHARE_EACH"),
    );
    if (!strict) errors.push(`${s.code} rule "${rule.label}": suitable instruments ${covered.join(", ")} need a share range with max ≤ ${rule.maxShare}`);
  }
}

/** Assets star: money only in suitable instruments, in at least minInstruments of them. */
function rightAssets(s, alloc) {
  const invested = Object.keys(alloc).filter((k) => k !== "CASH" && alloc[k] > 0).map(Number);
  return invested.every((id) => s.evaluation.suitableInstrumentIds.includes(id)) && invested.length >= s.evaluation.minInstruments;
}

/** Shares star: every range holds (inclusive); an `each` range applies to every listed instrument on its own. */
function rightShares(s, alloc) {
  const within = (r, share) => share >= r.min - EPS && share <= r.max + EPS;
  return s.evaluation.shareRanges.every((r) => {
    if (r.each) return r.instrumentIds.every((id) => within(r, alloc[String(id)] ?? 0));
    const share = (r.includesCash ? alloc.CASH ?? 0 : 0) + r.instrumentIds.reduce((a, id) => a + (alloc[String(id)] ?? 0), 0);
    return within(r, share);
  });
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
  return { finalValue, drop, growth, stability, goal: !shortfall && finalValue >= s.target, gained: finalValue + withdrawn > s.budget };
}

/** Stars for one run (defaults.stars): 2 for growth, 1 each for goal, assets and shares, at least the minimum. */
function starsFor(s, alloc, run) {
  const w = data.defaults.stars;
  const earned = (run.gained ? w.growth : 0) + (run.goal ? w.goal : 0) +
    (rightAssets(s, alloc) ? w.assets : 0) + (rightShares(s, alloc) ? w.shares : 0);
  return Math.max(w.minimum, earned);
}

function brokenRules(s, alloc) {
  return s.rules.filter((r) => {
    const shares = r.instrumentIds.map((id) => alloc[String(id)] ?? 0);
    return r.type === "MAX_SHARE_EACH"
      ? shares.some((x) => x > r.maxShare + EPS)
      : shares.reduce((a, b) => a + b, 0) > r.maxShare + EPS;
  }).length;
}

function evaluate(s, alloc, seeds = SEEDS) {
  state = s.scenarioSeed >>> 0;
  spare = null;
  const runs = Array.from({ length: seeds }, () => runOnce(s, alloc));
  const penalty = brokenRules(s, alloc) * data.defaults.rulePenaltyPoints;
  const scores = runs.map((r) => Math.min(100, Math.max(0, s.weights.growth * r.growth + s.weights.stability * r.stability - penalty)));
  const finals = runs.map((r) => r.finalValue).sort((a, b) => a - b);
  const quantile = (p) => finals[Math.floor(p * (finals.length - 1))];
  return {
    score: scores.reduce((a, b) => a + b, 0) / seeds,
    goal: runs.filter((r) => r.goal).length / seeds,
    stars: runs.reduce((a, r) => a + starsFor(s, alloc, r), 0) / seeds,
    p5: quantile(0.05),
    median: quantile(0.5),
    p95: quantile(0.95),
    medianDrop: runs.map((r) => r.drop).sort((a, b) => a - b)[Math.floor(seeds / 2)],
    penalty,
  };
}

// Random allocations (in share steps) that earn the assets and shares stars: the "right" spectrum.
let sampleState = 7;
const sampleUniform = () => (sampleState = (Math.imul(sampleState, 1103515245) + 12345) >>> 0) / 4294967296;
function sampleSpectrum(s, count) {
  const units = Math.round(1 / step);
  const found = new Map();
  sampleState = (s.scenarioSeed ^ 0x5bd1e995) >>> 0;
  for (let attempt = 0; attempt < 20000 && found.size < count; attempt++) {
    const pool = s.evaluation.suitableInstrumentIds.filter(() => sampleUniform() < 0.6);
    const keys = ["CASH", ...pool.map(String)];
    // Dirichlet(1) weights, rounded to whole steps with the largest remainders.
    const weights = keys.map(() => -Math.log(1 - sampleUniform()));
    const sum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((w) => (w / sum) * units);
    const whole = raw.map(Math.floor);
    let left = units - whole.reduce((a, b) => a + b, 0);
    raw.map((r, i) => [r - whole[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { whole[i]++; left--; } });
    const alloc = {};
    keys.forEach((k, i) => { if (whole[i] > 0) alloc[k] = Math.round(whole[i] * step * 100) / 100; });
    const key = JSON.stringify(Object.entries(alloc).sort());
    if (!found.has(key) && rightAssets(s, alloc) && rightShares(s, alloc)) found.set(key, alloc);
  }
  return [...found.values()];
}

const describe = (alloc) => Object.entries(alloc).map(([k, v]) => `${k}:${Math.round(v * 100)}%`).join(" ");

// ---------- report ----------

const { referenceMinMeanScore, trapMaxMeanScore, spectrumSeeds, spectrumSamples, spectrumMinMeanScore } = data.defaults.acceptance;
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
      `  ${ok ? "ok  " : "FAIL"} ${label.padEnd(30)} score ${e.score.toFixed(1).padStart(5)}  stars ${e.stars.toFixed(1)}  goal ${(e.goal * 100).toFixed(0).padStart(3)}%` +
        `  p5 ${money(e.p5)}  median ${money(e.median)}  p95 ${money(e.p95)}  median drop ${(e.medianDrop * 100).toFixed(1)}%` +
        (e.penalty ? `  rules −${e.penalty}` : ""),
    );
  }
  // Every allocation inside the spectrum should be a sound plan, not only the reference.
  const spectrum = sampleSpectrum(s, spectrumSamples).map((alloc) => ({ alloc, e: evaluate(s, alloc, spectrumSeeds) }));
  const worst = spectrum.reduce((a, b) => (b.e.score < a.e.score ? b : a), spectrum[0]);
  const ok = spectrum.length > 0 && worst.e.score >= spectrumMinMeanScore;
  if (!ok) failures++;
  const meanScore = spectrum.reduce((a, b) => a + b.e.score, 0) / Math.max(1, spectrum.length);
  const meanStars = spectrum.reduce((a, b) => a + b.e.stars, 0) / Math.max(1, spectrum.length);
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${`spectrum (${spectrum.length} samples)`.padEnd(30)} score mean ${meanScore.toFixed(1)}, worst ${worst ? worst.e.score.toFixed(1) : "–"}` +
      `  stars mean ${meanStars.toFixed(1)}${worst ? `  worst: ${describe(worst.alloc)}` : ""}`,
  );
}
console.log(`\n${data.scenarios.length} scenarios, ${SEEDS} seeds each: ${failures ? `${failures} acceptance failure(s)` : "all acceptance checks passed"}`);
process.exit(failures ? 1 : 0);
