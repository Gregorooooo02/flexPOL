// Mirrors backend DTOs: AnswerSubmissionRequest, AnswerResultResponse.

/** Body of POST /api/questions/{questionId}/answer. */
export interface AnswerSubmission {
  optionId: number;
}

/** Result of checking one answer. Only returned after the learner has answered. */
export interface AnswerResult {
  questionId: number;
  selectedOptionId: number;
  correct: boolean;
  correctOptionId: number;
  explanation: string | null;
}
