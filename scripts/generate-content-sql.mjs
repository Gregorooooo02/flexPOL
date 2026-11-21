#!/usr/bin/env node
// Parses the learning content in knowledge/ and writes it as INSERT statements
// into backend/src/main/resources/data.sql, between the GENERATED CONTENT markers.
// The sandbox scenarios (knowledge/sandbox-scenarios.json) go between the GENERATED SCENARIOS
// markers, after the instrument seed, because they reference instruments and chapters.
// Everything outside the markers is kept. The SQL must run on both H2 and PostgreSQL:
// locally through spring.sql.init, on PostgreSQL through the Flyway migration R__Seed_content.
// Demo users are not here: see demo-users.sql and the Flyway V2 migration.
//
// Usage (from the repository root):  node scripts/generate-content-sql.mjs

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KNOWLEDGE = join(ROOT, "knowledge");
const DATA_SQL = join(ROOT, "backend", "src", "main", "resources", "data.sql");
const SCENARIOS_JSON = join(KNOWLEDGE, "sandbox-scenarios.json");
const BEGIN = "-- BEGIN GENERATED CONTENT (scripts/generate-content-sql.mjs, do not edit by hand)";
const END = "-- END GENERATED CONTENT";
const SCENARIOS_BEGIN = "-- BEGIN GENERATED SCENARIOS (scripts/generate-content-sql.mjs, do not edit by hand)";
const SCENARIOS_END = "-- END GENERATED SCENARIOS";
const RULE_TYPES = new Set(["MAX_SHARE_EACH", "MAX_TOTAL_SHARE"]);

const INSTRUMENTS = {
  "Accessible Cash": "ACCESSIBLE_CASH",
  "Diversified market basket": "MARKET_BASKET",
  "Volatile concentrated asset": "VOLATILE_ASSET",
  "Locked-term instrument": "LOCKED_TERM",
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const fail = (msg) => {
  throw new Error(msg);
};

// ---------- parsing ----------

function parseOverview() {
  const text = read(join(KNOWLEDGE, "learning-chapters.md"));
  const chapters = [];
  for (const section of text.split(/^## /m).slice(1)) {
    const heading = section.match(/^Chapter (\d+) — (.+)$/m);
    if (!heading) continue; // skips "Lesson files", "Capstone", …
    const objective = section.match(/^\*Objective: (.+)\*$/m);
    const mission = section.match(/^\*\*Mission: "([^"]+)"\*\*(?: \*\([^)]*\)\*)?\. (.+)$/m);
    chapters.push({
      sortOrder: Number(heading[1]),
      title: heading[2].trim(),
      objective: capitalize(objective?.[1].trim() ?? null),
      missionTitle: mission?.[1] ?? null,
      missionDescription: mission ? mission[2].replace(/\*\*/g, "").trim() : null,
    });
  }
  return chapters;
}

function readExercise(block, name, where) {
  const fence = "```";
  const lines = block.split("\n").map((line) => line.trimEnd());
  const opening = lines.indexOf(fence + name);
  if (opening === -1) return null;
  const closing = lines.indexOf(fence, opening + 1);
  if (closing === -1) fail(`${where}: unclosed ${name} block`);
  if (lines.indexOf(fence + name, closing + 1) !== -1) fail(`${where}: duplicate ${name} block`);
  try {
    const content = JSON.parse(lines.slice(opening + 1, closing).join("\n"));
    if (content && typeof content === "object" && !Array.isArray(content)) return content;
  } catch {
    fail(`${where}: invalid JSON in ${name} block`);
  }
  fail(`${where}: expected an object in ${name} block`);
}

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const isPercent = (value) => Number.isInteger(value) && value >= 0 && value <= 100;
const isNonnegativeInt = (value) => Number.isInteger(value) && value >= 0 && value <= 2_147_483_647;

function validateItems(items, where, label) {
  if (!Array.isArray(items) || items.length < 2 || items.some((item) =>
    !item || typeof item.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(item.id) || !hasText(item[label]))) {
    fail(`${where}: expected at least two items with an id and ${label}`);
  }
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) fail(`${where}: ids must be unique`);
  return ids;
}

