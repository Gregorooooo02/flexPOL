import type { Quiz, Subchapter } from '@/model';
import { apiClient } from '@/config/axios';

/** GET /api/subchapters/{subchapterId}: includes the lesson Markdown. */
export async function getSubchapter(subchapterId: number, signal?: AbortSignal): Promise<Subchapter> {
  const { data } = await apiClient.get<Subchapter>(`/subchapters/${subchapterId}`, { signal });
  return data;
}

/** GET /api/subchapters/{subchapterId}/control-quiz */
export async function getSubchapterControlQuiz(subchapterId: number, signal?: AbortSignal): Promise<Quiz> {
  const { data } = await apiClient.get<Quiz>(`/subchapters/${subchapterId}/control-quiz`, { signal });
  return data;
}
