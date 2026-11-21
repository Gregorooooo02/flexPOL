/** Hedgie's expressions, drawn as SVGs in `public/` (file names are Polish). */
export type HedgieMood = 'greeting' | 'hint' | 'encouragement' | 'joy';

const FILES: Record<HedgieMood, string> = {
  greeting: 'hedgie-powitanie.svg',
  hint: 'hedgie-wskazowka.svg',
  encouragement: 'hedgie-otucha.svg',
  joy: 'hedgie-radosc.svg',
};

export function hedgieImage(mood: HedgieMood): string {
  return `${import.meta.env.BASE_URL}${FILES[mood]}`;
}

/**
 * Which face fits the coach's reply: a hint while the learner works on a question,
 * encouragement after a wrong answer, joy after a right one, a friendly greeting otherwise.
 * After a sandbox run: joy for 4–5 stars, encouragement for 1–2, a hint for 3.
 */
export function moodForReply(context: {
  readonly questionId?: number;
  readonly answerCorrect?: boolean;
  readonly scenarioStars?: number;
}): HedgieMood {
  if (context.scenarioStars !== undefined) {
    return context.scenarioStars >= 4 ? 'joy' : context.scenarioStars <= 2 ? 'encouragement' : 'hint';
  }
  if (context.questionId === undefined) {
    return 'greeting';
  }
  if (context.answerCorrect === undefined) {
    return 'hint';
  }
  return context.answerCorrect ? 'joy' : 'encouragement';
}
