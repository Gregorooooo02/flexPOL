import type { Quiz, QuizAttempt } from '@/model';
import { apiClient } from '@/config/axios';

/** GET /api/quizzes/{quizId} */
export async function getQuiz(quizId: number, signal?: AbortSignal): Promise<Quiz> {
  const { data } = await apiClient.get<Quiz>(`/quizzes/${quizId}`, { signal });
  return data;
}

/** POST /api/quizzes/{quizId}/attempts: starts a saved attempt for the logged-in learner. */
export async function startQuizAttempt(quizId: number, signal?: AbortSignal): Promise<QuizAttempt> {
  const { data } = await apiClient.post<QuizAttempt>(`/quizzes/${quizId}/attempts`, undefined, { signal });
  return data;
}

/** GET /api/quiz-attempts/{attemptId}: one of the logged-in learner's attempts. */
export async function getQuizAttempt(attemptId: number, signal?: AbortSignal): Promise<QuizAttempt> {
  const { data } = await apiClient.get<QuizAttempt>(`/quiz-attempts/${attemptId}`, { signal });
  return data;
}
