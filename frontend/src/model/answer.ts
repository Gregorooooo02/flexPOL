// Mirrors backend DTOs: AnswerSubmissionRequest, AnswerResultResponse.

/**
 * Body of POST /api/questions/{questionId}/answer. With `attemptId` the answer is also saved
 * in that quiz attempt of the logged-in learner.
 */
export interface AnswerSubmission {
  optionId: number;
  attemptId?: number;
}

/** Result of checking one answer. Only returned after the learner has answered. */
export interface AnswerResult {
  questionId: number;
  selectedOptionId: number;
  correct: boolean;
  correctOptionId: number;
  explanation: string | null;
}
