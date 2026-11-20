import type { AnswerResult, AnswerSubmission } from '@/model';
import { apiClient } from '@/config/axios';

/** POST /api/questions/{questionId}/answer: checks one answer and reveals the correct option and explanation. */
export async function submitAnswer(questionId: number, optionId: number, signal?: AbortSignal): Promise<AnswerResult> {
  const body: AnswerSubmission = { optionId };
  const { data } = await apiClient.post<AnswerResult>(`/questions/${questionId}/answer`, body, { signal });
  return data;
}