function validateAssignment(assignment, where) {
  const { mode, cards, targets, solution, hint } = assignment;
  if (mode !== "MATCH" && mode !== "SORT") fail(`${where}: expected MATCH or SORT`);
  const cardIds = validateItems(cards, `${where} cards`, "text");
  const targetIds = validateItems(targets, `${where} targets`, "text");
  if (cards.some((card) => card.prices !== undefined && (
    !Array.isArray(card.prices) || card.prices.length < 2 ||
    card.prices.some((price) => !isNonnegativeInt(price))
  ))) fail(`${where}: charts need at least two nonnegative integer prices`);
  if (!solution || typeof solution !== "object" || Array.isArray(solution) ||
    Object.keys(solution).length !== cardIds.size ||
    !Object.entries(solution).every(([card, target]) => cardIds.has(card) && targetIds.has(target))) {
    fail(`${where}: the solution must assign each card to a known destination`);
  }
  if (mode === "MATCH" && (cards.length !== targets.length || new Set(Object.values(solution)).size !== cards.length)) {
    fail(`${where}: a matching solution must use each destination exactly once`);
  }
  if (!hasText(hint)) fail(`${where}: missing hint for a retry`);
}

function validateComparison(comparison, where) {
  const { company, startingBalance, dropPercent, portfolios } = comparison;
  validateItems(portfolios, `${where} portfolios`, "name");
  if (!hasText(company) || !isNonnegativeInt(startingBalance) || startingBalance === 0 ||
    !isPercent(dropPercent) || dropPercent === 0 || portfolios.length !== 2 ||
    portfolios.some((portfolio) => !isPercent(portfolio.exposurePercent) || !hasText(portfolio.description)) ||
    portfolios[0].exposurePercent === portfolios[1].exposurePercent) {
    fail(`${where}: expected two portfolios with different exposures and a positive starting balance and drop`);
  }
}

function validateNumber(exercise, where) {
  const { label, unit, answer, hint, lab, dial } = exercise;
  if (!hasText(label) || !hasText(unit) || !Number.isFinite(answer) || Math.abs(answer) > 1_000_000_000 ||
      Number(answer.toFixed(6)) !== answer || !hasText(hint)) {
    fail(`${where}: a number exercise needs a label, unit, answer and hint`);
  }
  if (Boolean(lab) === Boolean(dial)) fail(`${where}: provide a lab or a number dial`);
  if (!lab) {
    const {max, step} = dial;
    if (!isNonnegativeInt(max) || !isNonnegativeInt(step) || step === 0 || max <= step || max % step !== 0 ||
        answer < 0 || answer > max || answer % step !== 0) fail(`${where}: invalid number dial bounds or answer`);
    return;
  }
  const { kind, max, step, initial, balance, rate, bill } = lab;
  if (!["COMPOUNDING", "LOCKBOX", "SHOCK"].includes(kind) || !isNonnegativeInt(max) ||
      !isNonnegativeInt(step) || step === 0 || max === 0 || max % step !== 0 ||
      !isNonnegativeInt(balance) || balance === 0 || !isNonnegativeInt(initial) ||
      initial > max || initial % step !== 0 || answer < 0 || answer > max || answer % step !== 0) {
    fail(`${where}: invalid lab slider bounds or answer`);
  }
  if (kind === "LOCKBOX" && (!isNonnegativeInt(bill) || bill > balance || max > balance)) {
    fail(`${where}: the lockbox needs a bill and amounts within the starting balance`);
  }
  if (kind !== "LOCKBOX" && !isPercent(rate)) fail(`${where}: the lab needs a percentage rate`);
  if (kind === "SHOCK" && max > 100) fail(`${where}: the shock slider uses percent allocations`);
  if (kind === "COMPOUNDING" && max > 60) fail(`${where}: the time machine is limited to 60 years`);
}

