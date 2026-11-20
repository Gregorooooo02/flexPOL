import type { Chapter, Quiz, SubchapterSummary } from '@/model';
import { apiClient } from '@/config/axios';

/** GET /api/chapters: all chapters in order, with subchapter summaries. */
export async function getChapters(signal?: AbortSignal): Promise<Chapter[]> {
  const { data } = await apiClient.get<Chapter[]>('/chapters', { signal });
  return data;
}

/** GET /api/chapters/{chapterId} */
export async function getChapter(chapterId: number, signal?: AbortSignal): Promise<Chapter> {
  const { data } = await apiClient.get<Chapter>(`/chapters/${chapterId}`, { signal });
  return data;
}

/** GET /api/chapters/{chapterId}/subchapters: summaries only, without lesson bodies. */
export async function getChapterSubchapters(chapterId: number, signal?: AbortSignal): Promise<SubchapterSummary[]> {
  const { data } = await apiClient.get<SubchapterSummary[]>(`/chapters/${chapterId}/subchapters`, { signal });
  return data;
}

/** GET /api/chapters/{chapterId}/final-quiz */
export async function getChapterFinalQuiz(chapterId: number, signal?: AbortSignal): Promise<Quiz> {
  const { data } = await apiClient.get<Quiz>(`/chapters/${chapterId}/final-quiz`, { signal });
  return data;
}
