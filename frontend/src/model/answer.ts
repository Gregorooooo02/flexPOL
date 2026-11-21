// Mirrors backend DTOs: AnswerSubmissionRequest, AnswerResultResponse.

/**
 * Body of POST /api/questions/{questionId}/answer. With `attemptId` the answer is also saved
 * in that quiz attempt of the logged-in learner.
 */
export type Assignments = Readonly<Record<string, string>>;

export type AnswerChoice =
  | { optionId: number; assignments?: never }
  | { assignments: Assignments; optionId?: never };

export type AnswerSubmission = AnswerChoice & { attemptId?: number };

/** Result of checking one answer. Only returned after the learner has answered. */
export interface AnswerResult {
  questionId: number;
  selectedOptionId: number | null;
  correct: boolean;
  correctOptionId: number | null;
  explanation: string | null;
  hint?: string;
}
