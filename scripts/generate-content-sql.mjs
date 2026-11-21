#!/usr/bin/env node
// Parses the learning content in knowledge/ and writes it as INSERT statements
// into backend/src/main/resources/data.sql, between the GENERATED CONTENT markers.
// The sandbox scenarios (knowledge/sandbox-scenarios.json) go between the GENERATED SCENARIOS
// markers, after the instrument seed, because they reference instruments and chapters.
// Everything outside the markers (for example the USER seed rows) is kept.
// Also validates knowledge/duel-scenarios.json and copies it to a generated classpath resource.
//
// Usage (from the repository root):  node scripts/generate-content-sql.mjs

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KNOWLEDGE = join(ROOT, "knowledge");
const DATA_SQL = join(ROOT, "backend", "src", "main", "resources", "data.sql");
const SCENARIOS_JSON = join(KNOWLEDGE, "sandbox-scenarios.json");
const DUEL_SCENARIOS_JSON = join(KNOWLEDGE, "duel-scenarios.json");
const DUEL_RESOURCE = join(ROOT, "backend", "src", "main", "resources", "duel-scenarios.json");
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
    if (options.length !== 4) fail(`${where}: expected 4 options, found ${options.length}`);
    if (options.map((o) => o.label).join("") !== "ABCD") fail(`${where}: options must be A-D in order`);
    if (options.filter((o) => o.correct).length !== 1) fail(`${where}: expected exactly one ✅ option`);
    if (!explanation) fail(`${where}: missing **Explanation:**`);
    return { sortOrder: i + 1, prompt, explanation: capitalize(explanation), sourceCode, options };
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
const insert = (table, row) => `INSERT INTO ${table} (${Object.keys(row).join(", ")}) VALUES (${Object.values(row).map(sql).join(", ")});`;

function toSql(chapters) {
  const out = [];
  const ids = { chapter: 0, subchapter: 0, quiz: 0, question: 0, answer_option: 0 };
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
      out.push(insert("question", { id: qid, quiz_id: quiz.id, sort_order: q.sortOrder, prompt: q.prompt, explanation: q.explanation, source_subchapter_id: source }));
      for (const o of q.options) {
        out.push(insert("answer_option", { id: next("answer_option"), question_id: qid, label: o.label, text: o.text, is_correct: o.correct }));
      }
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
  return { body: out.join("\n"), ids };
}

// ---------- scenarios ----------

