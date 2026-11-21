import content from '../../../knowledge/final-lesson.json' with { type: 'json' };

export { content };
export type Answers = Readonly<Partial<Record<string, string>>>;
export type ProfileId = keyof typeof content.profiles;
export type Question = (typeof content.questions)[number];

interface Condition {
  readonly field: string;
  readonly values: readonly string[];
}

export const questions = content.questions;

export function isAnswered(question: Question, answers: Answers): boolean {
  return question.options.some((option) => option.value === answers[question.id]);
}

function matches(condition: Condition, answers: Answers): boolean {
  const answer = answers[condition.field];
  return answer !== undefined && condition.values.includes(answer);
}

/** Financial foundations and capacity take priority over appetite for risk. */
export function buildPlan(answers: Answers) {
  if (!questions.every((question) => isAnswered(question, answers))) {
    throw new Error('Answer all six questions before seeing your starting point.');
  }
  const rule = content.rules.find((candidate) => candidate.when.some((condition) => matches(condition, answers)));
  const profileId = (rule?.profile ?? 'diversified') as ProfileId;
  const reasons = rule?.when.filter((condition) => matches(condition, answers)).map((condition) => condition.reason) ?? [content.longTermReason];
  const note = content.contextNotes.find((candidate) => matches(candidate, answers))?.text;
  return { profileId, profile: content.profiles[profileId], reasons: reasons.slice(0, 2), note };
}

export type ResearchPlan = ReturnType<typeof buildPlan>;