function parseQuestions(section, file, withSource) {
  const blocks = section.split(/^### Q\d+\. /m).slice(1);
  return blocks.map((block, i) => {
    const lines = block.trim().split("\n");
    const prompt = lines[0].trim();
    const options = lines
      .map((l) => l.match(/^- ([ABCD])\) (.+)$/))
      .filter(Boolean)
      .map(([, label, raw]) => ({
        label,
        correct: raw.trimEnd().endsWith("✅"),
        text: raw.replace(/\s*✅\s*$/, "").trim(),
      }));
    const expl = block.match(/^\*\*Explanation:\*\* (.+)$/m);
    let explanation = expl?.[1].trim() ?? null;
    let sourceCode = null;
    if (explanation && withSource) {
      const ref = explanation.match(/\s*\*\(([\d.]+)(?:,[^)]*)?\)\*\s*$/);
      if (ref) {
        sourceCode = ref[1];
        explanation = explanation.slice(0, ref.index).trim();
      }
    }
    const where = `${file} Q${i + 1}`;
    const assignment = readExercise(block, "assignment", where);
    const comparison = readExercise(block, "comparison", where);
    const numberExercise = readExercise(block, "number", where);
    if (assignment && (options.length || comparison || numberExercise)) fail(`${where}: an assignment replaces the other answer types`);
    if (numberExercise && options.length) fail(`${where}: a number exercise replaces the options`);
    if (withSource && (assignment || comparison || numberExercise)) fail(`${where}: interactive exercises are for practice quizzes`);
    if (assignment) {
      validateAssignment(assignment, where);
    } else if (numberExercise) {
      validateNumber(numberExercise, where);
    } else {
      if (options.length !== 4) fail(`${where}: expected 4 options, found ${options.length}`);
      if (options.map((o) => o.label).join("") !== "ABCD") fail(`${where}: options must be A-D in order`);
      if (options.filter((o) => o.correct).length !== 1) fail(`${where}: expected exactly one ✅ option`);
    }
    if (comparison) validateComparison(comparison, where);
    if (!explanation) fail(`${where}: missing **Explanation:**`);
    return { sortOrder: i + 1, prompt, explanation: capitalize(explanation), sourceCode, options, assignment, comparison, numberExercise };
  });
}