// Runs after toSql(), which gives every chapter and subchapter its id.
function scenariosToSql(chapters, data, seededInstruments) {
  const out = [];
  const ids = { scenario: 0, scenario_rule: 0, scenario_allocation: 0 };
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
    const id = next("scenario");
    out.push(`-- Scenario ${s.code}: ${s.title}`);
    out.push(insert("scenario", {
      id, slug: s.id, code: s.code, chapter_id: chapter.id, sort_order: index + 1, title: s.title,
      persona_name: s.persona.name, persona_age: s.persona.age ?? null, persona_situation: s.persona.situation ?? null,
      goal: s.goal, currency: defaults.currency, budget: s.budget, duration_days: s.durationDays,
      target: s.target, floor: s.floor, max_drawdown: s.maxDrawdown,
      growth_weight: s.weights.growth, stability_weight: s.weights.stability,
      rule_penalty_points: defaults.rulePenaltyPoints, scenario_seed: s.scenarioSeed, retirement_gap: s.retirementGap ?? null,
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
    s.debriefPoints.forEach((point, i) => out.push(insert("scenario_debrief_point", { scenario_id: id, sort_order: i, point_text: point })));
    (s.notSimulated ?? []).forEach((note, i) => out.push(insert("scenario_not_simulated", { scenario_id: id, sort_order: i, note_text: note })));
    out.push("");
  });

  out.push("-- Let rows inserted by the application continue after the seeded ids");
  for (const [table, last] of Object.entries(ids)) out.push(`ALTER TABLE ${table} ALTER COLUMN id RESTART WITH ${last + 1};`);
  return { body: out.join("\n"), ids };
}

// ---------- Duel templates (generated resource, not SQL) ----------

function validateDuelTemplates(data) {
  const check = (condition, message) => {
    if (!condition) fail(`duel-scenarios.json: ${message}`);
  };
  const text = (value, field) => check(typeof value === "string" && value.trim().length > 0, `${field} must not be blank`);
  const fields = (value, allowed, where) => {
    check(value !== null && typeof value === "object" && !Array.isArray(value), `${where} must be an object`);
    for (const key of Object.keys(value)) check(allowed.includes(key), `${where}: unknown field ${key}`);
  };
  fields(data, ["schemaVersion", "currency", "disclaimer", "rules", "templates"], "root");
  check(data.schemaVersion === 1, "schemaVersion must be 1");
  check(data.currency === "EUR", "currency must be EUR");
  text(data.disclaimer, "disclaimer");
  check(Array.isArray(data.rules) && data.rules.length > 0, "rules must not be empty");
  data.rules.forEach((rule) => text(rule, "rule"));
  check(Array.isArray(data.templates) && data.templates.length > 0, "templates must not be empty");
  const ids = new Set();
  for (const template of data.templates) {
    fields(template, ["id", "version", "title", "background", "objective", "category", "categoryLabel", "options"], "template");
    check(typeof template.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(template.id), "template id must be a nonempty kebab-case key");
    check(!ids.has(template.id), `duplicate template id: ${template.id}`);
    ids.add(template.id);
    const where = `template ${template.id}`;
    check(Number.isSafeInteger(template.version) && template.version > 0 && template.version <= 2147483647, `${where}: version must be a positive Java integer`);
    for (const key of ["title", "background", "objective", "categoryLabel"]) text(template[key], `${where}: ${key}`);
    check(["STOCK", "EQUITY_ETF"].includes(template.category), `${where}: category must be STOCK or EQUITY_ETF`);
    check(Array.isArray(template.options) && template.options.length > 0, `${where}: options must not be empty`);
    const options = new Set();
    for (const option of template.options) {
      fields(option, ["budget", "durationDays"], `${where}: option`);
      check(typeof option.budget === "number" && Number.isFinite(option.budget) && option.budget > 0 && option.budget <= 1e12
        && /^\d+(?:\.\d{1,2})?$/.test(String(option.budget)), `${where}: budget must be positive whole cents, at most 1000000000000`);
      check(Number.isInteger(option.durationDays) && option.durationDays >= 1 && option.durationDays <= 3650,
        `${where}: durationDays must be between 1 and 3650`);
      const key = `${option.budget}:${option.durationDays}`;
      check(!options.has(key), `${where}: duplicate budget/horizon option`);
      options.add(key);
    }
  }
  return data;
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
const { body, ids } = toSql(chapters);

const current = read(DATA_SQL);
const seededInstruments = new Set(
  [...current.matchAll(/^INSERT INTO instrument \([^)]*\) VALUES \((\d+),/gm)].map((m) => Number(m[1])),
);
const scenarios = scenariosToSql(chapters, JSON.parse(read(SCENARIOS_JSON)), seededInstruments);
const duelTemplates = validateDuelTemplates(JSON.parse(read(DUEL_SCENARIOS_JSON)));

let updated = replaceBlock(current, BEGIN, END, body);
updated = replaceBlock(updated, SCENARIOS_BEGIN, SCENARIOS_END, scenarios.body);
writeFileSync(DATA_SQL, updated, "utf8");
writeFileSync(DUEL_RESOURCE, `${JSON.stringify(duelTemplates, null, 2)}\n`, "utf8");

console.log(
  `Wrote ${ids.chapter} chapters, ${ids.subchapter} subchapters, ${ids.quiz} quizzes, ` +
    `${ids.question} questions, ${ids.answer_option} options, ${scenarios.ids.scenario} scenarios to ${DATA_SQL}`,
);
console.log(`Wrote ${duelTemplates.templates.length} Duel templates to ${DUEL_RESOURCE}`);
