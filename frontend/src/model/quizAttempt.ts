// Mirrors backend DTO: QuizAttemptResponse.

/**
 * A learner's attempt at a quiz. `completedAt`, `score` and `passed` stay null until every
 * question has an answer. The score counts each question's first answer only.
 */
export interface QuizAttempt {
  id: number;
  quizId: number;
  startedAt: string;
  completedAt: string | null;
  answeredCount: number;
  questionCount: number;
  score: number | null;
  passed: boolean | null;
}
