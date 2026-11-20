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
 */
export function moodForReply(context: {
  readonly questionId?: number;
  readonly selectedOptionId?: number;
  readonly answerCorrect?: boolean;
}): HedgieMood {
  if (context.questionId === undefined) {
    return 'greeting';
  }
  if (context.selectedOptionId === undefined) {
    return 'hint';
  }
  return context.answerCorrect ? 'joy' : 'encouragement';
}
