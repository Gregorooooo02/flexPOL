import type { Quiz } from '@/model';
import { apiClient } from '@/config/axios';

/** GET /api/quizzes/{quizId} */
export async function getQuiz(quizId: number, signal?: AbortSignal): Promise<Quiz> {
  const { data } = await apiClient.get<Quiz>(`/quizzes/${quizId}`, { signal });
  return data;
}
