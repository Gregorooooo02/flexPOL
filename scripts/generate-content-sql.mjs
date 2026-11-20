#!/usr/bin/env node
// Parses the learning content in knowledge/ and writes it as INSERT statements
// into backend/src/main/resources/data.sql, between the GENERATED CONTENT markers.
// Everything outside the markers (for example the USER seed rows) is kept.
//
// Usage (from the repository root):  node scripts/generate-content-sql.mjs

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KNOWLEDGE = join(ROOT, "knowledge");
const DATA_SQL = join(ROOT, "backend", "src", "main", "resources", "data.sql");
const BEGIN = "-- BEGIN GENERATED CONTENT (scripts/generate-content-sql.mjs, do not edit by hand)";
const END = "-- END GENERATED CONTENT";

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

// ---------- write ----------

const chapters = loadContent();
const { body, ids } = toSql(chapters);
const block = `${BEGIN}\n\n${body}\n\n${END}`;

const current = read(DATA_SQL);
const start = current.indexOf(BEGIN);
const end = current.indexOf(END);
const updated =
  start >= 0 && end > start
    ? current.slice(0, start) + block + current.slice(end + END.length)
    : `${current.trimEnd()}\n\n${block}\n`;
writeFileSync(DATA_SQL, updated, "utf8");

console.log(
  `Wrote ${ids.chapter} chapters, ${ids.subchapter} subchapters, ${ids.quiz} quizzes, ` +
    `${ids.question} questions, ${ids.answer_option} options to ${DATA_SQL}`,
);
