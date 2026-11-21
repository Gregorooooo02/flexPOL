import { createContext, useContext, useEffect } from 'react';
import type { Assignments } from '@/model';

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
  /** Keep the launcher out of exercise controls on narrow screens. */
  readonly dockLauncher?: boolean;
  /** Whether that checked answer was right; only used to pick Hedgie's face. */
  readonly answerCorrect?: boolean;
}

export const CoachFocusContext = createContext<CoachFocus | null>(null);
export const SetCoachFocusContext = createContext<(focus: CoachFocus | null) => void>(() => {});

/** The learner's current focus, or null when no screen has published one. */
export function useCoachFocus(): CoachFocus | null {
  return useContext(CoachFocusContext);
}

/** Publishes `focus` while the calling component is mounted, and clears it on unmount. */
export function usePublishCoachFocus(focus: CoachFocus | null): void {
  const setFocus = useContext(SetCoachFocusContext);
  const { scopeId, label, subchapterId, questionId, selectedOptionId, assignments, number, answerCorrect, dockLauncher } = focus ?? {};
  useEffect(() => {
    setFocus(scopeId === undefined || label === undefined ? null : { scopeId, label, subchapterId, questionId, selectedOptionId, assignments, number, answerCorrect, dockLauncher });
  }, [setFocus, scopeId, label, subchapterId, questionId, selectedOptionId, assignments, number, answerCorrect, dockLauncher]);
  useEffect(() => () => setFocus(null), [setFocus]);
}