function parseSubchapter(path, file) {
  const text = read(path);
  const heading = text.match(/^# ([\d.]+) (.+)$/m) ?? fail(`${file}: missing "# <code> <title>" heading`);
  const goal = text.match(/^\*\*Goal of this subchapter:\*\* (.+)$/m);
  const instrument = text.match(/^\*\*Sandbox instrument:\*\* (.+)$/m);
  const lessonStart = text.indexOf("\n## Lesson\n");
  const questionsStart = text.indexOf("\n## Control questions\n");
  if (lessonStart < 0 || questionsStart < 0) fail(`${file}: needs "## Lesson" and "## Control questions" sections`);
  const lessonMarkdown = text
    .slice(lessonStart + "\n## Lesson\n".length, questionsStart)
    .replace(/\n---\s*$/, "")
    .trim();
  let sandboxInstrument = null;
  if (instrument) {
    sandboxInstrument = INSTRUMENTS[instrument[1].trim()] ?? fail(`${file}: unknown sandbox instrument "${instrument[1]}"`);
  }
  return {
    code: heading[1],
    sortOrder: Number(heading[1].split(".")[1]),
    title: heading[2].trim(),
    goal: capitalize(goal?.[1].trim() ?? null),
    sandboxInstrument,
    lessonMarkdown,
    questions: parseQuestions(text.slice(questionsStart), file, false),
  };
}

function parseFinalQuiz(path, file) {
  const text = read(path);
  const heading = text.match(/^# (.+)$/m) ?? fail(`${file}: missing title`);
  const passMark = text.match(/\*\*Suggested pass mark:\*\* (\d+)\//);
  return {
    title: heading[1].trim(),
    passMark: passMark ? Number(passMark[1]) : null,
    questions: parseQuestions(text, file, true),
  };
}

function loadContent() {
  const chapters = parseOverview();
  const dirs = readdirSync(KNOWLEDGE, { withFileTypes: true }).filter((d) => d.isDirectory() && /^chapter-\d+/.test(d.name));
  for (const dir of dirs) {
    const number = Number(dir.name.match(/^chapter-(\d+)/)[1]);
    const chapter = chapters.find((c) => c.sortOrder === number) ?? fail(`${dir.name}: chapter ${number} is not in learning-chapters.md`);
    const folder = join(KNOWLEDGE, dir.name);
    const files = readdirSync(folder).filter((f) => f.endsWith(".md")).sort();
    chapter.subchapters = files
      .filter((f) => /^\d+-\d+-/.test(f))
      .map((f) => parseSubchapter(join(folder, f), `${dir.name}/${f}`))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    chapter.finalQuiz = files.includes("final-quiz.md") ? parseFinalQuiz(join(folder, "final-quiz.md"), `${dir.name}/final-quiz.md`) : null;
  }
  return chapters.filter((c) => c.subchapters).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---------- SQL ----------

const sql = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" || typeof v === "boolean" ? String(v).toUpperCase() : `'${String(v).replace(/'/g, "''")}'`);
const insert = (table, row, jsonColumns = []) => `INSERT INTO ${table} (${Object.keys(row).join(", ")}) VALUES (${Object.entries(row).map(([key, value]) => jsonColumns.includes(key) ? `JSON ${sql(JSON.stringify(value))}` : sql(value)).join(", ")});`;

function toSql(chapters) {
  const out = [];
  const ids = { chapter: 0, subchapter: 0, quiz: 0, question: 0, answer_option: 0 };
  let optionCount = 0;
  const next = (t) => ++ids[t];
  const subchapterIds = new Map();

  // Chapters and subchapters first, so final-quiz questions can reference any subchapter.
  for (const ch of chapters) {
    ch.id = next("chapter");
    out.push(`-- Chapter ${ch.sortOrder}: ${ch.title}`);
    out.push(insert("chapter", { id: ch.id, sort_order: ch.sortOrder, title: ch.title, objective: ch.objective, mission_title: ch.missionTitle, mission_description: ch.missionDescription }));
    for (const sub of ch.subchapters) {
      sub.id = next("subchapter");
      subchapterIds.set(sub.code, sub.id);
      out.push(insert("subchapter", { id: sub.id, chapter_id: ch.id, sort_order: sub.sortOrder, code: sub.code, title: sub.title, goal: sub.goal, sandbox_instrument: sub.sandboxInstrument, lesson_markdown: sub.lessonMarkdown }));
    }
    out.push("");
  }

  const writeQuiz = (quiz, header) => {
    out.push(header);
    out.push(insert("quiz", { id: quiz.id, chapter_id: quiz.chapterId, subchapter_id: quiz.subchapterId, quiz_type: quiz.type, title: quiz.title, pass_mark: quiz.passMark }));
    for (const q of quiz.questions) {
      const qid = next("question");
      const source = q.sourceCode ? (subchapterIds.get(q.sourceCode) ?? fail(`${quiz.title}: unknown subchapter reference (${q.sourceCode})`)) : null;
      out.push(insert("question", {
        id: qid, quiz_id: quiz.id, sort_order: q.sortOrder, prompt: q.prompt, explanation: q.explanation,
        source_subchapter_id: source,
        ...(q.assignment && { assignment: q.assignment }),
        ...(q.comparison && { comparison: q.comparison }),
        ...(q.numberExercise && { number_exercise: q.numberExercise }),
      }, ["assignment", "comparison", "number_exercise"]));
      // Preserve option ids in the rest of the seed when a question becomes an assignment.
      if (q.options.length === 0) ids.answer_option += 4;
      for (const o of q.options) {
        out.push(insert("answer_option", { id: next("answer_option"), question_id: qid, label: o.label, text: o.text, is_correct: o.correct }));
      }
      optionCount += q.options.length;
    }
    out.push("");
  };

  for (const ch of chapters) {
    for (const sub of ch.subchapters) {
      writeQuiz(
        { id: next("quiz"), chapterId: ch.id, subchapterId: sub.id, type: "CONTROL", title: `${sub.code} ${sub.title} — Control questions`, passMark: null, questions: sub.questions },
        `-- Control questions: ${sub.code} ${sub.title}`,
      );
    }
    if (ch.finalQuiz) {
      writeQuiz({ id: next("quiz"), chapterId: ch.id, subchapterId: null, type: "FINAL", ...ch.finalQuiz }, `-- Final quiz: Chapter ${ch.sortOrder}`);
    }
  }

  // Explicit ids don't move H2's identity counters, so restart them past the seeded rows.
  out.push("-- Let rows inserted by the application continue after the seeded ids");
  for (const [table, last] of Object.entries(ids)) out.push(`ALTER TABLE ${table} ALTER COLUMN id RESTART WITH ${last + 1};`);
  return { body: out.join("\n"), ids, optionCount };
}

// ---------- scenarios ----------

// Runs after toSql(), which gives every chapter and subchapter its id.
function scenariosToSql(chapters, data, seededInstruments) {
  const out = [];
  const ids = { scenario: 0, scenario_rule: 0, scenario_allocation: 0, scenario_share_range: 0 };
  const next = (t) => ++ids[t];
  const { defaults } = data;
  const cash = defaults.cash.key;
  const chapterByNumber = new Map(chapters.map((c) => [c.sortOrder, c]));
  const subchapterByCode = new Map(chapters.flatMap((c) => c.subchapters.map((s) => [s.code, s])));
  const instrument = (id, where) =>
    seededInstruments.has(Number(id)) ? Number(id) : fail(`${where}: instrument ${id} is not in the instrument seed`);

  data.scenarios.forEach((s, index) => {
    const where = `sandbox-scenarios.json ${s.code}`;
    const chapter = chapterByNumber.get(s.chapterId) ?? fail(`${where}: unknown chapter ${s.chapterId}`);
    const evaluation = s.evaluation ?? fail(`${where}: evaluation is missing`);
    // Suitable and range instruments must be ones the scenario allows.
    const allowed = (instrumentId, what) =>
      s.instrumentIds.includes(Number(instrumentId)) ? instrument(instrumentId, where) : fail(`${where}: ${what} ${instrumentId} isn't allowed in the scenario`);
    const id = next("scenario");
    out.push(`-- Scenario ${s.code}: ${s.title}`);
    out.push(insert("scenario", {
      id, slug: s.id, code: s.code, chapter_id: chapter.id, sort_order: index + 1, title: s.title,
      persona_name: s.persona.name, persona_age: s.persona.age ?? null, persona_situation: s.persona.situation ?? null,
      goal: s.goal, currency: defaults.currency, budget: s.budget, duration_days: s.durationDays,
      target: s.target, floor: s.floor, max_drawdown: s.maxDrawdown,
      growth_weight: s.weights.growth, stability_weight: s.weights.stability,
      rule_penalty_points: defaults.rulePenaltyPoints, scenario_seed: s.scenarioSeed, retirement_gap: s.retirementGap ?? null,
      min_instruments: evaluation.minInstruments, evaluation_explanation: evaluation.explanation,
    }));
    s.lessonCodes.forEach((code, i) => {
      const sub = subchapterByCode.get(code) ?? fail(`${where}: unknown lesson ${code}`);
      out.push(insert("scenario_lesson", { scenario_id: id, sort_order: i, subchapter_id: sub.id }));
    });
    s.instrumentIds.forEach((instrumentId, i) =>
      out.push(insert("scenario_instrument", { scenario_id: id, sort_order: i, instrument_id: instrument(instrumentId, where) })),
    );
    s.moneyNeeds.forEach((need, i) =>
      out.push(insert("scenario_money_need", { scenario_id: id, sort_order: i, day_offset: need.day, amount: need.amount, label: need.label })),
    );
    s.rules.forEach((rule, i) => {
      if (!RULE_TYPES.has(rule.type)) fail(`${where}: unknown rule type ${rule.type}`);
      const ruleId = next("scenario_rule");
      out.push(insert("scenario_rule", { id: ruleId, scenario_id: id, sort_order: i + 1, rule_type: rule.type, max_share: rule.maxShare, label: rule.label }));
      rule.instrumentIds.forEach((instrumentId, j) =>
        out.push(insert("scenario_rule_instrument", { rule_id: ruleId, sort_order: j, instrument_id: instrument(instrumentId, where) })),
      );
    });
    const allocations = [
      { kind: "REFERENCE", shares: s.referenceAllocation },
      ...(s.alsoAcceptable ?? []).map((shares) => ({ kind: "ACCEPTABLE", shares })),
      ...(s.traps ?? []).map((trap) => ({ kind: "TRAP", shares: trap.allocation, label: trap.label, why: trap.why })),
    ];
    allocations.forEach((a, i) => {
      const allocationId = next("scenario_allocation");
      out.push(insert("scenario_allocation", {
        id: allocationId, scenario_id: id, sort_order: i + 1, kind: a.kind, label: a.label ?? null, why: a.why ?? null, cash_share: a.shares[cash] ?? 0,
      }));
      for (const [key, share] of Object.entries(a.shares)) {
        if (key === cash) continue;
        out.push(insert("scenario_allocation_share", { allocation_id: allocationId, instrument_id: instrument(key, where), share }));
      }
    });
    evaluation.suitableInstrumentIds.forEach((instrumentId, i) =>
      out.push(insert("scenario_suitable_instrument", { scenario_id: id, sort_order: i, instrument_id: allowed(instrumentId, "suitable instrument") })),
    );
    evaluation.shareRanges.forEach((range, i) => {
      const rangeId = next("scenario_share_range");
      out.push(insert("scenario_share_range", {
        id: rangeId, scenario_id: id, sort_order: i + 1, label: range.label, includes_cash: range.includesCash,
        each_instrument: range.each ?? false, min_share: range.min, max_share: range.max,
      }));
      range.instrumentIds.forEach((instrumentId, j) =>
        out.push(insert("scenario_share_range_instrument", { share_range_id: rangeId, sort_order: j, instrument_id: allowed(instrumentId, "share range instrument") })),
      );
    });
    s.debriefPoints.forEach((point, i) => out.push(insert("scenario_debrief_point", { scenario_id: id, sort_order: i, point_text: point })));
    (s.notSimulated ?? []).forEach((note, i) => out.push(insert("scenario_not_simulated", { scenario_id: id, sort_order: i, note_text: note })));
    out.push("");
  });

  out.push("-- Let rows inserted by the application continue after the seeded ids");
  for (const [table, last] of Object.entries(ids)) out.push(`ALTER TABLE ${table} ALTER COLUMN id RESTART WITH ${last + 1};`);
  return { body: out.join("\n"), ids };
}

// ---------- write ----------

// Replaces the text between the markers, or appends the block when the markers are missing.
function replaceBlock(text, begin, end, body) {
  const block = `${begin}\n\n${body}\n\n${end}`;
  const start = text.indexOf(begin);
  const stop = start >= 0 ? text.indexOf(end, start) : -1;
  return stop > start ? text.slice(0, start) + block + text.slice(stop + end.length) : `${text.trimEnd()}\n\n${block}\n`;
}

const chapters = loadContent();
const { body, ids, optionCount } = toSql(chapters);

const current = read(DATA_SQL);
const seededInstruments = new Set(
  [...current.matchAll(/^INSERT INTO instrument \([^)]*\) VALUES \((\d+),/gm)].map((m) => Number(m[1])),
);
const scenarios = scenariosToSql(chapters, JSON.parse(read(SCENARIOS_JSON)), seededInstruments);

let updated = replaceBlock(current, BEGIN, END, body);
updated = replaceBlock(updated, SCENARIOS_BEGIN, SCENARIOS_END, scenarios.body);
writeFileSync(DATA_SQL, updated, "utf8");

console.log(
  `Wrote ${ids.chapter} chapters, ${ids.subchapter} subchapters, ${ids.quiz} quizzes, ` +
    `${ids.question} questions, ${optionCount} options, ${scenarios.ids.scenario} scenarios to ${DATA_SQL}`,
);
