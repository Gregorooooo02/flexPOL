import { createContext, useContext, useEffect } from 'react';
import type { Assignments, ScenarioAllocation } from '@/model';

/**
 * What the learner is looking at, so the coach can answer "help me with this question".
 * A screen publishes it with `usePublishCoachFocus`; the coach reads it with `useCoachFocus`.
 */
export interface CoachFocus {
  /** Identifies the screen (e.g. a lesson node id). A new scope starts a new conversation. */
  readonly scopeId: string;
  /** Short text shown in the coach header, e.g. "1.1 Why Investing Is Worth It · Question 2/4". */
  readonly label: string;
  readonly subchapterId?: number;
  readonly questionId?: number;
  /** The option the learner picked and had checked. Leave it out until the answer is checked. */
  readonly selectedOptionId?: number;
  readonly assignments?: Assignments;
  readonly number?: number;
  /** The sandbox scenario the learner is in. */
  readonly scenarioId?: number;
  /** The learner's plan in that scenario, in euros (the rest is cash). Keep the array stable between renders. */
  readonly allocations?: readonly ScenarioAllocation[];
  /** True once the learner has run that plan and sees its result. */
  readonly scenarioRun?: boolean;
  /** The run's stars; only used to pick Hedgie's face. */
  readonly scenarioStars?: number;
  /** Whether that checked answer was right; only used to pick Hedgie's face. */
  readonly answerCorrect?: boolean;
}

/** A message a screen asked the coach to send for the learner, e.g. "Give me feedback on my plan". */
export interface CoachAsk {
  readonly id: number;
  readonly text: string;
}

export interface CoachAskChannel {
  /** The request waiting to be sent, or null. */
  readonly pending: CoachAsk | null;
  /** Opens the coach and sends `text` as the learner's message, with the current focus as context. */
  ask(text: string): void;
  /** Called by the coach once it has sent `id`. */
  done(id: number): void;
  /** The coach registers how to show its chat; `ask` calls it from the learner's click. */
  registerShowChat(show: (() => void) | null): void;
}

export const CoachFocusContext = createContext<CoachFocus | null>(null);
export const SetCoachFocusContext = createContext<(focus: CoachFocus | null) => void>(() => {});
export const CoachAskContext = createContext<CoachAskChannel>({
  pending: null,
  ask: () => {},
  done: () => {},
  registerShowChat: () => {},
});

/** The learner's current focus, or null when no screen has published one. */
export function useCoachFocus(): CoachFocus | null {
  return useContext(CoachFocusContext);
}

/** Returns `ask(text)`, which opens the coach and sends `text` for the learner. */
export function useAskCoach(): (text: string) => void {
  return useContext(CoachAskContext).ask;
}

/** For the coach: the message a screen asked it to send, and how to mark it sent. */
export function useCoachAskChannel(): CoachAskChannel {
  return useContext(CoachAskContext);
}

/** Publishes `focus` while the calling component is mounted, and clears it on unmount. */
export function usePublishCoachFocus(focus: CoachFocus | null): void {
  const setFocus = useContext(SetCoachFocusContext);
  const {
    scopeId,
    label,
    subchapterId,
    questionId,
    selectedOptionId,
    assignments,
    number,
    scenarioId,
    allocations,
    scenarioRun,
    scenarioStars,
    answerCorrect,
  } = focus ?? {};
  useEffect(() => {
    setFocus(
      scopeId === undefined || label === undefined
        ? null
        : {
            scopeId,
            label,
            subchapterId,
            questionId,
            selectedOptionId,
            assignments,
            number,
            scenarioId,
            allocations,
            scenarioRun,
            scenarioStars,
            answerCorrect,
          },
    );
  }, [
    setFocus,
    scopeId,
    label,
    subchapterId,
    questionId,
    selectedOptionId,
    assignments,
    number,
    scenarioId,
    allocations,
    scenarioRun,
    scenarioStars,
    answerCorrect,
  ]);
  useEffect(() => () => setFocus(null), [setFocus]);
}
