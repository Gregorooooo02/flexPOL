import type { AnswerResult, AnswerSubmission } from '@/model';
import { apiClient } from '@/config/axios';

/**
 * POST /api/questions/{questionId}/answer: checks one answer and reveals the correct option and explanation.
 * Pass `attemptId` to also save the answer in the learner's quiz attempt.
 */
export async function submitAnswer(
  questionId: number,
  optionId: number,
  options: { readonly attemptId?: number | null; readonly signal?: AbortSignal } = {},
): Promise<AnswerResult> {
  const body: AnswerSubmission = { optionId, ...(options.attemptId != null && { attemptId: options.attemptId }) };
  const { data } = await apiClient.post<AnswerResult>(`/questions/${questionId}/answer`, body, {
    signal: options.signal,
  });
  return data;
}
