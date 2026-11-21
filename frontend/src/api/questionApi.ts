import type { AnswerChoice, AnswerResult, AnswerSubmission } from '@/model';
import { apiClient } from '@/config/axios';

/**
 * POST /api/questions/{questionId}/answer: checks an option or a set of placements.
 * Pass `attemptId` to also save the answer in the learner's quiz attempt.
 */
export async function submitAnswer(
  questionId: number,
  choice: AnswerChoice,
  options: { readonly attemptId?: number | null; readonly signal?: AbortSignal } = {},
): Promise<AnswerResult> {
  const body: AnswerSubmission = { ...choice, ...(options.attemptId != null && { attemptId: options.attemptId }) };
  const { data } = await apiClient.post<AnswerResult>(`/questions/${questionId}/answer`, body, {
    signal: options.signal,
  });
  return data;
}
